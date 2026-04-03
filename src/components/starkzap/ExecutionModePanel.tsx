import { Sparkles, Wallet } from 'lucide-react';
import { type StarkZapExecutionMode } from '@/hooks/useStarkZapActions';

type ExecutionModePanelProps = {
  value: StarkZapExecutionMode;
  onChange: (value: StarkZapExecutionMode) => void;
  supportsSponsoredExecution: boolean;
  sponsoredExecutionNotice: string | null;
  recommendedExecutionMode: StarkZapExecutionMode;
  title?: string;
  description?: string;
  className?: string;
};

const OPTIONS: Array<{
  value: StarkZapExecutionMode;
  label: string;
  description: string;
  icon: typeof Wallet;
}> = [
  {
    value: 'user_pays',
    label: 'User Pays',
    description: 'Regular wallet signing with normal gas.',
    icon: Wallet,
  },
  {
    value: 'sponsored',
    label: 'Sponsored',
    description: 'Use paymaster execution when the wallet supports it.',
    icon: Sparkles,
  },
];

export function ExecutionModePanel({
  value,
  onChange,
  supportsSponsoredExecution,
  sponsoredExecutionNotice,
  recommendedExecutionMode,
  title = 'Execution mode',
  description = 'Choose how StarkZap transactions should be sent from this workspace.',
  className = '',
}: ExecutionModePanelProps) {
  return (
    <section className={`rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5 ${className}`.trim()}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="neo-chip shrink-0">
          Recommended: {recommendedExecutionMode === 'sponsored' ? 'Sponsored' : 'User Pays'}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const disabled = option.value === 'sponsored' && !supportsSponsoredExecution;
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`rounded-[18px] border px-4 py-3 text-left transition ${
                active
                  ? 'border-[#9ad255]/35 bg-[#B5F36B] text-slate-950 shadow-[0_18px_42px_-28px_rgba(91,132,39,0.44)]'
                  : 'border-black/10 bg-background/70 text-foreground hover:bg-black/[0.04] dark:border-white/10 dark:bg-background/35 dark:hover:bg-white/8'
              } ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border ${
                    active
                      ? 'border-slate-950/12 bg-white/45'
                      : 'border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/8'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className={`mt-1 text-xs leading-5 ${
                      active ? 'text-slate-800/75' : 'text-muted-foreground'
                    }`}>
                      {option.description}
                    </p>
                  </div>
                </div>
                {recommendedExecutionMode === option.value ? (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    active
                      ? 'bg-slate-950/10 text-slate-950'
                      : 'bg-[#B5F36B]/14 text-foreground'
                  }`}>
                    Recommended
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {sponsoredExecutionNotice ? (
        <div className="mt-3 rounded-[16px] border border-amber-500/18 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-900 dark:text-amber-100">
          {sponsoredExecutionNotice}
        </div>
      ) : null}
    </section>
  );
}
