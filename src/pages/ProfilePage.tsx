import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  Crown,
  Lock,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { useIncomingCircleRequests, useUserCircles } from '@/hooks/useCircle';
import { useReputation } from '@/hooks/useReputation';
import { useWallet } from '@/hooks/useWallet';
import { addressesEqual } from '@/lib/address';
import { isCircleReadyToStart } from '@/lib/circleState';
import { formatAddress, formatAmount, getCircleTypeLabel } from '@/lib/constants';
import { getCirclePath } from '@/lib/routes';
import type { Circle } from '@/types';

function formatTrackedBalance(formatted?: string) {
  if (!formatted) return '0';

  const parsed = Number.parseFloat(formatted);
  if (!Number.isFinite(parsed)) return formatted;

  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: parsed > 0 && parsed < 1 ? 2 : 0,
    maximumFractionDigits: parsed >= 100 ? 2 : 4,
  });
}

function sortCircles(circles: Circle[]) {
  return [...circles].sort((left, right) => {
    const leftReady = isCircleReadyToStart(left) ? 1 : 0;
    const rightReady = isCircleReadyToStart(right) ? 1 : 0;

    if (leftReady !== rightReady) {
      return rightReady - leftReady;
    }

    if (left.status !== right.status) {
      const rank = { ACTIVE: 0, PENDING: 1, COMPLETED: 2, FAILED: 3 } as const;
      return (rank[left.status as keyof typeof rank] ?? 4) - (rank[right.status as keyof typeof rank] ?? 4);
    }

    return right.createdAt - left.createdAt;
  });
}

function getStatusTone(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/14 text-emerald-300';
    case 'COMPLETED':
      return 'bg-sky-500/14 text-sky-300';
    case 'FAILED':
      return 'bg-rose-500/14 text-rose-300';
    default:
      return 'bg-amber-500/14 text-amber-300';
  }
}

export function ProfilePage() {
  const { address, assetBalances, balance, balanceLoading } = useWallet();
  const { stats, badges, levelName, levelColor, isLoading } = useReputation();
  const { circles, isLoading: circlesLoading } = useUserCircles();
  const {
    requests,
    pendingCount,
    readyToStartCircles,
    readyToStartCount,
    notificationCount,
  } = useIncomingCircleRequests({ pollMs: 30000 });

  const trackedAssets = assetBalances.map((asset) => ({
    symbol: asset.label,
    amount: asset.isLoading ? '...' : formatTrackedBalance(asset.balance?.formatted),
  }));

  const createdCircles = useMemo(
    () => circles.filter((circle) => address && addressesEqual(circle.creator, address)),
    [address, circles],
  );
  const joinedCircles = useMemo(
    () => circles.filter((circle) => !address || !addressesEqual(circle.creator, address)),
    [address, circles],
  );
  const portfolioRows = useMemo(
    () => sortCircles(circles).slice(0, 4),
    [circles],
  );
  const earnedBadges = badges.filter((badge) => badge.earned);
  const balanceLabel = balanceLoading
    ? 'Syncing'
    : balance
      ? `${parseFloat(balance.formatted).toFixed(2)} ${balance.symbol}`
      : '0.00 STRK';

  if (isLoading) {
    return (
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-foreground">
            Loading profile
          </h2>
        </section>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Connect to open your profile
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
      <section className="neo-panel p-3.5 md:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="flex min-w-0 items-center gap-4 rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/10 text-lg font-semibold text-slate-950"
              style={{ backgroundColor: levelColor }}
            >
              {address.slice(2, 4).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Wallet
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{formatAddress(address)}</p>
                <CopyButton value={address} successMessage="Wallet address copied" />
              </div>
            </div>
          </div>

          {[
            { label: 'Level', value: levelName },
            { label: 'Reputation', value: stats?.reputationScore || 0 },
            { label: 'Circles', value: circlesLoading ? '...' : circles.length },
            { label: 'Balance', value: balanceLabel },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <section className="neo-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Wallet
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Asset balances
                </h3>
              </div>
              <Wallet className="h-5 w-5 text-[#7CC8FF]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {trackedAssets.map((asset) => (
                <div key={asset.symbol} className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {asset.symbol}
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">{asset.amount}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  On-time rate
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {stats ? `${stats.onTimePaymentRate}%` : '0%'}
                </p>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Earned badges
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {earnedBadges.length}/{badges.length}
                </p>
              </div>
            </div>
          </section>

          <section className="neo-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Reputation
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Trust summary
                </h3>
              </div>
              <Crown className="h-5 w-5 text-[#FFB457]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Payments made
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{stats?.paymentsMade || 0}</p>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Late payments
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{stats?.paymentsLate || 0}</p>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Circles created
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{stats?.circlesCreated || createdCircles.length}</p>
              </div>
              <div className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Current collateral
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{formatAmount(stats?.currentCollateral || 0n)}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="neo-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Portfolio
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Circle ownership
                </h3>
              </div>
              <Users className="h-5 w-5 text-[#7AE7C7]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Created', value: createdCircles.length },
                { label: 'Joined', value: joinedCircles.length },
                { label: 'Ready to start', value: readyToStartCount },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {portfolioRows.map((circle) => (
                <Link
                  key={circle.id}
                  to={getCirclePath(circle.id)}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-black/10 bg-black/[0.03] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{circle.name}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getStatusTone(circle.status)}`}>
                        {circle.status}
                      </span>
                    </div>
                    <p className="truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {getCircleTypeLabel(circle.circleType)} • {circle.currentMembers}/{circle.maxMembers} members
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatAmount(circle.monthlyAmount)}</span>
                </Link>
              ))}

              {portfolioRows.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                  No circles connected to this wallet yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="neo-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Creator workload
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Current alerts
                </h3>
              </div>
              <BellRing className="h-5 w-5 text-[#FF6B6B]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Pending approvals', value: pendingCount },
                { label: 'Notifications', value: notificationCount },
                { label: 'Ready circles', value: readyToStartCircles.length },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {requests.slice(0, 3).map((request) => (
                <Link
                  key={request.id}
                  to={getCirclePath(request.circleId)}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-black/10 bg-black/[0.03] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{request.circleName}</p>
                    <p className="truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Request from {formatAddress(request.applicantAddress)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#FFB457]/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
                    Review
                  </span>
                </Link>
              ))}

              {requests.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                  No approval items are waiting.
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/circles/create">Create Circle</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/logs">Open Logs</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
