"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  MapPin,
  ShoppingBag,
  Receipt,
  BarChart3,
  Heart,
  Menu,
  X,
  Church,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const services = [
  { name: "Angels", href: "/services/angels" },
  { name: "Primary", href: "/services/primary" },
  { name: "Secondary", href: "/services/secondary" },
  { name: "High", href: "/services/high" },
  { name: "University", href: "/services/university" },
  { name: "Graduates", href: "/services/graduates" },
]

const navigation = [
  { name: "Students", href: "/", icon: Users },
  { name: "Parishes", href: "/parishes", icon: Church },
  { name: "Services", href: "/services", icon: Settings, hasSubMenu: true },
  { name: "Trips", href: "/trips", icon: MapPin },
  { name: "Store", href: "/store", icon: ShoppingBag },
  { name: "Purchases", href: "/purchases", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isServicesExpanded, setIsServicesExpanded] = useState(true)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">knesty</h1>
              <p className="text-sm text-gray-500">Student Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                    {item.hasSubMenu && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setIsServicesExpanded(!isServicesExpanded)
                        }}
                        className="ml-auto"
                      >
                        {isServicesExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </Link>

                  {item.name === "Services" && isServicesExpanded && (
                    <div className="ml-4 mt-2 space-y-1">
                      {services.map((service) => {
                        const isServiceActive = pathname.startsWith(service.href)
                        return (
                          <Link
                            key={service.name}
                            href={service.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-4",
                              isServiceActive
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                            )}
                          >
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            {service.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">© 2024 knesty</p>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
