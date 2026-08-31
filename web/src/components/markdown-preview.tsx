import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Code2, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Mode = 'view' | 'source'

type MarkdownPreviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: string
  tags?: string[]
  coverImageUrl?: string | null
  createdAt?: string
}

export function MarkdownPreview({
  open,
  onOpenChange,
  title,
  content,
  tags = [],
  coverImageUrl,
  createdAt,
}: MarkdownPreviewProps) {
  const [mode, setMode] = useState<Mode>('view')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setMode('view')
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-3 border-b p-4 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription>
                {createdAt
                  ? `Published ${new Date(createdAt).toLocaleString()}`
                  : 'Markdown preview'}
              </DialogDescription>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 rounded-lg border p-0.5">
              <Button
                type="button"
                size="xs"
                variant={mode === 'view' ? 'secondary' : 'ghost'}
                aria-pressed={mode === 'view'}
                onClick={() => setMode('view')}
              >
                <Eye data-icon="inline-start" />
                View
              </Button>
              <Button
                type="button"
                size="xs"
                variant={mode === 'source' ? 'secondary' : 'ghost'}
                aria-pressed={mode === 'source'}
                onClick={() => setMode('source')}
              >
                <Code2 data-icon="inline-start" />
                Source
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[min(60vh,32rem)] overflow-y-auto p-4">
          {coverImageUrl && mode === 'view' ? (
            <img
              src={coverImageUrl}
              alt=""
              className="mb-4 max-h-56 w-full rounded-lg object-cover"
            />
          ) : null}

          {mode === 'source' ? (
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {content}
            </pre>
          ) : (
            <div className="markdown-body text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
