/**
 * Data URL placeholders for image placeholders
 */

// Tiny gray blur placeholder (10x10 pixels, ~89 bytes)
export const BLUR_PLACEHOLDER_GRAY =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mNk+M+AARiHsiAAcCIKAYwFoQ8AAAAASUVORK5CYII='

// Tiny white placeholder (10x10 pixels, ~89 bytes)
export const BLUR_PLACEHOLDER_WHITE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAEUlEQVR42mP8z8AARiAGYDwFAQDQQQn6YrYk+QAAAABJRU5ErkJggg=='

// Tiny black placeholder (10x10 pixels, ~89 bytes)
export const BLUR_PLACEHOLDER_BLACK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAE0lEQVR42mP8/58BA4wDqSAOgEIAbEIrBwwF3+oAAAAASUVORK5CYII='

// Transparent placeholder (1x1 pixel, ~68 bytes)
export const TRANSPARENT_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

// Gradient placeholder (more visually interesting, ~180 bytes)
export const GRADIENT_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2YzZjMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNkZGRkZGQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMCAwaDQwdjQwSDB6Ii8+PC9zdmc+'

// Generate dynamic placeholder for different dimensions
export function generatePlaceholder(width: number, height: number): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f3f3f3"/>
          <stop offset="100%" stop-color="#dddddd"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#a)"/>
      <rect width="${width}" height="${height}" fill="none" stroke="#cccccc" stroke-width="1"/>
    </svg>
  `

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// Generate color placeholder with specific color
export function generateColorPlaceholder(color = '#f3f3f3'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
      <rect width="10" height="10" fill="${color}"/>
    </svg>
  `

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
