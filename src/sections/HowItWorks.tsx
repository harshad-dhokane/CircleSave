import { Link } from 'react-router-dom';
import { ArrowRight, ArrowRightLeft, FileText, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const steps = [
  {
    number: '01',
    icon: Wallet,
    title: 'Connect Once',
    description: 'Connect with Cartridge once in the header. That same account powers circles, swap, DCA, lending, and logs.',
    color: '#B5F36B',
  },
  {
    number: '02',
    icon: Users,
    title: 'Join or Create',
    description: 'Browse existing circles or create your own. Set the monthly amount, member count, and collateral ratio from one shared app flow.',
    color: '#7AE7C7',
  },
  {
    number: '03',
    icon: ArrowRightLeft,
    title: 'Swap or Schedule DCA',
    description: 'Use StarkZap v2 routes inside CircleSave to swap assets or create recurring DCA orders without leaving your connected wallet session.',
    color: '#FFB457',
  },
  {
    number: '04',
    icon: FileText,
    title: 'Track Everything',
    description: 'Public logs show full contract activity, while the dashboard filters the same feed to your wallet and circles, with Voyager links for verification.',
    color: '#7CC8FF',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="neo-panel p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#7AE7C7]/24 bg-[#7AE7C7]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Product Guide
          </span>
          <h2 className="mt-3 font-display text-[1.8rem] font-semibold tracking-[-0.05em] text-foreground md:text-[2.15rem]">
            Start saving in four clear steps
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Move from community savings into live StarkZap actions without switching accounts, tabs, or tools.
          </p>
        </div>

        <Button asChild>
          <Link to="/circles">
            Open Circles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <article
            key={step.number}
            className={cn(
              'flex h-full flex-col rounded-[22px] border border-black/10 bg-black/[0.03] p-5 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_62px_-38px_rgba(0,0,0,0.82)]',
              index === 0 && 'xl:-translate-y-1',
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <span
                className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ backgroundColor: `${step.color}18`, borderColor: `${step.color}55`, color: step.color }}
              >
                Step {step.number}
              </span>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10"
                style={{ backgroundColor: `${step.color}26`, color: step.color, boxShadow: `0 0 18px -6px ${step.color}66` }}
              >
                <step.icon className="h-5 w-5" />
              </div>
            </div>

            <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
