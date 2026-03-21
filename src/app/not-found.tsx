import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('errors')

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <CardTitle>{t('pageNotFound')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('pageNotFoundDescription')}
          </p>
          <Button asChild>
            <Link href="/">{t('goHome')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
