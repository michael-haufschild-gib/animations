import * as catalog from '../components/ui/catalog'

describe('ui/catalog re-exports', () => {
  it('exports the expected UI components', () => {
    expect(catalog).toBeDefined()
    // Access the re-exported symbols to count towards coverage
    // AnimationCard is memoized (object), CategorySection and GroupSection are plain functions
    expect(catalog.AnimationCard).toBeDefined()
    expect(typeof catalog.AnimationCard).toBe('object') // memoized
    expect(catalog.CategorySection).toBeDefined()
    expect(typeof catalog.CategorySection).toBe('function')
    expect(catalog.GroupSection).toBeDefined()
    expect(typeof catalog.GroupSection).toBe('function')
  })
})
