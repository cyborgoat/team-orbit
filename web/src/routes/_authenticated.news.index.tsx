import { createFileRoute } from '@tanstack/react-router'
import { ArticleList } from '@/components/article-list'
export const Route = createFileRoute('/_authenticated/news/')({
  component: () => <ArticleList kind="news" />,
})
