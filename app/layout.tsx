import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { Sidebar } from "@/components/sidebar"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: "Grace Community - Student Management",
  description: "Student management portal for Grace Community Church",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <div className="flex h-screen bg-gray-50">
              <Sidebar />
              <main className="flex-1 lg:ml-64 overflow-auto">
                <div className="p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
              </main>
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
