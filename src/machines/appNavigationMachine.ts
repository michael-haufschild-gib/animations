import type { Category, Group } from '@/types/animation'
import { assign, setup } from 'xstate'

// ============================================================================
// Types
// ============================================================================

/**
 * Context for the app navigation state machine.
 * Holds all state data needed for navigation and drawer management.
 */
export interface AppNavigationContext {
  /** Currently displayed animation group ID */
  currentGroupId: string
  /** All available groups in display order */
  allGroups: Group[]
  /** All categories with their groups */
  categories: Category[]
  /** Animation direction: 1 = forward, -1 = backward, 0 = no animation */
  direction: number
}

/**
 * Events that can be sent to the app navigation state machine.
 */
export type AppNavigationEvent =
  | {
      type: 'INITIALIZE'
      groupId?: string
      allGroups: Group[]
      categories: Category[]
    }
  | { type: 'NAVIGATE_TO_GROUP'; groupId: string }
  | { type: 'NAVIGATE_TO_CATEGORY'; categoryId: string }
  | { type: 'SWIPE_NEXT' }
  | { type: 'SWIPE_PREV' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }

/**
 * Input type for the state machine (initial context).
 */
export interface AppNavigationInput {
  navigate: (path: string, options?: { replace?: boolean }) => void
}

// ============================================================================
// Guards
// ============================================================================

/**
 * Check if the provided groupId exists in allGroups.
 */
const isValidGroupId = ({ event }: any) => {
  if (!event.groupId) return false
  return event.allGroups.some((g: Group) => g.id === event.groupId)
}

/**
 * Check if allGroups has at least one group.
 */
const hasGroups = ({ event }: any) => {
  return event.allGroups.length > 0
}

/**
 * Check if the target groupId is different from current.
 */
const isDifferentGroup = ({ context, event }: any) => {
  return event.groupId !== context.currentGroupId
}

/**
 * Check if we can navigate to the next group.
 */
const canGoNext = ({ context }: any) => {
  const currentIndex = context.allGroups.findIndex(
    (g: Group) => g.id === context.currentGroupId
  )
  return currentIndex >= 0 && currentIndex < context.allGroups.length - 1
}

/**
 * Check if we can navigate to the previous group.
 */
const canGoPrev = ({ context }: any) => {
  const currentIndex = context.allGroups.findIndex(
    (g: Group) => g.id === context.currentGroupId
  )
  return currentIndex > 0
}

/**
 * Check if the category exists and has groups.
 */
const isValidCategory = ({ context, event }: any) => {
  const category = context.categories.find((c: Category) => c.id === event.categoryId)
  return category !== undefined && category.groups.length > 0
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Initialize context with groups from INITIALIZE event.
 * Sets currentGroupId to the provided groupId if valid, otherwise first group.
 */
const initializeContext = assign({
  allGroups: ({ event }) =>
    (event as Extract<AppNavigationEvent, { type: 'INITIALIZE' }>).allGroups,
  categories: ({ event }) =>
    (event as Extract<AppNavigationEvent, { type: 'INITIALIZE' }>).categories,
  currentGroupId: ({ event }) => {
    const initEvent = event as Extract<AppNavigationEvent, { type: 'INITIALIZE' }>
    // If valid groupId provided, use it; otherwise use first group
    if (
      initEvent.groupId &&
      initEvent.allGroups.some((g) => g.id === initEvent.groupId)
    ) {
      return initEvent.groupId
    }
    return initEvent.allGroups[0]?.id || ''
  },
  direction: () => 0, // No animation on initial load
})

/**
 * Navigate to a specific group.
 * Updates currentGroupId and calculates direction based on position change.
 */
const navigateToGroup = assign({
  currentGroupId: ({ event }) =>
    (event as Extract<AppNavigationEvent, { type: 'NAVIGATE_TO_GROUP' }>)
      .groupId,
  direction: ({ context, event }) => {
    const targetGroupId = (
      event as Extract<AppNavigationEvent, { type: 'NAVIGATE_TO_GROUP' }>
    ).groupId
    const currentIndex = context.allGroups.findIndex(
      (g: Group) => g.id === context.currentGroupId
    )
    const newIndex = context.allGroups.findIndex((g: Group) => g.id === targetGroupId)
    return newIndex > currentIndex ? 1 : -1
  },
})

/**
 * Navigate to the first group in a category.
 * Finds the category and navigates to its first group.
 */
const navigateToCategory = assign({
  currentGroupId: ({ context, event }) => {
    const categoryId = (
      event as Extract<AppNavigationEvent, { type: 'NAVIGATE_TO_CATEGORY' }>
    ).categoryId
    const category = context.categories.find((c: Category) => c.id === categoryId)
    if (category && category.groups.length > 0) {
      return category.groups[0].id
    }
    return context.currentGroupId // Fallback to current if category not found
  },
  direction: ({ context, event }) => {
    const categoryId = (
      event as Extract<AppNavigationEvent, { type: 'NAVIGATE_TO_CATEGORY' }>
    ).categoryId
    const category = context.categories.find((c: Category) => c.id === categoryId)
    if (!category || category.groups.length === 0) {
      return context.direction
    }
    const targetGroupId = category.groups[0].id
    const currentIndex = context.allGroups.findIndex(
      (g: Group) => g.id === context.currentGroupId
    )
    const newIndex = context.allGroups.findIndex((g: Group) => g.id === targetGroupId)
    return newIndex > currentIndex ? 1 : -1
  },
})

/**
 * Navigate to the next group in the list.
 */
const navigateNext = assign({
  currentGroupId: ({ context }) => {
    const currentIndex = context.allGroups.findIndex(
      (g: Group) => g.id === context.currentGroupId
    )
    if (currentIndex >= 0 && currentIndex < context.allGroups.length - 1) {
      return context.allGroups[currentIndex + 1].id
    }
    return context.currentGroupId
  },
  direction: () => 1,
})

/**
 * Navigate to the previous group in the list.
 */
const navigatePrev = assign({
  currentGroupId: ({ context }) => {
    const currentIndex = context.allGroups.findIndex(
      (g: Group) => g.id === context.currentGroupId
    )
    if (currentIndex > 0) {
      return context.allGroups[currentIndex - 1].id
    }
    return context.currentGroupId
  },
  direction: () => -1,
})

// ============================================================================
// State Machine
// ============================================================================

/**
 * App navigation state machine.
 *
 * Manages navigation between animation groups and mobile drawer state.
 * Provides deterministic state transitions and side effects.
 *
 * States:
 * - initializing: Loading initial state from URL or defaults
 * - ready: Normal operation with parallel drawer state
 *   - drawer.closed: Drawer is closed (desktop always, mobile by default)
 *   - drawer.open: Drawer is open (mobile only)
 *
 * Events:
 * - INITIALIZE: Set up initial state with groups and optional groupId from URL
 * - NAVIGATE_TO_GROUP: Navigate to a specific group by ID
 * - NAVIGATE_TO_CATEGORY: Navigate to the first group in a category
 * - SWIPE_NEXT: Navigate to the next group (with boundary check)
 * - SWIPE_PREV: Navigate to the previous group (with boundary check)
 * - OPEN_DRAWER: Open the mobile navigation drawer
 * - CLOSE_DRAWER: Close the mobile navigation drawer
 *
 * Context:
 * - currentGroupId: Currently displayed group
 * - allGroups: All available groups
 * - categories: All categories with their groups
 * - direction: Animation direction (1 = forward, -1 = backward)
 *
 * @example
 * ```typescript
 * const machine = createAppNavigationMachine({
 *   navigate: (path) => router.navigate(path)
 * })
 * const actor = createActor(machine)
 * actor.start()
 *
 * // Initialize with groups
 * actor.send({
 *   type: 'INITIALIZE',
 *   groupId: 'modal-base',
 *   allGroups: [...],
 *   categories: [...]
 * })
 *
 * // Navigate to a group
 * actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'drawer' })
 * ```
 */
export const appNavigationMachine = setup({
  types: {
    context: {} as AppNavigationContext,
    events: {} as AppNavigationEvent,
    input: {} as AppNavigationInput,
  },
  guards: {
    isValidGroupId,
    hasGroups,
    isDifferentGroup,
    canGoNext,
    canGoPrev,
    isValidCategory,
  },
  actions: {
    initializeContext: initializeContext as any,
    navigateToGroup: navigateToGroup as any,
    navigateToCategory: navigateToCategory as any,
    navigateNext: navigateNext as any,
    navigatePrev: navigatePrev as any,
    updateURL: (() => {}) as any,  // Will be provided at runtime
    updateURLReplace: (() => {}) as any, // Will be provided at runtime
    preventBodyScroll: (() => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'
      }
    }) as any,
    restoreBodyScroll: (() => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }) as any,
  },
}).createMachine({
  id: 'appNavigation',
  context: {
    currentGroupId: '',
    allGroups: [],
    categories: [],
    direction: 0,
  },
  initial: 'initializing',
  states: {
    initializing: {
      on: {
        INITIALIZE: {
          guard: 'hasGroups',
          target: 'ready',
          actions: ['initializeContext', 'updateURLReplace'],
        },
      },
    },
    ready: {
      type: 'parallel',
      states: {
        drawer: {
          initial: 'closed',
          states: {
            closed: {
              on: {
                OPEN_DRAWER: {
                  target: 'open',
                  actions: 'preventBodyScroll',
                },
              },
            },
            open: {
              on: {
                CLOSE_DRAWER: {
                  target: 'closed',
                  actions: 'restoreBodyScroll',
                },
                // Auto-close drawer on navigation (mobile behavior)
                NAVIGATE_TO_GROUP: {
                  target: 'closed',
                  actions: 'restoreBodyScroll',
                },
                NAVIGATE_TO_CATEGORY: {
                  target: 'closed',
                  actions: 'restoreBodyScroll',
                },
              },
            },
          },
        },
        navigation: {
          initial: 'idle',
          states: {
            idle: {
              on: {
                NAVIGATE_TO_GROUP: {
                  guard: 'isDifferentGroup',
                  actions: ['navigateToGroup', 'updateURL'],
                },
                NAVIGATE_TO_CATEGORY: {
                  guard: 'isValidCategory',
                  actions: ['navigateToCategory', 'updateURL'],
                },
                SWIPE_NEXT: {
                  guard: 'canGoNext',
                  actions: ['navigateNext', 'updateURL'],
                },
                SWIPE_PREV: {
                  guard: 'canGoPrev',
                  actions: ['navigatePrev', 'updateURL'],
                },
              },
            },
          },
        },
      },
    },
  },
})

/**
 * Type-safe helper to create an app navigation machine with input.
 */
export function createAppNavigationMachine(input: AppNavigationInput) {
  return appNavigationMachine.provide({
    actions: {
      updateURL: ({ context }) => {
        input.navigate(`/${context.currentGroupId}`)
      },
      updateURLReplace: ({ context }) => {
        input.navigate(`/${context.currentGroupId}`, { replace: true })
      },
    },
  })
}
