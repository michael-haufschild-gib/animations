# App Navigation State Machine

## Overview

The app navigation state machine manages navigation between animation groups and mobile drawer state using XState v5. It provides deterministic state transitions, predictable behavior, and eliminates complex interdependent useEffect hooks.

## Architecture

### State Machine Structure

```
appNavigation
├─ initializing (initial state)
│   └─ INITIALIZE → ready
└─ ready (parallel state)
    ├─ drawer
    │   ├─ closed (initial)
    │   │   └─ OPEN_DRAWER → open
    │   └─ open
    │       ├─ CLOSE_DRAWER → closed
    │       ├─ NAVIGATE_TO_GROUP → closed (auto-close)
    │       └─ NAVIGATE_TO_CATEGORY → closed (auto-close)
    └─ navigation
        └─ idle (only state)
            ├─ NAVIGATE_TO_GROUP → idle (with context update)
            ├─ NAVIGATE_TO_CATEGORY → idle (with context update)
            ├─ SWIPE_NEXT → idle (with context update)
            └─ SWIPE_PREV → idle (with context update)
```

### Parallel Regions

The `ready` state contains two parallel regions:

1. **drawer**: Manages mobile drawer open/closed state
2. **navigation**: Handles navigation logic (always in idle state)

These regions run independently but can interact through events. For example, navigation events can trigger drawer state transitions (auto-close on mobile).

## Context

The state machine maintains the following context:

```typescript
interface AppNavigationContext {
  currentGroupId: string    // Currently displayed animation group ID
  allGroups: Group[]        // All available groups in display order
  categories: Category[]    // All categories with their groups
  direction: number         // Animation direction: 1 = forward, -1 = backward, 0 = none
}
```

## Events

### INITIALIZE

Initializes the state machine with groups and optional groupId from URL.

```typescript
{
  type: 'INITIALIZE'
  groupId?: string          // Optional groupId from URL param
  allGroups: Group[]        // All available groups
  categories: Category[]    // All categories
}
```

**Transitions:**
- `initializing` → `ready` (if allGroups has at least one group)

**Actions:**
- Sets `currentGroupId` to provided groupId if valid, otherwise first group
- Sets `direction` to 0 (no animation)
- Updates URL with replace: true

**Guards:**
- `hasGroups`: Ensures allGroups.length > 0

### NAVIGATE_TO_GROUP

Navigates to a specific group by ID.

```typescript
{
  type: 'NAVIGATE_TO_GROUP'
  groupId: string          // Target group ID
}
```

**Transitions:**
- `ready.drawer.open` → `ready.drawer.closed` (auto-close mobile drawer)

**Actions:**
- Updates `currentGroupId` to target groupId
- Calculates `direction` based on position change (1 = forward, -1 = backward)
- Updates URL (pushes new entry)

**Guards:**
- `isDifferentGroup`: Ignores navigation to current group

### NAVIGATE_TO_CATEGORY

Navigates to the first group in a category.

```typescript
{
  type: 'NAVIGATE_TO_CATEGORY'
  categoryId: string       // Target category ID
}
```

**Transitions:**
- `ready.drawer.open` → `ready.drawer.closed` (auto-close mobile drawer)

**Actions:**
- Finds category and updates `currentGroupId` to its first group
- Calculates `direction` based on position change
- Updates URL (pushes new entry)

**Guards:**
- `isValidCategory`: Ensures category exists and has at least one group

### SWIPE_NEXT

Navigates to the next group in the list (swipe left gesture).

```typescript
{
  type: 'SWIPE_NEXT'
}
```

**Actions:**
- Increments to next group
- Sets `direction` to 1 (forward)
- Updates URL

**Guards:**
- `canGoNext`: Ensures we're not at the last group

### SWIPE_PREV

Navigates to the previous group in the list (swipe right gesture).

```typescript
{
  type: 'SWIPE_PREV'
}
```

**Actions:**
- Decrements to previous group
- Sets `direction` to -1 (backward)
- Updates URL

**Guards:**
- `canGoPrev`: Ensures we're not at the first group

### OPEN_DRAWER

Opens the mobile navigation drawer.

```typescript
{
  type: 'OPEN_DRAWER'
}
```

**Transitions:**
- `ready.drawer.closed` → `ready.drawer.open`

**Actions:**
- Sets `document.body.style.overflow = 'hidden'` (prevent background scroll)

### CLOSE_DRAWER

Closes the mobile navigation drawer.

```typescript
{
  type: 'CLOSE_DRAWER'
}
```

**Transitions:**
- `ready.drawer.open` → `ready.drawer.closed`

**Actions:**
- Restores `document.body.style.overflow` (allow scroll)

## Guards

Guards prevent invalid transitions and ensure the state machine maintains valid state.

| Guard | Description |
|-------|-------------|
| `hasGroups` | Checks if allGroups.length > 0 |
| `isValidGroupId` | Checks if groupId exists in allGroups |
| `isDifferentGroup` | Checks if target groupId differs from current |
| `canGoNext` | Checks if we can navigate forward (not at last group) |
| `canGoPrev` | Checks if we can navigate backward (not at first group) |
| `isValidCategory` | Checks if category exists and has groups |

## Actions

Actions are side effects that occur during transitions.

### Context Updates

- `initializeContext`: Sets up initial context from INITIALIZE event
- `navigateToGroup`: Updates currentGroupId and direction for group navigation
- `navigateToCategory`: Updates currentGroupId and direction for category navigation
- `navigateNext`: Increments group and sets direction to 1
- `navigatePrev`: Decrements group and sets direction to -1

### Side Effects

- `updateURL`: Syncs URL with currentGroupId (pushes new entry)
- `updateURLReplace`: Syncs URL with currentGroupId (replaces current entry)
- `preventBodyScroll`: Sets body overflow to hidden
- `restoreBodyScroll`: Restores body overflow to default

## State Transitions

### Initialization Flow

```
1. App loads → state: initializing
2. Categories load → send INITIALIZE event
3. Machine validates groups (hasGroups guard)
4. Machine sets currentGroupId (from URL or defaults to first)
5. Machine updates URL with replace: true
6. Transition to ready state
7. Both parallel regions start: drawer.closed, navigation.idle
```

### Navigation Flow

```
1. User clicks group link → send NAVIGATE_TO_GROUP
2. Machine checks isDifferentGroup guard
3. If different: Update context (currentGroupId, direction)
4. Update URL
5. If drawer is open: Close drawer
6. Remain in navigation.idle state
7. React re-renders with new context
```

### Drawer Flow

```
Desktop:
- Drawer never opens (no hamburger button rendered)

Mobile:
1. User clicks hamburger → send OPEN_DRAWER
2. Transition to drawer.open
3. Prevent body scroll
4. User clicks overlay/X/group → send CLOSE_DRAWER
5. Transition to drawer.closed
6. Restore body scroll

Alternative close:
- User presses ESC → send CLOSE_DRAWER
- User navigates → auto-closes via drawer transition
```

## Integration

### In App.tsx

Replace scattered useState calls with the state machine:

**Before:**
```typescript
const [currentGroupId, setCurrentGroupId] = useState<string>('')
const [direction, setDirection] = useState<number>(0)
const [isDrawerOpen, setIsDrawerOpen] = useState(false)

// Multiple complex useEffects...
```

**After:**
```typescript
const {
  context,
  send,
  isDrawerOpen,
  isInitializing
} = useAppNavigationMachine(categories)

// All state transitions handled by machine
```

### Hook Usage

```typescript
// Get current state and controls
const {
  context: { currentGroupId, direction, allGroups },
  send,
  isDrawerOpen,
  isInitializing,
  isReady
} = useAppNavigationMachine(categories)

// Navigate to group
const handleGroupSelect = (groupId: string) => {
  send({ type: 'NAVIGATE_TO_GROUP', groupId })
}

// Navigate to category
const handleCategorySelect = (categoryId: string) => {
  send({ type: 'NAVIGATE_TO_CATEGORY', categoryId })
}

// Control drawer
const openDrawer = () => send({ type: 'OPEN_DRAWER' })
const closeDrawer = () => send({ type: 'CLOSE_DRAWER' })

// Swipe gestures
const handleSwipe = (direction: 'left' | 'right') => {
  if (direction === 'left') {
    send({ type: 'SWIPE_NEXT' })
  } else {
    send({ type: 'SWIPE_PREV' })
  }
}
```

## Testing

### Unit Tests

The state machine has comprehensive unit tests covering:

- Initialization with valid/invalid groupId
- Navigation between groups with direction calculation
- Navigation to categories
- Swipe gestures with boundary checks
- Drawer open/close state
- Parallel state behavior
- Edge cases (empty groups, single group, etc.)

Run tests:
```bash
npm test src/tests/machines/appNavigationMachine.test.ts
```

### E2E Tests

Playwright tests verify:

- Page loads with correct initial group from URL
- Navigation updates URL and renders correct group
- Swipe gestures work correctly
- Mobile drawer opens/closes
- ESC key closes drawer
- Scroll behavior maintains correct position

Run E2E tests:
```bash
npm run test:e2e
```

## Benefits

### Before State Machine

**Problems:**
- Multiple useState calls: currentGroupId, direction, isDrawerOpen
- Complex interdependent useEffects
- Non-deterministic state transitions
- Difficult to test all state combinations
- Race conditions possible
- Hard to understand state flow

### After State Machine

**Benefits:**
- Single source of truth for navigation state
- Explicit, documented state transitions
- Deterministic behavior (same input → same output)
- Easy to test (all transitions covered)
- No race conditions (guards prevent invalid transitions)
- Visual state diagram possible
- Type-safe events and context
- Side effects clearly defined and isolated

## State Diagram

Visual representation (using XState visualizer):

```
https://stately.ai/registry/editor/
```

Paste the machine code to visualize all states and transitions.

## Future Enhancements

Potential improvements:

1. **History State**: Track navigation history for back button
2. **Prefetching**: Prefetch next/previous group components
3. **Analytics**: Track navigation events for analytics
4. **Animations**: Add transition states for loading animations
5. **Deep Linking**: Support query params for animation IDs
6. **Keyboard Navigation**: Add arrow key navigation
7. **Search**: Add search state for filtering animations
8. **Favorites**: Add favorites state and persistence

## Related Files

- `/src/machines/appNavigationMachine.ts` - State machine implementation
- `/src/hooks/useAppNavigationMachine.ts` - React hook for consuming machine
- `/src/tests/machines/appNavigationMachine.test.ts` - Unit tests
- `/scripts/playwright/navigation.spec.ts` - E2E tests
- `/src/App.tsx` - Integration point

## References

- [XState v5 Documentation](https://stately.ai/docs/xstate)
- [XState React Documentation](https://stately.ai/docs/xstate-react)
- [Parallel States](https://stately.ai/docs/parallel-states)
- [Guards](https://stately.ai/docs/guards)
- [Actions](https://stately.ai/docs/actions)
