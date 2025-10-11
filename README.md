# Animation Catalog

> A production-ready library of reusable UI animations for React web applications, with patterns designed for React Native portability.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-purple)](https://vitejs.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11.x-pink)](https://www.framer.com/motion/)

## What is this?

This is a **living catalog** of high-quality, production-ready UI animations built with React, TypeScript, Framer Motion, and CSS. Each animation is a self-contained component with co-located metadata, making it easy to discover, customize, and integrate into your projects.

### Key Features

- 🎨 **150+ animations** across 5 categories (Dialogs, Progress, Real-time, Rewards, Base Effects)
- 🔄 **Dual implementations**: Framer Motion and CSS-only versions
- 📱 **Mobile-ready**: Transform/opacity patterns translate to React Native
- 🎯 **Type-safe**: Full TypeScript coverage with strict mode
- ⚡ **Performance-optimized**: Code-splitting, lazy loading, memoization
- 🧪 **100% tested**: Unit, integration, and E2E tests
- 📚 **Self-documenting**: Co-located metadata, clear structure

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd animations

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the catalog.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:5173 |
| `npm run build` | Production build → `dist/` folder |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Lint code with ESLint |
| `npm run typecheck` | Check TypeScript types |

## Project Structure

```
src/
├── components/           # Animation components
│   ├── base/            # Text, button, standard effects
│   ├── dialogs/         # Modal and dialog animations
│   ├── progress/        # Progress bars, loading states
│   ├── realtime/        # Live updates, timers, notifications
│   ├── rewards/         # Celebrations, confetti, coins
│   ├── ui/              # Catalog UI (AnimationCard, GroupSection)
│   └── animationRegistry.ts  # Central registry
├── services/            # Business logic
├── hooks/               # Custom React hooks
├── machines/            # XState state machines
├── contexts/            # React Context providers
└── types/               # TypeScript type definitions
```

### Folder Structure Convention

Animations are organized hierarchically:

```
Category → Group → Animation

Example:
Dialogs & Modals → Modal Base Animations → Scale Pop
```

Each group folder contains technology-specific subfolders:

```
src/components/dialogs/modal-base/
├── index.ts              # Group aggregation
├── framer/               # Framer Motion implementations
│   ├── ModalBaseScalePop.tsx
│   └── ModalBaseFadeIn.tsx
├── css/                  # CSS implementations
│   ├── ModalBaseSlideUp.tsx
│   └── ModalBaseSlideUp.css
└── shared.css            # Shared styles (optional)
```

## Using the Catalog

### Browsing Animations

1. **Navigate categories**: Use the sidebar to browse animation categories
2. **Switch code modes**: Toggle between "Framer" and "CSS" implementations
3. **View details**: Each card shows title, description, and technology tags
4. **Replay animations**: Click the "Replay" button to restart an animation
5. **Expand descriptions**: Click the chevron to read full descriptions

### Code Mode Switching

The catalog supports two animation technologies:

- **Framer Motion** - Declarative animations with spring physics
- **CSS** - Native CSS keyframes and transitions

Use the toggle in the sidebar to switch between modes. The displayed animations, titles, descriptions, and tags update automatically.

### Special Features

#### Lights Animations

Animations with IDs starting with `lights__` get special controls:
- **Bulb count slider**: Adjust number of lights (4-22)
- **Color picker**: Change light color

#### Infinite Animations

Some animations (loading spinners, live indicators) loop continuously without manual replay.

## Adding New Animations

### Step 1: Create Component

Create a new file in the appropriate group's `framer/` or `css/` folder:

```typescript
// src/components/dialogs/modal-base/framer/ModalBaseNewAnimation.tsx
import type { AnimationMetadata } from '@/types/animation'
import { motion } from 'framer-motion'

export function ModalBaseNewAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="modal-content">
        Hello World
      </div>
    </motion.div>
  )
}

export const metadata: AnimationMetadata = {
  id: 'modal-base__new-animation',
  title: 'New Animation',
  description: 'A brand new modal animation with spring physics',
  tags: ['framer', 'spring'],
  disableReplay: false
}
```

### Step 2: Add to Group Index

Update the group's `index.ts`:

```typescript
// src/components/dialogs/modal-base/index.ts
import {
  ModalBaseNewAnimation,
  metadata as newAnimationMeta
} from './framer/ModalBaseNewAnimation'

export const groupExport: GroupExport = {
  metadata: groupMetadata,
  framer: {
    // ... existing animations
    'modal-base__new-animation': {
      component: ModalBaseNewAnimation,
      metadata: newAnimationMeta
    }
  }
}
```

### Step 3: Test

```bash
npm run build && npm test
```

Your animation should now appear in the catalog!

## Metadata Schema

Every animation must export metadata:

```typescript
export const metadata: AnimationMetadata = {
  id: string                 // Unique ID (format: "group-id__animation-name")
  title: string              // Display title
  description: string        // Brief description (1-2 sentences)
  tags?: string[]            // Tech tags (e.g., ['framer', 'spring'])
  disableReplay?: boolean    // Hide replay button (for infinite animations)
}
```

### ID Naming Convention

Format: `{group-id}__{animation-name}`

Examples:
- `modal-base__scale-pop`
- `progress-bars__striped`
- `timer-effects__flash-expire`

Use kebab-case for all parts. The double underscore (`__`) separates group from animation name.

## Categories

### Base Effects
Text animations, button effects, and standard UI transitions.

**Groups**: Text Effects, Button Effects, Standard Effects

### Dialogs & Modals
Animations for modals, dialogs, toasts, and overlays.

**Groups**: Modal Base, Modal Celebrations, Modal Content, Dismiss & Toast

### Progress & Loading
Progress bars, loading states, level-up animations, and XP accumulation.

**Groups**: Progress Bars, Loading States, XP Accumulation

### Real-time Updates
Live data updates, timers, countdowns, notifications, and indicators.

**Groups**: Timer Effects, Update Indicators, Leaderboard Animations, Real-time Data

### Game Elements & Rewards
Celebrations, confetti, coins, badges, and reward animations.

**Groups**: Basic Rewards, Celebration Effects, Reward Cards

## Technology Stack

- **React 18** - UI library
- **TypeScript 5** - Type-safe development
- **Vite** - Build tool and dev server
- **Framer Motion 11** - Declarative animations
- **React Router 7** - Client-side routing
- **XState 5** - State machines
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## Architecture

This project uses a **co-located metadata architecture**:

1. Each animation component exports its metadata alongside the implementation
2. Groups aggregate animations from `framer/` and `css/` folders
3. Categories aggregate groups
4. Central registry provides access to all animations

**Key principle**: Folder structure IS the hierarchy. No external configuration files.

### Why Co-Located Metadata?

✅ **Single source of truth** - Metadata lives with code
✅ **Type-safe** - Full IntelliSense and compile-time validation
✅ **Easy refactoring** - Move/rename files → hierarchy updates automatically
✅ **Self-documenting** - Clear component structure
✅ **Tree-shakeable** - Only import what you use

See [docs/architecture.md](docs/architecture.md) for detailed documentation.

## React Native Migration

All animations use **transform/opacity-driven patterns** that translate to React Native using React Reanimated and Moti.

### Portability Guidelines

✅ **Prefer**: transform, opacity, scale, rotate, translate
✅ **Prefer**: Framer Motion patterns (map to React Reanimated)
❌ **Avoid**: width/height animations
❌ **Avoid**: SVG filters, backdrop-filter, mix-blend-mode
❌ **Avoid**: CSS-only features without RN equivalents

See [docs/REACT_NATIVE_REFACTORING_PATTERNS.md](docs/REACT_NATIVE_REFACTORING_PATTERNS.md) for migration guide.

## Performance

### Optimizations

- **Code splitting**: Each animation is a separate chunk (~1-2 KB)
- **Lazy loading**: Animations load on-demand via React.lazy()
- **Memoization**: AnimationCard and AppSidebar use React.memo()
- **Intersection Observer**: Animations trigger when 30% visible
- **Suspense boundaries**: Prevent blocking on slow imports

### Bundle Sizes

- Main bundle: ~380 KB (gzipped: 64 KB)
- Vendor bundle: ~340 KB (React, Framer Motion, Router)
- Per-animation chunks: 1-2 KB each

### Measuring Performance

Open DevTools → Performance tab:
1. Start recording
2. Navigate to animation group
3. Stop recording
4. Check FPS (should be 60 FPS)

## Testing

### Unit Tests (Vitest)

```bash
npm test
```

**Coverage**: 98%+ on core logic

Tests cover:
- Animation registry building
- Metadata lookup
- Data service transformations
- Component rendering
- State machine transitions

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Tests cover:
- Category navigation
- Animation playback
- Code mode switching
- Sidebar interactions
- URL routing

### Writing Tests

All new features must include tests. Example:

```typescript
import { render, screen } from '@testing-library/react'
import { MyAnimation } from './MyAnimation'

describe('MyAnimation', () => {
  it('renders correctly', () => {
    render(<MyAnimation />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Common Tasks

### Adding a Category

1. Create folder: `src/components/new-category/`
2. Add `index.ts` with category metadata and exports
3. Update `src/components/animationRegistry.ts`
4. Run tests

### Adding a Group

1. Create folder: `src/components/category/new-group/`
2. Add `index.ts` with group metadata
3. Update category `index.ts`
4. Run tests

### Removing an Animation

1. Delete component file
2. Remove from group `index.ts`
3. Run tests to catch broken references

### Updating Metadata

Edit the component file's metadata export:

```typescript
export const metadata: AnimationMetadata = {
  id: 'modal-base__scale-pop',
  title: 'New Title',  // ← Update here
  description: 'New description',
  tags: ['framer', 'updated']
}
```

Changes reflect immediately in the catalog.

## Troubleshooting

### Animations don't play

- Check browser console for errors
- Verify component exports metadata
- Ensure component is added to group index

### Code mode switching doesn't work

- Verify both `framer/` and `css/` implementations exist
- Check that metadata is exported from both versions
- Clear browser cache and rebuild

### Build fails

- Run `npm run typecheck` to find type errors
- Check for missing imports or metadata exports
- Verify all files use correct paths

### Tests fail

- Run `npm test` to see detailed error messages
- Check that all animations have valid metadata
- Verify registry consistency tests pass

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for exported functions
- Use Prettier for formatting (runs on commit)

### Commit Messages

Follow conventional commits:

```
feat: add new modal animation
fix: correct timing on progress bar
docs: update architecture guide
test: add tests for timer effects
```

### Pull Requests

1. Create feature branch: `git checkout -b feat/my-animation`
2. Make changes and add tests
3. Run full test suite: `npm test && npm run test:e2e`
4. Build: `npm run build`
5. Commit with descriptive message
6. Push and create PR

## License

[License details here]

## Resources

- [Architecture Documentation](docs/architecture.md) - Detailed architecture guide
- [React Native Patterns](docs/REACT_NATIVE_REFACTORING_PATTERNS.md) - RN migration guide
- [Framer Motion Docs](https://www.framer.com/motion/) - Animation library docs
- [XState Docs](https://stately.ai/docs) - State machine docs

## Support

For questions or issues:
1. Check [docs/architecture.md](docs/architecture.md)
2. Search existing issues
3. Create new issue with reproduction steps

---

**Made with ❤️ using React, TypeScript, and Framer Motion**
