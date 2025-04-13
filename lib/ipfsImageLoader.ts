import type { ImageLoaderProps } from 'next/image';

/**
 * Custom image loader for IPFS images with caching logic
 * 
 * This loader intercepts IPFS image requests, checks a cache, and 
 * if not found, fetches and caches for future use
 */
export default function ipfsImageLoader({ src, width, quality }: ImageLoaderProps) {
  // Check if this is an IPFS URL
  if (src.includes('w3s.link/ipfs/')) {
    // Extract the CID from the IPFS URL
    const cidMatch = src.match(/\/ipfs\/([a-zA-Z0-9/]+)/);
    const cidPath = cidMatch ? cidMatch[1] : '';
    
    if (cidPath) {
      // Return URL to our own API endpoint that will handle caching
      return `/api/cached-image/${cidPath}?width=${width}&quality=${quality || 75}`;
    }
  }
  
  // If it's already our cached image path
  if (src.startsWith('/api/cached-image/')) {
    // Just add width and quality params
    return `${src}${src.includes('?') ? '&' : '?'}width=${width}&quality=${quality || 75}`;
  }
  
  // For non-IPFS sources, return the original URL with width and quality
  return `${src}?w=${width}&q=${quality || 75}`;
}

// Enhanced version of the cidAsURL function that returns the cached version URL
export function enhancedCidAsURL(cid?: string) {
  if (!cid) {
    return undefined;
  }
  
  // Return the URL to our cached image API instead of direct IPFS
  return `/api/cached-image/${cid}`;
}