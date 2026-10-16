import { ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
export function VoteControls({
  score,
  myVote,
  onVote,
  pending,
}: {
  score: number
  myVote: number
  onVote: (value: 1 | -1 | 0) => void
  pending?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        disabled={pending}
        className={cn(myVote === 1 && 'text-primary')}
        onClick={() => onVote(myVote === 1 ? 0 : 1)}
      >
        <ChevronUp />
      </Button>
      <span className="min-w-6 text-center text-xs font-medium tabular-nums">
        {score}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        disabled={pending}
        className={cn(myVote === -1 && 'text-destructive')}
        onClick={() => onVote(myVote === -1 ? 0 : -1)}
      >
        <ChevronDown />
      </Button>
    </div>
  )
}
