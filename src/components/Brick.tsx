import type { Ref } from 'react'

type BrickProps = {
  type: string
  broken: boolean
  ref?: Ref<HTMLDivElement>
}

const Brick = ({ type, broken, ref }: BrickProps) => {
  return <div ref={ref} className={`brick brick--${type}${broken ? ' brick--broken' : ''}`} />
}

export default Brick
