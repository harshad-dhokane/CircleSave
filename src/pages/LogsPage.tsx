import { useMemo, useState } from 'react';
import {
  Blocks,
  ExternalLink,
  FileBadge2,
  RefreshCcw,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { formatAddress, getVoyagerContractUrl, CONTRACTS } from '@/lib/constants';
import { type OnchainActivityEntry, useOnchainActivityFeed } from '@/hooks/useOnchainActivityFeed';
import { getStarkZapLogAmountText, type StarkZapLogEntry } from '@/lib/starkzapLogs';

const CATEGORY_META = {
  factory: { color: '#FFB457', icon: Blocks, label: 'Factory' },
  circle: { color: '#7AE7C7', icon: Users, label: 'Circle' },
  reputation: { color: '#FFE66D', icon: Trophy, label: 'Reputation' },
  collateral: { color: '#7CC8FF', icon: Shield, label: 'Collateral' },
  starkzap: { color: '#B5F36B', icon: FileBadge2, label: 'StarkZap' },
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

function mapSharedStarkZapEntry(entry: StarkZapLogEntry): LogsFeedEntry {
  const amountLabel = getStarkZapLogAmountText(entry);

  return {
    id: entry.id,
    category: 'starkzap',
    title: entry.title,
    valueText: amountLabel || entry.provider,
    valueDetail: entry.executionMode === 'sponsored' ? 'Sponsored execution' : 'User pays',
    eventLabel: `${entry.kind.toUpperCase()} · ${entry.provider}`,
    tone: entry.status === 'failed' ? 'warning' : 'highlight',
    updatedLabel: new Date(entry.updatedAt).toLocaleString(),
    updatedAtSort: new Date(entry.updatedAt).getTime(),
    actor: entry.account,
    sourceLabel: 'StarkZap Registry',
    sourceAddress: CONTRACTS.STARKZAP_ACTIVITY_REGISTRY,
    sourceUrl: CONTRACTS.STARKZAP_ACTIVITY_REGISTRY !== '0x0'
      ? getVoyagerContractUrl(CONTRACTS.STARKZAP_ACTIVITY_REGISTRY)
      : null,
    summary: entry.summary,
    explorerUrl: entry.explorerUrl,
    blockNumber: entry.blockNumber ?? null,
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
  const {
    error: starkZapError,
    hasConfiguredRegistry,
    lastUpdatedAt: starkZapLastUpdatedAt,
    logs: starkZapLogs,
    refresh: refreshStarkZapLogs,
  } = useStarkZapLogs();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedEntry, setSelectedEntry] = useState<LogsFeedEntry | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const feedEntries = useMemo(
    () => [...entries.map(mapContractEntry), ...starkZapLogs.map(mapSharedStarkZapEntry)]
      .sort((left, right) => right.updatedAtSort - left.updatedAtSort),
    [entries, starkZapLogs],
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
    starkzap: feedEntries.filter((entry) => entry.category === 'starkzap').length,
  }), [feedEntries]);
  const combinedError = error || starkZapError;
  const hasAnySource = hasConfiguredContracts || hasConfiguredRegistry;
  const syncedAt = Math.max(lastUpdatedAt || 0, starkZapLastUpdatedAt || 0) || null;

  const handleRefresh = async () => {
    try {
      setManualRefreshing(true);
      await Promise.all([refresh(), refreshStarkZapLogs()]);
    } finally {
      setManualRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total records', value: stats.total, bg: 'bg-[#B5F36B]', border: 'border-[#9ad255]/30' },
          { label: 'Circle events', value: stats.circles, bg: 'bg-[#FFB457]', border: 'border-[#e09938]/30' },
          { label: 'Factory events', value: stats.factory, bg: 'bg-[#A48DFF]', border: 'border-[#8a6fe0]/30' },
          { label: 'Reputation + collateral', value: stats.reputation + stats.collateral, bg: 'bg-[#7AE7C7]', border: 'border-[#5cc5a1]/30' },
          { label: 'StarkZap actions', value: stats.starkzap, bg: 'bg-[#7CC8FF]', border: 'border-[#66b8ef]/30' },
        ].map((item) => (
          <div key={item.label} className={`rounded-[18px] border px-4 py-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)] ${item.bg} ${item.border}`}>
            <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-950/70">
              {item.label}
            </p>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="neo-panel p-4 md:p-5">
        <div className="mb-5 space-y-4">
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

          <div className="flex flex-wrap items-center gap-2">
            {syncedAt ? (
              <div className="neo-chip whitespace-nowrap px-2.5 py-1 tracking-[0.14em]">
                Synced {new Date(syncedAt).toLocaleTimeString()}
              </div>
            ) : null}
            <Button
              variant="sky"
              size="sm"
              onClick={() => void handleRefresh()}
              disabled={manualRefreshing}
              className="px-2.5"
            >
              <RefreshCcw className={`h-4 w-4 ${manualRefreshing ? 'animate-spin' : ''}`} />
              {manualRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {([
              ['all', 'All'],
              ['circle', 'Circle'],
              ['factory', 'Factory'],
              ['reputation', 'Reputation'],
              ['collateral', 'Collateral'],
              ['starkzap', 'StarkZap'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategoryFilter(value)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                  categoryFilter === value
                    ? 'border-[#66b8ef]/35 bg-[#7CC8FF] text-slate-950'
                    : 'border-black/10 bg-black/[0.03] text-foreground/82 hover:bg-black/[0.045] hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/82 dark:hover:bg-white/8 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {combinedError ? (
          <div className="mb-4 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-700 dark:text-rose-100">
            {combinedError}
          </div>
        ) : null}

        {!hasAnySource ? (
          <div className="rounded-[24px] border border-dashed border-black/10 px-4 py-12 text-center text-sm text-muted-foreground dark:border-white/10">
            No shared activity sources are configured yet.
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
                        {selectedEntry.category === 'starkzap'
                          ? `${selectedMeta.label} registry event`
                          : `${selectedMeta.label} contract event`}
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
                <Button variant="sky" asChild>
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
