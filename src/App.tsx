import { useState } from 'react'
import Gameboard from './components/Gameboard'
import Stats from './components/Stats'
import type { Status } from './types/types'

const MIN_SPEED = 1;
const MAX_SPEED = 5;

const App = () => {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [status, setStatus] = useState<Status>('ready');

  const changeSpeed = (delta: number) =>
    setSpeed((s) => Math.min(MAX_SPEED, Math.max(MIN_SPEED, s + delta)))

  return (
    <div className="game-container">
      <div className="game-overlay">
        <p>Please turn your device</p>
      </div>
      <Gameboard 
        speed={speed} 
        score={score} 
        setLives={setLives} 
        setScore={setScore} 
        soundEnabled={soundEnabled} 
        status={status}
        setStatus={setStatus}
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
    </div>
  )
}

export default App
