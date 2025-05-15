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
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { useIPs } from '@/hooks/useIP'
import { useSession } from '@/components/AuthLayout'
import CachedImage from '@/components/CachedImage'
import type { Timestamp } from 'firebase/firestore'

// Status badge component for deal status visualization
const StatusBadge = ({
  status,
  isOwner,
}: { status?: string; isOwner: boolean }) => {
  // Default status for items without deals
  if (!status) {
    return (
      <Badge
        variant={isOwner ? 'default' : 'outline'}
        className="whitespace-nowrap"
      >
        {isOwner ? 'Owner' : 'Shared'}
      </Badge>
    )
  }

  // For items with deal status
  const statusConfig: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      label: string
    }
  > = {
    active: { variant: 'default', label: 'Active' },
    pending: { variant: 'secondary', label: 'Pending' },
    review: { variant: 'secondary', label: 'In Review' },
    inactive: { variant: 'outline', label: 'Inactive' },
    completed: { variant: 'default', label: 'Completed' },
    expired: { variant: 'destructive', label: 'Expired' },
  }

  const config = statusConfig[status] || statusConfig.inactive

  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  )
}

// Helper function for time remaining calculation
const getTimeRemaining = (expiresAt?: Timestamp): string | undefined => {
  if (!expiresAt) return undefined

  const now = new Date()
  const expiry = expiresAt.toDate()
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs <= 0) return 'Expired'

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  )

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`
  }
  return `${diffHours}h`
}

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
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  )
  useSession(myItems ? ['stytchUser', 'fbUser'] : [])

  // Responsive handling for screen size
  useEffect(() => {
    const updateResponsiveness = () => {
      const newWidth = getImageWidth()
      setImageWidth(newWidth)
      setIsMobile(window.innerWidth <= 640)
    }
    window.addEventListener('resize', updateResponsiveness)
    return () => window.removeEventListener('resize', updateResponsiveness)
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
        <CardContent className="p-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead className="w-[200px] md:w-[280px]">Name</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Description
                </TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
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
                ipItems.map((item) => {
                  // Get the most recent deal if exists
                  const latestDeal =
                    item.deals && item.deals.length > 0
                      ? item.deals.sort((a, b) => {
                          const aTime = a.createdAt.toMillis()
                          const bTime = b.createdAt.toMillis()
                          return bTime - aTime
                        })[0]
                      : null

                  // Determine deal status and expiry
                  const dealStatus = latestDeal ? latestDeal.status : undefined
                  const accessExpiry = latestDeal
                    ? latestDeal.expiresAt
                    : undefined

                  return (
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
                            <span className="truncate block max-w-[180px]">
                              {item.name}
                            </span>
                            {isMobile && (
                              <span className="text-xs text-foreground/60 truncate block mt-1">
                                {item.description}
                              </span>
                            )}
                          </TooltipTrigger>
                          <TooltipContent className="bg-background/80 backdrop-blur-md text-foreground p-3 rounded-xl max-w-xs border border-border shadow-lg">
                            {item.name}
                            {isMobile && (
                              <p className="mt-2 text-sm">{item.description}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-md">
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
                      <TableCell className="hidden md:table-cell">
                        {item.createdAt?.toDate().toLocaleDateString() ||
                          'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge
                            status={dealStatus}
                            isOwner={Boolean(item.creator)}
                          />
                          {accessExpiry && (
                            <span
                              className={`text-xs ${getTimeRemaining(accessExpiry) === 'Expired' ? 'text-destructive' : 'text-foreground/60'}`}
                            >
                              {getTimeRemaining(accessExpiry)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Improved Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex items-center space-x-3 mt-8 overflow-x-auto py-2">
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
