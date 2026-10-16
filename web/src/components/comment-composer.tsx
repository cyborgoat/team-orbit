import { useState } from 'react'
import { MarkdownEditor } from '@/components/markdown-editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
export function CommentComposer({
  reply = false,
  pending,
  onSubmit,
}: {
  reply?: boolean
  pending: boolean
  onSubmit: (content: string) => Promise<unknown>
}) {
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const id = reply ? undefined : 'forum-comment'
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (uploading || pending || !content.trim()) return
        void onSubmit(content)
          .then(() => setContent(''))
          .catch(() => {})
      }}
    >
      {!reply && <Label htmlFor="forum-comment-input">Add a comment</Label>}
      <MarkdownEditor
        id={id}
        value={content}
        onChange={setContent}
        onUploadingChange={setUploading}
        minHeightClass={reply ? 'min-h-20' : 'min-h-24'}
        placeholder={reply ? 'Write a reply…' : 'Write a markdown comment…'}
      />
      <Button
        type="submit"
        size={reply ? 'sm' : 'default'}
        disabled={uploading || pending || !content.trim()}
      >
        {pending ? 'Posting…' : reply ? 'Post reply' : 'Post comment'}
      </Button>
    </form>
  )
}
