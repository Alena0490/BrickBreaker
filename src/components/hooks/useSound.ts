import { useEffect, useRef, useCallback } from 'react'
import Win from '../../sounds/win.mp3'
import Lose from '../../sounds/game-over.mp3'
import BrickHit from '../../sounds/glass-break.mp3'
import PaddleHit from '../../sounds/ball-hit.mp3'

const sounds = {
  win: new Audio(Win),
  lose: new Audio(Lose),
  brick: new Audio(BrickHit),
  paddle: new Audio(PaddleHit),
}

type SoundName = keyof typeof sounds

type UseSoundProps = {
  soundEnabled: boolean
}

const useSound = ({ soundEnabled }: UseSoundProps) => {
  const enabledRef = useRef(soundEnabled)

  useEffect(() => {
    enabledRef.current = soundEnabled
  }, [soundEnabled])

  const playSound = useCallback((name: SoundName, volume: number) => {
    if (!enabledRef.current) return
    const audio = sounds[name].cloneNode() as HTMLAudioElement
    audio.volume = volume
    audio.play().catch(() => {})
}, [])

  const playWin = useCallback(() => playSound('win', 1), [playSound])
  const playLose = useCallback(() => playSound('lose', 1), [playSound])
  const playBrickHit = useCallback(() => playSound('brick', 0.8), [playSound])
  const playPaddleHit = useCallback(() => playSound('paddle', 0.2), [playSound])

  return {
    playWin,
    playLose,
    playBrickHit,
    playPaddleHit
  }
}

export default useSound