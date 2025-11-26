"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle, ThemeSwitch } from "@/components/ui/theme-toggle";
import {
  SimpleThemeToggle,
  FloatingThemeToggle,
} from "@/components/ui/simple-theme-toggle";
import {
  ThemeSwitch as ToggleSwitch,
  CompactThemeSwitch,
} from "@/components/ui/theme-switch";

export function ThemeToggleDemo() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Theme Toggle Components</h1>
        <p className="text-muted-foreground">
          Different ways to switch between light and dark themes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Dropdown Theme Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dropdown Toggle</CardTitle>
            <CardDescription>
              Dropdown menu with Light/Dark/System options
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ThemeToggle />
          </CardContent>
        </Card>

        {/* Simple Theme Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Simple Toggle</CardTitle>
            <CardDescription>
              Simple button that cycles through themes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SimpleThemeToggle />
          </CardContent>
        </Card>

        {/* Basic Switch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Switch</CardTitle>
            <CardDescription>
              Simple toggle between light and dark
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ThemeSwitch />
          </CardContent>
        </Card>

        {/* Toggle Switch with Label */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Switch with Label</CardTitle>
            <CardDescription>Switch component with mode labels</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ToggleSwitch showLabel labelPosition="right" />
          </CardContent>
        </Card>

        {/* Compact Switch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compact Switch</CardTitle>
            <CardDescription>Minimal switch without labels</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CompactThemeSwitch />
          </CardContent>
        </Card>

        {/* Button with Label */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Button with Label</CardTitle>
            <CardDescription>Button style with text label</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SimpleThemeToggle showLabel variant="button" />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Implementation Examples</h2>
        <p className="text-muted-foreground">
          These theme toggles are now available throughout the application
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Header</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The admin dashboard header now includes a dropdown theme toggle
              next to the notifications bell.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coming Soon Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The landing page has a fixed theme toggle in the top-right corner
              for easy access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
