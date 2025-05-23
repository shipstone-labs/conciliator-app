import type { IPDoc } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Card, CardContent } from '../ui/card'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

type MyAgentProps = {
  ipDoc: IPDoc
}
export const MyAgent = ({ ipDoc }: MyAgentProps) => {
  const router = useRouter()
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (e.key === 'Enter') {
        router.push(`/discovery/${ipDoc.id}`)
      }
    },
    [ipDoc, router, ipDoc.id]
  )

  return (
    <>
      {/* Clickable My Agent card */}
      <a
        href={`/discovery/${ipDoc.id}`}
        className="cursor-pointer transform transition-transform hover:scale-[1.01] active:scale-[0.99]"
        aria-label="Go to My AI Agent"
        onKeyDown={onKeyDown}
      >
        <Card className="w-full backdrop-blur-lg bg-background/30 border border-primary/20 shadow-xl hover:border-primary hover:shadow-primary/20 transition-all mt-8">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
              <Image
                src="/chatbot.svg"
                alt="My Agent Icon"
                width={32}
                height={32}
                priority
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-primary mb-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                My AI Agent{' '}
                <ArrowRight
                  className="w-4 h-4 inline-block"
                  aria-hidden="true"
                />
              </h3>
              <p className="text-foreground/80 text-sm">
                Your AI agent monitors the internet for unauthorized use of this
                Idea and provides detailed reports when potential infringement
                is detected.
              </p>
            </div>
          </CardContent>
        </Card>
      </a>
    </>
  )
}
