'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
}

const DEFAULT_PRESET_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#a855f7', // Violet
]

export default function ColorPicker({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
}: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value)

  const handleColorChange = (newColor: string) => {
    setLocalValue(newColor)
    onChange(newColor)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {/* Color preview and input */}
        <div className="flex-1 flex gap-2 items-center">
          <div
            className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
            style={{ backgroundColor: localValue }}
          />
          <Input
            type="text"
            value={localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#3b82f6"
            className="flex-1 font-mono"
          />
        </div>

        {/* Color picker popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <svg
                className="h-4 w-4"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Preset Colors</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="color-input" className="text-xs">
                  Custom Color
                </Label>
                <input
                  id="color-input"
                  type="color"
                  value={localValue}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-10 rounded border-2 border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
