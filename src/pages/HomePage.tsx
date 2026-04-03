import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  BellRing,
  Blocks,
  FileText,
  Moon,
  PiggyBank,
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

const heroGuides = [
  {
    title: 'Queue-first circle orchestration',
    description: 'Create, review, and launch groups from one calm operating shell.',
    icon: Users,
    accent: '#B5F36B',
  },
  {
    title: 'Automation without context switching',
    description: 'Swap, batch, DCA, and lending stay inside the same workflow.',
    icon: Repeat,
    accent: '#FFB457',
  },
  {
    title: 'Readable after every submit',
    description: 'Dashboard activity and public logs keep the work easy to verify.',
    icon: BellRing,
    accent: '#A48DFF',
  },
] as const;

const landingLanes = [
  {
    eyebrow: 'Circle orchestration',
    title: 'Shape a circle, review joins, and launch it from one bright control lane.',
    description: 'Membership state, approvals, and start readiness stay visible instead of getting split across separate screens.',
    accent: '#B5F36B',
    to: '/circles',
  },
  {
    eyebrow: 'Automation routing',
    title: 'Swap, batching, DCA, and Vesu lending move inside the same visual language.',
    description: 'The landing page now mirrors the shell inside the app, so the first impression matches the product you open next.',
    accent: '#FFB457',
    to: '/swap',
  },
  {
    eyebrow: 'Review and proof',
    title: 'Wallet activity, shared logs, and module outcomes stay readable after every action.',
    description: 'Recent submissions and provider outputs are easier to scan when the same dashboard palette carries across the whole product.',
    accent: '#A48DFF',
    to: '/logs',
  },
] as const;

const finalModuleTiles = [
  {
    label: 'Swap',
    description: 'Route the best path with the same bold shell styling.',
    icon: ArrowRightLeft,
    accent: '#B5F36B',
    to: '/swap',
  },
  {
    label: 'Batching',
    description: 'Bundle mixed transfers into one clean motion.',
    icon: Blocks,
    accent: '#FFB457',
    to: '/batching',
  },
  {
    label: 'DCA',
    description: 'Launch recurring buys without leaving the main flow.',
    icon: Repeat,
    accent: '#A48DFF',
    to: '/dca',
  },
  {
    label: 'Lending',
    description: 'Deposit, borrow, repay, and return to circles fast.',
    icon: PiggyBank,
    accent: '#7CC8FF',
    to: '/lending',
  },
] as const;

function LandingWorkspacePreview({
  isDark,
  circleCount,
  activeCount,
  pendingCount,
}: {
  isDark: boolean;
  circleCount: string | number;
  activeCount: string | number;
  pendingCount: string | number;
}) {
  const theme = isDark
    ? {
      shell: '#06080d',
      frame: '#0d1017',
      panel: '#121722',
      soft: '#171d29',
      text: '#f4f7ff',
      muted: 'rgba(231, 238, 255, 0.58)',
      border: 'rgba(255,255,255,0.08)',
      line: 'rgba(255,255,255,0.10)',
      wallet: '#212816',
    }
    : {
      shell: '#f7f2e8',
      frame: '#f3ede3',
      panel: '#fff9f0',
      soft: '#f0e8db',
      text: '#0f172a',
      muted: 'rgba(15, 23, 42, 0.56)',
      border: 'rgba(15,23,42,0.08)',
      line: 'rgba(15,23,42,0.08)',
      wallet: '#dce8bf',
    };

  const statTiles = [
    { label: 'Active circles', value: activeCount, accent: '#B5F36B' },
    { label: 'Ready to launch', value: pendingCount, accent: '#FFB457' },
    { label: 'DCA orders', value: '04', accent: '#A48DFF' },
    { label: 'Lending lanes', value: '02', accent: '#7CC8FF' },
  ];

  const queueRows = [
    { label: 'Approvals', detail: '2 circles waiting on review', accent: '#B5F36B' },
    { label: 'Swaps', detail: 'Best route ready for USDC -> STRK', accent: '#FFB457' },
    { label: 'Logs', detail: 'Explorer receipts synced across lanes', accent: '#A48DFF' },
  ];

  const activityRows = [
    { label: 'Swap route', width: '78%', accent: '#B5F36B' },
    { label: 'Batch send', width: '62%', accent: '#FFB457' },
    { label: 'DCA plan', width: '54%', accent: '#A48DFF' },
    { label: 'Lend health', width: '70%', accent: '#7CC8FF' },
  ];

  const quickTiles = [
    { label: 'Logs', icon: FileText, accent: '#A48DFF' },
    { label: 'Batch', icon: Blocks, accent: '#FFB457' },
    { label: 'Wallet', icon: Wallet, accent: '#B5F36B' },
    { label: 'Lend', icon: PiggyBank, accent: '#7CC8FF' },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[38px] border p-3 shadow-[0_38px_120px_-48px_rgba(0,0,0,0.55)] sm:p-4"
      style={{ backgroundColor: theme.shell, borderColor: theme.border }}
    >
      <div
        className="absolute -left-20 top-8 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(181,243,107,0.18)' }}
      />
      <div
        className="absolute -right-16 bottom-6 h-48 w-48 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(164,141,255,0.18)' }}
      />

      <div
        className="relative rounded-[32px] border p-3 sm:p-4"
        style={{ backgroundColor: theme.frame, borderColor: theme.border }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border px-3 py-3 sm:px-4"
          style={{ backgroundColor: theme.panel, borderColor: theme.border }}
        >
          <div
            className="rounded-[16px] border px-4 py-2 font-display text-base font-semibold tracking-[-0.04em] text-slate-950"
            style={{ backgroundColor: '#B5F36B', borderColor: 'rgba(154,210,85,0.4)' }}
          >
            Dashboard
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[16px] border"
              style={{ backgroundColor: theme.soft, borderColor: theme.border, color: theme.text }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[16px] border"
              style={{ backgroundColor: '#FFB457', borderColor: 'rgba(224,153,56,0.38)', color: '#0f172a' }}
            >
              <BellRing className="h-4 w-4" />
            </div>
            <div
              className="flex min-w-[178px] items-center justify-center gap-2 rounded-[16px] border px-3 py-2 text-sm font-semibold"
              style={{ backgroundColor: theme.wallet, borderColor: 'rgba(181,243,107,0.2)', color: theme.text }}
            >
              <span className="truncate">0x0E...86c2</span>
              <span style={{ color: theme.muted }}>{circleCount} circles</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(290px,0.94fr)]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {statTiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-[24px] border px-4 py-4 shadow-[0_18px_44px_-26px_rgba(0,0,0,0.18)]"
                  style={{ backgroundColor: tile.accent, borderColor: `${tile.accent}66`, color: '#0f172a' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                    {tile.label}
                  </p>
                  <p className="mt-3 font-display text-[1.8rem] font-semibold tracking-[-0.05em]">
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="rounded-[28px] border p-4 sm:p-5"
              style={{ backgroundColor: theme.panel, borderColor: theme.border }}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                    Activity lanes
                  </p>
                  <p className="mt-1 font-display text-[1.45rem] font-semibold tracking-[-0.04em]" style={{ color: theme.text }}>
                    Live operator flow
                  </p>
                </div>
                <ArrowRightLeft className="h-5 w-5" style={{ color: '#B5F36B' }} />
              </div>

              <div className="space-y-4">
                {activityRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: theme.muted }}>
                      {row.label}
                    </p>
                    <div className="h-11 rounded-full p-1" style={{ backgroundColor: theme.soft }}>
                      <div
                        className="flex h-full items-center rounded-full px-4 text-xs font-semibold text-slate-950"
                        style={{ width: row.width, backgroundColor: row.accent }}
                      >
                        Synced
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-[28px] border p-4 sm:p-5"
              style={{ backgroundColor: theme.panel, borderColor: theme.border }}
            >
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                  Control queue
                </p>
                <p className="mt-1 font-display text-[1.45rem] font-semibold tracking-[-0.04em]" style={{ color: theme.text }}>
                  One shell, many actions
                </p>
              </div>

              <div className="space-y-3">
                {queueRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 rounded-[20px] border px-4 py-3"
                    style={{ backgroundColor: theme.soft, borderColor: theme.border }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: theme.text }}>
                        {row.label}
                      </p>
                      <p className="truncate text-xs uppercase tracking-[0.14em]" style={{ color: theme.muted }}>
                        {row.detail}
                      </p>
                    </div>
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950"
                      style={{ backgroundColor: row.accent }}
                    >
                      live
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {quickTiles.map((tile) => {
                const Icon = tile.icon;

                return (
                  <div
                    key={tile.label}
                    className="rounded-[24px] border px-4 py-4"
                    style={{ backgroundColor: theme.panel, borderColor: theme.border }}
                  >
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-[16px] border"
                      style={{ backgroundColor: `${tile.accent}24`, borderColor: `${tile.accent}2e`, color: tile.accent }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>
                      {tile.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const { circles, activeCircles, pendingCircles, isLoading } = useCircles();
  const { isConnected } = useWallet();

  const featuredCircles = circles.slice(0, 3);
  const heroSignals = useMemo(
    () => [
      {
        label: 'Live circles',
        value: isLoading ? '...' : String(circles.length),
        detail: 'deployed groups moving through the shared factory',
        accent: '#B5F36B',
      },
      {
        label: 'Active now',
        value: isLoading ? '...' : String(activeCircles.length),
        detail: 'groups currently progressing through their cycle',
        accent: '#FFB457',
      },
      {
        label: 'Pending setup',
        value: isLoading ? '...' : String(pendingCircles.length),
        detail: 'circles waiting on joins or launch readiness',
        accent: '#A48DFF',
      },
    ],
    [activeCircles.length, circles.length, isLoading, pendingCircles.length],
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
      <div className="min-h-screen bg-[#f3ede3] text-foreground dark:bg-[#05070c]">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(181,243,107,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,180,87,0.16),transparent_26%),radial-gradient(circle_at_76%_78%,rgba(164,141,255,0.14),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(181,243,107,0.14),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(255,180,87,0.14),transparent_24%),radial-gradient(circle_at_76%_78%,rgba(164,141,255,0.14),transparent_28%)]" />
          <div className="absolute inset-x-0 top-0 h-[38rem] bg-[#f7f1e8]/72 dark:bg-[#05070c]/96" />

          <div className="page-shell relative z-10 flex min-h-screen flex-col pb-14 pt-5 sm:pt-6 lg:pb-20 lg:pt-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-3 rounded-[24px] border border-black/10 bg-white/72 px-3.5 py-3 shadow-[0_24px_54px_-34px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_28px_68px_-38px_rgba(0,0,0,0.72)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-black/10 bg-white text-slate-950 shadow-[0_16px_32px_-22px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-none">
                  <Users className="h-5 w-5" />
                </div>
                <span className="rounded-[16px] border border-[#9ad255]/35 bg-[#B5F36B] px-4 py-2 font-display text-[1.45rem] font-bold tracking-[-0.05em] text-slate-950 shadow-[0_18px_38px_-24px_rgba(120,170,43,0.42)]">
                  CircleSave
                </span>
              </Link>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                  className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-black/10 bg-white/72 text-foreground shadow-[0_16px_36px_-24px_rgba(15,23,42,0.26)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:shadow-[0_20px_42px_-28px_rgba(0,0,0,0.82)]"
                >
                  {isDark ? <SunMedium className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </button>
                <Button variant="outline" onClick={handlePrimaryAction} className="h-11 px-4 sm:px-5">
                  {isConnected ? 'Open Workspace' : 'Connect Wallet'}
                </Button>
              </div>
            </div>

            <div className="grid flex-1 items-center gap-12 py-12 lg:py-16 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.08fr)]">
              <div className="max-w-[35rem] animate-slide-in-left">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/68 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-white/58 dark:shadow-none">
                  <Sparkles className="h-3.5 w-3.5" />
                  Starknet savings workspace
                </div>

                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-black/45 dark:text-white/45">
                  CircleSave on Starknet
                </p>
                <h1 className="font-display max-w-[11ch] text-[clamp(3.4rem,8vw,6rem)] font-semibold leading-[0.9] tracking-[-0.07em] text-foreground dark:text-white">
                  One vivid control room for circles and capital flow.
                </h1>
                <p className="mt-5 max-w-[32rem] text-base leading-7 text-black/62 dark:text-white/62 sm:text-lg">
                  The landing page now speaks the same dashboard language as the product itself, with the same lime, orange, violet, and sky accents guiding every move from connect to execution.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" onClick={handlePrimaryAction} className="px-6">
                    {isConnected ? 'Open Circles' : 'Connect And Continue'}
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Button>
                  <Button size="lg" variant="outline" asChild className="px-6">
                    <Link to="/dashboard">
                      View Dashboard
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-9 space-y-3">
                  {heroGuides.map((guide, index) => {
                    const Icon = guide.icon;

                    return (
                      <div
                        key={guide.title}
                        className={`flex items-start gap-3 rounded-[22px] border border-black/10 bg-white/58 px-4 py-3 shadow-[0_20px_42px_-30px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none animate-fade-in stagger-${Math.min(index + 1, 3)}`}
                      >
                        <span
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]"
                          style={{ backgroundColor: `${guide.accent}26`, color: guide.accent }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground dark:text-white">{guide.title}</p>
                          <p className="mt-1 text-sm leading-6 text-black/58 dark:text-white/58">{guide.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[56rem] animate-slide-in-right xl:ml-auto xl:max-w-none">
                <div className="absolute inset-0 rounded-[40px] bg-black/8 blur-3xl dark:bg-white/[0.03]" />
                <div className="relative animate-float">
                  <LandingWorkspacePreview
                    isDark={isDark}
                    circleCount={isLoading ? '...' : circles.length}
                    activeCount={isLoading ? '...' : activeCircles.length}
                    pendingCount={isLoading ? '...' : pendingCircles.length}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-black/8 pt-6 dark:border-white/10 lg:grid-cols-3">
              {heroSignals.map((signal, index) => (
                <div
                  key={signal.label}
                  className={`overflow-hidden rounded-[26px] border border-black/10 bg-white/60 px-5 py-4 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none animate-fade-in stagger-${Math.min(index + 1, 3)}`}
                >
                  <div className="mb-4 h-2.5 w-20 rounded-full" style={{ backgroundColor: signal.accent }} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
                    {signal.label}
                  </p>
                  <p className="mt-3 font-display text-[2rem] font-semibold tracking-[-0.05em] text-foreground dark:text-white">
                    {signal.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/58 dark:text-white/58">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-black/8 dark:border-white/10">
          <div className="page-shell py-16 sm:py-20">
            <div className="grid gap-10 xl:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)]">
              <div className="max-w-[32rem]">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-black/45 dark:text-white/45">
                  Operating lanes
                </p>
                <h2 className="font-display text-[clamp(2.6rem,5vw,4.4rem)] font-semibold tracking-[-0.06em] text-foreground dark:text-white">
                  The whole page now moves with the same dashboard energy.
                </h2>
                <p className="mt-5 text-base leading-7 text-black/60 dark:text-white/60 sm:text-lg">
                  Instead of falling back to neutral product sections, the landing experience stays inside the same bold shell language the app uses after login.
                </p>
                <div className="mt-8">
                  <Button variant="outline" asChild>
                    <Link to="/dashboard">
                      Open Dashboard
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {landingLanes.map((lane, index) => (
                  <Link
                    key={lane.title}
                    to={lane.to}
                    className={`group block overflow-hidden rounded-[30px] border border-black/10 bg-white/64 px-5 py-5 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none dark:hover:bg-white/[0.06] animate-fade-in stagger-${Math.min(index + 1, 3)}`}
                  >
                    <div className="grid gap-5 lg:grid-cols-[140px_minmax(0,1fr)_auto] lg:items-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: lane.accent }}>
                        {lane.eyebrow}
                      </p>
                      <div className="min-w-0">
                        <h3 className="font-display text-[1.8rem] font-semibold tracking-[-0.05em] text-foreground dark:text-white">
                          {lane.title}
                        </h3>
                        <p className="mt-3 max-w-[42rem] text-sm leading-7 text-black/58 dark:text-white/58 sm:text-[15px]">
                          {lane.description}
                        </p>
                      </div>
                      <span
                        className="inline-flex h-fit items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-950"
                        style={{ backgroundColor: lane.accent }}
                      >
                        Open
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-black/8 dark:border-white/10">
          <div className="page-shell py-16 sm:py-20">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[42rem]">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-black/45 dark:text-white/45">
                  Live circles
                </p>
                <h2 className="font-display text-[clamp(2.6rem,5vw,4rem)] font-semibold tracking-[-0.06em] text-foreground dark:text-white">
                  Real circle cards, now sitting inside the same visual world as the hero.
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
              <div className="overflow-hidden rounded-[34px] border border-black/10 bg-white/62 px-6 py-8 text-center shadow-[0_28px_68px_-42px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none sm:px-8 sm:py-10">
                <p className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-foreground dark:text-white">
                  No circles available yet
                </p>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-black/58 dark:text-white/58 sm:text-[15px]">
                  Once circles are live, they will appear here inside the refreshed landing system without breaking the same dashboard palette and atmosphere.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="relative border-t border-black/8 pb-8 dark:border-white/10 sm:pb-12">
          <div className="page-shell py-16 sm:py-20">
            <div className="relative overflow-hidden rounded-[40px] border border-black/10 bg-white/70 px-6 py-7 shadow-[0_30px_88px_-44px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[#0d1016] dark:shadow-[0_34px_96px_-44px_rgba(0,0,0,0.9)] sm:px-8 sm:py-9 lg:px-10">
              <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-[#B5F36B]/18 blur-3xl" />
              <div className="absolute right-0 top-10 h-44 w-44 rounded-full bg-[#FFB457]/18 blur-3xl" />
              <div className="absolute bottom-0 right-12 h-48 w-48 rounded-full bg-[#A48DFF]/18 blur-3xl" />

              <div className="relative grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div className="max-w-[34rem]">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-black/45 dark:text-white/45">
                    Next move
                  </p>
                  <h2 className="font-display text-[clamp(2.7rem,5vw,4.3rem)] font-semibold tracking-[-0.06em] text-foreground dark:text-white">
                    Connect once and move across every lane from the same shell.
                  </h2>
                  <p className="mt-5 text-base leading-7 text-black/60 dark:text-white/60 sm:text-lg">
                    Jump straight into the workspace if you are ready, or open a specific module and keep the same color system, rhythm, and control surfaces across every route.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" onClick={handlePrimaryAction} className="px-6">
                      {isConnected ? 'Open Workspace' : 'Connect Wallet'}
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Button>
                    <Button size="lg" variant="outline" asChild className="px-6">
                      <Link to="/logs">
                        Review Logs
                        <ArrowRight className="h-4.5 w-4.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {finalModuleTiles.map((tile, index) => {
                    const Icon = tile.icon;

                    return (
                      <Link
                        key={tile.label}
                        to={tile.to}
                        className={`group rounded-[28px] border border-black/10 bg-white/60 px-5 py-5 shadow-[0_22px_54px_-34px_rgba(15,23,42,0.14)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_72px_-38px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none dark:hover:bg-white/[0.07] animate-fade-in stagger-${Math.min(index + 1, 4)}`}
                      >
                        <div
                          className="mb-5 flex h-12 w-12 items-center justify-center rounded-[18px]"
                          style={{ backgroundColor: `${tile.accent}26`, color: tile.accent }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-display text-[1.55rem] font-semibold tracking-[-0.05em] text-foreground dark:text-white">
                          {tile.label}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-black/58 dark:text-white/58">
                          {tile.description}
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground dark:text-white">
                          Open module
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
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
