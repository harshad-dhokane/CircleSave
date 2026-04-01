import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowRightLeft,
  PiggyBank,
  Repeat,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

const heroActionCards = [
  {
    title: 'Savings Circles',
    description: 'Create or join verified community groups.',
    icon: Users,
    color: '#FF6B6B',
  },
  {
    title: 'Best-Route Swap',
    description: 'Compare AVNU and Ekubo before routing assets into STRK.',
    icon: ArrowRightLeft,
    color: '#4ECDC4',
  },
  {
    title: 'Recurring DCA',
    description: 'Automate repeat buys and manage them from the same wallet.',
    icon: Repeat,
    color: '#FFE66D',
  },
  {
    title: 'Vesu Lending',
    description: 'Borrow, repay, and fund circles from active positions.',
    icon: PiggyBank,
    color: '#96CEB4',
  },
] as const;

const featurePills = [
  'Single Wallet Session',
  'Best Route + DCA Providers',
  'Voyager-linked Logs',
  'Gasless + Collateral-backed Circles',
];

export function Hero() {
  return (
    <section className="content-divider-bottom relative overflow-hidden border-b-[2px] border-black bg-white">
      <div className="absolute inset-0 neo-grid-bg opacity-[0.18]" />
      <div className="absolute left-[8%] top-16 h-28 w-28 rounded-full bg-[#FF6B6B]/15 blur-3xl" />
      <div className="absolute right-[10%] top-28 h-36 w-36 rounded-full bg-[#4ECDC4]/15 blur-3xl" />

      <div className="page-shell relative z-10 py-10 md:py-14 lg:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.03fr_0.97fr] lg:gap-10">
          <div className="animate-slide-in-left">
            <div className="neo-chip mb-5 bg-white">
              <Sparkles className="h-4 w-4 text-[#FF6B6B]" />
              Built on StarkNet + StarkZap v2
            </div>

            <p className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-black/55">
              Community Finance Workspace
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] md:text-6xl xl:text-[5.35rem]">
              Run savings circles.
              <span className="block text-[#FF6B6B]">Swap into STRK.</span>
              <span className="block">Borrow, lend, and automate.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-black/72 md:text-xl">
              CircleSave turns one Starknet wallet into a full savings workflow: community circles, live
              StarkZap-powered swaps, recurring DCA orders, lending, and contract-backed activity tracking.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/circles">
                <Button size="lg" className="neo-button-primary text-lg px-10 py-7">
                  Explore Circles
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/swap">
                <Button size="lg" variant="outline" className="neo-button-accent text-lg px-10 py-7">
                  Open Swap
                  <ArrowRightLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {featurePills.map((pill, index) => (
                <div
                  key={pill}
                  className={`neo-chip animate-fade-in stagger-${Math.min(index + 1, 4)} bg-[#FEFAE0]`}
                >
                  {pill}
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="neo-stat-tile bg-[#fff8dc]">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">One Session</p>
                <p className="mt-2 text-2xl font-black">Connect Once</p>
                <p className="mt-2 text-sm leading-relaxed text-black/65">
                  Use the same account across circles, swap, DCA, lending, and logs.
                </p>
              </div>
              <div className="neo-stat-tile bg-white">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Funding Flow</p>
                <p className="mt-2 text-2xl font-black">Swap Into STRK</p>
                <p className="mt-2 text-sm leading-relaxed text-black/65">
                  Route assets through StarkZap before you contribute or lock collateral.
                </p>
              </div>
              <div className="neo-stat-tile bg-white">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Automation</p>
                <p className="mt-2 text-2xl font-black">Recurring DCA</p>
                <p className="mt-2 text-sm leading-relaxed text-black/65">
                  Turn one-time intent into a repeatable plan with contract-backed logs and dashboard activity.
                </p>
              </div>
            </div>
          </div>

          <div className="relative animate-slide-in-right">
            <div className="absolute -top-4 right-6 z-20 hidden md:block">
              <div className="neo-chip bg-[#FFE66D] text-black">
                <Shield className="h-4 w-4" />
                Collateral-backed + On-chain
              </div>
            </div>

            <div className="neo-panel neo-spotlight relative overflow-hidden p-6 md:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-70 neo-dot-cluster" />

              <div className="relative z-10">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-black/55">Live Workspace</p>
                    <h2 className="text-3xl font-black md:text-4xl">One Wallet Command Center</h2>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center border-[2px] border-black bg-[#FF6B6B] text-white shadow-[4px_4px_0px_0px_#1a1a1a]">
                    <Wallet className="h-7 w-7" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {heroActionCards.map((card, index) => {
                    const Icon = card.icon;

                    return (
                      <div
                        key={card.title}
                        className={`border-[2px] border-black bg-white p-4 shadow-[3px_3px_0px_0px_#1a1a1a] animate-fade-in stagger-${Math.min(index + 1, 4)}`}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div
                            className="flex h-11 w-11 items-center justify-center border-[2px] border-black"
                            style={{ backgroundColor: card.color }}
                          >
                            <Icon className="h-5 w-5 text-black" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Live</span>
                        </div>
                        <h3 className="text-xl font-black">{card.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-black/65">{card.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="border-[2px] border-black bg-black p-5 text-white shadow-[4px_4px_0px_0px_#1a1a1a]">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-white/60">Wallet State</p>
                    <p className="mt-3 text-3xl font-black">Sepolia Ready</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      Cartridge social login, CircleSave actions, and StarkZap flows all reuse the same account.
                    </p>
                  </div>
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center border-[2px] border-black bg-[#96CEB4]">
                        <PiggyBank className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Portfolio Utility</p>
                        <p className="text-xl font-black">Circles + StarkZap + Logs</p>
                      </div>
                    </div>
                    <div className="neo-divider mb-3" />
                    <p className="text-sm leading-relaxed text-black/65">
                      Fund commitments, automate entries, lend idle assets, and keep a visible audit trail of every wallet action.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 left-5 z-20 hidden md:block">
              <div className="neo-chip animate-drift bg-[#4ECDC4] text-black">
                <ArrowRightLeft className="h-4 w-4" />
                AVNU + Ekubo routing live
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
