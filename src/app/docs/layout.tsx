import { SkipLink } from '@/components/ui/skip-link'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SkipLink />
      {children}
    </>
  )
}
