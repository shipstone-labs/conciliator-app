'use client'

import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { useIPs } from '@/hooks/useIP'
import { useSession } from '@/components/AuthLayout'
import CachedImage from '@/components/CachedImage'

type IPListViewProps = {
  myItems?: boolean
  itemsPerPage?: number
}

function getImageWidth() {
  const screenWidth = typeof window === 'undefined' ? 640 : window.innerWidth
  if (screenWidth <= 640) {
    return 40 // Small thumbnails for mobile
  }
  return 60 // Slightly larger thumbnails for desktop
}

function IPListView({ myItems, itemsPerPage = 16 }: IPListViewProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [imageWidth, setImageWidth] = useState(getImageWidth())
  useSession(myItems ? ['stytchUser', 'fbUser'] : [])

  // Responsive image size calculation
  useEffect(() => {
    const updateImageWidth = () => {
      const newWidth = getImageWidth()
      setImageWidth(newWidth)
    }
    window.addEventListener('resize', updateImageWidth)
    return () => window.removeEventListener('resize', updateImageWidth)
  }, [])

  const { data: ipItems, pages: totalPages } = useIPs({
    orderBy: 'createdAt',
    orderDirection: 'desc',
    itemsPerPage,
    currentPage,
    myItems,
  }) || { pages: 1 }

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleRowClick = useCallback(
    (id: string) => {
      router.push(`/details/${id}`)
    },
    [router]
  )

  if (!ipItems) {
    return <Loading />
  }

  return (
    <div className="w-full flex flex-col items-center p-3">
      <Card className="w-full max-w-6xl">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead className="w-[280px]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ipItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                ipItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(item.id)}
                  >
                    <TableCell>
                      <div className="flex justify-center">
                        <CachedImage
                          src={
                            item?.image?.cid
                              ? `/api/cached-image/${item.image.cid}`
                              : undefined
                          }
                          fallbackSrc="/images/placeholder.png"
                          alt={item.name}
                          width={imageWidth}
                          height={imageWidth}
                          className="rounded-md object-cover shadow-sm border border-border hover:border-primary/30 transition-all"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger className="block w-full text-left">
                          <span className="truncate block">{item.name}</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background/80 backdrop-blur-md text-foreground p-3 rounded-xl max-w-xs border border-border shadow-lg">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <Tooltip>
                        <TooltipTrigger className="block w-full text-left">
                          <span className="truncate block">
                            {item.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background/80 backdrop-blur-md text-foreground p-3 rounded-xl max-w-sm border border-border shadow-lg">
                          {item.description}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {item.createdAt?.toDate().toLocaleDateString() ||
                        'Unknown'}
                    </TableCell>
                    <TableCell>{item.creator ? 'Owner' : 'Shared'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Improved Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex items-center space-x-3 mt-8">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-5 py-2 h-11 bg-background/50 backdrop-blur-sm border border-border rounded-xl text-foreground/90 disabled:opacity-30 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Prev
          </button>

          {/* Create a sliding window of page numbers around the current page */}
          {(() => {
            // Determine start and end pages to show (max 5 page buttons)
            const maxButtons = 5

            // Handle case with few pages
            if (totalPages <= maxButtons) {
              return Array.from({ length: totalPages }, (_, i) => {
                const pageNumber = i + 1
                return (
                  <button
                    type="button"
                    key={`page-${pageNumber}`}
                    onClick={() => goToPage(pageNumber)}
                    className={`px-4 py-2 h-11 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all ${
                      currentPage === pageNumber
                        ? 'bg-primary text-black font-medium'
                        : 'bg-background/50 backdrop-blur-sm border border-border text-foreground/90 hover:bg-background/70'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })
            }

            // Handle case with many pages
            let startPage = Math.max(
              1,
              currentPage - Math.floor(maxButtons / 2)
            )
            let endPage = startPage + maxButtons - 1

            // Adjust if the end is beyond the total pages
            if (endPage > totalPages) {
              endPage = totalPages
              startPage = Math.max(1, endPage - maxButtons + 1)
            }

            return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const pageNumber = startPage + i
              return (
                <button
                  type="button"
                  key={`page-${pageNumber}`}
                  onClick={() => goToPage(pageNumber)}
                  className={`px-4 py-2 h-11 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all ${
                    currentPage === pageNumber
                      ? 'bg-primary text-black font-medium'
                      : 'bg-background/50 backdrop-blur-sm border border-border text-foreground/90 hover:bg-background/70'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })
          })()}

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-5 py-2 h-11 bg-background/50 backdrop-blur-sm border border-border rounded-xl text-foreground/90 disabled:opacity-30 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default IPListView
