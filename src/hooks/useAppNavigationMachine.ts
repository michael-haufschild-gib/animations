import {
  type AppNavigationContext,
  type AppNavigationEvent,
  createAppNavigationMachine,
} from '@/machines/appNavigationMachine'
import type { Category, Group } from '@/types/animation'
import { useMachine } from '@xstate/react'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

/**
 * Return type for useAppNavigationMachine hook.
 */
export interface UseAppNavigationMachineResult {
  /** Current state of the machine (e.g., 'initializing', 'ready.drawer.closed') */
  state: string
  /** Current context (currentGroupId, allGroups, categories, direction) */
  context: AppNavigationContext
  /** Send an event to the state machine */
  send: (event: AppNavigationEvent) => void
  /** Whether the drawer is currently open */
  isDrawerOpen: boolean
  /** Whether the machine is still initializing */
  isInitializing: boolean
  /** Whether the machine is ready for navigation */
  isReady: boolean
}

/**
 * Custom hook for managing app navigation state with XState.
 *
 * This hook creates and manages the app navigation state machine,
 * handling initialization from URL parameters, navigation between groups,
 * and mobile drawer state.
 *
 * Features:
 * - Automatic initialization from URL parameters
 * - Type-safe state machine integration
 * - React Router integration for URL sync
 * - Convenient state selectors (isDrawerOpen, isInitializing, etc.)
 *
 * @param categories - All animation categories with groups
 * @returns State machine state, context, and control functions
 *
 * @example
 * ```tsx
 * function App() {
 *   const { categories } = useAnimations()
 *   const {
 *     context,
 *     send,
 *     isDrawerOpen,
 *     isInitializing
 *   } = useAppNavigationMachine(categories)
 *
 *   if (isInitializing) return <Loading />
 *
 *   return (
 *     <div>
 *       <button onClick={() => send({ type: 'OPEN_DRAWER' })}>
 *         Menu
 *       </button>
 *       <GroupSection group={currentGroup} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Navigate to a specific group
 * send({ type: 'NAVIGATE_TO_GROUP', groupId: 'modal-base' })
 *
 * // Navigate to first group in a category
 * send({ type: 'NAVIGATE_TO_CATEGORY', categoryId: 'dialogs' })
 *
 * // Swipe navigation
 * send({ type: 'SWIPE_NEXT' })
 * send({ type: 'SWIPE_PREV' })
 *
 * // Drawer controls
 * send({ type: 'OPEN_DRAWER' })
 * send({ type: 'CLOSE_DRAWER' })
 * ```
 */
export function useAppNavigationMachine(
  categories: Category[]
): UseAppNavigationMachineResult {
  const navigate = useNavigate()
  const { groupId } = useParams<{ groupId?: string }>()

  // Create the state machine with router integration
  const machine = useMemo(
    () => createAppNavigationMachine({ navigate }),
    [navigate]
  )

  // Create actor from machine
  const [state, send] = useMachine(machine, {
    input: { navigate },
  })

  // Get all groups in order for navigation
  const allGroups: Group[] = useMemo(
    () => categories.flatMap((category) => category.groups),
    [categories]
  )

  // Initialize the machine when categories are loaded or when they change
  // This ensures the state machine updates when code mode changes (which changes categories)
  useEffect(() => {
    if (allGroups.length === 0) return

    send({
      type: 'INITIALIZE',
      groupId,
      allGroups,
      categories,
    })
  }, [allGroups, categories, groupId, send])

  // Close drawer on ESC key
  useEffect(() => {
    const isDrawerOpen = state.matches({ ready: { drawer: 'open' } })
    if (!isDrawerOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        send({ type: 'CLOSE_DRAWER' })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state, send])

  // Scroll to group when currentGroupId changes
  useEffect(() => {
    const { currentGroupId } = state.context
    if (!currentGroupId || typeof window === 'undefined') return

    const id = `group-${currentGroupId}`
    const EXTRA_OFFSET = 16

    let raf = 0
    let timeout: ReturnType<typeof setTimeout> | undefined

    const scrollGroupIntoView = () => {
      const el = document.getElementById(id)
      if (!el) return false

      const appBar =
        document.querySelector<HTMLElement>('[data-app-shell="bar"]')
      const appBarHeight = appBar?.getBoundingClientRect().height ?? 0
      const targetY = Math.max(
        0,
        el.getBoundingClientRect().top +
          window.scrollY -
          appBarHeight -
          EXTRA_OFFSET
      )

      if (Math.abs(window.scrollY - targetY) > 1) {
        window.scrollTo({ top: targetY, behavior: 'auto' })
      }

      return true
    }

    const attemptScroll = () => {
      if (!scrollGroupIntoView()) {
        timeout = setTimeout(scrollGroupIntoView, 360)
      }
    }

    raf = requestAnimationFrame(attemptScroll)

    return () => {
      cancelAnimationFrame(raf)
      if (timeout) clearTimeout(timeout)
    }
  }, [state.context.currentGroupId])

  // Derive convenient state flags
  const isDrawerOpen = state.matches({ ready: { drawer: 'open' } })
  const isInitializing = state.matches('initializing')
  const isReady = state.matches('ready')

  return {
    state: state.value.toString(),
    context: state.context,
    send,
    isDrawerOpen,
    isInitializing,
    isReady,
  }
}
