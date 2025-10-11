import { AppSidebar } from '@/components/ui/AppSidebar'
import type { Category } from '@/types/animation'
import { memo } from 'react'

/**
 * Props for the AppDrawer component
 */
interface AppDrawerProps {
  /** Whether the drawer is currently open */
  isOpen: boolean
  /** Callback when drawer should be closed */
  onClose: () => void
  /** Array of animation categories to display in navigation */
  categories: Category[]
  /** Currently active group ID (for highlighting) */
  currentGroupId: string
  /** Callback when a category header is clicked */
  onCategorySelect: (categoryId: string) => void
  /** Callback when a group link is clicked */
  onGroupSelect: (groupId: string) => void
}

/**
 * Mobile drawer component containing the navigation sidebar.
 *
 * Features:
 * - **Modal overlay**: Semi-transparent backdrop that closes drawer on click
 * - **Slide-in panel**: Animated panel containing navigation
 * - **Close button**: X button in header to dismiss drawer
 * - **Accessibility**: Proper ARIA attributes (role="dialog", aria-modal, etc.)
 * - **Auto-close**: Drawer closes when user selects a group/category
 *
 * The drawer is hidden (`hidden` attribute) when closed to remove from tab order
 * and prevent focus trap issues. CSS handles the slide animation via the `is-open` class.
 *
 * @example
 * ```tsx
 * <AppDrawer
 *   isOpen={isDrawerOpen}
 *   onClose={() => send({ type: 'CLOSE_DRAWER' })}
 *   categories={categories}
 *   currentGroupId={currentGroupId}
 *   onCategorySelect={(categoryId) => {
 *     handleCategorySelect(categoryId)
 *   }}
 *   onGroupSelect={(groupId) => {
 *     handleGroupSelect(groupId)
 *   }}
 * />
 * ```
 */
function AppDrawerComponent({
  isOpen,
  onClose,
  categories,
  currentGroupId,
  onCategorySelect,
  onGroupSelect,
}: AppDrawerProps) {
  return (
    <div
      id="pf-sidebar-drawer"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      hidden={!isOpen}
      className={`pf-drawer ${isOpen ? 'is-open' : ''}`}
    >
      {/* Overlay - clicks close the drawer */}
      <div className="pf-drawer__overlay" onClick={onClose} />

      {/* Drawer panel */}
      <div className="pf-drawer__panel">
        {/* Header with close button */}
        <div className="pf-drawer__panel-header">
          <button type="button" className="pf-hamburger" aria-label="Close menu" onClick={onClose}>
            {/* Close icon (X) */}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation sidebar */}
        <AppSidebar
          categories={categories}
          currentGroupId={currentGroupId}
          onCategorySelect={onCategorySelect}
          onGroupSelect={onGroupSelect}
          className="pf-sidebar"
        />
      </div>
    </div>
  )
}

/**
 * Memoized AppDrawer component to prevent unnecessary re-renders.
 *
 * Re-renders only when:
 * - isOpen changes (drawer opens/closes)
 * - currentGroupId changes (active group changes)
 * - categories array changes (catalog data updates)
 * - callback functions change
 */
export const AppDrawer = memo(AppDrawerComponent, (prevProps, nextProps) => {
  // Compare primitive props
  if (
    prevProps.isOpen !== nextProps.isOpen ||
    prevProps.currentGroupId !== nextProps.currentGroupId ||
    prevProps.onClose !== nextProps.onClose ||
    prevProps.onCategorySelect !== nextProps.onCategorySelect ||
    prevProps.onGroupSelect !== nextProps.onGroupSelect
  ) {
    return false // Props changed, re-render
  }

  // Compare categories array reference (fast path)
  if (prevProps.categories === nextProps.categories) {
    return true // Same reference, skip re-render
  }

  // Compare categories array length
  if (prevProps.categories.length !== nextProps.categories.length) {
    return false // Categories changed, re-render
  }

  // Shallow comparison of category ids
  for (let i = 0; i < prevProps.categories.length; i++) {
    if (prevProps.categories[i].id !== nextProps.categories[i].id) {
      return false // Category changed, re-render
    }
  }

  return true // Props are equal, skip re-render
})
