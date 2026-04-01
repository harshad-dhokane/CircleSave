import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  Blocks,
  BookOpen,
  FileText,
  PiggyBank,
  Repeat,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const featureCards = [
  {
    icon: Wallet,
    title: 'Single Wallet Session',
    description:
      'Users connect once from the main app header. The same connected account is reused for StarkZap-powered swap, DCA, and lending actions.',
    color: '#FF6B6B',
  },
  {
    icon: ArrowRightLeft,
    title: 'Swap Page',
    description:
      'Swap uses StarkZap v2 AVNU swap provider logic to quote and prepare calls, then executes them through the connected app wallet.',
    color: '#4ECDC4',
  },
  {
    icon: Repeat,
    title: 'DCA Page',
    description:
      'DCA uses StarkZap v2 AVNU DCA provider logic to preview cycle economics, create orders, and fetch existing orders for the active user.',
    color: '#FFE66D',
  },
  {
    icon: PiggyBank,
    title: 'Lending Page',
    description:
      'Lending uses StarkZap v2 Vesu provider logic to read markets and positions, then deposit or withdraw through the connected wallet.',
    color: '#96CEB4',
  },
  {
    icon: FileText,
    title: 'Unified Logs',
    description:
      'Every StarkZap action writes to one shared logs page with status, account, transaction hash, and Voyager explorer links.',
    color: '#DDA0DD',
  },
  {
    icon: Blocks,
    title: 'SDK Pieces Used',
    description:
      'This build uses StarkZap token presets, Amount helpers, Tx tracking, AVNU swap, AVNU DCA, and Vesu lending provider classes.',
    color: '#F4A261',
  },
] as const;

const actionLinks = [
  {
    href: '/swap',
    title: 'Swap',
    eyebrow: 'AVNU Routing',
    description: 'Trade into or out of STRK with the connected app wallet.',
    color: '#4ECDC4',
    icon: ArrowRightLeft,
  },
  {
    href: '/dca',
    title: 'DCA',
    eyebrow: 'Recurring Orders',
    description: 'Create recurring AVNU-powered DCA orders with one wallet session.',
    color: '#FFE66D',
    icon: Repeat,
  },
  {
    href: '/lending',
    title: 'Lending',
    eyebrow: 'Vesu Markets',
    description: 'Deposit to or withdraw from Vesu without leaving the app account.',
    color: '#96CEB4',
    icon: PiggyBank,
  },
  {
    href: '/logs',
    title: 'Logs',
    eyebrow: 'Voyager Links',
    description: 'Review every StarkZap transaction and jump to Voyager.',
    color: '#DDA0DD',
    icon: FileText,
  },
] as const;

function FeatureCard(props: (typeof featureCards)[number]) {
  const Icon = props.icon;

  return (
    <div className="neo-card h-full p-6">
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center border-[2px] border-black"
        style={{ backgroundColor: props.color }}
      >
        <Icon className="h-5 w-5 text-black" />
      </div>
      <h3 className="mb-3 text-xl font-black">{props.title}</h3>
      <p className="text-[15px] leading-relaxed text-black/70">{props.description}</p>
    </div>
  );
}

function ActionTile(props: (typeof actionLinks)[number]) {
  const Icon = props.icon;

  return (
    <Link to={props.href} className="group block h-full">
      <div className="h-full border-[2px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#1a1a1a] transition-all group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_0px_#1a1a1a]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div
            className="inline-flex items-center gap-2 border-[2px] border-black px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em]"
            style={{ backgroundColor: props.color }}
          >
            {props.eyebrow}
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center border-[2px] border-black"
            style={{ backgroundColor: props.color }}
          >
            <Icon className="h-5 w-5 text-black" />
          </div>
        </div>
        <h3 className="mb-2 text-2xl font-black">{props.title}</h3>
        <p className="min-h-[4.5rem] text-[15px] leading-relaxed text-black/70">{props.description}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em]">
          Open Page
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

export function SdkPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <div className="border-b-[2px] border-black bg-white">
        <div className="page-shell py-8 md:py-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#FFE66D] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <BookOpen className="h-4 w-4" />
                StarkZap SDK v2 Help
              </div>
              <h1 className="mb-2 text-4xl font-black md:text-5xl">SDK Guide</h1>
              <p className="max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
                This page is the help center for the StarkZap v2 integration in CircleSave. It explains what
                SDK features are used and sends users straight into the dedicated product pages where those actions happen.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/swap">
                <Button className="neo-button-primary">
                  <ArrowRightLeft className="h-5 w-5" />
                  Open Swap
                </Button>
              </Link>
              <Link to="/logs">
                <Button variant="outline" className="border-[2px] border-black">
                  <FileText className="h-5 w-5" />
                  View Logs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell space-y-8 py-8 md:py-10">
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.08em] text-black/60">Open A StarkZap Workspace</p>
              <h2 className="text-3xl font-black">Top Actions</h2>
            </div>
            <p className="max-w-xl text-right text-sm leading-relaxed text-black/60">
              These are the live action pages. They all use the same connected CircleSave wallet session.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {actionLinks.map((action) => (
              <ActionTile key={action.href} {...action} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </section>

        <section className="neo-card p-6 md:p-8">
          <h2 className="mb-4 text-2xl font-black">How It Works Now</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border-[2px] border-black bg-[#FEFAE0] p-5">
              <h3 className="mb-2 text-lg font-black">1. Connect Once</h3>
              <p className="text-[15px] leading-relaxed text-black/70">
                Users connect from the app header with Cartridge, Argent, or Braavos. That same account stays active
                across circles, profile, swap, DCA, lending, and logs.
              </p>
            </div>
            <div className="border-[2px] border-black bg-[#FEFAE0] p-5">
              <h3 className="mb-2 text-lg font-black">2. Use Dedicated Action Pages</h3>
              <p className="text-[15px] leading-relaxed text-black/70">
                Swap, DCA, and lending are separated into their own pages so each flow is focused, easier to understand,
                and easier to debug than a mixed SDK demo page.
              </p>
            </div>
            <div className="border-[2px] border-black bg-[#FEFAE0] p-5">
              <h3 className="mb-2 text-lg font-black">3. Execute Through The App Wallet</h3>
              <p className="text-[15px] leading-relaxed text-black/70">
                StarkZap provider logic prepares quotes or contract calls, then the already connected app wallet signs
                and submits those transactions.
              </p>
            </div>
            <div className="border-[2px] border-black bg-[#FEFAE0] p-5">
              <h3 className="mb-2 text-lg font-black">4. Review Shared Logs</h3>
              <p className="text-[15px] leading-relaxed text-black/70">
                Every submitted StarkZap action is written to one logs page with transaction status and a Voyager link.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
