import type { Ref } from 'react'

const Ball = ({ ref }: { ref: Ref<HTMLDivElement> }) => {
  return <div ref={ref} className="ball" aria-hidden={true} />
}

export default Ball
