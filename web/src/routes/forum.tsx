import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { MarkdownEditor } from '@/components/markdown-editor'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export const Route = createFileRoute('/forum')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: ForumPage,
})

type Author = {
  id: string
  username: string
  fullName: string
  avatarUrl?: string | null
}

type ForumPostListItem = {
  id: string
  title: string
  content: string
  score: number
  commentCount: number
  author: Author
  createdAt: string
}

function ForumPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['forum-posts'],
    queryFn: () => api<{ items: ForumPostListItem[] }>('/forum-posts'),
  })
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const create = useMutation({
    mutationFn: () =>
      api('/forum-posts', {
        method: 'POST',
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      setForm({ title: '', content: '' })
      setOpen(false)
      qc.invalidateQueries({ queryKey: ['forum-posts'] })
      toast.success('Post published')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/forum-posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] })
      toast.success('Deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = data?.items ?? []
  const canModerate = (authorId: string) =>
    user?.id === authorId ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPERUSER'

  return (
    <div>
      <PageHeader
        title="Forum"
        description="Markdown discussion posts with comments, replies, and votes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus data-icon="inline-start" />
                New post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  create.mutate()
                }}
              >
                <DialogHeader>
                  <DialogTitle>New forum post</DialogTitle>
                  <DialogDescription>
                    Write in markdown. Use Insert image to embed uploads.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="forum-title">Title</Label>
                  <Input
                    id="forum-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forum-content">Content</Label>
                  <MarkdownEditor
                    id="forum-content"
                    value={form.content}
                    onChange={(content) => setForm({ ...form, content })}
                    required
                    placeholder="## Hello&#10;&#10;Share an idea…"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? 'Publishing…' : 'Publish'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyTitle>No forum posts yet</EmptyTitle>
            <EmptyDescription>
              Start a discussion — any signed-in member can post.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      to="/forum/$postId"
                      params={{ postId: item.id }}
                      className="block font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    <pre className="mt-1 max-w-md truncate font-mono text-xs text-muted-foreground">
                      {item.content}
                    </pre>
                  </TableCell>
                  <TableCell className="tabular-nums">{item.score}</TableCell>
                  <TableCell className="tabular-nums">{item.commentCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.author.fullName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canModerate(item.author.id) ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Delete this post?')) remove.mutate(item.id)
                        }}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
