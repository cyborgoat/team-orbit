import { useRef, useState } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api, cn } from '@/lib/utils'

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  className,
  required,
  minHeightClass = 'min-h-40',
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  minHeightClass?: string
}) {
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function insertImage(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api<{ url: string }>('/uploads', {
        method: 'POST',
        body: form,
      })
      const snippet = `![image](${res.url})`
      const el = textareaRef.current
      if (el) {
        const start = el.selectionStart
        const end = el.selectionEnd
        const next =
          value.slice(0, start) +
          (start > 0 && value[start - 1] !== '\n' ? '\n' : '') +
          snippet +
          '\n' +
          value.slice(end)
        onChange(next)
        requestAnimationFrame(() => {
          const pos = start + snippet.length + 2
          el.focus()
          el.setSelectionRange(pos, pos)
        })
      } else {
        onChange(value ? `${value}\n${snippet}\n` : `${snippet}\n`)
      }
      toast.success('Image inserted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
          <label className="cursor-pointer">
            <Upload data-icon="inline-start" />
            {uploading ? 'Uploading…' : 'Insert image'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                void insertImage(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
          </label>
        </Button>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon className="size-3.5" />
          Inserts markdown image syntax
        </span>
      </div>
      <Textarea
        id={id}
        ref={textareaRef}
        className={cn('font-mono text-sm', minHeightClass)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  )
}
