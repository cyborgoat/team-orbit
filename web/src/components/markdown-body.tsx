import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

/** Shared read-only rendering; Markdown source is never rewritten. */
export function MarkdownBody({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div
      className={cn('markdown-body min-w-0 text-sm leading-relaxed', className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { trust: false, strict: 'ignore' }]]}
        components={{
          table: ({ children }) => (
            <div
              className="markdown-table overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Markdown table"
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
