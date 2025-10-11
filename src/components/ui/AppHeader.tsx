import githubIcon from '@/assets/github.svg'
import type { Group } from '@/types/animation'
import { forwardRef, memo } from 'react'

/**
 * Props for the AppHeader component
 */
interface AppHeaderProps {
  /** Current animation group being displayed */
  currentGroup: Group | undefined
  /** Callback when hamburger menu button is clicked */
  onMenuClick: () => void
}

/**
 * Mobile header bar with navigation and branding.
 *
 * Features:
 * - **Hamburger menu**: Opens mobile drawer navigation
 * - **Group title**: Shows current group name and animation count
 * - **GitHub link**: External link to source repository
 * - **Scroll reference**: Ref used for scroll calculations (via forwardRef)
 *
 * The header is fixed at top on mobile and uses `data-app-shell="bar"`
 * for identification by scroll logic.
 *
 * @example
 * ```tsx
 * const appBarRef = useRef<HTMLDivElement>(null)
 *
 * <AppHeader
 *   ref={appBarRef}
 *   currentGroup={currentGroup}
 *   onMenuClick={() => send({ type: 'OPEN_DRAWER' })}
 * />
 * ```
 */
const AppHeaderComponent = forwardRef<HTMLDivElement, AppHeaderProps>(
  ({ currentGroup, onMenuClick }, ref) => {
    return (
      <div className="pf-mobile-header" data-app-shell="bar" ref={ref}>
        {/* Hamburger menu button */}
        <button
          type="button"
          className="pf-hamburger"
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-controls="pf-sidebar-drawer"
          onClick={onMenuClick}
        >
          {/* Hamburger icon */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Current group title */}
        {currentGroup && (
          <span className="pf-mobile-header__title">
            {currentGroup.title} ({currentGroup.animations.length})
          </span>
        )}

        {/* GitHub link */}
        <a
          href="https://github.com/michael-h-patrianna/animations"
          target="_blank"
          rel="noopener noreferrer"
          className="pf-github-link"
          aria-label="View source on GitHub"
        >
          <img src={githubIcon} alt="GitHub" className="pf-github-icon" />
        </a>
      </div>
    )
  }
)

AppHeaderComponent.displayName = 'AppHeader'

/**
 * Memoized AppHeader component to prevent unnecessary re-renders.
 *
 * Re-renders only when:
 * - currentGroup changes (different group selected)
 * - onMenuClick callback changes
 */
export const AppHeader = memo(AppHeaderComponent, (prevProps, nextProps) => {
  // Compare onMenuClick callback
  if (prevProps.onMenuClick !== nextProps.onMenuClick) {
    return false // Callback changed, re-render
  }

  // Compare currentGroup (can be undefined)
  if (prevProps.currentGroup === nextProps.currentGroup) {
    return true // Same reference or both undefined, skip re-render
  }

  // If one is undefined and the other isn't, re-render
  if (!prevProps.currentGroup || !nextProps.currentGroup) {
    return false
  }

  // Compare currentGroup properties
  if (
    prevProps.currentGroup.id !== nextProps.currentGroup.id ||
    prevProps.currentGroup.title !== nextProps.currentGroup.title ||
    prevProps.currentGroup.animations.length !== nextProps.currentGroup.animations.length
  ) {
    return false // Group changed, re-render
  }

  return true // Props are equal, skip re-render
})
