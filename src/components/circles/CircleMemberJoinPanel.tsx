import { Link } from 'react-router-dom';
import { ExternalLink, Inbox, Loader2, UserPlus } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';
import { formatAddress } from '@/lib/constants';
import { getCirclePath } from '@/lib/routes';
import type { CircleMemberJoinNotice } from '@/types';

interface CircleMemberJoinPanelProps {
  notices: CircleMemberJoinNotice[];
  isLoading?: boolean;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function formatJoinedAt(joinedAt: number) {
  if (!joinedAt) {
    return 'Recently joined';
  }

  return `Joined ${new Date(joinedAt * 1000).toLocaleString()}`;
}

export function CircleMemberJoinPanel({
  notices,
  isLoading = false,
  compact = false,
  emptyTitle = 'No new joins',
  emptyDescription = 'When someone joins one of your managed circles, the update will show up here.',
  className,
}: CircleMemberJoinPanelProps) {
  if (isLoading) {
    return (
      <div className={cn('neo-panel p-5 text-center', className)}>
        <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#FF6B6B]" />
        <p className="font-semibold">Loading member joins...</p>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className={cn('neo-panel p-5 text-center', className)}>
        <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h3 className="font-display text-lg font-semibold">{emptyTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={cn(
            'rounded-[24px] border border-black/10 bg-white/72 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.26)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_60px_-36px_rgba(0,0,0,0.84)]',
            compact ? 'p-3' : 'p-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={getCirclePath(notice.circleId)}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4"
              >
                {notice.circleName}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <div className={cn('mt-2 flex items-center gap-2', compact ? 'text-sm' : 'text-lg')}>
                <UserPlus className="h-4 w-4 text-[#4ECDC4]" />
                <p className="font-semibold">{formatAddress(notice.memberAddress)} joined</p>
              </div>
              <div className="mt-2">
                <CopyButton value={notice.memberAddress} successMessage="Address copied" showLabel label="Copy address" />
              </div>
            </div>

            <div className={cn('rounded-full border border-black/10 bg-white/72 dark:border-white/10 dark:bg-white/8', compact ? 'px-2.5 py-1' : 'px-3 py-2')}>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                New Member
              </span>
            </div>
          </div>

          <div className={cn('mt-3 rounded-[20px] border border-black/10 bg-black/[0.03] dark:bg-white/6', compact ? 'p-3' : 'p-4')}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Join update</p>
            <p className={cn('mt-2 leading-relaxed text-foreground/80', compact ? 'text-sm' : 'text-[15px]')}>
              {formatAddress(notice.memberAddress)} has joined this circle.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {formatJoinedAt(notice.joinedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
