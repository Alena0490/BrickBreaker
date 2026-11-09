export type BrickData = {
  id: number
  type: string
  broken: boolean
}

type LocalRect = { left: number; top: number; right: number; bottom: number }

// Rects are cached per brick id because bricks never move; only resize invalidates.
// Coordinates are stored in board-local space so we only measure the board rect once per frame.
export const buildBrickRectCache = (
  brickElements: { [key: number]: HTMLDivElement | null },
  boardElement: HTMLElement,
): Map<number, LocalRect> => {
  const cache = new Map<number, LocalRect>()
  const boardRect = boardElement.getBoundingClientRect()
  const offsetX = boardRect.left + boardElement.clientLeft
  const offsetY = boardRect.top + boardElement.clientTop
  for (const key in brickElements) {
    const el = brickElements[key]
    if (!el) continue
    const r = el.getBoundingClientRect()
    cache.set(Number(key), {
      left: r.left - offsetX,
      top: r.top - offsetY,
      right: r.right - offsetX,
      bottom: r.bottom - offsetY,
    })
  }
  return cache
}

export const checkBallBrickCollisions = (
  ballLeft: number,
  ballTop: number,
  ballSize: number,
  rectCache: Map<number, LocalRect>,
  bricksData: BrickData[],
): { id: number; axis: 'x' | 'y' } | null => {
  const radius = ballSize / 2
  const cx = ballLeft + radius
  const cy = ballTop + radius
  const ballRight = ballLeft + ballSize
  const ballBottom = ballTop + ballSize

  for (let i = 0; i < bricksData.length; i++) {
    const brick = bricksData[i]
    if (brick.broken) continue

    const rect = rectCache.get(brick.id)
    if (!rect) continue

    // Cheap AABB prune first — skips the sqrt-free distance test for most bricks.
    if (ballRight < rect.left || ballLeft > rect.right || ballBottom < rect.top || ballTop > rect.bottom) {
      continue
    }

    const closestX = cx < rect.left ? rect.left : cx > rect.right ? rect.right : cx
    const closestY = cy < rect.top ? rect.top : cy > rect.bottom ? rect.bottom : cy
    const dx = cx - closestX
    const dy = cy - closestY

    if (dx * dx + dy * dy < radius * radius) {
      const overlapX = Math.min(ballRight, rect.right) - Math.max(ballLeft, rect.left)
      const overlapY = Math.min(ballBottom, rect.bottom) - Math.max(ballTop, rect.top)
      return { id: brick.id, axis: overlapX < overlapY ? 'x' : 'y' }
    }
  }

  return null
}
