'use client'

import { useCallback, useEffect, useState } from 'react'
import Loading from '@/components/Loading'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import Link from 'next/link'
import { cidAsURL } from '@/lib/internalTypes'
import { enhancedCidAsURL } from '@/lib/ipfsImageLoader'
import { useIPs } from '@/hooks/useIP'
import CachedImage from '@/components/CachedImage'

const itemsPerPage = 16 // 4 Cards per page

function getImageWidth() {
  const screenWidth = window.innerWidth
  if (screenWidth < 640) {
    return 150 // Mobile
  }
  if (screenWidth < 1024) {
    return 180 // Tablet
  }
  return 250 // Desktop
}

const CardGrid = () => {
  const [imageWidth, setImageWidth] = useState(getImageWidth()) // Default width
  const [currentPage, setCurrentPage] = useState(1)
  const { data: visibleItems, pages: totalPages } = useIPs(
    'createdAt',
    'desc',
    itemsPerPage,
    currentPage
  ) || { pages: 1 }

  // Responsive image size calculation
  useEffect(() => {
    const updateImageWidth = () => {
      const newWidth = getImageWidth()
      setImageWidth(newWidth)
    }
    window.addEventListener('resize', updateImageWidth)
    return () => window.removeEventListener('resize', updateImageWidth)
  }, [])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  if (!visibleItems) {
    return <Loading />
  }

  return (
    <div className="w-full flex flex-col items-center p-3">
      {/* HomeLink component removed - now using global header navigation instead */}
      {/* <HomeLink /> */}

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {visibleItems.map((item, index) => (
          <Card
            key={`${item.name}-${item.description}-${index}`}
            className="shadow-xl hover:shadow-primary/20 transition-all hover:-translate-y-1 backdrop-blur-md hover:backdrop-blur-lg"
          >
            {/* Name (Title) with Tooltip */}
            <CardHeader className="p-4 rounded-t-xl text-center h-16">
              <Tooltip>
                <TooltipTrigger className="block w-full">
                  <CardTitle className="text-sm font-bold leading-tight max-h-12 overflow-hidden line-clamp-2 text-ellipsis">
                    {item.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent className="bg-background/80 backdrop-blur-md text-white p-3 rounded-xl max-w-xs border border-white/10 shadow-lg">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            </CardHeader>

            {/* Image */}
            <CardContent className="flex justify-center p-4">
              <CachedImage
                src={enhancedCidAsURL(item?.image?.cid) || '/images/placeholder.png'}
                alt={item.name}
                width={imageWidth}
                height={imageWidth}
                className="rounded-xl object-cover shadow-md border border-white/10 hover:border-primary/30 transition-all"
              />
            </CardContent>

            {/* Description with Tooltip */}
            <CardContent className="p-4 h-32 overflow-hidden">
              <Tooltip>
                <TooltipTrigger className="block w-full">
                  <p className="text-white/80 text-sm line-clamp-5 text-ellipsis">
                    {item.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="bg-background/80 backdrop-blur-md text-white p-3 rounded-xl max-w-sm border border-white/10 shadow-lg">
                  {item.description}
                </TooltipContent>
              </Tooltip>
            </CardContent>

            <CardContent className="p-3 flex justify-center">
              <Link
                className="px-8 py-2 h-11 rounded-xl bg-primary text-black font-medium
                  hover:bg-primary/80 hover:scale-105
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:pointer-events-none ring-offset-background
                  shadow-lg hover:shadow-primary/30 transition-all"
                href={`/details/${item.id}`}
              >
                View Details
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-3 mt-8">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-5 py-2 h-11 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-white/90 disabled:opacity-30 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          Prev
        </button>

        {/* Display up to 5 page numbers dynamically */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
          <button
            type="button"
            key={`page-${i + 1}`}
            onClick={() => goToPage(i + 1)}
            className={`px-4 py-2 h-11 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all ${
              currentPage === i + 1
                ? 'bg-primary text-black font-medium'
                : 'bg-background/50 backdrop-blur-sm border border-white/10 text-white/90 hover:bg-background/70'
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          className="px-5 py-2 h-11 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-white/90 disabled:opacity-30 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default CardGrid
