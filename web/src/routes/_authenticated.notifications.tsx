import { useListPage } from '@/hooks/use-list-page'
import { ListControls } from '@/components/list-controls'
import { queryKeys } from '@/lib/query-keys'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { orbit } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const qc = useQueryClient()
  const pagination = useListPage()
  const { data, error, refetch, isFetching, isLoading } = useQuery({
    queryKey: [...queryKeys.notifications, pagination.page],
    queryFn: () =>
      orbit.notifications.list({
        page: pagination.page,
        limit: pagination.limit,
      }),
  })
  const markRead = useMutation({
    mutationFn: (id: string) => orbit.notifications.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      toast.success('Marked as read')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = data?.items ?? []
  const unread = items.filter((n) => !n.read).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Persisted feed plus live Socket.io toasts when content is created elsewhere."
        actions={
          unread > 0 ? <Badge variant="secondary">{unread} unread</Badge> : null
        }
      />

      <ListControls
        {...pagination}
        total={data?.total}
        error={error}
        retry={refetch}
        pending={isFetching}
      />
      {error ? null : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell />
            </EmptyMedia>
            <EmptyTitle>Inbox empty</EmptyTitle>
            <EmptyDescription>
              Create an announcement, event, news, or blog post to generate
              notifications.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notification</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((n) => (
                <TableRow key={n.id} data-unread={!n.read || undefined}>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      {!n.read ? (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      ) : (
                        <span className="mt-1.5 size-2 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">{n.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {n.body}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{n.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {!n.read ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markRead.mutate(n.id)}
                      >
                        Mark read
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Read
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
