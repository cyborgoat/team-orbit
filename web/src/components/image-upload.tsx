import { useState } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/utils'

export function ImageUpload({
  value,
  onChange,
}: {
  value?: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function onFile(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api<{ url: string }>('/uploads', {
        method: 'POST',
        body: form,
      })
      onChange(res.url)
      toast.success('Image uploaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={uploading} asChild>
          <label className="cursor-pointer">
            <Upload />
            {uploading ? 'Uploading…' : 'Choose image'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
            Remove
          </Button>
        ) : null}
      </div>
      {value ? (
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <img src={value} alt="Upload preview" className="h-36 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
          <ImageIcon className="size-4" />
          No image selected
        </div>
      )}
    </div>
  )
}
