import { useMemo, useState } from 'react';
import {
  Blocks,
  ExternalLink,
  RefreshCcw,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatAddress } from '@/lib/constants';
import { type OnchainActivityEntry, useOnchainActivityFeed } from '@/hooks/useOnchainActivityFeed';

const CATEGORY_META = {
  factory: { color: '#FFB457', icon: Blocks, label: 'Factory' },
  circle: { color: '#7AE7C7', icon: Users, label: 'Circle' },
  reputation: { color: '#FFE66D', icon: Trophy, label: 'Reputation' },
  collateral: { color: '#7CC8FF', icon: Shield, label: 'Collateral' },
} as const;

type FeedCategory = keyof typeof CATEGORY_META;
type CategoryFilter = 'all' | FeedCategory;

type LogsFeedEntry = {
  id: string;
  category: FeedCategory;
  title: string;
  valueText: string | null;
  valueDetail?: string | null;
  eventLabel: string;
  tone: OnchainActivityEntry['tone'];
  updatedLabel: string;
  updatedAtSort: number;
  actor?: string;
  sourceLabel: string;
  sourceAddress?: string | null;
  sourceUrl?: string | null;
  summary: string;
  explorerUrl: string;
  blockNumber: number | null;
};

function getToneClasses(tone: OnchainActivityEntry['tone']) {
  switch (tone) {
    case 'warning':
      return 'bg-rose-500/12 text-rose-700 dark:bg-rose-500/14 dark:text-rose-300';
    case 'highlight':
      return 'bg-amber-500/14 text-amber-800 dark:text-amber-300';
    case 'neutral':
      return 'bg-black/[0.06] text-foreground dark:bg-white/10 dark:text-white';
    default:
      return 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/14 dark:text-emerald-300';
  }
}

function mapContractEntry(entry: OnchainActivityEntry): LogsFeedEntry {
  return {
    id: entry.id,
    category: entry.category,
    title: entry.title,
    valueText: entry.circleName || entry.valueText || 'Protocol event',
    valueDetail: entry.circleName && entry.valueText ? entry.valueText : null,
    eventLabel: entry.eventName,
    tone: entry.tone,
    updatedLabel: entry.timeLabel,
    updatedAtSort: entry.occurredAt ?? entry.sortValue,
    actor: entry.actor,
    sourceLabel: entry.sourceLabel,
    sourceAddress: entry.sourceAddress,
    sourceUrl: entry.contractUrl,
    summary: entry.summary,
    explorerUrl: entry.explorerUrl,
    blockNumber: entry.blockNumber,
  };
}

export function LogsPage() {
  const {
    entries,
    error,
    hasConfiguredContracts,
    isLoading,
    lastUpdatedAt,
    refresh,
  } = useOnchainActivityFeed();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedEntry, setSelectedEntry] = useState<LogsFeedEntry | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const feedEntries = useMemo(
    () => entries.map(mapContractEntry).sort((left, right) => right.updatedAtSort - left.updatedAtSort),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    if (categoryFilter === 'all') {
      return feedEntries;
    }

    return feedEntries.filter((entry) => entry.category === categoryFilter);
  }, [feedEntries, categoryFilter]);

  const visibleEntries = filteredEntries.slice(0, 12);
  const selectedMeta = selectedEntry ? CATEGORY_META[selectedEntry.category] : null;
  const SelectedIcon = selectedMeta?.icon;
  const stats = useMemo(() => ({
    total: feedEntries.length,
    circles: feedEntries.filter((entry) => entry.category === 'circle').length,
    factory: feedEntries.filter((entry) => entry.category === 'factory').length,
    reputation: feedEntries.filter((entry) => entry.category === 'reputation').length,
    collateral: feedEntries.filter((entry) => entry.category === 'collateral').length,
  }), [feedEntries]);

  const handleRefresh = async () => {
    try {
      setManualRefreshing(true);
      await refresh();
    } finally {
      setManualRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total records', value: stats.total },
          { label: 'Circle events', value: stats.circles },
          { label: 'Factory events', value: stats.factory },
          { label: 'Reputation + collateral', value: stats.reputation + stats.collateral },
        ].map((item) => (
          <div key={item.label} className="neo-panel p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="neo-panel p-4 md:p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Feed
            </p>
            <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
              Latest 12 on-chain records
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Shared contract activity fetched live from CircleSave contracts, so every user sees the same feed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {lastUpdatedAt ? (
              <div className="neo-chip">
                Synced {new Date(lastUpdatedAt).toLocaleTimeString()}
              </div>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={manualRefreshing}>
              <RefreshCcw className={`h-4 w-4 ${manualRefreshing ? 'animate-spin' : ''}`} />
              {manualRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {([
              ['all', 'All'],
              ['circle', 'Circle'],
              ['factory', 'Factory'],
              ['reputation', 'Reputation'],
              ['collateral', 'Collateral'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategoryFilter(value)}
                className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  categoryFilter === value
                    ? 'border-[#9ad255]/35 bg-[#B5F36B] text-slate-950'
                    : 'border-black/10 bg-black/[0.03] text-muted-foreground hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-700 dark:text-rose-100">
            {error}
          </div>
        ) : null}

        {!hasConfiguredContracts ? (
          <div className="rounded-[24px] border border-dashed border-black/10 px-4 py-12 text-center text-sm text-muted-foreground dark:border-white/10">
            No contract activity sources are configured yet.
          </div>
        ) : isLoading && feedEntries.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-black/10 px-4 py-12 text-center text-sm text-muted-foreground dark:border-white/10">
            Loading activity feed...
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-black/10 px-4 py-12 text-center text-sm text-muted-foreground dark:border-white/10">
            No records match the current view.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEntries.map((entry) => {
              const meta = CATEGORY_META[entry.category];
              const Icon = meta.icon;

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedEntry(entry)}
                  className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-black/10 bg-black/[0.03] px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: `${meta.color}24`, color: meta.color }}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{entry.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getToneClasses(entry.tone)}`}>
                          {entry.eventLabel}
                        </span>
                      </div>
                      <p className="truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {meta.label} • {entry.actor ? formatAddress(entry.actor) : entry.sourceLabel}
                      </p>
                    </div>
                  </div>

                  <div className="hidden min-w-0 text-right md:block">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {entry.valueText || 'Protocol event'}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{entry.updatedLabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-h-[85svh] overflow-y-auto border border-black/10 bg-white/92 p-0 shadow-[0_32px_80px_-38px_rgba(15,23,42,0.48)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b0f15] dark:shadow-[0_34px_90px_-40px_rgba(0,0,0,0.92)] sm:max-w-2xl">
          {selectedEntry && selectedMeta && SelectedIcon ? (
            <div className="p-6">
              <DialogHeader className="border-b border-black/10 pb-5 text-left dark:border-white/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: `${selectedMeta.color}22`, color: selectedMeta.color }}
                    >
                      <SelectedIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle>{selectedEntry.title}</DialogTitle>
                      <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                        {selectedMeta.label} contract event
                      </DialogDescription>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getToneClasses(selectedEntry.tone)}`}>
                    {selectedEntry.eventLabel}
                  </span>
                </div>
              </DialogHeader>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Value
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {selectedEntry.valueText || 'Protocol event'}
                  </p>
                  {selectedEntry.valueDetail ? (
                    <p className="mt-2 text-sm text-muted-foreground">{selectedEntry.valueDetail}</p>
                  ) : null}
                </div>
                <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Updated
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">{selectedEntry.updatedLabel}</p>
                  {selectedEntry.blockNumber !== null ? (
                    <p className="mt-2 text-sm text-muted-foreground">Block #{selectedEntry.blockNumber}</p>
                  ) : null}
                </div>
                <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Actor
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selectedEntry.actor ? formatAddress(selectedEntry.actor) : 'Protocol'}
                    </p>
                    {selectedEntry.actor ? (
                      <CopyButton value={selectedEntry.actor} successMessage="Address copied" />
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Source
                  </p>
                  {selectedEntry.sourceUrl ? (
                    <a
                      href={selectedEntry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                    >
                      {selectedEntry.sourceLabel}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-foreground">{selectedEntry.sourceLabel}</p>
                  )}
                  {selectedEntry.sourceAddress ? (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-muted-foreground">{formatAddress(selectedEntry.sourceAddress)}</p>
                      <CopyButton value={selectedEntry.sourceAddress} successMessage="Address copied" />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Summary
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground">{selectedEntry.summary}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <a
                    href={selectedEntry.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open on Voyager
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="secondary" onClick={() => setSelectedEntry(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
