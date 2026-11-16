import { useState, useCallback } from 'react'
import useLocalStorage from './hooks/useLocalStorage'
import Gameboard from './components/Gameboard'
import Stats from './components/Stats'
import type { Status } from './types/types'

const MIN_SPEED = 1;
const MAX_SPEED = 5;

const App = () => {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useLocalStorage('brickBreaker.highScore', 0)
  const [soundEnabled, setSoundEnabled] = useLocalStorage('brickBreaker.sound', true)
  const [speed, setSpeed] = useLocalStorage('brickBreaker.speed', 1)
  const [status, setStatus] = useState<Status>('ready');
  const [gameId, setGameId] = useState(0);

  const best = Math.max(highScore, score);

  const handleGameEnd = useCallback((finalScore: number) => {
    setHighScore((prev) => Math.max(prev, finalScore))
  }, [setHighScore]);

  const restart = () => {
    setScore(0)
    setLives(3)
    setStatus('ready')
    setGameId((id) => id + 1)
  }

  const changeSpeed = (delta: number) =>
    setSpeed((s) => Math.min(MAX_SPEED, Math.max(MIN_SPEED, s + delta)))

  return (
    <main className="game-container">
      <h1 className="visually-hidden">Brick Breaker</h1>
      <div className="game-overlay" role="alert">
        <p>Please turn your device</p>
      </div>
      <Gameboard
        key={gameId} 
        speed={speed} 
        score={score} 
        setLives={setLives} 
        setScore={setScore} 
        soundEnabled={soundEnabled} 
        status={status}
        setStatus={setStatus}
        onRestart={restart}
        best={best}
        onGameEnd={handleGameEnd}
      />
      <Stats 
        lives={lives} 
        score={score} 
        speed={speed} 
        onSpeedChange={changeSpeed} 
        soundEnabled={soundEnabled} 
        setSoundEnabled={setSoundEnabled} 
        status={status}
        setStatus={setStatus}
      />
    </main>
  )
}

export default App
