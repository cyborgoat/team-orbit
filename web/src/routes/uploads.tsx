import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { ImageUpload } from '@/components/image-upload'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getToken } from '@/lib/utils'

export const Route = createFileRoute('/uploads')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: UploadsPage,
})

function UploadsPage() {
  const [url, setUrl] = useState('')

  return (
    <div>
      <PageHeader
        title="Uploads"
        description="Standalone image upload check. Copy the returned URL into event/news/blog cover fields."
      />
      <Card>
        <CardHeader>
          <CardTitle>Upload an image</CardTitle>
          <CardDescription>
            Max 5MB. Accepted types are images only. Files are stored under the API uploads folder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload value={url} onChange={setUrl} />
          {url ? (
            <div className="rounded-lg bg-muted px-3 py-2 font-mono text-sm break-all">
              {url}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
