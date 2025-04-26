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
            Click the toggle button to switch between light, dark, and system
            themes. The icon in the button will update to reflect the current
            theme.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
