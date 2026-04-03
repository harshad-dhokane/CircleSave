import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Circle } from '@/types';
import { Button } from '@/components/ui/button';
import { getCircleSpotsLeft, isCircleReadyToStart } from '@/lib/circleState';
import {
  formatAddress,
  formatAmountShort,
  getCategoryColor,
  getCategoryLabel,
  getCircleTypeLabel,
} from '@/lib/constants';
import { getCirclePath } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface CircleCardProps {
  circle: Circle;
  variant?: 'default' | 'compact';
  onSelect?: (circle: Circle) => void;
  viewerRole?: 'owner' | 'joined' | null;
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
    case 'COMPLETED':
      return 'bg-sky-500/12 text-sky-700 dark:text-sky-300';
    case 'FAILED':
      return 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
    default:
      return 'bg-amber-500/12 text-amber-700 dark:text-amber-300';
  }
}

function getAvailabilityMeta(circle: Circle, readyToStart: boolean, spotsLeft: number) {
  if (circle.status === 'ACTIVE') {
    return {
      label: 'In progress',
      classes: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
    };
  }

  if (circle.status === 'COMPLETED') {
    return {
      label: 'Completed',
      classes: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    };
  }

  if (circle.status === 'FAILED') {
    return {
      label: 'Needs review',
      classes: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    };
  }

  if (readyToStart) {
    return {
      label: 'Ready to launch',
      classes: 'bg-[#B5F36B]/16 text-foreground',
    };
  }

  if (spotsLeft === 0) {
    return {
      label: 'Filled',
      classes: 'bg-white/10 text-foreground',
    };
  }

  if (spotsLeft <= 2) {
    return {
      label: `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`,
      classes: 'bg-[#FFB457]/16 text-foreground',
    };
  }

  return {
    label: `${spotsLeft} spots open`,
    classes: 'bg-white/10 text-muted-foreground',
  };
}

export function CircleCard({ circle, variant = 'default', onSelect, viewerRole = null }: CircleCardProps) {
  const spotsLeft = getCircleSpotsLeft(circle);
  const readyToStart = isCircleReadyToStart(circle);
  const collateralAmount = (circle.monthlyAmount * BigInt(circle.collateralRatio)) / 100n;
  const categoryColor = getCategoryColor(circle.category);
  const categoryLabel = getCategoryLabel(circle.category);
  const circleTypeLabel = getCircleTypeLabel(circle.circleType);
  const availability = getAvailabilityMeta(circle, readyToStart, spotsLeft);
  const isCompact = variant === 'compact';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(circle);
    }
  };

  const cardBody = (
    <>
      <div className="min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2.5">
          <span
            className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
          >
            {categoryLabel}
          </span>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {circleTypeLabel}
          </span>
        </div>
        <div className="flex min-h-[26px] flex-wrap items-center gap-2">
          {viewerRole === 'owner' ? (
            <span className="inline-flex whitespace-nowrap rounded-full border border-[#9ad255]/35 bg-[#B5F36B] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-950 shadow-[0_12px_24px_-18px_rgba(120,170,43,0.4)]">
              You Own
            </span>
          ) : null}
          {viewerRole === 'joined' ? (
            <span className="inline-flex whitespace-nowrap rounded-full bg-[#7CC8FF]/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
              Joined
            </span>
          ) : null}
          <span
            className={cn(
              'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
              getStatusClasses(circle.status),
            )}
          >
            {circle.status}
          </span>
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <h3
          className={cn(
            'truncate font-display font-semibold tracking-[-0.04em] text-foreground',
            isCompact ? 'text-[1.05rem]' : 'text-[1.2rem]',
          )}
        >
          {circle.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>{viewerRole === 'owner' ? 'Owner: You' : `Owner ${formatAddress(circle.creator)}`}</span>
          <span className="h-1 w-1 rounded-full bg-current/50" />
          <span>{circle.currentMembers}/{circle.maxMembers} members</span>
        </div>
        {!isCompact && circle.description ? (
          <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
            {circle.description}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          'mt-3 grid overflow-hidden rounded-[16px] border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5',
          isCompact ? 'grid-cols-2' : 'grid-cols-3',
        )}
      >
        {[
          { label: 'Monthly', value: formatAmountShort(circle.monthlyAmount) },
          { label: 'Members', value: `${circle.currentMembers}/${circle.maxMembers}` },
          ...(!isCompact ? [{ label: 'Collateral', value: formatAmountShort(collateralAmount) }] : []),
        ].map((item, index) => (
          <div
            key={item.label}
            className={cn(
              'min-w-0 px-3 py-2.5',
              index > 0 && 'border-l border-black/10 dark:border-white/10',
            )}
          >
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
            availability.classes,
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {availability.label}
        </span>

        {onSelect ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            View
            <ArrowRight className="h-4 w-4" />
          </span>
        ) : (
          <Button asChild size="sm" variant="secondary">
            <Link to={getCirclePath(circle.id)}>
              Open
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </>
  );

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(circle) : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      className={cn(
        'group flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-black/10 bg-black/[0.03] shadow-[0_20px_52px_-36px_rgba(15,23,42,0.3)] backdrop-blur-xl transition duration-200 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_64px_-40px_rgba(0,0,0,0.8)]',
        isCompact ? 'p-3.5' : 'p-4',
        onSelect
          ? 'cursor-pointer text-left hover:-translate-y-0.5 hover:border-[#B5F36B]/18 hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5F36B]/60 dark:hover:bg-white/8'
          : 'hover:-translate-y-0.5 hover:border-[#B5F36B]/18 hover:bg-black/[0.05] dark:hover:bg-white/8',
      )}
    >
      {cardBody}
    </div>
  );
}
