'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '@/components/Loading'
import { Input } from '@/components/ui/input'
import { useDebounce } from 'use-debounce'

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

// Helper function to perform case-insensitive search
function searchItems(
  items: Array<{ name?: string; description?: string; [key: string]: any }>,
  searchTerm: string
) {
  if (!searchTerm.trim()) return items

  const lowerCaseSearch = searchTerm.toLowerCase().trim()
  const searchTerms = lowerCaseSearch
    .split(/\s+/)
    .filter((term) => term.length > 0)

  // If no valid search terms after splitting, return all items
  if (searchTerms.length === 0) return items

  return items.filter((item) => {
    const title = item.name?.toLowerCase() || ''
    const description = item.description?.toLowerCase() || ''

    // Check if all search terms are found in either title or description
    return searchTerms.every(
      (term) => title.includes(term) || description.includes(term)
    )
  })
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
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)

  // Handle pagination reset when search term changes
  // This needs to be a separate useCallback to avoid dependency issues
  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])

  // Apply the pagination reset when search changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      resetPagination()
    }
  }, [debouncedSearchTerm, resetPagination])

  // Handle keyboard events for the search input
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Clear search when Escape key is pressed
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('')
        e.preventDefault()
      }
      // Submit search when Enter key is pressed
      if (e.key === 'Enter') {
        e.preventDefault() // Prevent form submission
        // The actual search is handled by the debounced effect
      }
    },
    [searchTerm]
  )

  // Handle explicit search button click
  const handleSearchClick = useCallback(() => {
    // Force the input to blur to close mobile keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    // The actual search is handled by the debounced effect
  }, [])
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

  // Filter items based on debounced search term
  const filteredItems = useMemo(() => {
    return ipItems ? searchItems(ipItems, debouncedSearchTerm) : []
  }, [ipItems, debouncedSearchTerm])

  if (!ipItems) {
    return <Loading />
  }

  return (
    <div className="w-full flex flex-col items-center p-3">
      {/* Search input */}
      <div className="w-full max-w-6xl mb-4">
        <div className="relative">
          <div className="relative flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
              role="presentation"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-background/50 border-border focus:border-primary transition-colors pl-10 pr-10 backdrop-blur-sm"
              data-testid="ip-search-input"
            />
            <div className="absolute right-0 flex items-center space-x-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="h-8 w-8 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                  aria-label="Clear search"
                  data-testid="clear-search-button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    role="presentation"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={handleSearchClick}
                className="h-8 w-8 mr-2 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors sm:hidden"
                aria-label="Search"
                data-testid="search-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  role="presentation"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {debouncedSearchTerm && (
          <div className="text-sm text-foreground/70 mt-2 pl-1">
            Found {filteredItems.length}{' '}
            {filteredItems.length === 1 ? 'result' : 'results'} for "
            {debouncedSearchTerm}"
          </div>
        )}
      </div>
      <Card className="w-full max-w-6xl">
        <CardContent className="p-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Image</TableHead>
                <TableHead className="w-[200px] md:w-[280px]">Title</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Description
                </TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow data-testid="ip-list-empty-state">
                  <TableCell colSpan={5} className="text-center">
                    {ipItems.length === 0
                      ? 'No items found'
                      : 'No matching results found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => {
                  // Get the most recent deal if exists
                  const latestDeal =
                    item.deals && item.deals.length > 0
                      ? item.deals.sort((a: any, b: any) => {
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
                      data-testid={`ip-list-item-${index}`}
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
                            alt={item.name || 'IP asset image'}
                            width={imageWidth}
                            height={imageWidth}
                            className="rounded-md object-cover shadow-sm border border-border hover:border-primary/30 transition-all"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Tooltip>
                          <TooltipTrigger className="block w-full text-left">
                            <span className="line-clamp-2 block max-w-[180px]">
                              {item.name}
                            </span>
                            {isMobile && (
                              <span className="text-xs text-foreground/60 line-clamp-2 block mt-1 max-w-[300px]">
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
                            <span className="line-clamp-2 block max-w-[400px]">
                              {item.description || ''}
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
      {filteredItems.length > 0 && totalPages > 0 && (
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
