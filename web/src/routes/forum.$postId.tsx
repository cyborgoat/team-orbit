import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Code2,
  Eye,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { MarkdownBody } from '@/components/markdown-body'
import { toast } from 'sonner'
import { MarkdownEditor } from '@/components/markdown-editor'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { api, cn, getToken } from '@/lib/utils'

export const Route = createFileRoute('/forum/$postId')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: ForumPostPage,
})

type Author = {
  id: string
  username: string
  fullName: string
  avatarUrl?: string | null
}

type ForumComment = {
  id: string
  content: string
  score: number
  myVote: number
  author: Author
  createdAt: string
  replies: ForumComment[]
}

type ForumPost = {
  id: string
  title: string
  content: string
  score: number
  myVote: number
  author: Author
  createdAt: string
  comments: ForumComment[]
}

function VoteControls({
  score,
  myVote,
  onVote,
  pending,
}: {
  score: number
  myVote: number
  onVote: (value: 1 | -1 | 0) => void
  pending?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        disabled={pending}
        className={cn(myVote === 1 && 'text-primary')}
        onClick={() => onVote(myVote === 1 ? 0 : 1)}
      >
        <ChevronUp />
      </Button>
      <span className="min-w-6 text-center text-xs font-medium tabular-nums">
        {score}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        disabled={pending}
        className={cn(myVote === -1 && 'text-destructive')}
        onClick={() => onVote(myVote === -1 ? 0 : -1)}
      >
        <ChevronDown />
      </Button>
    </div>
  )
}

function ForumPostPage() {
  const { postId } = Route.useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [mode, setMode] = useState<'view' | 'source'>('view')
  const [commentUploading, setCommentUploading] = useState(false)
  const [replyUploading, setReplyUploading] = useState(false)
  const [comment, setComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const { data: post, isLoading } = useQuery({
    queryKey: ['forum-post', postId],
    queryFn: () => api<ForumPost>(`/forum-posts/${postId}`),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['forum-post', postId] })
    qc.invalidateQueries({ queryKey: ['forum-posts'] })
  }

  const votePost = useMutation({
    mutationFn: (value: 1 | -1 | 0) =>
      api(`/forum-posts/${postId}/vote`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  const voteComment = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 1 | -1 | 0 }) =>
      api(`/forum-comments/${id}/vote`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  const addComment = useMutation({
    mutationFn: (payload: { content: string; parentId?: string }) =>
      api(`/forum-posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, vars) => {
      if (vars.parentId) {
        setReplyTo(null)
        setReplyContent('')
      } else {
        setComment('')
      }
      invalidate()
      toast.success(vars.parentId ? 'Reply posted' : 'Comment posted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removeComment = useMutation({
    mutationFn: (id: string) =>
      api(`/forum-comments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast.success('Comment deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removePost = useMutation({
    mutationFn: () => api(`/forum-posts/${postId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] })
      toast.success('Post deleted')
      void navigate({ to: '/forum' })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canModerate = (authorId: string) =>
    user?.id === authorId ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPERUSER'

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to forum
        </Link>
        <p className="text-sm text-muted-foreground">Post not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            to="/forum"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to forum
          </Link>
          <PageHeader
            title={post.title}
            description={`By ${post.author.fullName} · ${new Date(post.createdAt).toLocaleString()}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <VoteControls
            score={post.score}
            myVote={post.myVote}
            pending={votePost.isPending}
            onVote={(value) => votePost.mutate(value)}
          />
          <div className="flex rounded-lg border p-0.5">
            <Button
              type="button"
              size="xs"
              variant={mode === 'view' ? 'secondary' : 'ghost'}
              onClick={() => setMode('view')}
            >
              <Eye data-icon="inline-start" />
              View
            </Button>
            <Button
              type="button"
              size="xs"
              variant={mode === 'source' ? 'secondary' : 'ghost'}
              onClick={() => setMode('source')}
            >
              <Code2 data-icon="inline-start" />
              Source
            </Button>
          </div>
          {canModerate(post.author.id) ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete post"
              onClick={() => {
                if (confirm('Delete this post and all comments?')) {
                  removePost.mutate()
                }
              }}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="pt-(--card-spacing)">
          {mode === 'source' ? (
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {post.content}
            </pre>
          ) : (
            <MarkdownBody content={post.content} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            Comments
          </CardTitle>
          <CardDescription>
            Reply to the post or to a top-level comment (one level deep).
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (commentUploading || addComment.isPending || !comment.trim()) return
            addComment.mutate({ content: comment })
          }}
        >
          <CardContent className="space-y-2">
            <Label htmlFor="forum-comment-input">Add a comment</Label>
            <MarkdownEditor
              id="forum-comment"
              value={comment}
              onChange={setComment}
              onUploadingChange={setCommentUploading}
              minHeightClass="min-h-24"
              placeholder="Write a markdown comment…"
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={commentUploading || addComment.isPending || !comment.trim()}>
              {addComment.isPending ? 'Posting…' : 'Post comment'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          post.comments.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-sm">{c.author.fullName}</CardTitle>
                  <CardDescription>
                    {new Date(c.createdAt).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <VoteControls
                    score={c.score}
                    myVote={c.myVote}
                    pending={voteComment.isPending}
                    onVote={(value) =>
                      voteComment.mutate({ id: c.id, value })
                    }
                  />
                  {canModerate(c.author.id) ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Delete comment"
                      onClick={() => {
                        if (confirm('Delete this comment?')) {
                          removeComment.mutate(c.id)
                        }
                      }}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <MarkdownBody content={c.content} />
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setReplyTo(replyTo === c.id ? null : c.id)
                      setReplyContent('')
                    }}
                  >
                    {replyTo === c.id ? 'Cancel reply' : 'Reply'}
                  </Button>
                </div>
                {replyTo === c.id ? (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (replyUploading || addComment.isPending || !replyContent.trim()) return
                      addComment.mutate({
                        content: replyContent,
                        parentId: c.id,
                      })
                    }}
                  >
                    <MarkdownEditor
                      value={replyContent}
                      onChange={setReplyContent}
                      onUploadingChange={setReplyUploading}
                      minHeightClass="min-h-20"
                      placeholder="Write a reply…"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={replyUploading || addComment.isPending || !replyContent.trim()}
                    >
                      {addComment.isPending ? 'Posting…' : 'Post reply'}
                    </Button>
                  </form>
                ) : null}
                {c.replies.length > 0 ? (
                  <div className="mt-4 space-y-3 border-l pl-4">
                    {c.replies.map((r) => (
                      <div key={r.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{r.author.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(r.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <VoteControls
                              score={r.score}
                              myVote={r.myVote}
                              pending={voteComment.isPending}
                              onVote={(value) =>
                                voteComment.mutate({ id: r.id, value })
                              }
                            />
                            {canModerate(r.author.id) ? (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label="Delete reply"
                                onClick={() => {
                                  if (confirm('Delete this reply?')) {
                                    removeComment.mutate(r.id)
                                  }
                                }}
                              >
                                <Trash2 />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        <MarkdownBody content={r.content} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
