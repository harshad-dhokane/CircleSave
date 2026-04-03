import { Link } from 'react-router-dom';
import { Check, ExternalLink, Inbox, Loader2, MessageSquareText, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';
import { formatAddress, formatAmount } from '@/lib/constants';
import { getCirclePath } from '@/lib/routes';
import type { CircleJoinRequest } from '@/types';

interface CircleRequestsPanelProps {
  requests: CircleJoinRequest[];
  isLoading?: boolean;
  actingRequestId?: string | null;
  actingRequestAction?: 'approve' | 'reject' | null;
  onApprove?: (request: CircleJoinRequest) => void | Promise<void>;
  onReject?: (request: CircleJoinRequest) => void | Promise<void>;
  showCircleName?: boolean;
  compact?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function CircleRequestsPanel({
  requests,
  isLoading = false,
  actingRequestId = null,
  actingRequestAction = null,
  onApprove,
  onReject,
  showCircleName = true,
  compact = false,
  emptyTitle = 'No pending requests',
  emptyDescription = 'Incoming join requests will show up here as soon as members apply.',
  className,
}: CircleRequestsPanelProps) {
  if (isLoading) {
    return (
      <div className={cn('neo-panel p-5 text-center', className)}>
        <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#FF6B6B]" />
        <p className="font-semibold">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
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
      {requests.map((request) => {
        const isActing = actingRequestId === request.id;
        const isApproving = isActing && actingRequestAction === 'approve';
        const isRejecting = isActing && actingRequestAction === 'reject';

        return (
          <div
            key={request.id}
            className={cn(
              'rounded-[24px] border border-black/10 bg-white/72 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.26)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_60px_-36px_rgba(0,0,0,0.84)]',
              compact ? 'p-3' : 'p-5',
            )}
          >
            <div className={cn('flex items-start justify-between gap-3', compact ? 'mb-2' : 'mb-3')}>
              <div className="min-w-0">
                {showCircleName && (
                  <Link
                    to={getCirclePath(request.circleId)}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4"
                  >
                    {request.circleName}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
                <p className={cn('font-semibold', compact ? 'mt-1 text-sm' : 'mt-1 text-lg')}>
                  {formatAddress(request.applicantAddress)}
                </p>
                <div className="mt-2">
                  <CopyButton value={request.applicantAddress} successMessage="Address copied" showLabel label="Copy address" />
                </div>
              </div>

              <div className={cn('rounded-full border border-black/10 bg-white/72 dark:border-white/10 dark:bg-white/8', compact ? 'px-2 py-1' : 'px-3 py-2')}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                    {formatAmount(request.collateralRequired)}
                  </span>
                </div>
              </div>
            </div>

            <div className={cn('rounded-[20px] border border-black/10 bg-black/[0.03] dark:bg-white/6', compact ? 'p-3' : 'p-4')}>
              <div className="mb-2 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-[#FF6B6B]" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Join note</p>
              </div>
              <p className={cn('leading-relaxed text-foreground/80', compact ? 'text-sm' : 'text-[15px]')}>
                {request.message || 'No message was attached to this request.'}
              </p>
            </div>

            {(onApprove || onReject) && (
              <div className={cn('mt-3 flex gap-3', compact ? 'flex-col' : 'flex-wrap')}>
                {onApprove && (
                  <Button
                    type="button"
                    onClick={() => void onApprove(request)}
                    disabled={isActing}
                    className={cn(
                      'bg-[#b9f480] text-[#11180b] hover:bg-[#c6f78f]',
                      compact ? 'h-10 w-full justify-center text-sm' : 'px-5',
                    )}
                  >
                    {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Accept
                  </Button>
                )}

                {onReject && (
                  <Button
                    type="button"
                    onClick={() => void onReject(request)}
                    disabled={isActing}
                    variant="outline"
                    className={cn(
                      'font-semibold',
                      compact ? 'h-10 w-full justify-center text-sm' : 'px-5',
                    )}
                  >
                    {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                    Reject
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
