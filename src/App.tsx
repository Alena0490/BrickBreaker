import { useState } from 'react'
import Gameboard from './components/Gameboard'
import Stats from './components/Stats'

const MIN_SPEED = 1
const MAX_SPEED = 5

const App = () => {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
      />
      <Stats 
        lives={lives} 
        score={score} 
        speed={speed} 
        onSpeedChange={changeSpeed} 
        soundEnabled={soundEnabled} 
        setSoundEnabled={setSoundEnabled} 
      />
    </div>
  )
}

export default App
