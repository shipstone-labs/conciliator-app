'use client'

import { usePathname } from 'next/navigation'
import ProgressIndicator from '@/components/AddIP/ProgressIndicator'

export default function AddIPLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Detect current step based on pathname
  let currentStep: 1 | 2 | 3 = 1
  if (pathname.includes('/protect')) {
    currentStep = 1
  } else if (pathname.includes('/share')) {
    currentStep = 2
  } else if (pathname.includes('/guard')) {
    currentStep = 3
  }

  return (
    <div>
      <ProgressIndicator currentStep={currentStep} />
      {children}
    </div>
  )
}
