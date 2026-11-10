import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";

type StatsProps = {
  lives: number
  score: number
  speed: number
  onSpeedChange: (delta: number) => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

const Stats = ({ lives, score, speed, onSpeedChange, soundEnabled, setSoundEnabled }: StatsProps) => {
  const hearts = []
  for (let i = 0; i < lives; i++) {
    hearts.push(<span key={i} className="life">❤️</span>)
  }

  return (
    <div className="game-stats">
      <div className="stat speed">
        Speed: {speed}
        <div className="buttons">
          <button className="speed-button" onClick={() => onSpeedChange(-1)}>-</button>
          <button className="speed-button" onClick={() => onSpeedChange(1)}>+</button>
        </div>
      </div>
      <div>Score: {score}</div>
      <div>Lives: <span>{hearts}</span></div>
      <button 
        className="sound-button" 
        onClick={() => setSoundEnabled(!soundEnabled)} 
        aria-label="Toggle Sound"
      >
        {soundEnabled ? <HiSpeakerWave /> : <HiSpeakerXMark />}
      </button>
    </div>
  )
}

export default Stats
