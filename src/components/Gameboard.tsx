import { useState, useEffect, useRef, useCallback } from 'react'
import useSound from './hooks/useSound'
import { createBricks } from '../data/brickData'
import type { Status } from '../types/types'
import Paddle from './Paddle'
import Ball from './Ball'
import Brick from './Brick'
import { checkBallBrickCollisions, buildBrickRectCache } from '../utils/collision'

type GameboardProps = {
  speed: number;
  score: number;
  setLives: (lives: number) => void;
  setScore: (score: number) => void;
  soundEnabled: boolean;
  status: Status;
  setStatus: (ready: Status) => void;
  
}

const isTouch = window.matchMedia('(pointer: coarse)').matches
const statusText: Record<Status, { title: string; hint?: string }> = {
  ready: { 
    title: 'Ready', 
    hint: isTouch ? 'Tap to start' : 'Click or press Space to start' 
  },
  playing: {title: ''},
  paused: {
    title: 'Paused', 
    hint: isTouch ? 'Tap to resume' : 'Click or press Space to resume'
  },
  over: {title: 'Game over'},
  win: {title: 'You win!'},
}

const FX = {
  trail: {
    size: 7,               // radius of a new trail particle (px)
    fade: 0.02,            // how fast it fades (larger = shorter trail)
    spread: 1,             // currently unused — trail particles do not move
    glow: 25,              // glow strength
    glowColor: '#9ad5fa',  // glow color
    headColor: '#aadcfb77',// color near the ball
    headUntil: 0.7,        // life threshold above which headColor is used
  },
  debris: {
    count: 20,             // debris chunks spawned per broken brick
    speed: 6,              // how fast they fly out
    size: 4,               // debris chunk size (px)
    fade: 0.02,            // how fast they fade
    gravity: 0.2,          // vertical acceleration
  },
}

const INITIAL_SPEED_FACTOR = 0.002
const PADDLE_SPEED_FACTOR = 0.01
const MAX_DT = 3

type Particle = { x: number; y: number; life: number }
type Debris = { x: number; y: number; vx: number; vy: number; life: number; color: string }

const Gameboard = ({ speed, score, setLives, setScore, soundEnabled, status, setStatus }: GameboardProps) => {
  const [bricks, setBricks] = useState(createBricks)

  const { playWin, playBrickHit, playPaddleHit, playLose } = useSound({ soundEnabled });
  const boardRef = useRef<HTMLDivElement>(null);
  const paddleRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brickRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const bricksStateRef = useRef(bricks);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const speedRef = useRef(speed);
  const statusRef = useRef<Status>('ready');

  const changeStatus = useCallback((s: Status) => {
    statusRef.current = s
    setStatus(s)
  }, [setStatus])

  useEffect(() => { bricksStateRef.current = bricks }, [bricks]);
  useEffect(() => { speedRef.current = speed }, [speed]);
  useEffect(() => { statusRef.current = status }, [status]);

  useEffect(() => {
    const board = boardRef.current;
    const paddle = paddleRef.current;
    const ball = ballRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const portraitQuery = window.matchMedia('(max-width: 768px) and (orientation: portrait)')
    if (!board || !paddle || !ball || !canvas || !ctx) return;

    const trailColor = getComputedStyle(document.documentElement).getPropertyValue('--cyan-light').trim();
    const brickColorCache = new Map<number, string>();

    const particles: Particle[] = []
    const debris: Debris[] = []

    const style = getComputedStyle(board)
    let padLeft = parseFloat(style.paddingLeft)
    let padRight = parseFloat(style.paddingRight)
    let padTop = parseFloat(style.paddingTop)
    let lastWidth = board.clientWidth
    let fxScale = board.clientWidth / 800       // effect scale: 1 = board 800px, 0.5 = board 400px
    let dpr = window.devicePixelRatio || 1      // pixel density: 1 on desktop, 2–3 on phone

    const keys = { left: false, right: false }
    let x = (board.clientWidth - paddle.offsetWidth) / 2
    let ballX = (board.clientWidth - ball.offsetWidth) / 2
    let ballY = paddle.offsetTop - ball.offsetHeight
    let baseSpeed = board.clientWidth * INITIAL_SPEED_FACTOR
    let speedX = baseSpeed
    let speedY = -baseSpeed
    let frameId = 0
    let last = 0

    // Brick rects are static between resizes — build once, invalidate on resize.
    let rectCache = buildBrickRectCache(brickRefs.current, board)

    const resetBallToPaddle = () => {
      baseSpeed = board.clientWidth * INITIAL_SPEED_FACTOR
      speedX = baseSpeed * (Math.random() < 0.5 ? -1 : 1)
      speedY = -baseSpeed
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.left = true
      if (e.key === 'ArrowRight') keys.right = true
      if (e.code === 'Space') {
        e.preventDefault()
        const s = statusRef.current
        if (s === 'ready' || s === 'paused') changeStatus('playing')
        else if (s === 'playing') changeStatus('paused')
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.left = false
      if (e.key === 'ArrowRight') keys.right = false
    }

    const onVisibilityChange = () => {
      if (statusRef.current === 'playing' &&  document.hidden) { 
        changeStatus('paused')
      }
    };

    const onOrientationChange = () => {
        if (portraitQuery.matches && statusRef.current === 'playing') {
          changeStatus('paused')
        };
    };

    const onPointerDown = () => { 
      if (statusRef.current === 'ready' || statusRef.current === 'paused') changeStatus('playing')
    }

    const onPointerMove = (e: PointerEvent) => {
      const s = statusRef.current
      if (s === 'paused' || s === 'over' || s === 'win') return
      const rect = board.getBoundingClientRect()
      x = e.clientX - rect.left - board.clientLeft - paddle.offsetWidth / 2
    }

    const onResize = () => {
      const s = getComputedStyle(board)
      padLeft = parseFloat(s.paddingLeft)
      padRight = parseFloat(s.paddingRight)
      padTop = parseFloat(s.paddingTop)

      const scale = board.clientWidth / lastWidth
      x *= scale
      ballX *= scale
      ballY *= scale
      speedX *= scale
      speedY *= scale
      baseSpeed *= scale
      lastWidth = board.clientWidth
      fxScale = board.clientWidth / 800 

      dpr = window.devicePixelRatio || 1
      canvas.width = board.clientWidth * dpr   
      canvas.height = board.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)   

      // Layout changed — rebuild cached brick rects.
      rectCache = buildBrickRectCache(brickRefs.current, board)
    }

    // Walk each array in place, keeping surviving entries at a write index.
    // Avoids allocating a new array via .filter() every frame.
    const updateAndDrawParticles = (dt: number) => {
      let write = 0
      ctx.shadowBlur = FX.trail.glow * fxScale * dpr
      ctx.shadowColor = FX.trail.glowColor
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.life -= FX.trail.fade * dt
        if (p.life <= 0) continue
        particles[write++] = p

        ctx.globalAlpha = p.life
        ctx.fillStyle = p.life > FX.trail.headUntil ? FX.trail.headColor : trailColor
        ctx.beginPath()
        ctx.arc(p.x, p.y, FX.trail.size * p.life * fxScale, 0, Math.PI * 2 )
        ctx.fill()
      }
      particles.length = write
      ctx.shadowBlur = 0
    }

    const updateAndDrawDebris = (dt: number) => {
      let write = 0
      for (let i = 0; i < debris.length; i++) {
        const d = debris[i]
        d.vy += FX.debris.gravity * dt * fxScale
        d.x += d.vx * dt
        d.y += d.vy * dt
        d.life -= FX.debris.fade * dt
        if (d.life <= 0) continue
        debris[write++] = d

        ctx.globalAlpha = d.life
        ctx.fillStyle = d.color
        ctx.fillRect(d.x, d.y, FX.debris.size * fxScale, FX.debris.size * fxScale)
      }
      debris.length = write
      ctx.globalAlpha = 1
    }

    const spawnDebrisForBrick = (brickId: number) => {
      const rect = rectCache.get(brickId)
      if (!rect) return
      const cx = (rect.left + rect.right) / 2
      const cy = (rect.top + rect.bottom) / 2

      let color = brickColorCache.get(brickId)
      if (!color) {
        const el = brickRefs.current[brickId]
        if (!el) return
        color = getComputedStyle(el).getPropertyValue('--c2').trim()
        brickColorCache.set(brickId, color)
      }

      for (let i = 0; i < FX.debris.count; i++) {
        debris.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * FX.debris.speed * fxScale,
          vy: (Math.random() - 0.5) * FX.debris.speed * fxScale,
          life: 1,
          color,
        })
      }
    }

    const loop = (time: number) => {
      frameId = requestAnimationFrame(loop)
      const dt = last ? Math.min((time - last) / 16.67, MAX_DT) : 1
      last = time

      const s = statusRef.current
      if (s === 'paused' || s === 'over' || s === 'win') return

      // Paddle movement
      const paddleSpeed = board.clientWidth * PADDLE_SPEED_FACTOR
      if (keys.left) x -= paddleSpeed * dt
      if (keys.right) x += paddleSpeed * dt
      const minX = padLeft
      const maxX = board.clientWidth - padRight - paddle.offsetWidth
      if (x < minX) x = minX
      else if (x > maxX) x = maxX
      paddle.style.transform = `translateX(${x}px)`

      // Stick the ball to the paddle until the player starts the rally.
      if (s === 'ready') {
        ballX = x + paddle.offsetWidth / 2 - ball.offsetWidth / 2
        ballY = paddle.offsetTop - ball.offsetHeight
        ball.style.transform = `translate(${ballX}px, ${ballY}px)`
        particles.length = 0
        debris.length = 0
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      // Ball motion
      ballX += speedX * speedRef.current * dt
      ballY += speedY * speedRef.current * dt
      ball.style.transform = `translate(${ballX}px, ${ballY}px)`

      const ballLeft = ballX
      const ballRight = ballX + ball.offsetWidth
      const ballTop = ballY
      const ballBottom = ballY + ball.offsetHeight

      // Spawn a new trail particle at the ball's center.
      particles.push({
        x: ballX + ball.offsetWidth / 2,
        y: ballY + ball.offsetHeight / 2,
        life: 1,
      })

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      updateAndDrawParticles(dt)
      updateAndDrawDebris(dt)

      // Fell off the bottom — lose a life.
      if (ballTop > board.clientHeight) {
        livesRef.current -= 1
        setLives(livesRef.current)
        changeStatus(livesRef.current <= 0 ? 'over' : 'ready')
        resetBallToPaddle()
        if (livesRef.current <=0) {playLose()}
        return
      }

      // Brick collision
      const hit = checkBallBrickCollisions(ballX, ballY, ball.offsetWidth, rectCache, bricksStateRef.current)
      if (hit !== null) {
        spawnDebrisForBrick(hit.id)
        if (hit.axis === 'x') speedX = -speedX
        else speedY = -speedY

        bricksStateRef.current = bricksStateRef.current.map((brick) =>
          brick.id === hit.id ? { ...brick, broken: true } : brick,
        )
        setBricks(bricksStateRef.current)

        scoreRef.current += 10 * speedRef.current
        setScore(scoreRef.current)

        if (bricksStateRef.current.every((brick) => brick.broken)) {
          changeStatus('win');
          playWin();
        }
        playBrickHit();
      }

      let bounced = false    

      // Walls
      if (ballLeft < padLeft) {
        speedX = Math.abs(speedX)
        bounced = true  
      }
      if (ballRight > board.clientWidth - padRight) {
        speedX = -Math.abs(speedX)
        bounced = true  
      }
      if (ballTop < padTop) {
        speedY = Math.abs(speedY)
        bounced = true  
      }
      // Paddle collision — reflect angle based on where the ball hits.
      if (
        ballBottom > paddle.offsetTop &&
        ballTop < paddle.offsetTop + paddle.offsetHeight &&
        ballRight > x &&
        ballLeft < x + paddle.offsetWidth
      ) {
        const ballCenter = ballX + ball.offsetWidth / 2
        const paddleCenter = x + paddle.offsetWidth / 2
        const hitPos = (ballCenter - paddleCenter) / (paddle.offsetWidth / 2)
        const clamped = hitPos < -1 ? -1 : hitPos > 1 ? 1 : hitPos
        speedY = -Math.abs(speedY)
        speedX = clamped * Math.abs(speedY);
        bounced = true
      }
      if (bounced) playPaddleHit() 
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('visibilitychange', onVisibilityChange) 
    portraitQuery.addEventListener('change', onOrientationChange)
    board.addEventListener('pointermove', onPointerMove)
    board.addEventListener('pointerdown', onPointerDown)
    const resizeObserver = new ResizeObserver(onResize)  // calls onResize for every size chage
    resizeObserver.observe(board)   
    frameId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      portraitQuery.removeEventListener('change', onOrientationChange)
      board.removeEventListener('pointermove', onPointerMove)
      board.removeEventListener('pointerdown', onPointerDown)
      resizeObserver.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [setLives, setScore, playWin, playLose, playBrickHit, playPaddleHit, changeStatus])

  const renderEndOverlay = (label: string, className: string) => (
    <div className="overlay">
      <span className={className}>{label}</span>
      <span className="final-score">Score: {score}</span>
      <button onClick={() => window.location.reload()}>Play Again</button>
    </div>
  )

  return (
    <div className="gameboard" ref={boardRef}>
      <canvas ref={canvasRef} className="particles" />
      <div className="bricks">
        {bricks.map((brick) => (
          <Brick
            key={brick.id}
            type={brick.type}
            broken={brick.broken}
            ref={(el) => { brickRefs.current[brick.id] = el }}
          />
        ))}
      </div>
      <Ball ref={ballRef} />
      <Paddle ref={paddleRef} />

      {(status === 'ready' || status === 'paused') && (
        <div className="overlay">
          <span>{statusText[status].title}</span>
          {statusText[status].hint && <span className="hint">{statusText[status].hint}</span>}
        </div>
      )}
      {status === 'over' && renderEndOverlay(statusText.over.title, 'over')}
      {status === 'win' && renderEndOverlay(statusText.win.title, 'win')}
    </div>
  )
}

export default Gameboard
