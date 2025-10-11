import { animationDataService } from '@/services/animationData'
import { useCodeMode } from '@/contexts/CodeModeContext'
import type { Category } from '@/types/animation'
import { useCallback, useEffect, useState } from 'react'

/**
 * Internal state tracking for animation catalog loading
 * @internal
 */
interface LoadingState {
  /** Whether the catalog is currently being loaded */
  isLoading: boolean
  /** Error message if loading failed, null otherwise */
  error: string | null
}

/**
 * Hook for loading and managing the animation catalog.
 *
 * Automatically loads the animation catalog based on the current code mode (CSS/Framer),
 * and provides methods to refresh the catalog when needed. Handles loading states,
 * error states, and automatically reloads when code mode changes.
 *
 * @returns Animation catalog state and control functions
 * @returns returns.categories - Array of animation categories with nested groups and animations
 * @returns returns.isLoading - True while catalog is loading
 * @returns returns.error - Error message if loading failed, null otherwise
 * @returns returns.refreshAnimations - Function to manually reload the catalog
 *
 * @example
 * ```tsx
 * function AnimationCatalog() {
 *   const { categories, isLoading, error, refreshAnimations } = useAnimations()
 *
 *   if (isLoading) return <LoadingSpinner />
 *   if (error) return <ErrorMessage message={error} onRetry={refreshAnimations} />
 *
 *   return (
 *     <div>
 *       {categories.map(category => (
 *         <CategorySection key={category.id} category={category} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Hook automatically reloads when code mode changes
 * function App() {
 *   const { codeMode, toggleCodeMode } = useCodeMode()
 *   const { categories, isLoading } = useAnimations()
 *
 *   // When toggleCodeMode is called, useAnimations automatically
 *   // reloads the catalog with the new mode's components
 *   return <button onClick={toggleCodeMode}>Toggle to {codeMode === 'framer' ? 'CSS' : 'Framer'}</button>
 * }
 * ```
 */
export function useAnimations() {
  const { codeMode } = useCodeMode()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
  })

  const loadCatalog = useCallback(async () => {
    try {
      setLoadingState({ isLoading: true, error: null })
      const data = await animationDataService.loadAnimations(codeMode)
      setCategories(data)
      setLoadingState({ isLoading: false, error: null })
    } catch (error) {
      setLoadingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load animations',
      })
    }
  }, [codeMode])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const refreshAnimations = async () => {
    try {
      setLoadingState({ isLoading: true, error: null })
      const data = await animationDataService.refreshCatalog(codeMode)
      setCategories(data)
      setLoadingState({ isLoading: false, error: null })
    } catch (error) {
      setLoadingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh animations',
      })
    }
  }

  return {
    categories,
    isLoading: loadingState.isLoading,
    error: loadingState.error,
    refreshAnimations,
  }
}
