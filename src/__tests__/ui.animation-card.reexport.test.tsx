import * as animationCard from '../components/ui/animation-card'

describe('ui/animation-card re-export', () => {
  it('re-exports AnimationCard symbol', () => {
    expect(animationCard).toBeDefined()
    // AnimationCard is memoized, so it's an object (memo component), not a plain function
    expect(animationCard.AnimationCard).toBeDefined()
    expect(typeof animationCard.AnimationCard).toBe('object')
  })
})
