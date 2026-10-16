import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Newspaper, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { MarkdownPreview } from '@/components/markdown-preview'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth'
import { api, getToken } from '@/lib/utils'

export const Route = createFileRoute('/news/')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: NewsPage,
})

type Item = {
  id: string
  title: string
  content: string
  tags: string[]
  coverImageUrl?: string | null
  createdAt: string
}

function NewsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api<{ items: Item[] }>('/news'),
  })
  const [preview, setPreview] = useState<Item | null>(null)
  const remove = useMutation({
    mutationFn: (id: string) => api(`/news/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news'] })
      toast.success('Deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = data?.items ?? []

  return (
    <div>
      <PageHeader
        title="News"
        description="Markdown articles with tags. Content stays as markdown for your real frontend later."
        actions={
          (user?.role === 'ADMIN' || user?.role === 'SUPERUSER') ? (<Button asChild><Link to="/news/new"><Plus data-icon="inline-start" />New article</Link></Button>) : null
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Newspaper />
            </EmptyMedia>
            <EmptyTitle>No news yet</EmptyTitle>
            <EmptyDescription>Publish a markdown article to test the news API.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setPreview(item)}
                >
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <pre className="mt-1 max-w-md truncate font-mono text-xs text-muted-foreground">
                      {item.content}
                    </pre>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(item.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPERUSER') && <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this article?')) remove.mutate(item.id)
                      }}
                    >
                      <Trash2 />
                    </Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MarkdownPreview
        open={preview !== null}
        onOpenChange={(next) => {
          if (!next) setPreview(null)
        }}
        title={preview?.title ?? ''}
        content={preview?.content ?? ''}
        tags={preview?.tags}
        coverImageUrl={preview?.coverImageUrl}
        createdAt={preview?.createdAt}
      />
    </div>
  )
}
