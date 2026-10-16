import { uploadImage } from '@/lib/api'
import { useRef, useState } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function ImageUpload({
  value,
  onChange,
  onUploadingChange,
}: {
  value?: string
  onChange: (url: string) => void
  onUploadingChange?: (uploading: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function onFile(file: File | null) {
    if (!file) return
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const res = await uploadImage(file)
      onChange(res.url)
      toast.success('Image uploaded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          <Upload />
          {uploading ? 'Uploading…' : 'Choose image'}
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          aria-label="Upload cover image"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            void onFile(event.target.files?.[0] ?? null)
            event.target.value = ''
          }}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
          >
            Remove
          </Button>
        ) : null}
      </div>
      {value ? (
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <img
            src={value}
            alt="Upload preview"
            className="h-36 w-full object-cover"
          />
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
