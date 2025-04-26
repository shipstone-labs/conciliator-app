'use client'

import { ModeToggle } from '@/components/mode-toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Theme Toggle Test
            <ModeToggle />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This is a test page for the theme toggle functionality. The toggle
            should appear in the top right.
          </p>
          <p>
            Note: Since we haven&apos;t yet integrated the ThemeProvider in the
            root layout, the toggle won&apos;t actually change the theme yet.
            This is just to verify the components render correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
