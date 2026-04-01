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
    title: 'Best Route Swap',
    description: 'Swap now compares AVNU and Ekubo, shows best-route output, and can execute with sponsored mode when available.',
    color: '#4ECDC4',
  },
  {
    title: 'Circle Automation',
    description: 'New circles can launch with attached DCA plans, and existing circles can be funded from swap or lending flows in one sequence.',
    color: '#FFE66D',
  },
  {
    title: 'Public Proof Layer',
    description: 'On-chain circle data now feeds leaderboard reputation, and the logs page surfaces public factory, circle, reputation, and collateral events with Voyager links.',
    color: '#96CEB4',
  },
] as const;

const actionLanes = [
  {
    href: '/swap',
    title: 'Open Swap',
    description: 'Preview AVNU vs Ekubo and execute the route that best fits the moment.',
    icon: ArrowRightLeft,
    color: '#4ECDC4',
  },
  {
    href: '/dca',
    title: 'Open DCA',
    description: 'Create, review, and cancel recurring provider-aware DCA plans from the same account you use for circles.',
    icon: Repeat,
    color: '#FFE66D',
  },
  {
    href: '/lending',
    title: 'Open Lending',
    description: 'Deposit, withdraw, borrow, and repay on Vesu while previewing health and max-borrow limits.',
    icon: PiggyBank,
    color: '#96CEB4',
  },
  {
    href: '/logs',
    title: 'Review Logs',
    description: 'Browse public CircleSave contract activity and jump to Voyager from one shared audit trail.',
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
              StarkZap liquidity and automation are now part of the core
              <span className="text-[#FF6B6B]"> CircleSave workflow.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/70">
              The landing page now reflects the real implementation: users connect one wallet, explore circles,
              route through StarkZap providers, automate recurring funding, tap Vesu positions, and verify public contract activity plus reputation from the same app.
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
                  Open Help Center
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="border-[3px] border-black font-black">
                  Open Dashboard
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
