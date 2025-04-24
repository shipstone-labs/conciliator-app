import type { ImageLoaderProps } from 'next/image'

/**
 * Custom image loader for IPFS images with caching logic
 *
 * This loader intercepts IPFS image requests, checks a cache, and
 * if not found, fetches and caches for future use
 */
export default function ipfsImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  console.log('IPFS Image Loader:', src, width, quality)
  // Check if this is an IPFS URL
  if (src.includes('w3s.link/ipfs/')) {
    // Extract the CID from the IPFS URL
    const cidMatch = src.match(/\/ipfs\/([a-zA-Z0-9/]+)/)
    const cidPath = cidMatch ? cidMatch[1] : ''

    if (cidPath) {
      // Return URL to our own API endpoint that will handle caching
      return `/api/cached-image/${cidPath}?width=${width}&quality=${quality || 75}&format=webp`
    }
  }

  // If it's already our cached image path
  if (src.startsWith('/api/cached-image/')) {
    // Create a proper URL object to handle existing query parameters correctly
    const url = new URL(src, window.location.origin)

    // Update or add our parameters
    url.searchParams.set('width', width.toString())
    url.searchParams.set('quality', (quality || 75).toString())
    url.searchParams.set('format', 'webp')

    // Return the full URL string - this will handle query parameters correctly
    return url.toString().replace(window.location.origin, '')
  }

  // For non-IPFS sources, return the original URL with width and quality
  return `${src}?w=${width}&q=${quality || 75}`
}

// Removed enhancedCidAsURL function to avoid issues with default width parameter
