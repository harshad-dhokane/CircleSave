import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useReputation } from '@/hooks/useReputation';
import { useUserCircles } from '@/hooks/useCircle';
import { type OnchainActivityEntry, useOnchainActivityFeed } from '@/hooks/useOnchainActivityFeed';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRightLeft,
  Award,
  Blocks,
  CheckCircle,
  Crown,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Medal,
  MoveRight,
  PiggyBank,
  Plus,
  RefreshCcw,
  Repeat,
  Shield,
  Trophy,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  formatAddress,
  LEVEL_COLORS,
  LEVEL_NAMES,
} from '@/lib/constants';
import { getStarkZapLogAmountText, type StarkZapLogEntry } from '@/lib/starkzapLogs';
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
  factory: { label: 'Factory', color: '#F4A261', icon: Blocks },
  circle: { label: 'Circle', color: '#FF6B6B', icon: Users },
  reputation: { label: 'Reputation', color: '#FFE66D', icon: Trophy },
  collateral: { label: 'Collateral', color: '#96CEB4', icon: Shield },
  batch: { label: 'Batch', color: '#F4A261', icon: Blocks },
  staking: { label: 'Staking', color: '#45B7D1', icon: Blocks },
  swap: { label: 'Swap', color: '#DDA0DD', icon: ArrowRightLeft },
  dca: { label: 'DCA', color: '#FFE66D', icon: Repeat },
  lending: { label: 'Lending', color: '#96CEB4', icon: PiggyBank },
} as const;

function getActivityToneClasses(tone: OnchainActivityEntry['tone']) {
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

function calculateMilestoneProgress(currentValue: number, requiredValue: number) {
  if (requiredValue <= 0) return 1;
  return Math.min(currentValue / requiredValue, 1);
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

type ActivityTableRow = {
  id: string;
  kind: keyof typeof LOG_KIND_META;
  title: string;
  amountText: string | null;
  summary: string;
  account: string;
  provider: string;
  badgeText: string;
  tone: OnchainActivityEntry['tone'];
  updatedAtLabel: string;
  updatedAtSort: number;
  explorerUrl: string;
  explorerLabel: string;
};

function formatWalletActionProvider(provider: string) {
  return provider ? provider.toUpperCase() : 'STARKZAP';
}

function getWalletActionLabel(entry: StarkZapLogEntry) {
  return getStarkZapLogAmountText(entry) || entry.summary;
}

function getWalletActionSupportText(entry: StarkZapLogEntry | null, fallback: string) {
  if (!entry) {
    return fallback;
  }

  return entry.status === 'confirmed'
    ? 'Latest confirmed action'
    : entry.status === 'failed'
      ? 'Latest action failed'
      : 'Pending confirmation';
}

function getWalletActionTone(status: StarkZapLogEntry['status']): OnchainActivityEntry['tone'] {
  if (status === 'failed') return 'warning';
  if (status === 'submitted') return 'neutral';
  return 'success';
}

export function ProfilePage() {
  const { address, assetBalances } = useWallet();
  const { stats, badges, level, levelName, levelColor, isLoading } = useReputation();
  const { circles, isLoading: circlesLoading } = useUserCircles();
  const { logs } = useStarkZapLogs();
  const {
    entries: activityEntries,
    error: activityError,
    isLoading: activityLoading,
    refresh: refreshActivity,
  } = useOnchainActivityFeed();
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'circles' | 'reputation' | 'analytics'>('profile');
  const [selectedActivityRow, setSelectedActivityRow] = useState<ActivityTableRow | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToContentRef = useRef(false);
  const userCircleAddressSet = useMemo(() => new Set(
    circles.map((circle) => circle.contractAddress.toLowerCase()),
  ), [circles]);

  const myActivityEntries = useMemo(() => {
    if (!address) return [];
    const normalizedAddress = address.toLowerCase();
    return activityEntries.filter((entry) => {
      if (entry.actor?.toLowerCase() === normalizedAddress) {
        return true;
      }

      return entry.circleAddress ? userCircleAddressSet.has(entry.circleAddress.toLowerCase()) : false;
    });
  }, [activityEntries, address, userCircleAddressSet]);

  const earnedBadges = badges.filter((badge) => badge.earned);
  const availableBadges = badges.filter((badge) => !badge.earned);
  const portfolioCircleCount = circles.length;
  const levelIndex = Math.max(LEVEL_ORDER.indexOf(level), 0);
  const nextLevelKey = LEVEL_ORDER[Math.min(levelIndex + 1, LEVEL_ORDER.length - 1)];
  const nextLevelName = LEVEL_NAMES[nextLevelKey] || nextLevelKey;
  const nextRequirements = LEVEL_REQUIREMENTS[Math.min(levelIndex + 1, LEVEL_REQUIREMENTS.length - 1)];
  const currentCirclesJoined = Math.max(stats?.circlesJoined || 0, portfolioCircleCount);
  const hasPaymentHistory = (stats?.paymentsMade || 0) > 0;
  const currentOnTimeRate = hasPaymentHistory ? (stats?.onTimePaymentRate || 0) : 0;
  const nextLevelProgress = level === LEVEL_ORDER[LEVEL_ORDER.length - 1]
    ? 100
    : Math.round((
      calculateMilestoneProgress(currentCirclesJoined, nextRequirements.minCircles) +
      calculateMilestoneProgress(currentOnTimeRate, nextRequirements.minRate)
    ) / 2 * 100);
  const trackedAssetCards = assetBalances.map((asset) => ({
    symbol: asset.label,
    amount: asset.isLoading ? '...' : formatTrackedBalance(asset.balance?.formatted),
  }));
  const safeAddress = address || '';
  const walletActionLogs = useMemo(() => {
    if (!safeAddress) return [];

    const normalizedAddress = safeAddress.toLowerCase();
    return logs.filter((entry) => entry.account.toLowerCase() === normalizedAddress);
  }, [logs, safeAddress]);
  const nonFailedWalletActionLogs = useMemo(
    () => walletActionLogs.filter((entry) => entry.status !== 'failed'),
    [walletActionLogs],
  );
  const latestSwapLog = useMemo(
    () => nonFailedWalletActionLogs.find((entry) => entry.kind === 'swap') || null,
    [nonFailedWalletActionLogs],
  );
  const latestDcaLog = useMemo(
    () => nonFailedWalletActionLogs.find((entry) => entry.kind === 'dca') || null,
    [nonFailedWalletActionLogs],
  );
  const latestLendingLog = useMemo(
    () => nonFailedWalletActionLogs.find((entry) => entry.kind === 'lending') || null,
    [nonFailedWalletActionLogs],
  );
  const createdCirclesCount = circles.filter((circle) => circle.creator.toLowerCase() === safeAddress.toLowerCase()).length;
  const activityFactoryCount = myActivityEntries.filter((entry) => entry.category === 'factory').length;
  const activityCircleCount = myActivityEntries.filter((entry) => entry.category === 'circle').length;
  const totalCircleActivityCount = activityFactoryCount + activityCircleCount;
  const batchActionCount = walletActionLogs.filter((entry) => entry.kind === 'batch').length;
  const swapActionCount = walletActionLogs.filter((entry) => entry.kind === 'swap').length;
  const dcaActionCount = walletActionLogs.filter((entry) => entry.kind === 'dca').length;
  const lendingActionCount = walletActionLogs.filter((entry) => entry.kind === 'lending').length;
  const activityRows = useMemo<ActivityTableRow[]>(() => {
    const contractRows = myActivityEntries
      .map((entry) => ({
        id: entry.id,
        kind: entry.category,
        title: entry.title,
        amountText: entry.valueText || entry.circleName || null,
        summary: entry.summary,
        account: entry.actor || safeAddress,
        provider: entry.sourceLabel,
        badgeText: entry.eventName,
        tone: entry.tone,
        updatedAtLabel: entry.timeLabel,
        updatedAtSort: entry.occurredAt ?? entry.sortValue,
        explorerUrl: entry.explorerUrl,
        explorerLabel: 'Open',
      }));
    const walletRows = walletActionLogs.map((entry) => ({
      id: `starkzap:${entry.id}`,
      kind: entry.kind,
      title: entry.title,
      amountText: getWalletActionLabel(entry),
      summary: entry.summary,
      account: entry.account,
      provider: formatWalletActionProvider(entry.provider),
      badgeText: entry.status === 'confirmed' ? 'Confirmed' : entry.status === 'failed' ? 'Failed' : 'Submitted',
      tone: getWalletActionTone(entry.status),
      updatedAtLabel: new Date(entry.updatedAt).toLocaleString(),
      updatedAtSort: new Date(entry.updatedAt).getTime(),
      explorerUrl: entry.explorerUrl,
      explorerLabel: 'Open',
    }));

    return [...walletRows, ...contractRows]
      .sort((left, right) => right.updatedAtSort - left.updatedAtSort);
  }, [myActivityEntries, safeAddress, walletActionLogs]);
  const combinedActivityEntryCount = activityRows.length;
  const selectedActivityMeta = selectedActivityRow ? LOG_KIND_META[selectedActivityRow.kind] : null;
  const SelectedActivityIcon = selectedActivityMeta?.icon;

  useEffect(() => {
    if (!shouldScrollToContentRef.current) return;
    shouldScrollToContentRef.current = false;

    if (window.innerWidth >= 1280) return;

    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-[#FF6B6B]" />
          <p className="font-bold text-gray-600 text-lg">Loading dashboard from blockchain...</p>
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
          <p className="text-gray-600 text-lg">Connect your wallet to open your dashboard, circles, reputation, and wallet activity in one workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <div className="page-shell py-8 md:py-10">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            shouldScrollToContentRef.current = true;
            setActiveTab(value as typeof activeTab);
          }}
          className="w-full animate-fade-in gap-4 xl:grid xl:grid-cols-[252px_minmax(0,1fr)] xl:items-start xl:gap-5 2xl:gap-6"
        >
          <aside className="space-y-3 xl:self-start">
            <TabsList className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-none border-[3px] border-black bg-white p-1.5 shadow-[0_4px_0px_0px_#1a1a1a] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:flex-col xl:flex-nowrap xl:items-stretch xl:overflow-visible">
              <TabsTrigger value="profile" className="flex-none min-w-[152px] shrink-0 justify-start rounded-none px-4 py-3 font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white sm:min-w-[168px] xl:min-w-0 xl:w-full xl:flex-1">
                <Wallet className="mr-2 h-5 w-5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-none min-w-[152px] shrink-0 justify-start rounded-none px-4 py-3 font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white sm:min-w-[168px] xl:min-w-0 xl:w-full xl:flex-1">
                <FileText className="mr-2 h-5 w-5" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="circles" className="flex-none min-w-[152px] shrink-0 justify-start rounded-none px-4 py-3 font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white sm:min-w-[168px] xl:min-w-0 xl:w-full xl:flex-1">
                <Users className="mr-2 h-5 w-5" />
                My Circles
              </TabsTrigger>
              <TabsTrigger value="reputation" className="flex-none min-w-[152px] shrink-0 justify-start rounded-none px-4 py-3 font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white sm:min-w-[168px] xl:min-w-0 xl:w-full xl:flex-1">
                <Medal className="mr-2 h-5 w-5" />
                Reputation
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-none min-w-[152px] shrink-0 justify-start rounded-none px-4 py-3 font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white sm:min-w-[168px] xl:min-w-0 xl:w-full xl:flex-1">
                <TrendingUp className="mr-2 h-5 w-5" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <div className="neo-panel p-4">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Quick Actions</p>
              <div className="mt-4 grid gap-2">
                <Link to="/circles/create" className="neo-button-primary justify-start">
                  <Plus className="h-4 w-4" />
                  Create Circle
                </Link>
                <Link to="/swap" className="neo-button-secondary justify-start">
                  <ArrowRightLeft className="h-4 w-4" />
                  Open Swap
                </Link>
                <Link to="/batching" className="neo-button-secondary justify-start">
                  <Blocks className="h-4 w-4" />
                  Open Batching
                </Link>
                <Link to="/dca" className="neo-button-secondary justify-start">
                  <Repeat className="h-4 w-4" />
                  Open DCA
                </Link>
                <Link to="/logs" className="inline-flex items-center justify-start gap-2 border-[2px] border-black bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.08em] shadow-[2px_2px_0px_0px_#1a1a1a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1a1a] dark:border-[#3f4c76] dark:bg-[#1d2440] dark:shadow-[2px_2px_0px_0px_#070b17] dark:hover:shadow-[4px_4px_0px_0px_#070b17]">
                  <FileText className="h-4 w-4" />
                  Open Logs
                </Link>
              </div>
            </div>
          </aside>

          <div ref={contentRef} className="mt-1 min-w-0 scroll-mt-24 xl:mt-0">
            <TabsContent value="profile" className="space-y-6">
              <section className="neo-panel neo-spotlight p-6 md:p-8">
                <div className="mb-4 neo-chip bg-white">Profile</div>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  <div className="relative animate-scale-in">
                    <div
                      className="flex h-28 w-28 items-center justify-center border-[3px] border-black md:h-32 md:w-32"
                      style={{ backgroundColor: levelColor }}
                    >
                      <span className="text-4xl font-black text-white md:text-5xl">{address.slice(2, 4)}</span>
                    </div>
                    <div
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap border-[2px] border-black px-4 py-1.5 text-sm font-black"
                      style={{ backgroundColor: levelColor }}
                    >
                      {levelName}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-3xl font-black md:text-4xl">Dashboard Profile</h2>
                        <p className="text-wrap-safe mt-2 font-mono text-sm text-black/55">{address}</p>
                      </div>
                      <div
                        className="inline-flex w-fit items-center border-[2px] border-black px-4 py-2 text-xs font-black uppercase tracking-[0.08em]"
                        style={{ backgroundColor: levelColor }}
                      >
                        {levelName} tier
                      </div>
                    </div>

                    <div className="mt-6 border-[2px] border-black bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-[#4ECDC4]" />
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Tracked Token Balances</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {trackedAssetCards.map((asset) => (
                          <div key={asset.symbol} className="border-[2px] border-black bg-[#FEFAE0] p-4">
                            <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">{asset.symbol}</p>
                            <p className="mt-2 text-2xl font-black tracking-tight">{asset.amount}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Circles Joined</p>
                        <p className="mt-2 text-2xl font-black">{portfolioCircleCount}</p>
                      </div>
                      <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Circles Created</p>
                        <p className="mt-2 text-2xl font-black">{createdCirclesCount}</p>
                      </div>
                      <div className="min-w-0 border-[2px] border-black bg-[#FEFAE0] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Latest Swap</p>
                        <p className="text-wrap-safe mt-2 text-lg font-black">{latestSwapLog ? getWalletActionLabel(latestSwapLog) : 'No swaps yet'}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-black/55">
                          {getWalletActionSupportText(latestSwapLog, 'Use swap to populate this card')}
                        </p>
                      </div>
                      <div className="min-w-0 border-[2px] border-black bg-[#FEFAE0] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Latest DCA</p>
                        <p className="text-wrap-safe mt-2 text-lg font-black">{latestDcaLog ? getWalletActionLabel(latestDcaLog) : 'No DCA yet'}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-black/55">
                          {getWalletActionSupportText(latestDcaLog, 'Create a DCA order to populate this card')}
                        </p>
                      </div>
                      <div className="min-w-0 border-[2px] border-black bg-[#FEFAE0] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Latest Lending</p>
                        <p className="text-wrap-safe mt-2 text-lg font-black">{latestLendingLog ? getWalletActionLabel(latestLendingLog) : 'No lending yet'}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-black/55">
                          {getWalletActionSupportText(latestLendingLog, 'Use lending to populate this card')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="neo-panel p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#FF6B6B]">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Activity Snapshot</p>
                    <h3 className="text-2xl font-black">Wallet + Circle Breakdown</h3>
                  </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Swap Activity</p>
                      <ArrowRightLeft className="h-6 w-6 text-[#DDA0DD]" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Wallet Swaps</p>
                        <p className="mt-2 text-2xl font-black">{swapActionCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Latest Amount</p>
                        <p className="text-wrap-safe mt-2 text-xl font-black">{latestSwapLog ? getWalletActionLabel(latestSwapLog) : 'No swaps yet'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">DCA Activity</p>
                      <Repeat className="h-6 w-6 text-[#FFE66D]" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Wallet DCA Orders</p>
                        <p className="mt-2 text-2xl font-black">{dcaActionCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Latest Plan</p>
                        <p className="text-wrap-safe mt-2 text-xl font-black">{latestDcaLog ? getWalletActionLabel(latestDcaLog) : 'No DCA yet'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Lending Activity</p>
                      <PiggyBank className="h-6 w-6 text-[#96CEB4]" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Wallet Lending Actions</p>
                        <p className="mt-2 text-2xl font-black">{lendingActionCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Latest Amount</p>
                        <p className="text-wrap-safe mt-2 text-xl font-black">{latestLendingLog ? getWalletActionLabel(latestLendingLog) : 'No lending yet'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Circle + Reputation</p>
                      <Users className="h-6 w-6 text-[#FF6B6B]" />
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Circle Events</p>
                        <p className="mt-2 text-2xl font-black">{totalCircleActivityCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/45">Reputation Score</p>
                        <p className="mt-2 text-2xl font-black">{stats?.reputationScore || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
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
                </div>

                <div className="neo-panel p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center border-[2px] border-black bg-[#96CEB4]">
                      <Medal className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Journey Snapshot</p>
                      <h2 className="text-2xl font-black">Trust + Progress</h2>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Current Level</p>
                      <p className="mt-2 text-2xl font-black">{levelName}</p>
                    </div>
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Earned Badges</p>
                      <p className="mt-2 text-2xl font-black">{earnedBadges.length}/{badges.length}</p>
                    </div>
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Circles To Next Tier</p>
                      <p className="mt-2 text-2xl font-black">{currentCirclesJoined}/{nextRequirements.minCircles}</p>
                    </div>
                    <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">On-Time Rate</p>
                      <p className="mt-2 text-2xl font-black">
                        {hasPaymentHistory ? `${currentOnTimeRate}%` : 'No record'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <section className="border-b-[2px] border-black bg-white">
                <div className="px-6 py-6 md:px-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#DDA0DD] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                        <FileText className="h-4 w-4" />
                        Wallet Activity Feed
                      </div>
                      <h2 className="mb-2 text-3xl font-black md:text-4xl">Activity</h2>
                      <p className="max-w-3xl text-[15px] leading-relaxed text-black/70">
                        Review your StarkZap batching, swap, DCA, and lending actions together with CircleSave contract events tied to this wallet and the circles it belongs to.
                      </p>
                    </div>

                    <Button variant="outline" onClick={refreshActivity} className="border-[2px] border-black">
                      <RefreshCcw className="h-4 w-4" />
                      Refresh Activity
                    </Button>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-5">
                {[
                  { label: 'Total Entries', value: combinedActivityEntryCount, color: '#DDA0DD' },
                  { label: 'Batch Actions', value: batchActionCount, color: '#F4A261' },
                  { label: 'Swap Actions', value: swapActionCount, color: '#DDA0DD' },
                  { label: 'DCA Orders', value: dcaActionCount, color: '#FFE66D' },
                  { label: 'Lending Actions', value: lendingActionCount, color: '#96CEB4' },
                ].map((item) => (
                  <div key={item.label} className="border-[2px] border-black bg-white p-5">
                    <div className="mb-3 h-2 w-16 border-[2px] border-black" style={{ backgroundColor: item.color }} />
                    <p className="text-sm font-bold uppercase tracking-[0.08em] text-black/60">{item.label}</p>
                    <p className="mt-2 text-3xl font-black">{item.value}</p>
                  </div>
                ))}
              </section>

              {activityError ? (
                <section className="neo-card p-8">
                  <h3 className="text-2xl font-black">Contract activity is delayed right now</h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/70">
                    {activityError} StarkZap wallet actions saved in this browser can still appear below while contract reads recover.
                  </p>
                </section>
              ) : null}

              {activityRows.length > 0 ? (
                <section className="neo-card overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[720px]">
                      <TableHeader className="bg-black [&_tr]:border-black">
                        <TableRow className="border-black hover:bg-black">
                          <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Event</TableHead>
                          <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Value</TableHead>
                          <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Type</TableHead>
                          <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Updated</TableHead>
                          <TableHead className="px-4 py-4 text-right text-xs font-black uppercase tracking-[0.08em] text-white">Open</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityRows.map((row) => {
                          const meta = LOG_KIND_META[row.kind];
                          const Icon = meta.icon;

                          return (
                            <TableRow
                              key={row.id}
                              tabIndex={0}
                              role="button"
                              onClick={() => setSelectedActivityRow(row)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedActivityRow(row);
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
                                    <p className="font-black">{row.title}</p>
                                    <p className="text-xs uppercase tracking-[0.08em] text-black/50">
                                      {meta.label} • {row.provider}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top text-sm font-black text-black/80">
                                {row.amountText || 'Protocol event'}
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top">
                                <span className={`inline-flex border-[2px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${getActivityToneClasses(row.tone)}`}>
                                  {row.badgeText}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top text-sm text-black/65">
                                {row.updatedAtLabel}
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top text-right">
                                <span className="inline-flex items-center gap-2 text-sm font-black text-black/70">
                                  Details
                                  <MoveRight className="h-4 w-4" />
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              ) : (
                <div className="neo-card p-12 text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-black bg-[#FEFAE0]">
                    <FileText className="h-9 w-9" />
                  </div>
                  <h2 className="mb-3 text-3xl font-black">{activityLoading ? 'Loading Activity...' : 'No Wallet Activity Yet'}</h2>
                  <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-black/70">
                    {activityLoading
                      ? 'Fetching wallet actions and contract events tied to this account.'
                      : 'Use batching, swap, DCA, lending, or circle flows and your wallet activity will appear here.'}
                  </p>
                </div>
              )}
            </TabsContent>

          <TabsContent value="circles">
            {circlesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FF6B6B]" />
                <p className="font-bold text-gray-600 text-lg">Loading circles...</p>
              </div>
            ) : circles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-2">
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

          <TabsContent value="reputation">
            <div className="neo-card p-8">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Identity Layer</p>
                  <h3 className="text-2xl font-black">Reputation & Badges</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="neo-chip bg-[#FEFAE0]">
                    <Trophy className="h-4 w-4 text-[#FFD700]" />
                    {stats?.reputationScore || 0} REP
                  </div>
                  <div className="neo-chip bg-white">
                    <Medal className="h-4 w-4 text-[#FF6B6B]" />
                    {earnedBadges.length}/{badges.length} Earned
                  </div>
                </div>
              </div>
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

          <TabsContent value="analytics">
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
          </div>
        </Tabs>
      </div>

      <Dialog open={!!selectedActivityRow} onOpenChange={(open) => !open && setSelectedActivityRow(null)}>
        <DialogContent className="max-w-2xl border-[3px] border-black bg-white p-0 shadow-[8px_8px_0px_0px_#1a1a1a]">
          {selectedActivityRow && selectedActivityMeta && SelectedActivityIcon ? (
            <div className="p-6 md:p-7">
              <DialogHeader className="border-b-[2px] border-black pb-5 text-left">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center border-[2px] border-black"
                      style={{ backgroundColor: selectedActivityMeta.color }}
                    >
                      <SelectedActivityIcon className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <DialogTitle>{selectedActivityRow.title}</DialogTitle>
                      <DialogDescription className="mt-2 text-sm leading-relaxed text-black/65">
                        {selectedActivityMeta.label} activity for {formatAddress(selectedActivityRow.account)}
                      </DialogDescription>
                    </div>
                  </div>

                  <span className={`inline-flex w-fit border-[2px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${getActivityToneClasses(selectedActivityRow.tone)}`}>
                    {selectedActivityRow.badgeText}
                  </span>
                </div>
              </DialogHeader>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Value</p>
                  <p className="mt-2 text-2xl font-black">
                    {selectedActivityRow.amountText || 'Protocol event'}
                  </p>
                </div>

                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Updated</p>
                  <p className="mt-2 text-lg font-black">{selectedActivityRow.updatedAtLabel}</p>
                </div>

                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Provider</p>
                  <p className="mt-2 text-lg font-black">{selectedActivityRow.provider}</p>
                </div>

                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Account</p>
                  <p className="text-wrap-safe mt-2 font-mono text-sm text-black/75">{selectedActivityRow.account}</p>
                </div>
              </div>

              <div className="mt-4 border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/50">Summary</p>
                <p className="mt-3 text-[15px] leading-relaxed text-black/80">{selectedActivityRow.summary}</p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <a
                  href={selectedActivityRow.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-[2px] border-black bg-[#FEFAE0] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] shadow-[3px_3px_0px_0px_#1a1a1a] transition-transform hover:-translate-y-0.5"
                >
                  {selectedActivityRow.explorerLabel} on Voyager
                  <ExternalLink className="h-4 w-4" />
                </a>

                <Button
                  type="button"
                  variant="outline"
                  className="border-[2px] border-black"
                  onClick={() => setSelectedActivityRow(null)}
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
