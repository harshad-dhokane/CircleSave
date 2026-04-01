import { Link } from 'react-router-dom';
import { ArrowRight, ArrowRightLeft, FileText, PiggyBank, Repeat, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const implementationPoints = [
  {
    title: 'One Wallet Session',
    description: 'Users connect once from the main header, then reuse that same account for circles, swap, DCA, lending, and logs.',
    color: '#FF6B6B',
  },
  {
    title: 'AVNU Swap Live',
    description: 'StarkZap swap preview and execution are now live in the app, so users can route token trades without leaving CircleSave.',
    color: '#4ECDC4',
  },
  {
    title: 'AVNU DCA Live',
    description: 'Recurring DCA orders are supported through StarkZap v2, with the same wallet identity used across the rest of the product.',
    color: '#FFE66D',
  },
  {
    title: 'Shared Logs + Voyager',
    description: 'Every StarkZap action is written to shared logs with status tracking and direct explorer links for verification.',
    color: '#DDA0DD',
  },
] as const;

const actionLanes = [
  {
    href: '/swap',
    title: 'Open Swap',
    description: 'Preview quotes and execute live routes from your connected app wallet.',
    icon: ArrowRightLeft,
    color: '#4ECDC4',
  },
  {
    href: '/dca',
    title: 'Open DCA',
    description: 'Create recurring buys with StarkZap v2 from the same account you use for circles.',
    icon: Repeat,
    color: '#FFE66D',
  },
  {
    href: '/lending',
    title: 'Open Lending',
    description: 'Move into Vesu lending without a separate login or isolated SDK wallet flow.',
    icon: PiggyBank,
    color: '#96CEB4',
  },
  {
    href: '/logs',
    title: 'Review Logs',
    description: 'Check submitted StarkZap activity and jump to Voyager from one shared audit trail.',
    icon: FileText,
    color: '#FF6B6B',
  },
] as const;

export function StarkZapShowcase() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="absolute inset-0 neo-grid-bg opacity-20" />

      <div className="page-shell relative z-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="animate-fade-in">
            <div className="mb-4 inline-flex items-center gap-2 border-[3px] border-black bg-[#FFE66D] px-5 py-2.5 shadow-[4px_4px_0px_0px_#1a1a1a]">
              <Wallet className="h-5 w-5" />
              <span className="text-base font-black uppercase tracking-[0.08em]">New In This Build</span>
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">
              StarkZap swap and DCA are now part of the core
              <span className="text-[#FF6B6B]"> CircleSave workflow.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/70">
              The landing page now reflects the real implementation: users connect one wallet, explore circles,
              swap through StarkZap, create recurring DCA orders, and verify activity from shared logs.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {implementationPoints.map((item, index) => (
                <div
                  key={item.title}
                  className={`animate-fade-in stagger-${index + 1} border-[3px] border-black bg-[#FEFAE0] p-5 shadow-[4px_4px_0px_0px_#1a1a1a]`}
                >
                  <div
                    className="mb-4 h-3 w-20 border-[2px] border-black"
                    style={{ backgroundColor: item.color }}
                  />
                  <h3 className="mb-2 text-xl font-black">{item.title}</h3>
                  <p className="text-[15px] leading-relaxed text-black/70">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/sdk">
                <Button className="neo-button-primary">
                  Open SDK Guide
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="border-[3px] border-black font-black">
                  View Profile Activity
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {actionLanes.map((lane, index) => {
              const Icon = lane.icon;

              return (
                <Link key={lane.href} to={lane.href} className={`block animate-fade-in stagger-${index + 2}`}>
                  <div className="group flex items-center justify-between gap-4 border-[3px] border-black bg-white px-6 py-5 shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_#1a1a1a]">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center border-[3px] border-black"
                        style={{ backgroundColor: lane.color }}
                      >
                        <Icon className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">{lane.title}</h3>
                        <p className="text-[15px] leading-relaxed text-black/70">{lane.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
