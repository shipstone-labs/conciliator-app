'use client'
import Image from 'next/image'
import type { FC } from 'react'

interface LogoProps {
  showText?: boolean
}

export const Logo: FC<LogoProps> = ({ showText = true }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mb-10">
      {/* Logo Image */}
      <Image
        width={192}
        height={192}
        className="rounded-full shadow-lg border-2 border-primary/30"
        priority
        src="/svg/Black+Yellow.svg"
        alt="SafeIdea Logo"
      />

      {/* Text Container - Only shown when showText is true */}
      {showText && (
        <div className="text-center mt-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            SafeIdea
          </h1>
          <p className="mt-2 text-base text-foreground/70">
            Securely Store, Share and Monetize Digital Assets
          </p>
        </div>
      )}
    </div>
  )
}
