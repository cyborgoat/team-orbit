import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/image-upload'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { api, getToken } from '@/lib/utils'

export const Route = createFileRoute('/events')({
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
  component: EventsPage,
})

type Item = {
  id: string
  title: string
  description: string
  startAt: string
  endAt: string
  location: string
  coverImageUrl?: string | null
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString()
}

function EventsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api<{ items: Item[] }>('/events'),
  })
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
    coverImageUrl: '',
  })

  const create = useMutation({
    mutationFn: () =>
      api('/events', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          location: form.location,
          startAt: fromLocalInput(form.startAt),
          endAt: fromLocalInput(form.endAt),
          coverImageUrl: form.coverImageUrl || undefined,
        }),
      }),
    onSuccess: () => {
      setForm({
        title: '',
        description: '',
        startAt: '',
        endAt: '',
        location: '',
        coverImageUrl: '',
      })
      setOpen(false)
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event created')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Events"
        description="Team schedule with local date/time pickers and optional cover images."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus data-icon="inline-start" />
                New event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  create.mutate()
                }}
              >
                <DialogHeader>
                  <DialogTitle>New event</DialogTitle>
                  <DialogDescription>
                    Dates use your local timezone and are stored as ISO timestamps.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="ev-title">Title</Label>
                  <Input
                    id="ev-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-location">Location</Label>
                  <Input
                    id="ev-location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ev-start">Starts</Label>
                    <Input
                      id="ev-start"
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ev-end">Ends</Label>
                    <Input
                      id="ev-end"
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-desc">Description</Label>
                  <Textarea
                    id="ev-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cover image</Label>
                  <ImageUpload
                    value={form.coverImageUrl}
                    onChange={(url) => setForm({ ...form, coverImageUrl: url })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? 'Saving…' : 'Create event'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>No events scheduled</EmptyTitle>
            <EmptyDescription>Add an event with start/end times and a location.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt=""
                          className="size-10 rounded-md object-cover"
                        />
                      ) : null}
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="line-clamp-1 text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.startAt).toLocaleString()}
                    <div className="text-xs">→ {new Date(item.endAt).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={() => {
                        if (confirm('Delete this event?')) remove.mutate(item.id)
                      }}
                    >
                      <Trash2 />
                    </Button>
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

