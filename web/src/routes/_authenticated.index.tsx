import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Bell,
  CalendarDays,
  FileText,
  Megaphone,
  MessageSquare,
  Newspaper,
  Settings,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
})

const shortcuts = [
  {
    to: '/announcements',
    title: 'Announcements',
    description: 'Post and review team notices',
    icon: Megaphone,
  },
  {
    to: '/events',
    title: 'Events',
    description: 'Schedule with dates and covers',
    icon: CalendarDays,
  },
  {
    to: '/news',
    title: 'News',
    description: 'Markdown articles with tags',
    icon: Newspaper,
  },
  {
    to: '/blog',
    title: 'Blog',
    description: 'Long-form markdown posts',
    icon: FileText,
  },
  {
    to: '/forum',
    title: 'Forum',
    description: 'Discussions, comments, and votes',
    icon: MessageSquare,
  },
  {
    to: '/users',
    title: 'Users',
    description: 'Create members, roles, and activation',
    icon: Users,
  },
  {
    to: '/notifications',
    title: 'Notifications',
    description: 'Live feed from content creates',
    icon: Bell,
  },
  {
    to: '/settings',
    title: 'Settings',
    description: 'Update your profile and password',
    icon: Settings,
  },
] as const

function HomePage() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName ?? 'member'}`}
        description="Manage your team’s content, discussions, and settings."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/30">
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
