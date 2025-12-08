'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavigationContextType {
  isNavigating: boolean
  startNavigation: () => void
  stopNavigation: () => void
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  startNavigation: () => {},
  stopNavigation: () => {},
})

export function useNavigation() {
  return useContext(NavigationContext)
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const startNavigation = () => {
    setIsNavigating(true)
  }

  const stopNavigation = () => {
    setIsNavigating(false)
  }

  // Stop navigation when pathname or search params change
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, searchParams])

  // Listen for all link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (link && link.href) {
        const url = new URL(link.href)
        const currentUrl = new URL(window.location.href)

        // Only show loader for internal navigation (same origin)
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          startNavigation()
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation, stopNavigation }}>
      {children}
    </NavigationContext.Provider>
  )
}
