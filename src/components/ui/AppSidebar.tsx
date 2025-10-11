import type { Category } from '@/types/animation'
import { memo, type FC } from 'react'
import { CodeModeSwitch } from './CodeModeSwitch'

/**
 * Props for the AppSidebar component
 */
interface AppSidebarProps {
  /** Array of animation categories to display in navigation */
  categories: Category[]
  /** Currently active group ID (for highlighting) */
  currentGroupId: string
  /** Callback when a category header is clicked (navigates to first group) */
  onCategorySelect: (categoryId: string) => void
  /** Callback when a group link is clicked (navigates to that group) */
  onGroupSelect: (groupId: string) => void
  /** Optional additional CSS class name */
  className?: string
}

/**
 * Navigation sidebar for browsing animation categories and groups.
 *
 * Features:
 * - **Two-level navigation**: Category headers and nested group links
 * - **Active state highlighting**: Shows which category/group is currently visible
 * - **Code mode toggle**: Displays CodeModeSwitch component at top
 * - **Collapsible categories**: Each category can contain multiple group links
 *
 * Active state logic:
 * - A category is highlighted if ANY of its groups is currently active
 * - A group link is highlighted if it matches the currentGroupId
 *
 * Uses memoization to prevent re-renders when app state changes but
 * navigation data and active group remain the same.
 *
 * @example
 * ```tsx
 * <AppSidebar
 *   categories={[
 *     {
 *       id: "dialogs",
 *       title: "Dialogs & Modals",
 *       groups: [
 *         { id: "modal-base", title: "Modal Base Animations", animations: [...] },
 *         { id: "toast-notifications", title: "Toast Notifications", animations: [...] }
 *       ]
 *     },
 *     {
 *       id: "progress",
 *       title: "Progress Indicators",
 *       groups: [...]
 *     }
 *   ]}
 *   currentGroupId="modal-base"
 *   onCategorySelect={(categoryId) => {
 *     // Navigate to first group in category
 *     const firstGroup = categories.find(c => c.id === categoryId)?.groups[0]
 *     if (firstGroup) navigate(firstGroup.id)
 *   }}
 *   onGroupSelect={(groupId) => {
 *     // Navigate to specific group
 *     navigate(groupId)
 *   }}
 * />
 * ```
 */
const AppSidebarComponent: FC<AppSidebarProps> = ({
  categories,
  currentGroupId,
  onCategorySelect,
  onGroupSelect,
  className,
}) => {
  return (
    <aside className={`pf-sidebar${className ? ` ${className}` : ''}`}>
      <CodeModeSwitch />
      <div className="pf-sidebar__nav">
        {categories.map((category) => {
          // Check if any group in this category is currently active
          const hasActiveGroup = category.groups.some((group) => group.id === currentGroupId)

          return (
            <div key={category.id} className="pf-sidebar__section">
              <button
                onClick={() => onCategorySelect(category.id)}
                className={`pf-sidebar__link pf-sidebar__link--category ${
                  hasActiveGroup ? 'pf-sidebar__link--active' : ''
                }`}
              >
                {category.title}
              </button>

              {category.groups.length > 0 && (
                <div className="pf-sidebar__subnav">
                  {category.groups.map((group) => {
                    const isActiveGroup = group.id === currentGroupId

                    return (
                      <button
                        key={group.id}
                        onClick={() => onGroupSelect(group.id)}
                        className={`pf-sidebar__link pf-sidebar__link--group ${
                          isActiveGroup ? 'pf-sidebar__link--active' : ''
                        }`}
                      >
                        {group.title}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

/**
 * Memoized AppSidebar component to prevent unnecessary re-renders.
 *
 * Custom comparison function checks:
 * - currentGroupId (active group state)
 * - categories array reference and length
 * - callback functions (onCategorySelect, onGroupSelect)
 * - className prop
 *
 * Prevents re-renders when parent App component updates unrelated state
 * (like drawer open/close, scroll position, etc.)
 */
export const AppSidebar = memo(AppSidebarComponent, (prevProps, nextProps) => {
  // Compare primitive props
  if (
    prevProps.currentGroupId !== nextProps.currentGroupId ||
    prevProps.className !== nextProps.className ||
    prevProps.onCategorySelect !== nextProps.onCategorySelect ||
    prevProps.onGroupSelect !== nextProps.onGroupSelect
  ) {
    return false // Props changed, re-render
  }

  // Compare categories array reference first (fast path)
  if (prevProps.categories === nextProps.categories) {
    return true // Same reference, skip re-render
  }

  // Compare categories array length
  if (prevProps.categories.length !== nextProps.categories.length) {
    return false // Categories changed, re-render
  }

  // Shallow comparison of category ids and group counts
  for (let i = 0; i < prevProps.categories.length; i++) {
    const prevCat = prevProps.categories[i]
    const nextCat = nextProps.categories[i]

    if (
      prevCat.id !== nextCat.id ||
      prevCat.title !== nextCat.title ||
      prevCat.groups.length !== nextCat.groups.length
    ) {
      return false // Category changed, re-render
    }

    // Compare group ids within each category
    for (let j = 0; j < prevCat.groups.length; j++) {
      if (prevCat.groups[j].id !== nextCat.groups[j].id) {
        return false // Group changed, re-render
      }
    }
  }

  return true // Props are equal, skip re-render
})
