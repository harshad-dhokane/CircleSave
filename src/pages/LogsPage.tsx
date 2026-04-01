import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Blocks,
  ExternalLink,
  FileText,
  MoveRight,
  PiggyBank,
  RefreshCcw,
  Repeat,
  Shield,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAddress } from '@/lib/constants';
import { type OnchainActivityEntry, useOnchainActivityFeed } from '@/hooks/useOnchainActivityFeed';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { getStarkZapLogAmountText, getStarkZapLogDetails, type StarkZapLogEntry } from '@/lib/starkzapLogs';

const CATEGORY_META = {
  factory: { color: '#FF6B6B', icon: Blocks, label: 'Factory' },
  circle: { color: '#4ECDC4', icon: Users, label: 'Circle' },
  reputation: { color: '#FFE66D', icon: Trophy, label: 'Reputation' },
  collateral: { color: '#96CEB4', icon: Shield, label: 'Collateral' },
  swap: { color: '#DDA0DD', icon: ArrowRightLeft, label: 'Swap' },
  dca: { color: '#FFE66D', icon: Repeat, label: 'DCA' },
  lending: { color: '#96CEB4', icon: PiggyBank, label: 'Lending' },
} as const;

type FeedCategory = keyof typeof CATEGORY_META;

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
  mode: 'contract' | 'wallet';
};

function getToneClasses(tone: OnchainActivityEntry['tone']) {
  switch (tone) {
    case 'warning':
      return 'bg-[#FF6B6B] text-white';
    case 'highlight':
      return 'bg-[#FFE66D] text-black';
    case 'neutral':
      return 'bg-white text-black';
    default:
      return 'bg-[#96CEB4] text-black';
  }
}

function getWalletLogTone(status: StarkZapLogEntry['status']): OnchainActivityEntry['tone'] {
  if (status === 'failed') return 'warning';
  if (status === 'submitted') return 'neutral';
  return 'success';
}

function getWalletLogEventLabel(status: StarkZapLogEntry['status']) {
  if (status === 'failed') return 'Failed';
  if (status === 'submitted') return 'Submitted';
  return 'Confirmed';
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
    mode: 'contract',
  };
}

function mapWalletLog(entry: StarkZapLogEntry): LogsFeedEntry {
  const details = getStarkZapLogDetails(entry);
  const valueText = getStarkZapLogAmountText(entry) || entry.summary;
  const valueDetail = entry.kind === 'swap' && details?.outputAmount && details?.outputToken
    ? `${details.outputAmount} ${details.outputToken} received`
    : entry.kind === 'dca' && details?.outputToken
      ? `Buying ${details.outputToken}`
      : null;

  return {
    id: `wallet:${entry.id}`,
    category: entry.kind,
    title: entry.title,
    valueText,
    valueDetail,
    eventLabel: getWalletLogEventLabel(entry.status),
    tone: getWalletLogTone(entry.status),
    updatedLabel: new Date(entry.updatedAt).toLocaleString(),
    updatedAtSort: new Date(entry.updatedAt).getTime(),
    actor: entry.account,
    sourceLabel: entry.provider ? entry.provider.toUpperCase() : 'StarkZap',
    sourceAddress: null,
    sourceUrl: null,
    summary: entry.summary,
    explorerUrl: entry.explorerUrl,
    blockNumber: null,
    mode: 'wallet',
  };
}

function addTokenAmount(bucket: Map<string, number>, amountText?: string | null) {
  if (!amountText) return;

  const match = amountText.trim().match(/^(-?\d+(?:\.\d+)?)\s+([A-Z0-9]+)$/i);
  if (!match) return;

  const amount = Number.parseFloat(match[1]);
  const token = match[2].toUpperCase();

  if (!Number.isFinite(amount)) return;

  bucket.set(token, (bucket.get(token) || 0) + amount);
}

function formatTokenTotals(bucket: Map<string, number>) {
  const items = [...bucket.entries()]
    .filter(([, amount]) => Number.isFinite(amount) && amount !== 0)
    .sort((left, right) => right[1] - left[1]);

  if (items.length === 0) {
    return '0';
  }

  return items
    .map(([token, amount]) => `${amount.toLocaleString(undefined, { maximumFractionDigits: amount >= 100 ? 2 : 4 })} ${token}`)
    .join(' • ');
}

export function LogsPage() {
  const { entries, error, hasConfiguredContracts, isLoading, lastUpdatedAt, refresh } = useOnchainActivityFeed();
  const { logs } = useStarkZapLogs();
  const [selectedEntry, setSelectedEntry] = useState<LogsFeedEntry | null>(null);

  const nonFailedWalletLogs = useMemo(
    () => logs.filter((entry) => entry.status !== 'failed'),
    [logs],
  );

  const feedEntries = useMemo(() => {
    const contractEntries = entries.map(mapContractEntry);
    const walletEntries = logs.map(mapWalletLog);

    return [...walletEntries, ...contractEntries].sort((left, right) => right.updatedAtSort - left.updatedAtSort);
  }, [entries, logs]);

  const counts = useMemo(() => ({
    total: feedEntries.length,
    circle: feedEntries.filter((entry) => entry.category === 'factory' || entry.category === 'circle').length,
    reputation: feedEntries.filter((entry) => entry.category === 'reputation').length,
    swap: feedEntries.filter((entry) => entry.category === 'swap').length,
    dca: feedEntries.filter((entry) => entry.category === 'dca').length,
    lending: feedEntries.filter((entry) => entry.category === 'lending').length,
  }), [feedEntries]);

  const totals = useMemo(() => {
    const circleContributions = new Map<string, number>();
    const collateralLocked = new Map<string, number>();
    const swapVolume = new Map<string, number>();
    const dcaBudget = new Map<string, number>();
    const lendingVolume = new Map<string, number>();

    entries.forEach((entry) => {
      if (entry.eventName === 'ContributionMade') {
        addTokenAmount(circleContributions, entry.valueText);
      }

      if (entry.category === 'collateral' && entry.eventName === 'CollateralLocked') {
        addTokenAmount(collateralLocked, entry.valueText);
      }
    });

    nonFailedWalletLogs.forEach((entry) => {
      const details = getStarkZapLogDetails(entry);

      if (entry.kind === 'swap') {
        addTokenAmount(swapVolume, details?.inputAmount && details?.inputToken ? `${details.inputAmount} ${details.inputToken}` : null);
      }

      if (entry.kind === 'dca') {
        addTokenAmount(dcaBudget, details?.totalAmount && details?.totalToken ? `${details.totalAmount} ${details.totalToken}` : null);
      }

      if (entry.kind === 'lending') {
        addTokenAmount(lendingVolume, details?.inputAmount && details?.inputToken ? `${details.inputAmount} ${details.inputToken}` : null);
      }
    });

    return {
      circleContributions: formatTokenTotals(circleContributions),
      collateralLocked: formatTokenTotals(collateralLocked),
      swapVolume: formatTokenTotals(swapVolume),
      dcaBudget: formatTokenTotals(dcaBudget),
      lendingVolume: formatTokenTotals(lendingVolume),
    };
  }, [entries, nonFailedWalletLogs]);

  const selectedMeta = selectedEntry ? CATEGORY_META[selectedEntry.category] : null;
  const SelectedIcon = selectedMeta?.icon;
  const showTable = feedEntries.length > 0 || isLoading;
  const showEmpty = !isLoading && feedEntries.length === 0;

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <div className="content-divider-bottom border-b-[2px] border-black bg-white">
        <div className="page-shell py-8 md:py-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#DDA0DD] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <FileText className="h-4 w-4" />
                Unified Activity Feed
              </div>
              <h1 className="mb-2 text-4xl font-black md:text-5xl">Logs</h1>
              <p className="max-w-4xl text-[15px] leading-relaxed text-black/70 md:text-base">
                One place for badge, circle, collateral, swap, DCA, lending, borrow, repay, and withdraw activity.
                CircleSave contract events are public, and StarkZap wallet actions saved in this browser are merged into the same feed.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {lastUpdatedAt ? (
                <div className="inline-flex items-center gap-2 border-[2px] border-black bg-[#FEFAE0] px-4 py-2 text-sm font-black">
                  Synced {new Date(lastUpdatedAt).toLocaleTimeString()}
                </div>
              ) : null}
              <Button variant="outline" onClick={refresh} className="border-[2px] border-black">
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell space-y-6 py-8 md:py-10">
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: 'Total Records', value: counts.total, color: '#DDA0DD' },
            { label: 'Circle Events', value: counts.circle, color: '#4ECDC4' },
            { label: 'Reputation', value: counts.reputation, color: '#FFE66D' },
            { label: 'Swap Actions', value: counts.swap, color: '#DDA0DD' },
            { label: 'DCA Orders', value: counts.dca, color: '#FFE66D' },
            { label: 'Lending Actions', value: counts.lending, color: '#96CEB4' },
          ].map((item) => (
            <div key={item.label} className="border-[2px] border-black bg-white p-5">
              <div className="mb-3 h-2 w-16 border-[2px] border-black" style={{ backgroundColor: item.color }} />
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-black/60">{item.label}</p>
              <p className="mt-2 text-3xl font-black">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Circle Contributions', value: totals.circleContributions, color: '#4ECDC4' },
            { label: 'Collateral Locked', value: totals.collateralLocked, color: '#96CEB4' },
            { label: 'Swap Volume', value: totals.swapVolume, color: '#DDA0DD' },
            { label: 'DCA Budgeted', value: totals.dcaBudget, color: '#FFE66D' },
            { label: 'Lending Volume', value: totals.lendingVolume, color: '#96CEB4' },
          ].map((item) => (
            <div key={item.label} className="border-[2px] border-black bg-[#FEFAE0] p-5 min-w-0">
              <div className="mb-3 h-2 w-16 border-[2px] border-black" style={{ backgroundColor: item.color }} />
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-black/60">{item.label}</p>
              <p className="text-wrap-safe mt-2 text-xl font-black">{item.value}</p>
            </div>
          ))}
        </section>

        {error ? (
          <section className="neo-card p-8">
            <h2 className="text-2xl font-black">Contract feed is delayed right now</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/70">
              {error} Any StarkZap wallet actions already saved in this browser can still appear below.
            </p>
            <Button onClick={refresh} className="mt-5 neo-button-primary">
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          </section>
        ) : null}

        {!hasConfiguredContracts && logs.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-black bg-[#FEFAE0]">
              <FileText className="h-9 w-9" />
            </div>
            <h2 className="mb-3 text-3xl font-black">No Activity Sources Yet</h2>
            <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-black/70">
              Add the deployed CircleSave contract addresses or submit swap, DCA, and lending actions from this browser to start populating the unified logs feed.
            </p>
          </div>
        ) : null}

        {showTable ? (
          <section className="neo-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader className="bg-black [&_tr]:border-black">
                  <TableRow className="border-black hover:bg-black">
                    <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Event</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Value</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Type</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Source</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Updated</TableHead>
                    <TableHead className="px-4 py-4 text-right text-xs font-black uppercase tracking-[0.08em] text-white">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && feedEntries.length === 0 ? (
                    <TableRow className="border-black bg-white">
                      <TableCell colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-black/65">
                        Loading unified activity feed...
                      </TableCell>
                    </TableRow>
                  ) : (
                    feedEntries.map((entry) => {
                      const meta = CATEGORY_META[entry.category];
                      const Icon = meta.icon;

                      return (
                        <TableRow
                          key={entry.id}
                          tabIndex={0}
                          role="button"
                          onClick={() => setSelectedEntry(entry)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedEntry(entry);
                            }
                          }}
                          className="cursor-pointer border-black bg-white transition-colors hover:bg-[#FEFAE0] focus-visible:bg-[#FEFAE0] focus-visible:outline-none"
                        >
                          <TableCell className="px-4 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center border-[2px] border-black"
                                style={{ backgroundColor: meta.color }}
                              >
                                <Icon className="h-4 w-4 text-black" />
                              </div>
                              <div>
                                <p className="font-black">{entry.title}</p>
                                <p className="text-xs uppercase tracking-[0.08em] text-black/50">
                                  {meta.label} • {entry.actor ? formatAddress(entry.actor) : 'Protocol'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top text-sm font-black text-black/80">
                            {entry.valueText || 'Protocol event'}
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top">
                            <span className={`inline-flex border-[2px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${getToneClasses(entry.tone)}`}>
                              {entry.eventLabel}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top text-sm font-bold text-black/65">
                            {entry.sourceLabel}
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top text-sm text-black/65">
                            {entry.updatedLabel}
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top text-right">
                            <span className="inline-flex items-center gap-2 text-sm font-black text-black/70">
                              Details
                              <MoveRight className="h-4 w-4" />
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        {showEmpty ? (
          <div className="neo-card p-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-black bg-[#FEFAE0]">
              <FileText className="h-9 w-9" />
            </div>
            <h2 className="mb-3 text-3xl font-black">No Activity Yet</h2>
            <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-black/70">
              Once badge, circle, swap, DCA, lending, or collateral actions are available, they will appear here in one unified feed.
            </p>
          </div>
        ) : null}
      </div>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[85svh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto border-[3px] border-black bg-white p-0 shadow-[8px_8px_0px_0px_#1a1a1a]"
        >
          {selectedEntry && selectedMeta && SelectedIcon ? (
            <div className="p-6 md:p-7">
              <div className="mb-5 flex items-center justify-end">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center border-[2px] border-black bg-white shadow-[2px_2px_0px_0px_#1a1a1a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1a1a1a]"
                    aria-label="Close log details"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </DialogClose>
              </div>

              <DialogHeader className="border-b-[2px] border-black pb-5 text-left">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center border-[2px] border-black"
                      style={{ backgroundColor: selectedMeta.color }}
                    >
                      <SelectedIcon className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <DialogTitle>{selectedEntry.title}</DialogTitle>
                      <DialogDescription className="mt-2 text-sm leading-relaxed text-black/65">
                        {selectedMeta.label} {selectedEntry.mode === 'wallet' ? 'wallet action' : 'contract event'}
                        {selectedEntry.actor ? ` for ${formatAddress(selectedEntry.actor)}` : ''}.
                      </DialogDescription>
                    </div>
                  </div>

                  <span className={`inline-flex w-fit border-[2px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${getToneClasses(selectedEntry.tone)}`}>
                    {selectedEntry.eventLabel}
                  </span>
                </div>
              </DialogHeader>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Value</p>
                  <p className="text-wrap-safe mt-2 text-2xl font-black">
                    {selectedEntry.valueText || 'Protocol event'}
                  </p>
                  {selectedEntry.valueDetail ? (
                    <p className="mt-2 text-sm text-black/60">{selectedEntry.valueDetail}</p>
                  ) : null}
                </div>

                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Updated</p>
                  <p className="mt-2 text-lg font-black">{selectedEntry.updatedLabel}</p>
                  {selectedEntry.blockNumber !== null ? (
                    <p className="mt-2 text-sm text-black/60">Block #{selectedEntry.blockNumber}</p>
                  ) : null}
                </div>

                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Actor</p>
                  <p className="text-wrap-safe mt-2 font-mono text-sm text-black/75">
                    {selectedEntry.actor || 'Protocol'}
                  </p>
                </div>

                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Source</p>
                  {selectedEntry.sourceUrl ? (
                    <a
                      href={selectedEntry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-black underline underline-offset-4"
                    >
                      {selectedEntry.sourceLabel}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="mt-2 text-lg font-black">{selectedEntry.sourceLabel}</p>
                  )}
                  {selectedEntry.sourceAddress ? (
                    <p className="text-wrap-safe mt-2 font-mono text-xs text-black/60">{selectedEntry.sourceAddress}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Summary</p>
                <p className="mt-3 text-[15px] leading-relaxed text-black/80">{selectedEntry.summary}</p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <a
                  href={selectedEntry.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-[2px] border-black bg-[#FEFAE0] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] shadow-[3px_3px_0px_0px_#1a1a1a] transition-transform hover:-translate-y-0.5"
                >
                  Open on Voyager
                  <ExternalLink className="h-4 w-4" />
                </a>

                <Button
                  type="button"
                  variant="outline"
                  className="border-[2px] border-black"
                  onClick={() => setSelectedEntry(null)}
                >
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
