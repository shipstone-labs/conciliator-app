import type { IPDoc } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

type ViewDocProps = {
  view: boolean
  ipDoc: IPDoc
}

export const ViewStatus = ({ view, ipDoc }: ViewDocProps) => {
  const router = useRouter()
  return ipDoc.canView && !view ? (
    <div
      onClick={() => router.push(`/view/${ipDoc.id}`)}
      className="cursor-pointer transform transition-transform hover:scale-[1.01] active:scale-[0.99]"
      aria-label="Go to View Mode"
      data-testid="ip-detail-view-button"
    >
      <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center">
          <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
            <Image
              src="/view.svg"
              alt="View Mode Icon"
              width={32}
              height={32}
              priority
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
              View Encrypted Idea{' '}
              <ArrowRight className="w-4 h-4 inline-block" aria-hidden="true" />
            </h3>
            <p className="text-foreground/80 text-sm">
              Since you either own or have purchased the content you can now
              view it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null
}
