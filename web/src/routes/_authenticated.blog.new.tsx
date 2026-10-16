import { createFileRoute } from '@tanstack/react-router'
import { ContentCreatePage } from '@/components/content-create-page'

export const Route = createFileRoute('/_authenticated/blog/new')({
  component: () => <ContentCreatePage kind="blog" />,
})
