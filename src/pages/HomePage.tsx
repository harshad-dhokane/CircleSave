import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  BellRing,
  Moon,
  Repeat,
  Sparkles,
  SunMedium,
  Users,
  Wallet,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { CircleCard } from '@/components/circles/CircleCard';
import { Footer } from '@/components/layout/Footer';
import { ConnectWalletDialog } from '@/components/layout/ConnectWalletDialog';
import { useCircles } from '@/hooks/useCircle';
import { useWallet } from '@/hooks/useWallet';
import { appNavigationSections } from '@/lib/navigation';

const operationalPillars = [
  {
    title: 'Circle management',
    description: 'Create, review, and monitor contribution groups with clean status visibility.',
    icon: Users,
    accent: '#B5F36B',
  },
  {
    title: 'Automation tools',
    description: 'Run swap, batching, DCA, and lending from the same connected wallet session.',
    icon: Repeat,
    accent: '#FFB457',
  },
  {
    title: 'Operational logs',
    description: 'Keep wallet actions and provider outcomes visible in one review-friendly workspace.',
    icon: BellRing,
    accent: '#7CC8FF',
  },
] as const;

const workflowSteps = [
  {
    title: 'Connect once',
    description: 'Open a Starknet wallet session from the landing page and move directly into the dashboard shell.',
  },
  {
    title: 'Manage circles',
    description: 'Review active groups, approvals, and funding requirements without switching layouts.',
  },
  {
    title: 'Run automations',
    description: 'Use swap, DCA, lending, and logs from the same left-hand workspace navigation.',
  },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const { circles, activeCircles, pendingCircles, isLoading } = useCircles();
  const { isConnected } = useWallet();

  const featuredCircles = circles.slice(0, 3);
  const managementModules = useMemo(
    () => appNavigationSections
      .flatMap((section) => section.items)
      .filter((item) => ['/dashboard', '/circles', '/swap', '/dca', '/lending', '/logs'].includes(item.to)),
    [],
  );

  const handlePrimaryAction = () => {
    if (isConnected) {
      navigate('/circles');
      return;
    }

    setWalletDialogOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-black/8 dark:border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(181,243,107,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,200,255,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,247,252,0.82))] dark:bg-[radial-gradient(circle_at_top_left,rgba(181,243,107,0.18),transparent_26%),radial-gradient(circle_at_top_right,rgba(124,200,255,0.16),transparent_30%),linear-gradient(180deg,rgba(7,9,15,0.96),rgba(11,15,23,0.94))]" />
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3))] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.03))] lg:block" />

          <div className="page-shell relative z-10 py-5 sm:py-6 lg:py-7">
            <div className="mb-10 flex items-center justify-between gap-4 xl:mb-16">
              <Link
                to="/"
                className="rounded-[20px] border border-black/10 bg-[linear-gradient(145deg,rgba(181,243,107,0.18),rgba(124,200,255,0.12)_48%,rgba(255,180,87,0.12))] px-3.5 py-3 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(181,243,107,0.12),rgba(124,200,255,0.08)_48%,rgba(255,180,87,0.08))] dark:shadow-[0_24px_48px_-34px_rgba(0,0,0,0.76)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-black/10 bg-white/74 text-slate-950 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-white/8 dark:text-white dark:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.7)]">
                    <Users className="h-5.5 w-5.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="bg-[linear-gradient(120deg,#B5F36B_0%,#7CC8FF_52%,#FFB457_100%)] bg-clip-text font-display text-[1.45rem] font-bold leading-none tracking-[-0.05em] text-transparent">
                      CircleSave
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/72 text-foreground shadow-[0_16px_36px_-24px_rgba(15,23,42,0.32)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.82)]"
                >
                  {isDark ? <SunMedium className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </button>
                <Button variant="outline" onClick={handlePrimaryAction} className="h-11 px-4 sm:px-5">
                  {isConnected ? 'Open Circles' : 'Connect Wallet'}
                </Button>
              </div>
            </div>

            <div className="grid items-start gap-12 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,0.96fr)] xl:gap-10 2xl:gap-16">
              <div className="animate-slide-in-left xl:max-w-[38rem] xl:pt-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60 dark:border-white/10 dark:bg-white/6 dark:text-white/55">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live savings workspace
                </div>

                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Operational finance on Starknet
                </p>
                <h1 className="font-display max-w-[12ch] text-[clamp(3.45rem,8vw,5.7rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-foreground">
                  Run circles, route funds, and manage activity from one clean shell.
                </h1>
                <p className="mt-6 max-w-[34rem] text-base leading-7 text-muted-foreground sm:text-lg">
                  CircleSave now opens into a compact management-style workspace with a sidebar, unified wallet session,
                  top-right notifications, and a cleaner operating flow for circles, StarkZap routes, DCA, lending, and logs.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={handlePrimaryAction} className="px-6">
                    {isConnected ? 'Open Dashboard' : 'Connect And Continue'}
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Button>
                  <Button size="lg" variant="outline" asChild className="px-6">
                    <Link to="/circles">
                      Explore Circles
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  <div className="neo-stat-tile">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Live circles
                    </p>
                    <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
                      {isLoading ? '...' : circles.length}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">All groups across the connected factory.</p>
                  </div>
                  <div className="neo-stat-tile">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Active now
                    </p>
                    <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
                      {isLoading ? '...' : activeCircles.length}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">Circle workflows currently in progress.</p>
                  </div>
                  <div className="neo-stat-tile">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Pending setup
                    </p>
                    <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
                      {isLoading ? '...' : pendingCircles.length}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">Circles waiting on members or launch.</p>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[48rem] animate-slide-in-right xl:ml-auto xl:max-w-none">
                <div className="absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_top_left,rgba(181,243,107,0.25),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,180,87,0.2),transparent_24%)] blur-3xl" />
                <div className="relative overflow-hidden rounded-[34px] border border-white/8 bg-[#05070c] p-4 shadow-[0_34px_100px_-38px_rgba(0,0,0,0.92)] sm:p-5 lg:p-6">
                  <div className="grid items-start gap-4 lg:grid-cols-[108px_minmax(0,1fr)]">
                    <div className="hidden rounded-[26px] border border-white/8 bg-white/[0.04] p-3 lg:block">
                      <div className="mb-5 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-900">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
                          Menu
                        </span>
                      </div>
                      <div className="space-y-2">
                        {['Dashboard', 'Circles', 'Swap', 'Logs'].map((item, index) => (
                          <div
                            key={item}
                            className={index === 0
                              ? 'rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold text-white'
                              : 'rounded-2xl px-3 py-2 text-sm text-white/46'}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-0 space-y-4">
                      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Dashboard</p>
                          <p className="mt-1 font-display text-[clamp(1.8rem,3vw,2.4rem)] font-semibold tracking-[-0.04em] text-white">
                            Management View
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.05] text-white">
                            <BellRing className="h-4 w-4" />
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white text-slate-900">
                            <Wallet className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Circles</p>
                          <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-white">
                            {isLoading ? '...' : circles.length}
                          </p>
                        </div>
                        <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Routes</p>
                          <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-white">
                            4
                          </p>
                        </div>
                        <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Logs</p>
                          <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-white">
                            Live
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Operations timeline</p>
                            <p className="mt-1 font-display text-xl font-semibold tracking-[-0.03em] text-white">
                              Recent wallet flows
                            </p>
                          </div>
                          <ArrowRightLeft className="h-5 w-5 text-[#B5F36B]" />
                        </div>

                        <div className="space-y-3">
                          {[
                            { label: 'Swap route', width: '78%', color: '#B5F36B' },
                            { label: 'Batch submit', width: '54%', color: '#FFB457' },
                            { label: 'DCA setup', width: '66%', color: '#A48DFF' },
                            { label: 'Lending sync', width: '48%', color: '#7AE7C7' },
                          ].map((lane) => (
                            <div key={lane.label} className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[94px_minmax(0,1fr)]">
                              <p className="text-xs uppercase tracking-[0.14em] text-white/42">{lane.label}</p>
                              <div className="h-11 rounded-full bg-white/[0.06] p-1">
                                <div
                                  className="flex h-full items-center rounded-full px-4 text-xs font-semibold text-slate-950"
                                  style={{ width: lane.width, backgroundColor: lane.color }}
                                >
                                  Synced
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="neo-section">
          <div className="page-shell">
            <div className="mb-8 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Why this layout works
              </p>
              <h2 className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-[3.15rem]">
                Built like a control room, not a landing page pretending to be one.
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {operationalPillars.map((pillar, index) => {
                const Icon = pillar.icon;

                return (
                  <div key={pillar.title} className={`neo-panel animate-fade-in p-6 stagger-${Math.min(index + 1, 3)}`}>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10" style={{ backgroundColor: `${pillar.accent}26`, color: pillar.accent }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-black/8 py-16 dark:border-white/10 sm:py-20">
          <div className="page-shell">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Workflow
                </p>
                <h2 className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-[3rem]">
                  One connect action, then CircleSave opens into circles first.
                </h2>
              </div>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Preview Dashboard</Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className={`neo-panel p-6 animate-fade-in stagger-${Math.min(index + 1, 3)}`}>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.04] text-sm font-semibold dark:border-white/10 dark:bg-white/6">
                    0{index + 1}
                  </div>
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="neo-section">
          <div className="page-shell">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Featured circles
                </p>
                <h2 className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-[3rem]">
                  Use the new workspace theme with the same CircleSave options and data.
                </h2>
              </div>
              <Button variant="outline" asChild>
                <Link to="/circles">
                  View all circles
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              </Button>
            </div>

            {featuredCircles.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {featuredCircles.map((circle, index) => (
                  <div key={circle.id} className={`animate-fade-in stagger-${Math.min(index + 1, 3)}`}>
                    <CircleCard circle={circle} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="neo-panel p-8 text-center sm:p-10">
                <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  No circles available yet
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  Once deployed circles are available, they will appear here inside the updated management-style theme.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="page-shell">
            <div className="mb-8 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Product modules
              </p>
              <h2 className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-[3rem]">
                Your existing tools, reorganized into a cleaner management system.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {managementModules.map((module, index) => {
                const Icon = module.icon;

                return (
                  <Link
                    key={module.to}
                    to={module.to}
                    className={`neo-panel group flex h-full flex-col justify-between p-6 animate-fade-in stagger-${Math.min(index + 1, 6)}`}
                  >
                    <div>
                      <div
                        className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: `${module.accent}24`, color: module.accent }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                        {module.label}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                        {module.description}
                      </p>
                    </div>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                      Open module
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <Footer />

      <ConnectWalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        onConnected={() => navigate('/circles')}
        title="Connect to open circles"
        description="Once connected, CircleSave opens into the circles workspace first, with swap, DCA, lending, and logs in the same shell."
      />
    </>
  );
}
