"use client"

import type { ReactNode } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  actionButton?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline"
  }
  variant?: "card" | "gradient" | "simple"
}

export function PageHeader({ title, description, icon, actionButton, variant = "simple" }: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Brand Header */}
      

      {/* Page Title Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="text-blue-600">{icon}</div>}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
        {actionButton && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            variant={actionButton.variant}
            onClick={actionButton.onClick}
          >
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  )
}
