import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MDXEditor, type MDXEditorMethods, headingsPlugin, listsPlugin, quotePlugin,
  thematicBreakPlugin, markdownShortcutPlugin, linkPlugin, linkDialogPlugin,
  imagePlugin, tablePlugin, codeBlockPlugin, codeMirrorPlugin, diffSourcePlugin,
  toolbarPlugin, UndoRedo, BoldItalicUnderlineToggles, BlockTypeSelect,
  ListsToggle, CreateLink, InsertImage, InsertTable, InsertThematicBreak,
  InsertCodeBlock, CodeToggle, DiffSourceToggleWrapper,
  realmPlugin, createRootEditorSubscription$, createActiveEditorSubscription$, $createImageNode, ImageNode,
} from '@mdxeditor/editor'
import { $getNodeByKey, $insertNodes, PASTE_COMMAND, COMMAND_PRIORITY_BEFORE_CRITICAL } from 'lexical'
import { toast } from 'sonner'
import { api, cn } from '@/lib/utils'
import '@mdxeditor/editor/style.css'

const accessibilityPlugin = realmPlugin<{ id?: string; required?: boolean }>({
  init(realm, params) {
    realm.pub(createRootEditorSubscription$, (editor) => editor.registerRootListener((root) => {
      if (!root) return
      if (params?.id) root.id = `${params.id}-input`
      root.setAttribute('aria-label', 'Markdown content')
      root.setAttribute('aria-required', String(!!params?.required))
    }))
  },
})

type Upload = (file: File) => Promise<string>

// Insert nodes synchronously at the paste selection. Resolve each upload into its
// own node, so later typing and failed siblings cannot move or discard images.
const clipboardImagesPlugin = realmPlugin<{ upload: Upload }>({
  init(realm, params) {
    realm.pub(createActiveEditorSubscription$, (editor) => editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false
        const files = Array.from(event.clipboardData?.items ?? [])
          .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
          .map((item) => item.getAsFile()).filter((file): file is File => !!file)
        if (!files.length) return false
        event.preventDefault()
        for (const file of files) {
          const preview = URL.createObjectURL(file)
          const node = $createImageNode({ src: preview, altText: file.name || 'image' })
          const key = node.getKey()
          $insertNodes([node])
          void params!.upload(file).then((url) => {
            editor.update(() => {
              const current = $getNodeByKey(key)
              if (current instanceof ImageNode) current.setSrc(url)
            })
          }).catch(() => {
            editor.update(() => $getNodeByKey(key)?.remove())
          }).finally(() => URL.revokeObjectURL(preview))
        }
        return true
      },
      COMMAND_PRIORITY_BEFORE_CRITICAL,
    ))
  },
})

export function MarkdownEditor({ id, value, onChange, placeholder, className, required,
  minHeightClass = 'min-h-40', onUploadingChange,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  minHeightClass?: string
  onUploadingChange?: (uploading: boolean) => void
}) {
  const editor = useRef<MDXEditorMethods>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const [initial] = useState(value)
  const last = useRef(value)
  const pending = useRef(0)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const callbacks = useRef({ onChange, onUploadingChange })
  useEffect(() => { callbacks.current = { onChange, onUploadingChange } }, [onChange, onUploadingChange])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (value !== last.current) {
      editor.current?.setMarkdown(value)
      last.current = value
    }
  }, [value])

  // Also protect inline comment forms and submission via the Enter key.
  useEffect(() => {
    const form = wrapper.current?.closest('form')
    const guard = (event: Event) => {
      if (pending.current || (required && !last.current.trim())) {
        event.preventDefault()
        event.stopImmediatePropagation()
        toast.error(pending.current ? 'Wait for images to finish uploading' : 'Content is required')
      }
    }
    form?.addEventListener('submit', guard, true)
    return () => form?.removeEventListener('submit', guard, true)
  }, [id, required])

  const upload = useCallback<Upload>((file) => {
    pending.current += 1
    setUploading(true)
    callbacks.current.onUploadingChange?.(true)
    const task = queue.current.catch(() => {}).then(async () => {
      if (!file.type.startsWith('image/')) throw new Error('Choose an image file')
      if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller')
      const body = new FormData()
      body.append('file', file)
      const response = await api<{ url: string }>('/uploads', { method: 'POST', body })
      return response.url
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Image upload failed')
      throw error
    }).finally(() => {
      pending.current -= 1
      // Let Lexical commit the resolved URL before publishing becomes available.
      window.setTimeout(() => {
        const busy = pending.current > 0
        setUploading(busy)
        callbacks.current.onUploadingChange?.(busy)
      }, 0)
    })
    queue.current = task
    return task
  }, [])

  return (
    <div ref={wrapper} className={cn('space-y-2', className)} aria-busy={uploading}>
      <MDXEditor
        ref={editor}
        markdown={initial}
        onChange={(markdown) => { setError(''); last.current = markdown; callbacks.current.onChange(markdown) }}
        onError={({ error }) => setError(error)}
        placeholder={placeholder ?? 'Write your content…'}
        className="orbit-editor rounded-lg border bg-background"
        contentEditableClassName={cn('markdown-body p-4 outline-none', minHeightClass)}
        plugins={[
          accessibilityPlugin({ id, required }),
          headingsPlugin(), listsPlugin(), quotePlugin(), thematicBreakPlugin(),
          linkPlugin(), linkDialogPlugin(), tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
          codeMirrorPlugin({ codeBlockLanguages: { txt: 'Text', js: 'JavaScript', ts: 'TypeScript', json: 'JSON', css: 'CSS', html: 'HTML', bash: 'Shell', python: 'Python' } }),
          // Upload callbacks access refs only when an image is submitted.
          // oxlint-disable-next-line react/refs
          imagePlugin({ imageUploadHandler: upload, disableImageResize: true, allowSetImageDimensions: false }),
          // oxlint-disable-next-line react/refs
          clipboardImagesPlugin({ upload }),
          diffSourcePlugin({ viewMode: 'rich-text' }), markdownShortcutPlugin(),
          toolbarPlugin({ toolbarContents: () => (
            <DiffSourceToggleWrapper options={['rich-text', 'source']}>
              <UndoRedo /><BlockTypeSelect /><BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
              <CodeToggle /><ListsToggle /><CreateLink /><InsertImage />
              <InsertTable /><InsertCodeBlock /><InsertThematicBreak />
            </DiffSourceToggleWrapper>
          ) }),
        ]}
      />
      <p className="text-xs text-muted-foreground" role="status">{uploading ? 'Uploading images…' : 'Paste images into the rich text editor, or use the image toolbar button. Maximum 5 MB per image.'}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error} Switch to source mode to correct the Markdown.</p>}
    </div>
  )
}
