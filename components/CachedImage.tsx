'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import ipfsImageLoader from '@/lib/ipfsImageLoader'
import type { StaticImageData } from 'next/image'

type StaticImport = StaticImageData | string

type CachedImageProps = {
  src: string | StaticImport
  alt: string
  width: number
  height: number
  className?: string
  fallbackSrc?: string
  priority?: boolean
  [key: string]: unknown
}

/**
 * A wrapper around Next.js Image component that displays a loading indicator
 * while loading IPFS images and handles loading failures gracefully.
 *
 * Optimized to eliminate flickering using CSS-only transitions and DOM refs.
 */
const CachedImage = React.memo(function CachedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc = '/svg/Black+Yellow.svg',
  priority = false,
  ...props
}: CachedImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageLoaded = useRef(false)
  const imageErrored = useRef(false)

  // Use CSS custom properties for transitions instead of React state
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Initially show loader unless priority is true
    if (!priority) {
      container.style.setProperty('--loader-opacity', '1')
      container.style.setProperty('--image-opacity', '0')
    } else {
      container.style.setProperty('--loader-opacity', '0')
      container.style.setProperty('--image-opacity', '1')
      imageLoaded.current = true
    }

    // Clean up function
    return () => {
      imageLoaded.current = false
      imageErrored.current = false
    }
  }, [priority])

  // Handle image load completion
  const handleLoadComplete = () => {
    if (!containerRef.current || imageLoaded.current) return

    imageLoaded.current = true
    const container = containerRef.current

    // Smoothly transition - hide loader, show image
    container.style.setProperty('--loader-opacity', '0')
    setTimeout(() => {
      container.style.setProperty('--image-opacity', '1')
    }, 30) // Small delay for smoother transition
  }

  // Handle image loading error
  const handleError = () => {
    if (!containerRef.current) return

    imageErrored.current = true
    const container = containerRef.current

    // Hide loader, show fallback image
    container.style.setProperty('--loader-opacity', '0')
    container.style.setProperty('--image-opacity', '1')
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={
        {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          '--loader-opacity': priority ? '0' : '1',
          '--image-opacity': priority ? '1' : '0',
        } as React.CSSProperties
      }
    >
      {/* Loading spinner */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-xl z-10 pointer-events-none"
        style={{
          opacity: 'var(--loader-opacity)',
          transition: 'opacity 0.2s ease-out',
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>

      {/* Image with CSS transitions */}
      <div
        style={{
          opacity: 'var(--image-opacity)',
          transition: 'opacity 0.3s ease-in',
          width: '100%',
          height: '100%',
        }}
      >
        <Image
          src={imageErrored.current ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          loader={ipfsImageLoader}
          className={className}
          priority={priority}
          onLoadingComplete={handleLoadComplete}
          onError={handleError}
          {...props}
        />
      </div>
    </div>
  )
})

export default CachedImage
