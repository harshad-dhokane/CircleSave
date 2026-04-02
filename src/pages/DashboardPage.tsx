import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useUserCircles } from '@/hooks/useCircle';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { CircleCard } from '@/components/circles/CircleCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRightLeft,
  Blocks,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  PiggyBank,
  Plus,
  Repeat,
  TrendingUp,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { CONTRACTS, formatAddress, formatAmountShort, getVoyagerContractUrl } from '@/lib/constants';

const LOG_KIND_META = {
  batch: { label: 'Batch', color: '#F4A261', icon: Blocks },
  swap: { label: 'Swap', color: '#4ECDC4', icon: ArrowRightLeft },
  dca: { label: 'DCA', color: '#FFE66D', icon: Repeat },
  lending: { label: 'Lending', color: '#96CEB4', icon: PiggyBank },
  staking: { label: 'Staking', color: '#45B7D1', icon: TrendingUp },
} as const;

const quickActions = [
  { to: '/circles', icon: Users, color: '#FF6B6B', title: 'Discover Circles', desc: 'Find new groups and open spots.' },
  { to: '/circles/create', icon: Plus, color: '#4ECDC4', title: 'Create Circle', desc: 'Launch a new community savings plan.' },
  { to: '/swap', icon: ArrowRightLeft, color: '#DDA0DD', title: 'Swap', desc: 'Route into STRK from your connected wallet.' },
  { to: '/batching', icon: Blocks, color: '#F4A261', title: 'Batching', desc: 'Sign multiple transfers in one TxBuilder flow.' },
  { to: '/dca', icon: Repeat, color: '#FFE66D', title: 'DCA', desc: 'Automate recurring buys with one wallet.' },
  { to: '/lending', icon: PiggyBank, color: '#96CEB4', title: 'Lending', desc: 'Put idle assets to work on Vesu.' },
  { to: '/logs', icon: FileText, color: '#F4A261', title: 'Logs', desc: 'Check submitted wallet activity and status.' },
] as const;

export function DashboardPage() {
  const { address, isConnected, balance } = useWallet();
  const { circles, isLoading } = useUserCircles();
  const { logs } = useStarkZapLogs();
  const [activeTab, setActiveTab] = useState('active');

  const activeCircles = circles.filter((circle) => circle.status === 'ACTIVE');
  const pendingCircles = circles.filter((circle) => circle.status === 'PENDING');
  const createdCircles = circles.filter((circle) => address && circle.creator.toLowerCase() === address.toLowerCase());
  const pastCircles = circles.filter((circle) => circle.status === 'COMPLETED' || circle.status === 'FAILED');

  const myLogs = useMemo(() => {
    if (!address) return [];
    return logs.filter((log) => log.account.toLowerCase() === address.toLowerCase());
  }, [address, logs]);

  const recentLogs = myLogs.slice(0, 4);
  const monthlyCommitted = circles.reduce((sum, circle) => sum + circle.monthlyAmount, 0n);
  const lockedCollateral = circles.reduce(
    (sum, circle) => sum + ((circle.monthlyAmount * BigInt(circle.collateralRatio)) / 100n),
    0n,
  );
  const walletBalance = balance ? `${parseFloat(balance.formatted).toFixed(2)} ${balance.symbol}` : '0.00 STRK';

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="neo-panel max-w-2xl p-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border-[3px] border-black bg-[#FFE66D] shadow-[4px_4px_0px_0px_#1a1a1a]">
            <Wallet className="h-11 w-11" />
          </div>
          <div className="neo-chip mb-5 bg-white">Wallet Required</div>
          <h2 className="text-4xl font-black mb-3">Open Your Dashboard</h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-black/70">
            Connect from the header to unlock your circle portfolio, StarkZap activity, quick actions, and on-chain wallet status.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <div className="border-b-[2px] border-black bg-white">
        <div className="page-shell py-8 md:py-10">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <section className="neo-panel neo-spotlight p-6 md:p-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="neo-chip bg-[#FFE66D]">Wallet Workspace</div>
                {CONTRACTS.CIRCLE_FACTORY !== '0x0' && (
                  <a
                    href={getVoyagerContractUrl(CONTRACTS.CIRCLE_FACTORY)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border-[2px] border-black bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.08em] shadow-[2px_2px_0px_0px_#1a1a1a]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Contracts
                  </a>
                )}
              </div>

              <h1 className="text-4xl font-black md:text-5xl">Dashboard</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/70 md:text-base">
                This is your live CircleSave command center: circle exposure, quick StarkZap actions, and recent wallet activity in one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="neo-chip bg-white">
                  <User className="h-4 w-4" />
                  {formatAddress(address!)}
                </div>
                <div className="neo-chip bg-white">
                  <Wallet className="h-4 w-4" />
                  {walletBalance}
                </div>
                <div className="neo-chip bg-[#FEFAE0]">
                  <TrendingUp className="h-4 w-4" />
                  {activeCircles.length} Active Circles
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <div className="neo-stat-tile bg-[#fff8dc]">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Monthly Commitment</p>
                  <p className="mt-2 text-3xl font-black">{formatAmountShort(monthlyCommitted)}</p>
                  <p className="mt-2 text-sm text-black/65">Across every circle linked to this wallet.</p>
                </div>
                <div className="neo-stat-tile bg-white">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Locked Collateral</p>
                  <p className="mt-2 text-3xl font-black">{formatAmountShort(lockedCollateral)}</p>
                  <p className="mt-2 text-sm text-black/65">Current estimated circle security exposure.</p>
                </div>
                <div className="neo-stat-tile bg-white">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Wallet Actions</p>
                  <p className="mt-2 text-3xl font-black">{myLogs.length}</p>
                  <p className="mt-2 text-sm text-black/65">Swap, DCA, and lending entries recorded in logs.</p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/circles/create">
                  <Button className="neo-button-primary">
                    <Plus className="h-5 w-5" />
                    Create Circle
                  </Button>
                </Link>
                <Link to="/swap">
                  <Button className="neo-button-secondary">
                    <ArrowRightLeft className="h-5 w-5" />
                    Open Swap
                  </Button>
                </Link>
                <Link to="/logs">
                  <Button variant="outline" className="border-[2px] border-black font-black">
                    <FileText className="mr-2 h-4 w-4" />
                    Review Logs
                  </Button>
                </Link>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="neo-panel p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center border-[2px] border-black bg-[#4ECDC4]">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">At A Glance</p>
                    <h2 className="text-2xl font-black">Signals</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Active circles', value: activeCircles.length, color: '#4ECDC4' },
                    { label: 'Pending circles', value: pendingCircles.length, color: '#FFE66D' },
                    { label: 'Created by you', value: createdCircles.length, color: '#FF6B6B' },
                    { label: 'Past circles', value: pastCircles.length, color: '#96CEB4' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-[2px] border-black bg-[#FEFAE0] px-4 py-3">
                      <span className="text-sm font-black uppercase tracking-[0.08em]">{item.label}</span>
                      <span className="text-xl font-black" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="neo-panel p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Recent Wallet Activity</p>
                    <h2 className="text-2xl font-black">Latest Moves</h2>
                  </div>
                  <Link to="/logs" className="text-sm font-black uppercase tracking-[0.08em] underline underline-offset-4">
                    Full Logs
                  </Link>
                </div>
                {recentLogs.length > 0 ? (
                  <div className="space-y-3">
                    {recentLogs.map((log) => {
                      const meta = LOG_KIND_META[log.kind];
                      const Icon = meta.icon;

                      return (
                        <div key={log.id} className="border-[2px] border-black bg-white p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center border-[2px] border-black"
                              style={{ backgroundColor: meta.color }}
                            >
                              <Icon className="h-4 w-4 text-black" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black">{log.title}</p>
                              <p className="mt-1 text-sm leading-relaxed text-black/65">{log.summary}</p>
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
                    <h3 className="text-xl font-black">No wallet actions yet</h3>
                    <p className="mt-2 text-sm leading-relaxed text-black/65">
                      Use swap, DCA, or lending and your latest actions will show up here automatically.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="page-shell py-8 md:py-10">
        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Fast Access</p>
              <h2 className="text-3xl font-black">Quick Actions</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {quickActions.map((action, index) => (
              <Link key={action.title} to={action.to} className={`animate-fade-in stagger-${Math.min(index + 1, 6)}`}>
                <div className="neo-panel h-full p-6 hover:bg-[#FEFAE0]">
                  <action.icon className="mb-4 h-10 w-10" style={{ color: action.color }} />
                  <h3 className="text-xl font-black">{action.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-black/65">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Manage Circles</p>
              <h2 className="text-3xl font-black">Your Circle Portfolio</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className={`neo-panel p-6 animate-pulse stagger-${Math.min(index + 1, 4)}`}>
                  <div className="h-3 w-24 bg-black/10" />
                  <div className="mt-4 h-8 w-40 bg-black/10" />
                  <div className="mt-3 h-16 bg-black/10" />
                  <div className="mt-5 h-12 bg-black/10" />
                </div>
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in">
              <TabsList className="sticky top-[5.9rem] z-20 mb-8 flex h-auto w-full flex-wrap justify-start rounded-none border-[2px] border-black bg-white p-1 shadow-[4px_4px_0px_0px_#1a1a1a]">
                <TabsTrigger value="active" className="rounded-none px-5 py-2.5 text-base font-bold data-[state=active]:bg-black data-[state=active]:text-white">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Active ({activeCircles.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-none px-5 py-2.5 text-base font-bold data-[state=active]:bg-black data-[state=active]:text-white">
                  <Clock className="mr-2 h-5 w-5" />
                  Pending ({pendingCircles.length})
                </TabsTrigger>
                <TabsTrigger value="created" className="rounded-none px-5 py-2.5 text-base font-bold data-[state=active]:bg-black data-[state=active]:text-white">
                  <User className="mr-2 h-5 w-5" />
                  Created ({createdCircles.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="rounded-none px-5 py-2.5 text-base font-bold data-[state=active]:bg-black data-[state=active]:text-white">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Past ({pastCircles.length})
                </TabsTrigger>
              </TabsList>

              {['active', 'pending', 'created', 'past'].map((tab) => {
                const tabCircles = tab === 'active'
                  ? activeCircles
                  : tab === 'pending'
                    ? pendingCircles
                    : tab === 'created'
                      ? createdCircles
                      : pastCircles;

                return (
                  <TabsContent key={tab} value={tab}>
                    {tabCircles.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {tabCircles.map((circle, index) => (
                          <div key={circle.id} className={`animate-fade-in stagger-${Math.min(index + 1, 6)}`}>
                            <CircleCard circle={circle} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="neo-panel p-12 text-center animate-fade-in">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-black bg-[#FEFAE0]">
                          <Users className="h-9 w-9 text-black/35" />
                        </div>
                        <h3 className="text-3xl font-black">No {tab} circles yet</h3>
                        <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-black/65">
                          {circles.length === 0
                            ? 'You have not joined or created a circle yet. Start with a new group or discover an existing one.'
                            : `You do not have any circles in the ${tab} state right now.`}
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                          <Link to="/circles">
                            <Button className="neo-button-secondary">Discover Circles</Button>
                          </Link>
                          <Link to="/circles/create">
                            <Button className="neo-button-primary">
                              <Plus className="h-5 w-5" />
                              Create Circle
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </section>
      </div>
    </div>
  );
}
