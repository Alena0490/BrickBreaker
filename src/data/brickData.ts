export const ROWS = 6
export const COLS = 7
export const TYPES = ['row1', 'row2', 'row3', 'row4', 'row5', 'row6'] as const

export type BrickData = { id: number; type: string; broken: boolean }

export const createBricks = (): BrickData[] => {
  const bricks: BrickData[] = new Array(ROWS * COLS)
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = row * COLS + col
      bricks[id] = { id, type: TYPES[row], broken: false }
    }
  }
  return bricks
}
