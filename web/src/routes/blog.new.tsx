import { createFileRoute, redirect } from '@tanstack/react-router'
import { ContentCreatePage } from '@/components/content-create-page'
import { getToken } from '@/lib/utils'

export const Route = createFileRoute('/blog/new')({
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
  component: () => <ContentCreatePage kind="blog" />,
})
