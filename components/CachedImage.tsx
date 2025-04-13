'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { Loader2 } from 'lucide-react'
import ipfsImageLoader from '@/lib/ipfsImageLoader'

type CachedImageProps = Omit<ImageProps, 'loader'> & {
  fallbackSrc?: string
}

/**
 * A wrapper around Next.js Image component that displays a loading indicator
 * while loading IPFS images and handles loading failures gracefully.
 */
export default function CachedImage({
  src,
  alt,
  className,
  fallbackSrc = '/svg/Black+Yellow.svg',
  ...props
}: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="relative">
      {/* Display the loading spinner when image is loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-xl z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* The actual image */}
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        loader={ipfsImageLoader}
        className={className}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
        {...props}
      />
    </div>
  )
}
