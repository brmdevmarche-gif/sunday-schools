'use client'

import { useNavigation } from './NavigationProvider'

export default function NavigationLoader() {
  const { isNavigating } = useNavigation()

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      {/* Progress bar */}
      <div className="h-1 bg-primary/20 overflow-hidden">
        <div className="h-full bg-primary animate-progress-bar" />
      </div>
    </div>
  )
}
