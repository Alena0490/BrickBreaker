import type { Ref } from 'react'

const Paddle = ({ ref }: { ref: Ref<HTMLDivElement> }) => {
  return <div ref={ref} className="paddle" />
}

export default Paddle
