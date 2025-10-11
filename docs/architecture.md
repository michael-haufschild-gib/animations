# Animation Library Architecture

## Overview

This is a production-ready animation component library built with React, TypeScript, and modern animation technologies (Framer Motion, CSS Animations). The library serves as both a **showcase catalog** and a **reference implementation** for reusable UI animations across web and mobile platforms.

### Design Goals

1. **Portability**: Animations use transform/opacity-driven patterns that translate to React Native (React Reanimated, Moti)
2. **Type Safety**: Full TypeScript coverage with strict type checking
3. **Performance**: Optimized rendering with memoization, lazy loading, and code splitting
4. **Developer Experience**: Co-located metadata, self-documenting code, and clear component structure
5. **Maintainability**: Single source of truth, minimal configuration files

## Technology Stack

### Core Technologies
- **React 18** - UI library with concurrent features
- **TypeScript 5** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router 7** - Client-side routing

### Animation Libraries
- **Framer Motion** - Declarative animation library with spring physics
- **CSS Animations** - Native CSS keyframes and transitions

### Testing
- **Vitest** - Unit and integration testing
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end browser testing

### State Management
- **XState v5** - Type-safe state machines for navigation
- **React Context** - Global state for code mode switching

## Project Structure

```
animations/
├── src/
│   ├── components/              # Animation components organized by category
│   │   ├── base/               # Base effects (text, buttons, standard)
│   │   ├── dialogs/            # Modal and dialog animations
│   │   ├── progress/           # Progress bars, loading states
│   │   ├── realtime/           # Real-time updates, timers
│   │   ├── rewards/            # Game elements, celebrations
│   │   ├── ui/                 # Catalog UI components
│   │   └── animationRegistry.ts # Central registry
│   ├── services/               # Business logic
│   │   └── animationData.ts    # Catalog data service
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAnimations.ts    # Animation catalog hook
│   │   └── useAppNavigationMachine.ts # Navigation state machine
│   ├── machines/               # XState state machines
│   │   └── appNavigationMachine.ts # App navigation logic
│   ├── contexts/               # React Context providers
│   │   └── CodeModeContext.tsx # Code mode (Framer/CSS) switching
│   ├── types/                  # TypeScript type definitions
│   │   └── animation.ts        # Core animation types
│   ├── test/                   # Test utilities
│   │   └── utils/              # Testing helpers
│   └── __tests__/              # Test files
├── docs/                       # Documentation
│   ├── architecture.md         # This file
│   └── REACT_NATIVE_REFACTORING_PATTERNS.md # RN migration guide
├── scripts/                    # Build and utility scripts
│   └── playwright/             # E2E test scripts
└── public/                     # Static assets
```

## Core Architecture Principles

### 1. Co-Located Metadata System

**Principle**: Metadata lives with component code, folder structure defines hierarchy.

Every animation component exports its own metadata alongside the implementation:

```typescript
// src/components/dialogs/modal-base/framer/ModalBaseScalePop.tsx
import type { AnimationMetadata } from '@/types/animation'

export function ModalBaseScalePop() {
  return <motion.div>...</motion.div>
}

export const metadata: AnimationMetadata = {
  id: 'modal-base__scale-pop',
  title: 'Scale Pop',
  description: 'Modal scales up with spring physics',
  tags: ['framer', 'spring'],
  disableReplay: false
}
```

**Benefits**:
- No external configuration files to maintain
- Move/rename files → hierarchy updates automatically
- Type-safe metadata with IntelliSense
- Easy to add/remove animations

### 2. Hierarchical Organization

The folder structure directly maps to the UI hierarchy:

```
Category (e.g., "Dialogs & Modals")
  └─ Group (e.g., "Modal Base Animations")
      └─ Animation (e.g., "Scale Pop")
```

**Folder Structure**:

```
src/components/
├─ dialogs/                    # Category
│  ├─ index.ts                 # Category aggregation
│  ├─ modal-base/              # Group
│  │  ├─ index.ts              # Group aggregation
│  │  ├─ framer/               # Framer Motion implementations
│  │  │  ├─ ModalBaseScalePop.tsx
│  │  │  └─ ModalBaseFadeIn.tsx
│  │  ├─ css/                  # CSS implementations
│  │  │  ├─ ModalBaseSlideUp.tsx
│  │  │  └─ ModalBaseSlideUp.css
│  │  └─ shared.css            # Shared styles (optional)
│  └─ modal-celebrations/      # Another group
└─ progress/                   # Another category
```

### 3. Technology-Specific Folders

Each group contains technology-specific subfolders:

- **`framer/`** - Framer Motion implementations (`.tsx` files)
- **`css/`** - CSS-only implementations (`.tsx` + `.css` files)
- Shared assets (e.g., `shared.css`) live at the group root

This enables **code mode switching**: users can toggle between viewing Framer or CSS implementations in the catalog UI.

### 4. Three-Level Aggregation

Metadata flows from component → group → category → central registry:

#### Level 1: Component (Metadata Export)

```typescript
// Component file
export const metadata: AnimationMetadata = {
  id: 'modal-base__scale-pop',
  title: 'Scale Pop',
  description: '...',
  tags: ['framer']
}
```

#### Level 2: Group (Aggregation)

```typescript
// src/components/dialogs/modal-base/index.ts
import { ModalBaseScalePop, metadata as scalePopMeta } from './framer/ModalBaseScalePop'

export const groupMetadata: GroupMetadata = {
  id: 'modal-base',
  title: 'Modal Base Animations',
  tech: 'framer',
  demo: 'modalBase'
}

export const groupExport: GroupExport = {
  metadata: groupMetadata,
  framer: {
    'modal-base__scale-pop': { component: ModalBaseScalePop, metadata: scalePopMeta }
  },
  css: {
    // CSS implementations
  }
}
```

#### Level 3: Category (Aggregation)

```typescript
// src/components/dialogs/index.ts
import { groupExport as modalBaseGroup } from './modal-base'

export const categoryMetadata: CategoryMetadata = {
  id: 'dialogs',
  title: 'Dialogs & Modals'
}

export const categoryExport: CategoryExport = {
  metadata: categoryMetadata,
  groups: {
    'modal-base': modalBaseGroup
  }
}
```

#### Level 4: Central Registry

```typescript
// src/components/animationRegistry.ts
import { categoryExport as dialogsCategory } from './dialogs'

export const categories: Record<string, CategoryExport> = {
  dialogs: dialogsCategory
}
```

## Core Systems

### Animation Registry

**Location**: `src/components/animationRegistry.ts`

The registry provides two key functions:

#### 1. `buildRegistryFromCategories(codeMode)`

Builds a flat map of animation IDs to React components, filtered by code mode.

```typescript
export function buildRegistryFromCategories(codeMode: CodeMode = 'Framer') {
  const registry: Record<string, React.ComponentType> = {}
  const animationSource = codeMode === 'CSS' ? 'css' : 'framer'

  Object.values(categories).forEach(cat => {
    Object.values(cat.groups).forEach(group => {
      const animations = group[animationSource]
      if (animations) {
        Object.entries(animations).forEach(([id, anim]) => {
          registry[id] = anim.component
        })
      }
    })
  })

  return registry
}
```

**Usage**: `GroupSection` calls this to get the correct components based on user's selected code mode.

#### 2. `getAnimationMetadata(animationId, codeMode?)`

Retrieves metadata for a specific animation, optionally filtered by code mode.

```typescript
export function getAnimationMetadata(
  animationId: string,
  codeMode?: CodeMode
): AnimationMetadata | null {
  // If codeMode specified, search only that mode
  if (codeMode) {
    const source = codeMode === 'CSS' ? 'css' : 'framer'
    for (const cat of Object.values(categories)) {
      for (const group of Object.values(cat.groups)) {
        if (group[source]?.[animationId]) {
          return group[source][animationId].metadata
        }
      }
    }
  }

  // Otherwise search both modes
  // ...
}
```

**Usage**: `GroupSection` calls this to display correct title/description/tags for the selected code mode.

### Data Service

**Location**: `src/services/animationData.ts`

Transforms the hierarchical registry into a flat, UI-friendly structure:

```typescript
const buildCatalogFromCategories = (): Category[] => {
  return Object.values(categories).map(cat => ({
    id: cat.metadata.id,
    title: cat.metadata.title,
    groups: Object.values(cat.groups).map(group => ({
      id: group.metadata.id,
      title: group.metadata.title,
      animations: extractAllAnimations(group)
    }))
  }))
}

function extractAllAnimations(group: GroupExport): AnimationData[] {
  const framerAnims = Object.values(group.framer || {})
  const cssAnims = Object.values(group.css || {})

  // Combine and deduplicate by ID
  return [...framerAnims, ...cssAnims].map(anim => ({
    id: anim.metadata.id,
    title: anim.metadata.title,
    description: anim.metadata.description,
    tags: anim.metadata.tags,
    disableReplay: anim.metadata.disableReplay
  }))
}
```

**Note**: The catalog is mode-agnostic. It includes all animations regardless of implementation technology. The UI layer filters and displays based on user's selected code mode.

### Code Mode Switching

**Location**: `src/contexts/CodeModeContext.tsx`

React Context that manages global code mode state:

```typescript
export type CodeMode = 'Framer' | 'CSS'

export const CodeModeContext = createContext<{
  codeMode: CodeMode
  setCodeMode: (mode: CodeMode) => void
}>({
  codeMode: 'Framer',
  setCodeMode: () => {}
})

export function CodeModeProvider({ children }: { children: React.ReactNode }) {
  const [codeMode, setCodeMode] = useState<CodeMode>('Framer')

  return (
    <CodeModeContext.Provider value={{ codeMode, setCodeMode }}>
      {children}
    </CodeModeContext.Provider>
  )
}
```

**Usage**: User toggles between 'Framer' and 'CSS' in the sidebar. This triggers:
1. `GroupSection` re-renders
2. `animationRegistry` rebuilds with new mode
3. Mode-specific metadata is fetched
4. `AnimationCard` displays correct component + metadata

### UI Components

#### GroupSection

**Location**: `src/components/ui/GroupSection.tsx`

Renders a grid of animations for a single group. Handles code mode switching.

**Key features**:
- Fetches mode-specific animation components via `buildRegistryFromCategories(codeMode)`
- Fetches mode-specific metadata via `getAnimationMetadata(id, codeMode)`
- Not memoized (must re-render when context changes)
- Lazy loads components with React Suspense

```typescript
export function GroupSection({ group, elementId }: GroupSectionProps) {
  const { codeMode } = useCodeMode()
  const animationRegistry = useMemo(
    () => buildRegistryFromCategories(codeMode),
    [codeMode]
  )

  return (
    <div className="pf-card-grid">
      {group.animations.map(animation => {
        const AnimationComponent = animationRegistry[animation.id]
        const metadata = getAnimationMetadata(animation.id, codeMode)

        return (
          <AnimationCard
            key={animation.id}
            title={metadata?.title || animation.title}
            description={metadata?.description || animation.description}
            tags={metadata?.tags || animation.tags}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <AnimationComponent />
            </Suspense>
          </AnimationCard>
        )
      })}
    </div>
  )
}
```

#### AnimationCard

**Location**: `src/components/ui/AnimationCard.tsx`

Individual animation showcase card with replay controls.

**Key features**:
- Memoized with custom comparison (compares title, description, tags, animationId)
- IntersectionObserver triggers animation when 30% visible
- Replay button remounts child component (increments key)
- Special controls for "lights" animations (bulb count, color picker)
- Expandable description with chevron

```typescript
export const AnimationCard = memo(AnimationCardComponent, (prevProps, nextProps) => {
  // Compare primitive props
  if (
    prevProps.title !== nextProps.title ||
    prevProps.description !== nextProps.description ||
    prevProps.animationId !== nextProps.animationId ||
    prevProps.infiniteAnimation !== nextProps.infiniteAnimation
  ) {
    return false // Re-render
  }

  // Compare tags array
  const prevTags = prevProps.tags || []
  const nextTags = nextProps.tags || []
  if (prevTags.length !== nextTags.length) return false
  for (let i = 0; i < prevTags.length; i++) {
    if (prevTags[i] !== nextTags[i]) return false
  }

  return true // Skip re-render
})
```

**Design decision**: AnimationCard is memoized because it's rendered in grids (potentially 50+ cards). When code mode changes, the new title/tags/description trigger a re-render.

### Navigation State Machine

**Location**: `src/machines/appNavigationMachine.ts`

XState v5 state machine managing app navigation logic.

**States**:
- `initializing` - Loading categories and groups
- `ready` - Main app state (parallel regions: drawer, navigation)
  - `drawer.closed` / `drawer.open`
  - `navigation.showingGroup` / `navigation.showingCategory`

**Events**:
- `INITIALIZE` - Load data
- `NAVIGATE_TO_GROUP` - Navigate to specific group
- `NAVIGATE_TO_CATEGORY` - Navigate to category view
- `SWIPE_NEXT` / `SWIPE_PREV` - Navigate between groups
- `OPEN_DRAWER` / `CLOSE_DRAWER` - Toggle sidebar

**Hook**: `useAppNavigationMachine()` wraps the state machine and integrates with React Router.

## Performance Optimizations

### 1. Code Splitting

Each animation component is lazy-loaded:

```typescript
// Group index.ts uses dynamic imports
const ModalBaseScalePop = lazy(() => import('./framer/ModalBaseScalePop'))
```

Vite automatically code-splits these into separate chunks.

### 2. Memoization Strategy

- ✅ **AnimationCard**: Memoized (rendered in grids)
- ✅ **AppSidebar**: Memoized (complex tree structure)
- ❌ **GroupSection**: NOT memoized (must respond to context changes)
- ❌ **CategorySection**: NOT memoized (top-level component)

### 3. Lazy Rendering

- IntersectionObserver in AnimationCard delays rendering until card is 30% visible
- Suspense boundaries prevent blocking on slow imports

### 4. Build Optimizations

- Separate `.metadata.ts` files prevent static/dynamic import conflicts
- Tree-shaking removes unused animations
- CSS code-splitting per animation group

## Type System

### Core Types

```typescript
// src/types/animation.ts

export interface AnimationMetadata {
  id: string                      // Unique ID (e.g., "modal-base__scale-pop")
  title: string                   // Display title
  description: string             // Brief description
  tags?: string[]                 // Technology tags (e.g., ["framer", "spring"])
  disableReplay?: boolean         // Hide replay button
}

export interface GroupMetadata {
  id: string                      // Group ID (e.g., "modal-base")
  title: string                   // Display title
  tech: 'framer' | 'css' | 'both' // Primary technology
  demo?: string                   // Demo preset name
}

export interface CategoryMetadata {
  id: string                      // Category ID (e.g., "dialogs")
  title: string                   // Display title
}

export interface AnimationExport {
  component: React.ComponentType<any>
  metadata: AnimationMetadata
}

export interface GroupExport {
  metadata: GroupMetadata
  framer?: Record<string, AnimationExport>
  css?: Record<string, AnimationExport>
}

export interface CategoryExport {
  metadata: CategoryMetadata
  groups: Record<string, GroupExport>
}
```

### Type Safety Features

1. **Strict mode**: `tsconfig.json` enables all strict checks
2. **No implicit any**: All functions and variables must be typed
3. **Branded types**: Animation IDs use string literal unions where possible
4. **Compile-time validation**: TypeScript catches metadata mismatches at build time

## Testing Strategy

### Unit Tests (Vitest)

**Coverage**: 98%+ on core logic

- `animationRegistry.test.ts` - Registry building, metadata lookup
- `animationData.test.ts` - Catalog data service
- Component tests for AnimationCard, GroupSection, AppSidebar

### Integration Tests (Vitest + RTL)

- Full component mounting with context providers
- Navigation state machine transitions
- Code mode switching behavior

### E2E Tests (Playwright)

- `catalog.spec.ts` - Browse categories, view animations
- `navigation.spec.ts` - Sidebar, swipe gestures, URL routing
- `code-mode.spec.ts` - Switch between Framer/CSS modes

**Test policy**: 100% of new features must include tests. Tests must pass before merge.

## Build and Deployment

### Development

```bash
npm run dev         # Start dev server (http://localhost:5173)
npm test           # Run unit tests
npm run build      # Production build
npm run preview    # Preview production build
```

### Production Build

```bash
npm run build
```

**Output**: `dist/` folder with:
- Optimized JS bundles (code-split per route and animation group)
- CSS bundles (per animation group)
- Static assets (images, fonts)
- `index.html` entry point

**Bundle sizes** (approximate):
- Main bundle: ~380 KB (gzipped: 64 KB)
- Vendor bundle: ~340 KB (React, Framer Motion, Router)
- Per-animation chunks: 1-2 KB each

## Maintenance

### Adding a New Animation

1. Create component file in appropriate group folder:
   ```typescript
   // src/components/dialogs/modal-base/framer/ModalBaseNewAnimation.tsx
   export function ModalBaseNewAnimation() { /* ... */ }
   export const metadata: AnimationMetadata = { /* ... */ }
   ```

2. Add to group `index.ts`:
   ```typescript
   import { ModalBaseNewAnimation, metadata as newAnimMeta } from './framer/ModalBaseNewAnimation'

   export const groupExport: GroupExport = {
     metadata: groupMetadata,
     framer: {
       // ...existing animations
       'modal-base__new-animation': { component: ModalBaseNewAnimation, metadata: newAnimMeta }
     }
   }
   ```

3. Run tests: `npm run build && npm test`

### Adding a New Group

1. Create folder: `src/components/<category>/<new-group>/`
2. Add `index.ts` with `groupMetadata` and `groupExport`
3. Add to category `index.ts`: `groups: { 'new-group': newGroupExport }`
4. Run tests

### Adding a New Category

1. Create folder: `src/components/<new-category>/`
2. Add `index.ts` with `categoryMetadata` and `categoryExport`
3. Add to `animationRegistry.ts`: `categories: { 'new-category': newCategoryExport }`
4. Run tests

### Removing Animations

1. Delete component file
2. Remove from group `index.ts`
3. Run tests to ensure no broken references

## Common Pitfalls

### ❌ Don't memoize GroupSection

GroupSection must re-render when `codeMode` context changes. Memoization blocks this.

```typescript
// ❌ BAD
export const GroupSection = memo(GroupSectionComponent)

// ✅ GOOD
export function GroupSection(props) { /* ... */ }
```

### ❌ Don't pass static metadata to AnimationCard

The catalog's static data doesn't change between code modes. Always fetch mode-specific metadata:

```typescript
// ❌ BAD
<AnimationCard title={animation.title} tags={animation.tags} />

// ✅ GOOD
const metadata = getAnimationMetadata(animation.id, codeMode)
<AnimationCard title={metadata?.title} tags={metadata?.tags} />
```

### ❌ Don't forget to export metadata

Every animation component must export metadata:

```typescript
// ❌ BAD
export function MyAnimation() { /* ... */ }

// ✅ GOOD
export function MyAnimation() { /* ... */ }
export const metadata: AnimationMetadata = { /* ... */ }
```

### ❌ Don't use absolute imports in CSS

Use relative imports to maintain portability:

```css
/* ❌ BAD */
@import '/src/styles/shared.css';

/* ✅ GOOD */
@import '../shared.css';
```

## Future Enhancements

### Planned Features

1. **Search and filtering** - Full-text search across animation titles/descriptions
2. **Favorites system** - User can bookmark animations
3. **Code export** - Copy animation code to clipboard
4. **Theme switching** - Dark/light mode support
5. **Performance metrics** - Display FPS, memory usage per animation
6. **Accessibility audit** - WCAG compliance checker

### React Native Migration

See `docs/REACT_NATIVE_REFACTORING_PATTERNS.md` for detailed migration guide.

**Key principles**:
- Use transform/opacity patterns (avoid width/height animations)
- Prefer Framer Motion patterns that map to React Reanimated
- Avoid SVG filters, backdrop-filter, mix-blend-mode
- Test on lower-end devices

## Conclusion

This architecture prioritizes:
- **Maintainability**: Co-located metadata, clear structure
- **Performance**: Code splitting, memoization, lazy loading
- **Type safety**: Strict TypeScript, compile-time validation
- **Portability**: Transform-based animations for RN migration
- **Developer experience**: Self-documenting code, minimal config

The co-located metadata system eliminates the traditional pain points of large component libraries (external config files, manual syncing, opaque hierarchies) while maintaining full type safety and excellent performance.
