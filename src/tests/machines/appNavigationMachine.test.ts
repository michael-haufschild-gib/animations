import {
  type AppNavigationContext,
  createAppNavigationMachine,
} from '@/machines/appNavigationMachine'
import type { Category, Group } from '@/types/animation'
import { createActor } from 'xstate'

// ============================================================================
// Test Data
// ============================================================================

const mockGroups: Group[] = [
  {
    id: 'modal-base',
    title: 'Modal Animations',
    tech: 'framer',
    animations: [],
  },
  {
    id: 'drawer',
    title: 'Drawer Animations',
    tech: 'css',
    animations: [],
  },
  {
    id: 'tooltip',
    title: 'Tooltip Animations',
    tech: 'framer',
    animations: [],
  },
]

const mockCategories: Category[] = [
  {
    id: 'dialogs',
    title: 'Dialogs',
    groups: [mockGroups[0], mockGroups[1]],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    groups: [mockGroups[2]],
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

function createTestMachine(navigateMock = jest.fn()) {
  return createAppNavigationMachine({ navigate: navigateMock })
}

function createTestActor(navigateMock = jest.fn()) {
  const machine = createTestMachine(navigateMock)
  const actor = createActor(machine, {
    input: { navigate: navigateMock },
  })
  actor.start()
  return { actor, navigateMock }
}

function getContext(actor: ReturnType<typeof createActor>): AppNavigationContext {
  return actor.getSnapshot().context
}

function getCurrentState(actor: ReturnType<typeof createActor>): string {
  return JSON.stringify(actor.getSnapshot().value)
}

// ============================================================================
// Tests
// ============================================================================

describe('appNavigationMachine', () => {
  describe('Initialization', () => {
    test('initializes in initializing state', () => {
      const { actor } = createTestActor()
      expect(getCurrentState(actor)).toContain('initializing')
    })

    test('initializes with valid groupId from URL', () => {
      const { actor, navigateMock } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'drawer',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('drawer')
      expect(context.allGroups).toEqual(mockGroups)
      expect(context.categories).toEqual(mockCategories)
      expect(context.direction).toBe(0)
      expect(navigateMock).toHaveBeenCalledWith('/drawer', { replace: true })
    })

    test('defaults to first group when no groupId provided', () => {
      const { actor, navigateMock } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(navigateMock).toHaveBeenCalledWith('/modal-base', { replace: true })
    })

    test('defaults to first group when invalid groupId provided', () => {
      const { actor, navigateMock } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'non-existent',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(navigateMock).toHaveBeenCalledWith('/modal-base', { replace: true })
    })

    test('transitions to ready state after initialization', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      expect(getCurrentState(actor)).toContain('ready')
    })

    test('does not transition if no groups provided', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        allGroups: [],
        categories: [],
      })

      expect(getCurrentState(actor)).toContain('initializing')
    })
  })

  describe('Navigation to Group', () => {
    test('navigates to a different group', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize
      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Navigate to drawer (forward direction)
      actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'drawer' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('drawer')
      expect(context.direction).toBe(1) // Forward
      expect(navigateMock).toHaveBeenCalledWith('/drawer')
    })

    test('calculates backward direction when navigating to previous group', () => {
      const { actor } = createTestActor()

      // Initialize at drawer
      actor.send({
        type: 'INITIALIZE',
        groupId: 'drawer',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      // Navigate to modal-base (backward direction)
      actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'modal-base' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(context.direction).toBe(-1) // Backward
    })

    test('ignores navigation to same group', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize
      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Try to navigate to same group
      actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'modal-base' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(navigateMock).not.toHaveBeenCalled()
    })

    test('auto-closes drawer when navigating on mobile', () => {
      const { actor } = createTestActor()

      // Initialize
      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      // Open drawer
      actor.send({ type: 'OPEN_DRAWER' })
      expect(getCurrentState(actor)).toContain('open')

      // Navigate to different group
      actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'drawer' })

      // Drawer should be closed
      expect(getCurrentState(actor)).toContain('closed')
      expect(getCurrentState(actor)).not.toContain('open')
    })
  })

  describe('Navigation to Category', () => {
    test('navigates to first group in category', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize
      actor.send({
        type: 'INITIALIZE',
        groupId: 'tooltip',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Navigate to dialogs category (should go to modal-base)
      actor.send({ type: 'NAVIGATE_TO_CATEGORY', categoryId: 'dialogs' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(navigateMock).toHaveBeenCalledWith('/modal-base')
    })

    test('calculates direction correctly for category navigation', () => {
      const { actor } = createTestActor()

      // Initialize at tooltip (index 2)
      actor.send({
        type: 'INITIALIZE',
        groupId: 'tooltip',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      // Navigate to dialogs category (first group is modal-base at index 0)
      actor.send({ type: 'NAVIGATE_TO_CATEGORY', categoryId: 'dialogs' })

      const context = getContext(actor)
      expect(context.direction).toBe(-1) // Backward from index 2 to 0
    })

    test('stays at current group if category not found', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize
      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Try to navigate to non-existent category
      actor.send({ type: 'NAVIGATE_TO_CATEGORY', categoryId: 'non-existent' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(navigateMock).not.toHaveBeenCalled()
    })

    test('auto-closes drawer when navigating to category', () => {
      const { actor } = createTestActor()

      // Initialize
      actor.send({
        type: 'INITIALIZE',
        groupId: 'tooltip',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      // Open drawer
      actor.send({ type: 'OPEN_DRAWER' })
      expect(getCurrentState(actor)).toContain('open')

      // Navigate to category
      actor.send({ type: 'NAVIGATE_TO_CATEGORY', categoryId: 'dialogs' })

      // Drawer should be closed
      expect(getCurrentState(actor)).toContain('closed')
    })
  })

  describe('Swipe Navigation', () => {
    test('swipes to next group', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize at first group
      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Swipe next
      actor.send({ type: 'SWIPE_NEXT' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('drawer')
      expect(context.direction).toBe(1)
      expect(navigateMock).toHaveBeenCalledWith('/drawer')
    })

    test('swipes to previous group', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize at second group
      actor.send({
        type: 'INITIALIZE',
        groupId: 'drawer',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Swipe previous
      actor.send({ type: 'SWIPE_PREV' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(context.direction).toBe(-1)
      expect(navigateMock).toHaveBeenCalledWith('/modal-base')
    })

    test('does not swipe next at last group', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize at last group
      actor.send({
        type: 'INITIALIZE',
        groupId: 'tooltip',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Try to swipe next
      actor.send({ type: 'SWIPE_NEXT' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('tooltip')
      expect(navigateMock).not.toHaveBeenCalled()
    })

    test('does not swipe previous at first group', () => {
      const { actor, navigateMock } = createTestActor()

      // Initialize at first group
      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      navigateMock.mockClear()

      // Try to swipe previous
      actor.send({ type: 'SWIPE_PREV' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(navigateMock).not.toHaveBeenCalled()
    })
  })

  describe('Drawer State', () => {
    test('starts with drawer closed', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      expect(getCurrentState(actor)).toContain('closed')
      expect(getCurrentState(actor)).not.toContain('open')
    })

    test('opens drawer', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      actor.send({ type: 'OPEN_DRAWER' })

      expect(getCurrentState(actor)).toContain('open')
    })

    test('closes drawer', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      actor.send({ type: 'OPEN_DRAWER' })
      expect(getCurrentState(actor)).toContain('open')

      actor.send({ type: 'CLOSE_DRAWER' })
      expect(getCurrentState(actor)).toContain('closed')
    })

    test('drawer state is independent of navigation state', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      // Open drawer
      actor.send({ type: 'OPEN_DRAWER' })
      expect(getCurrentState(actor)).toContain('open')

      // Context should still be valid
      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
    })
  })

  describe('Parallel States', () => {
    test('drawer and navigation states run in parallel', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      // State should show both drawer and navigation states
      const state = getCurrentState(actor)
      expect(state).toContain('drawer')
      expect(state).toContain('navigation')
    })

    test('can be in ready.drawer.closed and ready.navigation.idle simultaneously', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      const state = getCurrentState(actor)
      expect(state).toContain('closed')
      expect(state).toContain('idle')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty categories array', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: [],
      })

      const context = getContext(actor)
      expect(context.categories).toEqual([])
      expect(context.currentGroupId).toBe('modal-base')
    })

    test('handles single group', () => {
      const { actor } = createTestActor()

      const singleGroup = [mockGroups[0]]
      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: singleGroup,
        categories: mockCategories,
      })

      // Should not be able to swipe
      actor.send({ type: 'SWIPE_NEXT' })
      actor.send({ type: 'SWIPE_PREV' })

      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
    })

    test('maintains state consistency across multiple transitions', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      // Multiple operations
      actor.send({ type: 'OPEN_DRAWER' })
      actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'drawer' })
      actor.send({ type: 'SWIPE_NEXT' })
      actor.send({ type: 'OPEN_DRAWER' })
      actor.send({ type: 'NAVIGATE_TO_CATEGORY', categoryId: 'dialogs' })

      // Should end up at modal-base with drawer closed
      const context = getContext(actor)
      expect(context.currentGroupId).toBe('modal-base')
      expect(getCurrentState(actor)).toContain('closed')
    })
  })

  describe('Direction Calculation', () => {
    test('calculates direction 1 for forward navigation', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'modal-base',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'tooltip' })

      const context = getContext(actor)
      expect(context.direction).toBe(1)
    })

    test('calculates direction -1 for backward navigation', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'tooltip',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      actor.send({ type: 'NAVIGATE_TO_GROUP', groupId: 'modal-base' })

      const context = getContext(actor)
      expect(context.direction).toBe(-1)
    })

    test('sets direction 0 on initialization', () => {
      const { actor } = createTestActor()

      actor.send({
        type: 'INITIALIZE',
        groupId: 'drawer',
        allGroups: mockGroups,
        categories: mockCategories,
      })

      const context = getContext(actor)
      expect(context.direction).toBe(0)
    })
  })
})
