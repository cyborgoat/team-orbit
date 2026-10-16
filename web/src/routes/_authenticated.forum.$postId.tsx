import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { ForumPostContent } from '@/components/forum-post-content'
import { ForumComment } from '@/components/forum-comment'
import { CommentComposer } from '@/components/comment-composer'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { ListControls } from '@/components/list-controls'
import { useAuth } from '@/lib/auth'
import { canModerate } from '@/lib/policies'
import { orbit } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
export const Route = createFileRoute('/_authenticated/forum/$postId')({
  component: ForumPostPage,
})
function ForumPostPage() {
  const { postId } = Route.useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const {
    data: post,
    error,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => orbit.forum.getPost(postId),
  })
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.post(postId) })
    void qc.invalidateQueries({ queryKey: queryKeys.forum })
  }
  const onError = (error: Error) => toast.error(error.message)
  const votePost = useMutation({
    mutationFn: (value: 1 | -1 | 0) => orbit.forum.votePost(postId, value),
    onSuccess: invalidate,
    onError,
  })
  const voteComment = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 1 | -1 | 0 }) =>
      orbit.forum.voteComment(id, value),
    onSuccess: invalidate,
    onError,
  })
  const addComment = useMutation({
    mutationFn: (payload: { content: string; parentId?: string }) =>
      orbit.forum.addComment(postId, payload),
    onSuccess: (_data, vars) => {
      invalidate()
      toast.success(vars.parentId ? 'Reply posted' : 'Comment posted')
    },
    onError,
  })
  const removeComment = useMutation({
    mutationFn: (id: string) => orbit.forum.deleteComment(id),
    onSuccess: () => {
      invalidate()
      toast.success('Comment deleted')
    },
    onError,
  })
  const removePost = useMutation({
    mutationFn: () => orbit.forum.deletePost(postId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.forum })
      toast.success('Post deleted')
      void navigate({ to: '/forum' })
    },
    onError,
  })
  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading…</p>
  if (error)
    return (
      <ListControls page={1} setPage={() => {}} error={error} retry={refetch} />
    )
  if (!post) return <Link to="/forum">Back to forum</Link>
  return (
    <div className="space-y-6">
      <ForumPostContent
        post={post}
        pending={votePost.isPending}
        onVote={(value) => votePost.mutate(value)}
        onDelete={() => removePost.mutate()}
        canDelete={canModerate(user, post.author.id)}
      />
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
        <CardContent>
          <CommentComposer
            pending={addComment.isPending}
            onSubmit={(content) => addComment.mutateAsync({ content })}
          />
        </CardContent>
      </Card>
      <div className="space-y-4">
        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          post.comments.map((comment) => (
            <ForumComment
              key={comment.id}
              comment={comment}
              actions={{
                pending: addComment.isPending,
                voting: voteComment.isPending,
                canModerate: (id) => canModerate(user, id),
                onVote: (id, value) => voteComment.mutate({ id, value }),
                onRemove: (id) => removeComment.mutate(id),
              }}
              onReply={(content) =>
                addComment.mutateAsync({ content, parentId: comment.id })
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
