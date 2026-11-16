import type { Status } from "../types/types";
import { HiSpeakerWave, HiSpeakerXMark,  HiMiniPlay, HiMiniPause } from "react-icons/hi2";

type StatsProps = {
  lives: number;
  score: number;
  speed: number;
  onSpeedChange: (delta: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  status: Status;
  setStatus: (ready: Status) => void;
}

const Stats = ({ lives, score, speed, onSpeedChange, soundEnabled, setSoundEnabled, status, setStatus }: StatsProps) => {
  const hearts = []
  for (let i = 0; i < lives; i++) {
    hearts.push(<span key={i} className="life" aria-hidden={true}>❤️</span>)
  }

  return (
    <div className="game-stats">
      <div className="stat speed" role="group" aria-label="Speed controls">
        <span aria-live="polite">Speed: {speed}</span>
        <div className="buttons">
          <button
            className="speed-button"
            onClick={() => onSpeedChange(-1)}
            aria-label="Decrease speed"
          >
            -
          </button>
          <button
            className="speed-button"
            onClick={() => onSpeedChange(1)}
            aria-label="Increase speed"
          >
            +
          </button>
        </div>
      </div>
      <div aria-live="polite">Score: {score}</div>
      <div aria-label={`Lives: ${lives}`}>Lives: <span>{hearts}</span></div>
      <div className="game-buttons">
        <button
          className="pause-button"
          onClick={() => setStatus(status === 'playing' ? 'paused' : 'playing')}
          disabled={status === 'over' || status === 'win'}
          aria-label={status === 'playing' ? 'Pause' : 'Play'}
        >
          {status === 'playing' ? <HiMiniPause /> : <HiMiniPlay />}
        </button>
        <button
          className="sound-button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          aria-pressed={!soundEnabled}
        >
          {soundEnabled ? <HiSpeakerWave /> : <HiSpeakerXMark />}
        </button>
      </div>
    </div>
  )
}

export default Stats
