import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">Welcome to Your App</CardTitle>
          <CardDescription className="text-lg mt-4">
            A modern web application built with Next.js, Supabase, and shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Features</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Next.js 16 with App Router and TypeScript</li>
              <li>Supabase for authentication and backend</li>
              <li>Beautiful UI components from shadcn/ui</li>
              <li>Tailwind CSS for styling</li>
              <li>Ready-to-use authentication pages</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild className="flex-1">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
            <p className="text-sm text-muted-foreground">
              Create an account or log in to access the dashboard. You can customize this
              application by editing the pages in the <code className="bg-muted px-1 py-0.5 rounded">src/app</code> directory
              and adding your own components.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
