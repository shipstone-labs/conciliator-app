import { formatDate, type IPAudit, type IPDoc } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useConfig } from '../AuthLayout'
import { Button } from '../ui/button'

type AuditLogProps = {
  audit?: IPAudit
  ipDoc?: IPDoc
}
export const AuditLog = ({ audit, ipDoc }: AuditLogProps) => {
  const config = useConfig()
  return audit ? (
    <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-white/10">
        <CardTitle className="text-2xl font-bold text-primary">
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        <div
          className="p-3 border border-white/10 rounded-xl bg-muted/20 grid gap-3"
          style={{ gridTemplateColumns: '12em 1fr' }}
        >
          <div className="text-white font-bold text-sm">Created On</div>
          <div className="text-white/80 text-sm">
            {formatDate(audit.createdAt)}
          </div>
          <div className="text-white font-bold text-sm">Status</div>
          <div className="text-white/80 text-sm">{audit.status}</div>
          <div className="text-white font-bold text-sm">Creator</div>
          <div className="text-white/80 text-sm">
            id={audit.creator}
            <br />
            address={audit.address}
          </div>
          <div className="text-white font-bold text-sm">Token ID</div>
          <div className="text-white/80 text-sm">
            {ipDoc?.metadata?.tokenId}
          </div>
          <div className="text-white font-bold text-sm">IPDocV2 Contract</div>
          <div className="text-white/80 text-sm">
            name={config.CONTRACT_NAME as string}
            <br />
            address={config.CONTRACT as string}
          </div>
          <div className="text-white font-bold text-sm">Mint Transaction</div>
          <div className="text-white/80 text-sm">
            {ipDoc?.metadata?.mint || 'Not available'}
            <br />
            <Button
              asChild
              size="sm"
              disabled={!ipDoc?.metadata?.mint}
              variant="outline"
              className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
            >
              <a
                className="px-3 py-1 h-auto text-sm font-bold bg-primary/40 hover:bg-primary/60 border-primary/50"
                href={`https://calibration.filfox.info/en/message/${ipDoc?.metadata?.mint}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ipDoc?.metadata?.mint
                  ? '✓ Confirm Creation Mint'
                  : '⚠ Transaction Unavailable'}{' '}
              </a>
            </Button>
          </div>
        </div>
        {audit.details?.map((detail) => (
          <div
            key={detail.id}
            className="p-3 border border-white/10 rounded-xl bg-muted/20 grid gap-3"
            style={{ gridTemplateColumns: '12em 1fr' }}
          >
            <div className="text-white font-bold text-sm">Created On</div>
            <div className="text-white/80 text-sm">
              {formatDate(detail.createdAt)}
            </div>

            <div className="text-white font-bold text-sm">Status</div>
            <div className="text-white/80 text-sm">{detail.status}</div>
          </div>
        )) || null}
      </CardContent>
    </Card>
  ) : null
}
