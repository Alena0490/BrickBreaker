import { describe, test, expect } from 'vitest'
import { checkBallBrickCollisions, type BrickData } from './collision'

// Jedna cihla na pozici 100–200 × 100–125 (šířka 100, výška 25)
const rectCache = new Map([[1, { left: 100, top: 100, right: 200, bottom: 125 }]])
const bricks: BrickData[] = [{ id: 1, type: 'row1', broken: false }]
const brokenBricks: BrickData[] = [{ id: 1, type: 'row1', broken: true }]
const BALL = 20

describe('checkBallBrickCollisions', () => {
  test('returns null when the ball is far from every brick', () => {
    const result = checkBallBrickCollisions(0, 0, BALL, rectCache, bricks)
    expect(result).toBeNull()
  })

  test('hits from below on the y axis', () => {
    // míček uprostřed pod cihlou, horní okraj míčku 5 px uvnitř cihly
    const result = checkBallBrickCollisions(140, 120, BALL, rectCache, bricks)
    expect(result).toEqual({ id: 1, axis: 'y' })
  })

test('hits from left on the x axis', () => {
    // míček zleva, pravý okraj 10 px uvnitř cihly
    const result = checkBallBrickCollisions(90, 105, BALL, rectCache, bricks)
    expect(result).toEqual({ id: 1, axis: 'x' })
  })

  test('hits from right on the x axis', () => {
    // míček zprava, levý okraj 10 px uvnitř cihly
    const result = checkBallBrickCollisions(190, 105, BALL, rectCache, bricks)
    expect(result).toEqual({ id: 1, axis: 'x' })
  })

  
  test('ignores the boken bricks', () => {
    // míček zasahuje do cihly, ale ta je rozbitá
    const result = checkBallBrickCollisions(140, 120, BALL, rectCache, brokenBricks )
    expect(result).toBeNull()
  })

    test('ignores the missing bricks', () => {
        // míček zasahuje do cihly, ale ta chybí
        const result = checkBallBrickCollisions(140, 120, BALL,  new Map(), bricks )
        expect(result).toBeNull()
    })

    test('ignores a near miss at the corner', () => {
        // míček se nedokne rohu cihly
        const result = checkBallBrickCollisions(82, 82, BALL, rectCache, bricks )
        expect(result).toBeNull()
    })

      test('ignores a near miss at the right bottom corner', () => {
        // míček se nedokne rohu cihly
        const result = checkBallBrickCollisions(198, 123, BALL, rectCache, bricks )
        expect(result).toBeNull()
    })
})

