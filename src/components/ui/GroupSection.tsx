import { buildRegistryFromCategories, getAnimationMetadata } from '@/components/animationRegistry'
import { AnimationCard } from '@/components/ui/AnimationCard'
import { useCodeMode } from '@/contexts/CodeModeContext'
import type { Group } from '@/types/animation'
import { Suspense, useMemo } from 'react'

/**
 * Props for the GroupSection component
 */
interface GroupSectionProps {
  /** Animation group data containing animations to display */
  group: Group
  /** HTML element ID for scroll anchoring and navigation */
  elementId: string
}

/**
 * Determines if an animation should run infinitely (continuous loop).
 *
 * Used to identify animations that represent ongoing states (like loading spinners,
 * live indicators, pulsing effects) that should never stop animating.
 *
 * @param groupId - The ID of the animation group (e.g., "loading-states")
 * @param animationId - The full animation ID (e.g., "timer-effects__timer-pulse")
 * @returns True if animation should loop infinitely, false otherwise
 *
 * @internal
 */
function isInfiniteAnimation(groupId: string, animationId: string): boolean {
  // All loading states should be infinite
  if (groupId === 'loading-states') return true

  // Specific animations that should loop infinitely
  const infiniteAnimations = [
    // Timer effects that should continuously pulse/glow
    'timer-effects__timer-pulse',
    'timer-effects__timer-glow',
    'timer-effects__timer-breathe',

    // Update indicators that should continuously show activity
    'update-indicators__live-ping',
    'update-indicators__badge-pulse',
    'update-indicators__notification-dot',

    // Realtime data animations
    'realtime-data__live-score-update',
    'realtime-data__currency-update',
    'realtime-data__win-ticker',
  ]

  return infiniteAnimations.includes(animationId)
}

/**
 * Section component that renders a group of related animations.
 *
 * Displays a header with the group title and animation count, followed by a grid
 * of AnimationCard components. Automatically detects special animation types:
 * - **Infinite animations**: Loading states and continuous effects that loop
 * - **Lights animations**: Animations with "lights__" prefix that get bulb controls
 *
 * The component:
 * - Builds the animation registry based on current code mode (CSS/Framer)
 * - Wraps each animation in Suspense for code-splitting/lazy loading
 * - Passes special props to lights animations (numBulbs, onColor)
 * - Shows placeholder for missing components
 *
 * Uses memoization to prevent re-renders when parent state changes but
 * group data remains the same.
 *
 * @example
 * ```tsx
 * // Render a group of modal animations
 * <GroupSection
 *   group={{
 *     id: "modal-base",
 *     title: "Modal Base Animations",
 *     animations: [
 *       { id: "modal-base__scale-pop", title: "Scale Pop", ... },
 *       { id: "modal-base__fade-in", title: "Fade In", ... }
 *     ]
 *   }}
 *   elementId="group-modal-base"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Render loading state group (infinite animations)
 * // All animations in loading-states group automatically loop infinitely
 * <GroupSection
 *   group={{
 *     id: "loading-states",
 *     title: "Loading States",
 *     animations: loadingAnimations
 *   }}
 *   elementId="group-loading-states"
 * />
 * ```
 */
export function GroupSection({ group, elementId }: GroupSectionProps) {
  const { codeMode } = useCodeMode()
  const animationRegistry = useMemo(() => buildRegistryFromCategories(codeMode), [codeMode])
  return (
    <article id={elementId} className="pf-group">
      <header className="pf-group__header">
        <div>
          <h2 className="pf-group__title">
            {group.title} ({group.animations.length})
          </h2>
        </div>
      </header>

      {group.animations.length > 0 ? (
        <div className="pf-card-grid">
          {group.animations.map((animation) => {
            const AnimationComponent = animationRegistry[animation.id]
            const infiniteAnimation = isInfiniteAnimation(group.id, animation.id)
            const isLightsAnimation = animation.id.startsWith('lights__')

            // Get metadata for the current code mode (Framer or CSS)
            const metadata = getAnimationMetadata(animation.id, codeMode)
            const title = metadata?.title || animation.title
            const description = metadata?.description || animation.description
            const tags = metadata?.tags || animation.tags

            return (
              <AnimationCard
                key={animation.id}
                title={title}
                description={description}
                animationId={animation.id}
                tags={tags}
                infiniteAnimation={infiniteAnimation}
                disableReplay={animation.disableReplay}
              >
                {({ bulbCount, onColor }) => (
                  AnimationComponent ? (
                    <Suspense fallback={<div className="pf-card__placeholder">Loading…</div>}>
                      <AnimationComponent {...(isLightsAnimation ? { numBulbs: bulbCount, onColor } : {})} />
                    </Suspense>
                  ) : (
                    <div className="pf-card__placeholder">{animation.id}</div>
                  )
                )}
              </AnimationCard>
            )
          })}
        </div>
      ) : (
        <div className="pf-group__empty">Animations coming soon</div>
      )}
    </article>
  )
}
