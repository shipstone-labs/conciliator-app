import { formatDate, type IPDoc } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Fragment } from 'react'
import { Button } from '../ui/button'
import { useFeature } from '@/hooks/useFeature'

type DealsProps = {
  ipDoc: IPDoc
}

export const Deals = ({ ipDoc }: DealsProps) => {
  const hasPurchase = useFeature('stripe')
  if (!hasPurchase) {
    return null
  }
  return ipDoc.deals?.length ? (
    <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
          Active Deals {ipDoc.dealsCount ? `(${ipDoc.dealsCount})` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex flex-row gap-4 items-center">
        {ipDoc.deals?.map((deal) => (
          <Fragment key={deal.id}>
            <div
              className="p-3 border border-border/30 rounded-xl bg-muted/20 grid gap-3"
              style={{ gridTemplateColumns: '12em 1fr' }}
            >
              <div className="text-foreground font-bold text-sm">Status</div>
              <div className="text-foreground/80 text-sm">{deal.status}</div>
              <div className="text-foreground font-bold text-sm">
                Expires On
              </div>
              <div className="text-foreground/80 text-sm">
                {formatDate(deal.expiresAt)}
              </div>
              <div className="text-foreground font-bold text-sm">Status</div>
              <div className="text-foreground/80 text-sm">
                {deal.status}
              </div>{' '}
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              disabled={!deal.metadata?.transfer}
              className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
            >
              <a
                className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
                href={`https://calibration.filfox.info/en/message/${deal.metadata?.transfer}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {deal.metadata?.transfer
                  ? '✓ Confirm Purchase Mint'
                  : '⚠ Transaction Unavailable'}{' '}
              </a>
            </Button>
          </Fragment>
        ))}
      </CardContent>
    </Card>
  ) : null
}
