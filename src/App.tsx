import { AppDrawer } from '@/components/ui/AppDrawer'
import { AppHeader } from '@/components/ui/AppHeader'
import { AppSidebar } from '@/components/ui/AppSidebar'
import { GroupSection } from '@/components/ui/catalog'
import { useAnimations } from '@/hooks/useAnimations'
import { useAppNavigationMachine } from '@/hooks/useAppNavigationMachine'
import type { Variants } from 'framer-motion'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useRef } from 'react'
import './App.css'

// Animation variants for group transitions
const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 }),
}

// Swipe gesture configuration
const SWIPE_CONFIDENCE_THRESHOLD = 10000
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity

function App() {
  const { categories, isLoading, error } = useAnimations()
  const {
    context: { currentGroupId, direction, allGroups },
    send,
    isDrawerOpen,
  } = useAppNavigationMachine(categories)
  const dragControls = useDragControls()
  const appBarRef = useRef<HTMLDivElement | null>(null)

  // Navigation handlers using state machine
  const handleCategorySelect = (categoryId: string) => {
    send({ type: 'NAVIGATE_TO_CATEGORY', categoryId })
  }

  const handleGroupSelect = (groupId: string) => {
    send({ type: 'NAVIGATE_TO_GROUP', groupId })
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-text-primary font-display text-2xl mb-4">Error Loading Animations</h1>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const currentGroup = allGroups.find((g) => g.id === currentGroupId)

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement

    // Don't start drag if the pointer is on an AnimationCard
    const isOnAnimationCard = target.closest('.pf-card')

    if (!isOnAnimationCard) {
      // Use the native event for DragControls
      dragControls.start(event.nativeEvent)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Mobile header */}
      <AppHeader ref={appBarRef} currentGroup={currentGroup} onMenuClick={() => send({ type: 'OPEN_DRAWER' })} />

      <div className="pf-main">
        <AppSidebar
          categories={categories}
          currentGroupId={currentGroupId}
          onCategorySelect={handleCategorySelect}
          onGroupSelect={handleGroupSelect}
        />

        <main className="pf-catalog">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-text-secondary">Loading animations...</div>
            </div>
          ) : (
            <>
              {/* Category heading removed: previews start with group header/title */}

              <AnimatePresence initial={false} custom={direction} mode="wait">
                {currentGroup && (
                  <motion.div
                    key={currentGroupId}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring' as const, stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    drag="x"
                    dragControls={dragControls}
                    dragListener={false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onPointerDown={handleDragStart}
                    onDragEnd={(_, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x)
                      if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) send({ type: 'SWIPE_NEXT' })
                      else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) send({ type: 'SWIPE_PREV' })
                    }}
                    style={{ width: '100%' }}
                  >
                    <GroupSection group={currentGroup} elementId={`group-${currentGroup.id}`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>

      {/* Mobile drawer */}
      <AppDrawer
        isOpen={isDrawerOpen}
        onClose={() => send({ type: 'CLOSE_DRAWER' })}
        categories={categories}
        currentGroupId={currentGroupId}
        onCategorySelect={handleCategorySelect}
        onGroupSelect={handleGroupSelect}
      />
    </div>
  )
}

export default App
