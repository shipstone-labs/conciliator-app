import { Card, CardContent, CardHeader } from '../ui/card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Loading from '../Loading'

type ShowDocumentProps = {
  viewed?: string
  view: boolean
}

export const ShowDocument = ({ viewed, view }: ShowDocumentProps) => {
  return view ? (
    <Card className="w-full backdrop-blur-lg bg-background/30 border border-border/30 shadow-xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/30">
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="px-3 py-1 text-xs font-medium bg-muted/40 text-foreground/70 rounded-full">
            Intellectual Property
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {viewed ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewed}</ReactMarkdown>
        ) : (
          <Loading text="Decrypting Content" />
        )}
      </CardContent>
    </Card>
  ) : null
}
