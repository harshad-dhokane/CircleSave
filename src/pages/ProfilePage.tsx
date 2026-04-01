import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useReputation } from '@/hooks/useReputation';
import { useUserCircles } from '@/hooks/useCircle';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { getStarkZapLogAmountText } from '@/lib/starkzapLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRightLeft,
  Award,
  CheckCircle,
  Crown,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Medal,
  PiggyBank,
  Repeat,
  Trophy,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  formatAddress,
  formatAmount,
  formatAmountShort,
  getCategoryLabel,
  LEVEL_COLORS,
  LEVEL_NAMES,
} from '@/lib/constants';
import { CircleCard } from '@/components/circles/CircleCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LEVEL_ORDER = ['NEWCOMER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
const LEVEL_REQUIREMENTS = [
  { name: 'Newcomer', minCircles: 0, minRate: 0 },
  { name: 'Bronze', minCircles: 1, minRate: 0 },
  { name: 'Silver', minCircles: 5, minRate: 90 },
  { name: 'Gold', minCircles: 10, minRate: 95 },
  { name: 'Platinum', minCircles: 25, minRate: 95 },
  { name: 'Diamond', minCircles: 50, minRate: 98 },
];

const LOG_KIND_META = {
  swap: { label: 'Swap', color: '#4ECDC4', icon: ArrowRightLeft },
  dca: { label: 'DCA', color: '#FFE66D', icon: Repeat },
  lending: { label: 'Lending', color: '#96CEB4', icon: PiggyBank },
} as const;

function getCircleStatusClasses(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-[#96CEB4] text-black';
    case 'COMPLETED':
      return 'bg-[#4ECDC4] text-black';
    case 'FAILED':
      return 'bg-[#FF6B6B] text-white';
    default:
      return 'bg-[#FFE66D] text-black';
  }
}

function getLogStatusClasses(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-[#96CEB4] text-black';
    case 'failed':
      return 'bg-[#FF6B6B] text-white';
    default:
      return 'bg-[#FFE66D] text-black';
  }
}

function calculateMilestoneProgress(currentValue: number, requiredValue: number) {
  if (requiredValue <= 0) return 1;
  return Math.min(currentValue / requiredValue, 1);
}

function addTokenTotal(totals: Map<string, number>, amount?: string, token?: string) {
  if (!amount || !token) return;

  const parsed = Number.parseFloat(amount);
  if (!Number.isFinite(parsed)) return;

  totals.set(token, (totals.get(token) || 0) + parsed);
}

function formatTokenAmount(value: number) {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (value >= 100) return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (value >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatTokenTotals(totals: Map<string, number>, emptyLabel: string) {
  if (totals.size === 0) return emptyLabel;

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([token, value]) => `${formatTokenAmount(value)} ${token}`)
    .join(' • ');
}

function formatTrackedBalance(formatted?: string) {
  if (!formatted) return '0';

  const parsed = Number.parseFloat(formatted);
  if (!Number.isFinite(parsed)) return formatted;

  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: parsed > 0 && parsed < 1 ? 2 : 0,
    maximumFractionDigits: parsed >= 100 ? 2 : 4,
  });
}

export function ProfilePage() {
  const { address, balance, balanceLoading, assetBalances } = useWallet();
  const { stats, badges, level, levelName, levelColor, isLoading } = useReputation();
  const { circles, isLoading: circlesLoading } = useUserCircles();
  const { logs } = useStarkZapLogs();

  const myLogs = useMemo(() => {
    if (!address) return [];
    return logs.filter((log) => log.account.toLowerCase() === address.toLowerCase());
  }, [address, logs]);

  const activityAmounts = useMemo(() => {
    const swapTotals = new Map<string, number>();
    const dcaBudgetTotals = new Map<string, number>();
    const dcaCycleTotals = new Map<string, number>();
    const lendingDepositTotals = new Map<string, number>();
    const lendingWithdrawTotals = new Map<string, number>();

    for (const log of myLogs) {
      const details = log.details;

      if (log.kind === 'swap') {
        addTokenTotal(swapTotals, details?.inputAmount, details?.inputToken);
      }

      if (log.kind === 'dca') {
        addTokenTotal(dcaBudgetTotals, details?.totalAmount, details?.totalToken);
        addTokenTotal(dcaCycleTotals, details?.cycleAmount, details?.cycleToken);
      }

      if (log.kind === 'lending') {
        const target = details?.action === 'withdraw' ? lendingWithdrawTotals : lendingDepositTotals;
        addTokenTotal(target, details?.inputAmount, details?.inputToken);
      }
    }

    return {
      swapTotals,
      dcaBudgetTotals,
      dcaCycleTotals,
      lendingDepositTotals,
      lendingWithdrawTotals,
    };
  }, [myLogs]);

  const earnedBadges = badges.filter((badge) => badge.earned);
  const availableBadges = badges.filter((badge) => !badge.earned);
  const walletBalanceValue = balanceLoading
    ? '...'
    : balance
      ? parseFloat(balance.formatted).toFixed(2)
      : '0.00';
  const walletBalanceSymbol = balance?.symbol || 'STRK';
  const walletBalance = `${walletBalanceValue} ${walletBalanceSymbol}`;
  const lockedCollateral = formatAmountShort(stats?.currentCollateral || 0n);
  const totalMonthlyCommitment = circles.reduce((sum, circle) => sum + circle.monthlyAmount, 0n);
  const portfolioCircleCount = circles.length;
  const swapCount = myLogs.filter((log) => log.kind === 'swap').length;
  const dcaCount = myLogs.filter((log) => log.kind === 'dca').length;
  const lendingCount = myLogs.filter((log) => log.kind === 'lending').length;
  const recentLogs = myLogs.slice(0, 3);
  const latestLog = recentLogs[0] || null;
  const levelIndex = Math.max(LEVEL_ORDER.indexOf(level), 0);
  const nextLevelKey = LEVEL_ORDER[Math.min(levelIndex + 1, LEVEL_ORDER.length - 1)];
  const nextLevelName = LEVEL_NAMES[nextLevelKey] || nextLevelKey;
  const nextRequirements = LEVEL_REQUIREMENTS[Math.min(levelIndex + 1, LEVEL_REQUIREMENTS.length - 1)];
  const currentCirclesJoined = Math.max(stats?.circlesJoined || 0, portfolioCircleCount);
  const hasPaymentHistory = (stats?.paymentsMade || 0) > 0;
  const currentOnTimeRate = hasPaymentHistory ? (stats?.onTimePaymentRate || 0) : 0;
  const completionRate = currentCirclesJoined > 0 ? (stats?.completionRate || 0) : 0;
  const nextLevelProgress = level === LEVEL_ORDER[LEVEL_ORDER.length - 1]
    ? 100
    : Math.round((
      calculateMilestoneProgress(currentCirclesJoined, nextRequirements.minCircles) +
      calculateMilestoneProgress(currentOnTimeRate, nextRequirements.minRate)
    ) / 2 * 100);
  const activityTotal = swapCount + dcaCount + lendingCount;
  const swapVolumeText = formatTokenTotals(
    activityAmounts.swapTotals,
    swapCount > 0 ? 'Amount unavailable' : 'No swaps yet',
  );
  const dcaBudgetText = formatTokenTotals(
    activityAmounts.dcaBudgetTotals,
    dcaCount > 0 ? 'Budget unavailable' : 'No DCA yet',
  );
  const dcaCycleText = formatTokenTotals(
    activityAmounts.dcaCycleTotals,
    dcaCount > 0 ? 'Cycle amount unavailable' : 'No DCA yet',
  );
  const lendingFlowText = [
    activityAmounts.lendingDepositTotals.size > 0
      ? `In ${formatTokenTotals(activityAmounts.lendingDepositTotals, '')}`
      : null,
    activityAmounts.lendingWithdrawTotals.size > 0
      ? `Out ${formatTokenTotals(activityAmounts.lendingWithdrawTotals, '')}`
      : null,
  ].filter(Boolean).join(' • ') || (lendingCount > 0 ? 'Amount unavailable' : 'No lending yet');
  const trackedAssetCards = assetBalances.map((asset) => ({
    symbol: asset.label,
    amount: asset.isLoading ? '...' : formatTrackedBalance(asset.balance?.formatted),
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-[#FF6B6B]" />
          <p className="font-bold text-gray-600 text-lg">Loading profile from blockchain...</p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-28 h-28 bg-[#FFE66D] border-[3px] border-black mx-auto mb-6 flex items-center justify-center">
            <Lock className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 text-lg">Connect your wallet to view your profile, circles, and investment activity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <div className="bg-white border-b-[2px] border-black">
        <div className="page-shell py-9 md:py-11">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <section className="neo-panel neo-spotlight p-6 md:p-8">
              <div className="mb-4 neo-chip bg-white">Wallet Identity</div>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="relative animate-scale-in">
                  <div
                    className="flex h-32 w-32 items-center justify-center border-[3px] border-black"
                    style={{ backgroundColor: levelColor }}
                  >
                    <span className="text-5xl font-black text-white">{address.slice(2, 4)}</span>
                  </div>
                  <div
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap border-[2px] border-black px-4 py-1.5 text-sm font-black"
                    style={{ backgroundColor: levelColor }}
                  >
                    {levelName}
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-black">{formatAddress(address)}</h1>
                  <p className="mt-2 font-mono text-sm text-black/55">{address}</p>
                  <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-black/70">
                    This profile combines your circle reputation, StarkZap wallet activity, badges, and progress toward the next trust level.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="neo-chip bg-[#FEFAE0]">
                      <Trophy className="h-4 w-4 text-[#FFD700]" />
                      {stats?.reputationScore || 0} REP
                    </div>
                    <div className="neo-chip bg-white">
                      <Wallet className="h-4 w-4 text-[#4ECDC4]" />
                      {walletBalance}
                    </div>
                    <div className="neo-chip bg-white">
                      <Lock className="h-4 w-4 text-[#FF6B6B]" />
                      Locked {lockedCollateral}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/logs" className="neo-button-secondary inline-flex items-center">
                      <FileText className="h-5 w-5" />
                      Open Logs
                    </Link>
                    <Link to="/swap" className="neo-button-primary inline-flex items-center">
                      <ArrowRightLeft className="h-5 w-5" />
                      Open Swap
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Current Level</p>
                      <p className="mt-2 text-2xl font-black">{levelName}</p>
                    </div>
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Circle Positions</p>
                      <p className="mt-2 text-2xl font-black">{circles.length}</p>
                    </div>
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Latest Wallet Move</p>
                      <p className="mt-2 text-lg font-black">
                        {latestLog ? LOG_KIND_META[latestLog.kind].label : 'No activity'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div className="border-[2px] border-black bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-[#4ECDC4]" />
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Wallet Holdings</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {trackedAssetCards.map((asset) => (
                          <div key={asset.symbol} className="border-[2px] border-black bg-[#FEFAE0] p-4 min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">{asset.symbol}</p>
                            <p className="mt-2 text-[1.75rem] leading-tight font-black whitespace-nowrap">{asset.amount}</p>
                            <p className="mt-1 text-xs text-black/55">Tracked wallet balance</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-[2px] border-black bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#FF6B6B]" />
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">StarkZap Totals</p>
                      </div>
                      <div className="grid gap-3">
                        <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Total Swapped</p>
                          <p className="mt-2 text-[1.45rem] leading-tight font-black">{swapVolumeText}</p>
                        </div>
                        <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Total DCA Budget</p>
                          <p className="mt-2 text-[1.45rem] leading-tight font-black">{dcaBudgetText}</p>
                          <p className="mt-1 text-xs text-black/55">
                            {dcaCount > 0 ? `Per cycle: ${dcaCycleText}` : 'No DCA activity yet'}
                          </p>
                        </div>
                        <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Total Lending Flow</p>
                          <p className="mt-2 text-[1.45rem] leading-tight font-black">{lendingFlowText}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              <div className="neo-panel p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center border-[2px] border-black bg-[#FFD700]">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Level Journey</p>
                    <h2 className="text-2xl font-black">
                      {level === LEVEL_ORDER[LEVEL_ORDER.length - 1] ? 'Top Tier Reached' : `Next: ${nextLevelName}`}
                    </h2>
                  </div>
                </div>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-4xl font-black">{nextLevelProgress}%</p>
                    <p className="text-sm text-black/60">Toward your next reputation tier</p>
                  </div>
                  <div
                    className="border-[2px] border-black px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em]"
                    style={{ backgroundColor: levelColor }}
                  >
                    {levelName}
                  </div>
                </div>
                <div className="neo-progress">
                  <div className="neo-progress-bar bg-[#FF6B6B]" style={{ width: `${nextLevelProgress}%` }} />
                </div>
                {level !== LEVEL_ORDER[LEVEL_ORDER.length - 1] && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Circles Milestone</p>
                      <p className="mt-2 text-2xl font-black">{currentCirclesJoined}/{nextRequirements.minCircles}</p>
                    </div>
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">On-Time Rate</p>
                      <p className="mt-2 text-xl font-black">
                        {hasPaymentHistory ? `${currentOnTimeRate}%` : 'No record'}
                        {nextRequirements.minRate > 0 ? ` / ${nextRequirements.minRate}%` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="neo-panel p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center border-[2px] border-black bg-[#4ECDC4]">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Activity Mix</p>
                    <h2 className="text-2xl font-black">Circle + StarkZap</h2>
                  </div>
                </div>

                {activityTotal > 0 ? (
                  <div className="space-y-3">
                    {[
                      { label: 'Swaps', value: swapCount, color: '#4ECDC4' },
                      { label: 'DCA Orders', value: dcaCount, color: '#FFE66D' },
                      { label: 'Lending Actions', value: lendingCount, color: '#96CEB4' },
                    ].map((item) => {
                      const percentage = Math.round((item.value / activityTotal) * 100);

                      return (
                        <div key={item.label}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black uppercase tracking-[0.08em]">
                            <span>{item.label}</span>
                            <span>{item.value} • {percentage}%</span>
                          </div>
                          <div className="neo-progress">
                            <div className="neo-progress-bar" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="text-sm leading-relaxed text-black/65">
                      No StarkZap actions yet. Once you swap, create a DCA order, or use lending, the activity mix will populate here.
                    </p>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Monthly Commitment</p>
                    <p className="mt-2 text-2xl font-black">{formatAmountShort(totalMonthlyCommitment)}</p>
                  </div>
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Earned Badges</p>
                    <p className="mt-2 text-2xl font-black">{earnedBadges.length}/{badges.length}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                icon: Wallet,
                color: '#4ECDC4',
                value: walletBalanceValue,
                suffix: walletBalanceSymbol,
                label: 'Wallet Balance',
                helper: 'Connected wallet balance',
              },
              {
                icon: Users,
                color: '#FF6B6B',
                value: portfolioCircleCount,
                suffix: null,
                label: 'Circle Positions',
                helper: 'Created or joined with this wallet',
              },
              {
                icon: CheckCircle,
                color: '#4ECDC4',
                value: stats?.paymentsMade || 0,
                suffix: null,
                label: 'Payments Made',
                helper: 'Confirmed contribution payments',
              },
              {
                icon: TrendingUp,
                color: '#96CEB4',
                value: hasPaymentHistory ? `${currentOnTimeRate}%` : 'No data',
                suffix: null,
                label: 'On-Time Rate',
                helper: hasPaymentHistory ? 'Payment punctuality' : 'No repayments yet',
              },
              {
                icon: CheckCircle,
                color: '#FFE66D',
                value: currentCirclesJoined > 0 ? `${completionRate}%` : 'No data',
                suffix: null,
                label: 'Completion',
                helper: currentCirclesJoined > 0 ? 'Circle completion score' : 'No completed circles yet',
              },
            ].map((stat, index) => (
              <div key={stat.label} className={`animate-fade-in stagger-${index + 2} neo-stat-tile text-center`}>
                <stat.icon className="w-7 h-7 mx-auto mb-2" style={{ color: stat.color }} />
                <p className="text-[2.15rem] font-black leading-none break-words">{stat.value}</p>
                {stat.suffix ? (
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.08em] text-black/55">{stat.suffix}</p>
                ) : null}
                <p className="mt-2 text-xs font-bold text-gray-600 uppercase">{stat.label}</p>
                <p className="mt-1 text-xs text-black/55">{stat.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-shell py-10 md:py-12">
        <Tabs defaultValue="portfolio" className="w-full animate-fade-in">
          <TabsList className="sticky top-[5.8rem] z-20 mb-8 h-auto w-full flex-wrap justify-start rounded-none border-[3px] border-black bg-white p-1.5 shadow-[0_4px_0px_0px_#1a1a1a]">
            <TabsTrigger value="portfolio" className="rounded-none font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white px-6 py-2.5">
              <Wallet className="w-5 h-5 mr-2" />
              Investments
            </TabsTrigger>
            <TabsTrigger value="circles" className="rounded-none font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white px-6 py-2.5">
              <Users className="w-5 h-5 mr-2" />
              Circles ({portfolioCircleCount})
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-none font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white px-6 py-2.5">
              <Medal className="w-5 h-5 mr-2" />
              Badges ({earnedBadges.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-none font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white px-6 py-2.5">
              <TrendingUp className="w-5 h-5 mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Circle Positions', value: portfolioCircleCount, helper: `${formatAmountShort(totalMonthlyCommitment)} committed monthly`, color: '#FF6B6B' },
                { label: 'Swaps', value: swapCount, helper: swapVolumeText, color: '#4ECDC4' },
                { label: 'DCA Orders', value: dcaCount, helper: dcaCount > 0 ? `${dcaBudgetText} total` : dcaBudgetText, color: '#FFE66D' },
                { label: 'Lending Actions', value: lendingCount, helper: lendingFlowText, color: '#96CEB4' },
              ].map((item) => (
                <div key={item.label} className="border-[2px] border-black bg-white p-5">
                  <div className="mb-3 h-2 w-16 border-[2px] border-black" style={{ backgroundColor: item.color }} />
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-black/60">{item.label}</p>
                  <p className="mt-2 text-3xl font-black">{item.value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-black/60">{item.helper}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="neo-panel p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#4ECDC4]">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Recent StarkZap Activity</p>
                    <h3 className="text-2xl font-black">Latest Wallet Moves</h3>
                  </div>
                </div>
                {recentLogs.length > 0 ? (
                  <div className="space-y-3">
                    {recentLogs.map((log) => {
                      const meta = LOG_KIND_META[log.kind];
                      const Icon = meta.icon;
                      const amountText = getStarkZapLogAmountText(log);

                      return (
                        <div key={log.id} className="border-[2px] border-black bg-[#FEFAE0] p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center border-[2px] border-black"
                              style={{ backgroundColor: meta.color }}
                            >
                              <Icon className="h-4 w-4 text-black" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black">{meta.label}</p>
                                <span className={`inline-flex border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${getLogStatusClasses(log.status)}`}>
                                  {log.status}
                                </span>
                              </div>
                              {amountText ? (
                                <p className="mt-1 text-sm font-black text-black/80">{amountText}</p>
                              ) : null}
                              <p className="mt-1 text-sm leading-relaxed text-black/70">{log.summary}</p>
                              <p className="mt-2 text-xs font-black uppercase tracking-[0.08em] text-black/45">
                                {new Date(log.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-6 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-black/25" />
                    <h4 className="text-xl font-black">No wallet moves yet</h4>
                    <p className="mt-2 text-sm leading-relaxed text-black/65">
                      Your last swaps, DCA orders, and lending actions will show here once you start using the StarkZap tools.
                    </p>
                  </div>
                )}
              </div>

              <div className="neo-panel p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#FF6B6B]">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Investment Snapshot</p>
                    <h3 className="text-2xl font-black">Portfolio Notes</h3>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Circle Exposure</p>
                    <p className="mt-2 text-2xl font-black">{formatAmountShort(totalMonthlyCommitment)}</p>
                    <p className="mt-2 text-sm text-black/65">Total monthly circle commitment across every position.</p>
                  </div>
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Swap Volume</p>
                    <p className="mt-2 text-2xl font-black break-words">{swapVolumeText}</p>
                    <p className="mt-2 text-sm text-black/65">Total token amount routed through wallet swaps.</p>
                  </div>
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">DCA Budgeted</p>
                    <p className="mt-2 text-2xl font-black break-words">{dcaBudgetText}</p>
                    <p className="mt-2 text-sm text-black/65">
                      {dcaCount > 0 ? `Per cycle: ${dcaCycleText}` : 'Recurring DCA totals will appear here.'}
                    </p>
                  </div>
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Lending Flow</p>
                    <p className="mt-2 text-2xl font-black break-words">{lendingFlowText}</p>
                    <p className="mt-2 text-sm text-black/65">Deposited and withdrawn token amounts recorded for lending.</p>
                  </div>
                  <div className="border-[2px] border-black bg-white p-4 sm:col-span-2">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Suggested Next Step</p>
                      <Link to="/circles" className="text-xs font-black uppercase tracking-[0.08em] underline underline-offset-4">
                        Explore
                      </Link>
                    </div>
                    <p className="text-lg font-black">
                      {circles.length === 0
                        ? 'Start with a circle to turn your wallet into a savings position.'
                        : swapCount === 0
                          ? 'Route into STRK with swap so contributions are ready when your next payment is due.'
                          : dcaCount === 0
                            ? 'Set up a DCA order to build your contribution balance automatically.'
                            : 'You already have a multi-product footprint. Check logs and tighten your next position.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to="/swap" className="neo-button-secondary inline-flex items-center">
                        Open Swap
                      </Link>
                      <Link to="/dca" className="neo-button-primary inline-flex items-center">
                        Open DCA
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="neo-card overflow-hidden p-0">
              <div className="border-b-[2px] border-black bg-white px-6 py-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Circle Positions</h3>
                    <p className="text-sm text-black/60">All circles linked to this wallet, including commitment size and current status.</p>
                  </div>
                  <Link to="/circles" className="text-sm font-black uppercase tracking-[0.08em] underline underline-offset-4">
                    Discover More Circles
                  </Link>
                </div>
              </div>
              {circlesLoading ? (
                <div className="p-10 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#FF6B6B]" />
                  <p className="font-bold text-gray-600">Loading your circles...</p>
                </div>
              ) : circles.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[980px]">
                  <TableHeader className="bg-black [&_tr]:border-black">
                    <TableRow className="border-black hover:bg-black">
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Circle</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Category</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Monthly</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Members</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Status</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {circles.map((circle) => (
                      <TableRow key={circle.id} className="border-black bg-white hover:bg-[#FEFAE0]">
                        <TableCell className="px-4 py-4 align-top">
                          <p className="font-black">{circle.name}</p>
                          <p className="mt-1 max-w-[280px] whitespace-normal text-sm text-black/60">{circle.description}</p>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm font-bold">{getCategoryLabel(circle.category)}</TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm font-bold">{formatAmount(circle.monthlyAmount)}</TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm text-black/65">
                          {circle.currentMembers}/{circle.maxMembers}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          <span className={`inline-flex border-[2px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${getCircleStatusClasses(circle.status)}`}>
                            {circle.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          <Link
                            to={`/circles/${circle.id}`}
                            className="inline-flex items-center gap-2 text-sm font-black underline underline-offset-4"
                          >
                            View Circle
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-2xl font-black mb-2">No Circle Positions Yet</h4>
                  <p className="text-gray-600 text-lg">Join or create circles to start building your savings portfolio.</p>
                </div>
              )}
            </section>

            <section className="neo-card overflow-hidden p-0">
              <div className="border-b-[2px] border-black bg-white px-6 py-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Wallet Activity</h3>
                    <p className="text-sm text-black/60">Swaps, DCA plans, and lending transactions for this wallet, all in one place.</p>
                  </div>
                  <Link to="/logs" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] underline underline-offset-4">
                    Open Full Logs
                    <FileText className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              {myLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[920px]">
                  <TableHeader className="bg-black [&_tr]:border-black">
                    <TableRow className="border-black hover:bg-black">
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Type</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Amount</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Summary</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Status</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Updated</TableHead>
                      <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Voyager</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLogs.map((log) => {
                      const meta = LOG_KIND_META[log.kind];
                      const Icon = meta.icon;
                      const amountText = getStarkZapLogAmountText(log);

                      return (
                        <TableRow key={log.id} className="border-black bg-white hover:bg-[#FEFAE0]">
                          <TableCell className="px-4 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center border-[2px] border-black"
                                style={{ backgroundColor: meta.color }}
                              >
                                <Icon className="h-4 w-4 text-black" />
                              </div>
                              <div>
                                <p className="font-black">{meta.label}</p>
                                <p className="text-xs uppercase tracking-[0.08em] text-black/50">{log.title}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top text-sm font-black text-black/80">
                            {amountText || 'Pending amount data'}
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top">
                            <p className="max-w-[360px] whitespace-normal text-[15px] leading-relaxed text-black/75">{log.summary}</p>
                            {log.error && <p className="mt-2 text-sm text-red-600">{log.error}</p>}
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top">
                            <span className={`inline-flex border-[2px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${getLogStatusClasses(log.status)}`}>
                              {log.status}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top text-sm text-black/65">
                            {new Date(log.updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="px-4 py-4 align-top">
                            <a
                              href={log.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-black underline underline-offset-4"
                            >
                              Open
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <FileText className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-2xl font-black mb-2">No Wallet Activity Yet</h4>
                  <p className="mx-auto max-w-2xl text-gray-600 text-lg">
                    Once you use swap, DCA, or lending, those actions will show up here beside your circle positions.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to="/sdk" className="neo-button-secondary inline-flex items-center">
                      Open SDK Guide
                    </Link>
                    <Link to="/swap" className="neo-button-primary inline-flex items-center">
                      Open Swap
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="circles">
            {circlesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FF6B6B]" />
                <p className="font-bold text-gray-600 text-lg">Loading circles...</p>
              </div>
            ) : circles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {circles.map((circle, index) => (
                  <div key={circle.id} className={`animate-fade-in stagger-${Math.min(index + 1, 6)}`}>
                    <CircleCard circle={circle} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="neo-card p-12 text-center animate-fade-in">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-2xl font-black mb-2">No Circles Yet</h3>
                <p className="text-gray-600 text-lg">Join or create circles to see them here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="badges">
            <div className="neo-card p-8">
              <h3 className="text-2xl font-black mb-6">Earned Badges</h3>
              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {earnedBadges.map((badge, index) => (
                    <div
                      key={badge.id}
                      className={`animate-fade-in stagger-${Math.min(index + 1, 8)} bg-[#FEFAE0] border-[3px] border-black p-5 text-center hover:shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all`}
                    >
                      <div className="text-5xl mb-3">🏆</div>
                      <h4 className="font-black text-base mb-1">{badge.name}</h4>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 text-lg">No badges earned yet. Start participating to earn badges!</p>
                </div>
              )}

              {availableBadges.length > 0 && (
                <div className="mt-10">
                  <h4 className="font-black mb-5 text-gray-400 text-lg">Available Badges</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {availableBadges.map((badge) => (
                      <div key={badge.id} className="bg-gray-100 border-[3px] border-gray-300 p-5 text-center opacity-50">
                        <div className="text-5xl mb-3 grayscale">🔒</div>
                        <h4 className="font-black text-base mb-1">{badge.name}</h4>
                        <p className="text-sm text-gray-500">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="neo-card p-8 animate-fade-in">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <Wallet className="w-7 h-7 text-[#4ECDC4]" />
                  Payment History
                </h3>
                <div className="space-y-0">
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-base">Payments Made</span>
                    <span className="font-black text-base">{stats?.paymentsMade || 0}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-base">Late Payments</span>
                    <span className="font-black text-red-500 text-base">{stats?.paymentsLate || 0}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-base">On-Time Rate</span>
                    <span className="font-black text-green-600 text-base">{stats?.onTimePaymentRate || 100}%</span>
                  </div>
                  <div className="flex justify-between py-4 bg-[#FEFAE0] border-[3px] border-black px-5 mt-2">
                    <span className="font-bold text-base">Reputation Score</span>
                    <span className="font-black text-base">{stats?.reputationScore || 0} / 1000</span>
                  </div>
                </div>
              </div>

              <div className="neo-card p-8 animate-fade-in stagger-1">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <TrendingUp className="w-7 h-7 text-[#FF6B6B]" />
                  Circle Activity
                </h3>
                <div className="space-y-0">
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-base">Circles Joined</span>
                    <span className="font-black text-base">{stats?.circlesJoined || 0}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-base">Circles Created</span>
                    <span className="font-black text-base">{stats?.circlesCreated || 0}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-base">Completion Rate</span>
                    <span className="font-black text-green-600 text-base">{stats?.completionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between py-4 bg-[#FEFAE0] border-[3px] border-black px-5 mt-2">
                    <span className="font-bold text-base">Badges Earned</span>
                    <span className="font-black text-base">{earnedBadges.length}/{badges.length}</span>
                  </div>
                </div>
              </div>

              <div className="neo-card p-8 md:col-span-2 animate-fade-in stagger-2">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <Crown className="w-7 h-7 text-[#FFD700]" />
                  Level Progress
                </h3>
                <div className="space-y-4">
                  {LEVEL_ORDER.map((lvlKey, index) => {
                    const isCurrent = lvlKey === level;
                    const isPassed = LEVEL_ORDER.indexOf(level) > index;
                    const lvlName = LEVEL_NAMES[lvlKey] || lvlKey;
                    const lvlStepColor = LEVEL_COLORS[lvlKey] || '#ccc';
                    const req = LEVEL_REQUIREMENTS[index];

                    return (
                      <div
                        key={lvlKey}
                        className={`flex items-center gap-4 p-5 border-[3px] ${
                          isCurrent ? 'border-[#FF6B6B] bg-[#FF6B6B]/10' :
                          isPassed ? 'border-green-400 bg-green-50' :
                          'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 border-[3px] border-black flex items-center justify-center font-black text-lg ${
                            isCurrent || isPassed ? '' : 'grayscale'
                          }`}
                          style={{ backgroundColor: isCurrent || isPassed ? lvlStepColor : '#ccc' }}
                        >
                          {isPassed ? <CheckCircle className="w-6 h-6" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-lg">{lvlName}</h4>
                          <p className="text-base text-gray-600">
                            {req.minCircles}+ circles, {req.minRate}% on-time rate
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="px-4 py-1.5 bg-[#FF6B6B] text-white text-sm font-bold border-[2px] border-black">
                            CURRENT
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
