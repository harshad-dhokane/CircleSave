import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft,
  Blocks,
  FileText,
  PiggyBank,
  Plus,
  Repeat,
  Users,
  Wallet,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useIncomingCircleRequests, useUserCircles } from '@/hooks/useCircle';
import { useReputation } from '@/hooks/useReputation';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { useWallet } from '@/hooks/useWallet';
import { isCircleReadyToStart } from '@/lib/circleState';
import { formatAddress, formatAmountShort } from '@/lib/constants';
import { getCirclePath } from '@/lib/routes';
import { getStarkZapLogAmountText } from '@/lib/starkzapLogs';

const MODULE_META = [
  { key: 'swap', label: 'Swap', icon: ArrowRightLeft, accent: '#B5F36B', to: '/swap' },
  { key: 'batch', label: 'Batch', icon: Blocks, accent: '#FFB457', to: '/batching' },
  { key: 'dca', label: 'DCA', icon: Repeat, accent: '#A48DFF', to: '/dca' },
  { key: 'lending', label: 'Lend', icon: PiggyBank, accent: '#7AE7C7', to: '/lending' },
] as const;

const activityChartConfig = {
  circles: { label: 'Circles', color: '#B5F36B' },
  swaps: { label: 'Swaps', color: '#7CC8FF' },
} as const;

const exposureChartConfig = {
  amount: { label: 'Monthly', color: '#B5F36B' },
} as const;

function toCircleTimestamp(value: number) {
  if (!Number.isFinite(value) || value <= 0) return Date.now();
  return value > 1_000_000_000_000 ? value : value * 1000;
}

function getDayKey(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatDayLabel(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(timestamp);
}

function formatShortDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(timestamp);
}

function formatShortDateTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function truncateLabel(value: string, maxLength = 12) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function compareBigIntDesc(left: bigint, right: bigint) {
  if (left === right) return 0;
  return left > right ? -1 : 1;
}

function getStatusPill(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-sky-500/12 text-sky-700 dark:text-sky-300';
    case 'COMPLETED':
      return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
    case 'FAILED':
      return 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
    default:
      return 'bg-amber-500/12 text-amber-700 dark:text-amber-300';
  }
}

function getLogStatusPill(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';
    case 'failed':
      return 'bg-rose-500/12 text-rose-700 dark:text-rose-300';
    default:
      return 'bg-amber-500/12 text-amber-700 dark:text-amber-300';
  }
}

export function DashboardPage() {
  const {
    address,
    isConnected,
    walletNotice,
  } = useWallet();
  const { circles } = useUserCircles();
  const { logs } = useStarkZapLogs();
  const { stats } = useReputation();
  const {
    requests,
    readyToStartCircles,
    pendingCount,
    readyToStartCount,
  } = useIncomingCircleRequests({ pollMs: 30000 });

  const activeCircles = circles.filter((circle) => circle.status === 'ACTIVE');
  const readyCircles = circles.filter((circle) => isCircleReadyToStart(circle));
  const monthlyCommitted = circles.reduce((sum, circle) => sum + circle.monthlyAmount, 0n);

  const myLogs = useMemo(() => {
    if (!address) {
      return [];
    }

    return logs.filter((entry) => entry.account.toLowerCase() === address.toLowerCase());
  }, [address, logs]);

  const recentCircles = useMemo(
    () => [...circles].sort((left, right) => toCircleTimestamp(right.createdAt) - toCircleTimestamp(left.createdAt)).slice(0, 5),
    [circles],
  );

  const recentSwapLogs = useMemo(
    () => myLogs.filter((entry) => entry.kind === 'swap').slice(0, 5),
    [myLogs],
  );

  const moduleCounts = useMemo(() => {
    return MODULE_META.map((module) => ({
      ...module,
      count: myLogs.filter((entry) => entry.kind === module.key).length,
    }));
  }, [myLogs]);

  const topModule = useMemo(
    () => [...moduleCounts].sort((left, right) => right.count - left.count)[0] ?? null,
    [moduleCounts],
  );

  const activitySeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const timestamp = date.getTime();

      return {
        key: timestamp,
        label: formatDayLabel(timestamp),
        circles: 0,
        swaps: 0,
      };
    });

    const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));

    circles.forEach((circle) => {
      const key = getDayKey(toCircleTimestamp(circle.createdAt));
      const index = bucketIndex.get(key);
      if (index !== undefined) {
        buckets[index].circles += 1;
      }
    });

    myLogs.forEach((entry) => {
      const key = getDayKey(new Date(entry.updatedAt).getTime());
      const index = bucketIndex.get(key);
      if (index !== undefined && entry.kind === 'swap') {
        buckets[index].swaps += 1;
      }
    });

    return buckets;
  }, [circles, myLogs]);

  const busiestDay = useMemo(() => {
    const peak = activitySeries.reduce(
      (best, item) => {
        const total = item.circles + item.swaps;
        return total > best.total ? { label: item.label, total } : best;
      },
      { label: 'Quiet', total: 0 },
    );

    return peak.total > 0 ? peak.label : 'Quiet';
  }, [activitySeries]);

  const exposureSeries = useMemo(() => {
    return [...circles]
      .sort((left, right) => compareBigIntDesc(left.monthlyAmount, right.monthlyAmount))
      .slice(0, 5)
      .reverse()
      .map((circle) => ({
        name: truncateLabel(circle.name, 14),
        amount: Number(circle.monthlyAmount / 10n ** 18n),
      }));
  }, [circles]);

  const dashboardOpsStats = useMemo(() => [
    {
      label: 'Ready',
      value: readyToStartCount || readyCircles.length,
      detail: 'to launch',
      to: readyToStartCircles[0] ? getCirclePath(readyToStartCircles[0].circleId) : '/circles',
    },
    {
      label: 'Pending',
      value: pendingCount,
      detail: 'approvals',
      to: requests[0] ? getCirclePath(requests[0].circleId) : '/circles',
    },
    {
      label: 'Recent',
      value: recentCircles.length,
      detail: 'circles',
      to: recentCircles[0] ? getCirclePath(recentCircles[0].id) : '/circles/create',
    },
    {
      label: 'Actions',
      value: topModule?.count || 0,
      detail: topModule?.label || 'modules',
      to: topModule?.to || '/swap',
    },
  ], [pendingCount, readyCircles.length, readyToStartCircles, readyToStartCount, recentCircles, requests, topModule]);

  if (!isConnected) {
    return (
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-8 text-center md:p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <Wallet className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Connect to open the workspace
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/">Return to landing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/circles">Browse circles</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active circles', value: activeCircles.length },
            { label: 'Ready to launch', value: readyToStartCount || readyCircles.length },
            { label: 'Approval queue', value: pendingCount },
            { label: 'Monthly flow', value: formatAmountShort(monthlyCommitted) },
          ].map((item) => (
            <div key={item.label} className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </section>

      {walletNotice ? (
        <div className="rounded-[18px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-semibold">{walletNotice.title}</p>
            <p className="mt-1 text-amber-100/80">{walletNotice.description}</p>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <div className="space-y-4">
          <div className="neo-panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Activity
                </p>
                <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">
                  Circle and swap trend
                </h3>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/logs">
                  <FileText className="h-4 w-4" />
                  Logs
                </Link>
              </Button>
            </div>

            <ChartContainer config={activityChartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={activitySeries} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-circles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-circles)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-circles)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fill-swaps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-swaps)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--color-swaps)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="circles"
                  stroke="var(--color-circles)"
                  strokeWidth={2}
                  fill="url(#fill-circles)"
                />
                <Area
                  type="monotone"
                  dataKey="swaps"
                  stroke="var(--color-swaps)"
                  strokeWidth={2}
                  fill="url(#fill-swaps)"
                />
              </AreaChart>
            </ChartContainer>

            <div className="mt-4 grid gap-3 border-t border-black/8 pt-4 dark:border-white/10 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Circles 7d', value: activitySeries.reduce((sum, item) => sum + item.circles, 0) },
                { label: 'Swaps 7d', value: activitySeries.reduce((sum, item) => sum + item.swaps, 0) },
                { label: 'Live queue', value: pendingCount + readyToStartCount },
                { label: 'Busiest day', value: busiestDay },
              ].map((item) => (
                <div key={item.label} className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="neo-panel p-4 md:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Operations
              </p>
              <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">
                Snapshot
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardOpsStats.map((row) => (
                <Link
                  key={row.label}
                  to={row.to}
                  className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 transition duration-200 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="mt-2 text-[1.55rem] font-semibold leading-none text-foreground">{row.value}</p>
                  <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {row.detail}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="neo-panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Circles
                </p>
                <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">
                  Recent circles
                </h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/circles">Open</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/circles/create">
                    <Plus className="h-4 w-4" />
                    Create
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              {recentCircles.length > 0 ? recentCircles.map((circle) => (
                <Link
                  key={circle.id}
                  to={getCirclePath(circle.id)}
                  className="grid gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 transition duration-200 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8 md:grid-cols-[minmax(0,1.2fr)_auto_auto_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{circle.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {formatShortDate(toCircleTimestamp(circle.createdAt))}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {circle.currentMembers}/{circle.maxMembers}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatAmountShort(circle.monthlyAmount)}
                  </div>
                  <div className="md:text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getStatusPill(circle.status)}`}>
                      {circle.status}
                    </span>
                  </div>
                </Link>
              )) : (
                <div className="rounded-[18px] border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                  No circles yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="neo-panel p-4 md:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Exposure
              </p>
              <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">
                Top circle sizes
              </h3>
            </div>

            <ChartContainer config={exposureChartConfig} className="aspect-auto h-[250px] w-full">
              <BarChart data={exposureSeries} layout="vertical" margin={{ top: 0, right: 6, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={82}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="neo-panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Automation
                </p>
                <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">
                  Module flow
                </h3>
              </div>
              <div className="neo-chip">{myLogs.length} actions</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {moduleCounts.map((module) => {
                const Icon = module.icon;

                return (
                  <Link
                    key={module.key}
                    to={module.to}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] px-3.5 py-3 transition duration-200 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: `${module.accent}24`, color: module.accent }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-sm font-semibold text-foreground">{module.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">{module.count}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="neo-panel p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Swaps
                  </p>
                  <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">
                    Recent swaps
                  </h3>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/swap">Open swap</Link>
                </Button>
              </div>

              <div className="space-y-2.5">
                {recentSwapLogs.length > 0 ? recentSwapLogs.map((entry) => (
                  <Link
                    key={entry.id}
                    to="/logs"
                    className="block rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 transition duration-200 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{entry.title}</p>
                        <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {getStarkZapLogAmountText(entry) || entry.summary}
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getLogStatusPill(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{entry.provider}</span>
                      <span>{formatShortDateTime(entry.updatedAt)}</span>
                    </div>
                  </Link>
                )) : (
                  <div className="rounded-[18px] border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                    No swap activity yet.
                  </div>
                )}
              </div>
            </div>

            <div className="neo-panel p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Queue
                  </p>
                  <h3 className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground">
                    Creator actions
                  </h3>
                </div>
                <div className="neo-chip">
                  <Users className="h-3.5 w-3.5" />
                  {pendingCount + readyToStartCount}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  { label: 'Reputation', value: stats?.reputationScore || 0 },
                  { label: 'Requests', value: pendingCount },
                  { label: 'Ready', value: readyToStartCount || readyCircles.length },
                ].map((item) => (
                  <div key={item.label} className="rounded-[18px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-2.5">
                {readyToStartCircles.slice(0, 2).map((circle) => (
                  <Link
                    key={circle.id}
                    to={getCirclePath(circle.circleId)}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 transition duration-200 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{circle.circleName}</p>
                      <p className="truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {circle.currentMembers}/{circle.maxMembers} joined
                      </p>
                    </div>
                    <span className="rounded-full bg-[#B5F36B]/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                      Start
                    </span>
                  </Link>
                ))}

                {requests.slice(0, 2).map((request) => (
                  <Link
                    key={request.id}
                    to={getCirclePath(request.circleId)}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 transition duration-200 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{request.circleName}</p>
                      <p className="truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Request from {formatAddress(request.applicantAddress)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FFB457]/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                      Review
                    </span>
                  </Link>
                ))}

                {readyToStartCircles.length === 0 && requests.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                    No actions waiting right now.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
