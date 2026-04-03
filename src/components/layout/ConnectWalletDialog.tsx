import { useState } from 'react';
import { ChevronRight, Sparkles, Wallet, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';

type ConnectWalletDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
  title?: string;
  description?: string;
};

export function ConnectWalletDialog({
  open,
  onOpenChange,
  onConnected,
  title = 'Connect wallet',
  description = 'Use one Starknet wallet session across circles, swap, DCA, lending, and logs.',
}: ConnectWalletDialogProps) {
  const { walletOptions, isConnecting, connectWallet } = useWallet();
  const { resolvedTheme } = useTheme();
  const [activeConnectorId, setActiveConnectorId] = useState<string | null>(null);
  const isDark = resolvedTheme !== 'light';

  const handleConnect = async (connectorId: string) => {
    setActiveConnectorId(connectorId);
    const didConnect = await connectWallet(connectorId);
    setActiveConnectorId(null);

    if (!didConnect) {
      return;
    }

    onOpenChange(false);
    onConnected?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'overflow-hidden rounded-[28px] p-0 sm:max-w-[560px]',
          isDark
            ? 'border-white/10 bg-[#0b0f15]/96 text-white shadow-[0_40px_96px_-40px_rgba(0,0,0,0.92)]'
            : 'border-black/10 bg-white/92 text-slate-950 shadow-[0_32px_80px_-38px_rgba(15,23,42,0.65)]',
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close wallet dialog"
          className={cn(
            'absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border transition',
            isDark
              ? 'border-white/10 bg-white/8 text-white hover:bg-white/12'
              : 'border-black/10 bg-white/82 text-slate-950 hover:bg-white',
          )}
        >
          <X className="h-4 w-4" />
        </button>

        <div className={cn('px-6 py-5 sm:px-7', isDark ? 'border-b border-white/10' : 'border-b border-black/8')}>
          <div className={cn(
            'mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
            isDark
              ? 'border border-white/10 bg-white/6 text-white/55'
              : 'border border-black/10 bg-black/[0.04] text-black/60',
          )}>
            <Sparkles className="h-3.5 w-3.5" />
            Unified Wallet Session
          </div>
          <DialogHeader>
            <DialogTitle className={cn(
              'font-display text-2xl font-semibold tracking-[-0.04em] sm:text-[2rem]',
              isDark ? 'text-white' : 'text-slate-950',
            )}>
              {title}
            </DialogTitle>
            <DialogDescription className={cn(
              'max-w-xl text-sm leading-6 sm:text-[15px]',
              isDark ? 'text-white/68' : 'text-slate-600',
            )}>
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 py-6 sm:px-7 sm:py-7">
          {walletOptions.map((option) => {
            const isActive = activeConnectorId === option.id;
            const connectorState = option.id === 'controller'
              ? 'Recommended'
              : option.installed
                ? 'Installed'
                : 'Unavailable';

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => void handleConnect(option.id)}
                disabled={isConnecting || !option.installed}
                className={cn(
                  'group flex w-full items-center justify-between gap-4 rounded-[24px] border px-4 py-4 text-left transition duration-200 disabled:cursor-not-allowed disabled:opacity-45 sm:px-5',
                  isDark
                    ? 'border-white/10 bg-white/[0.05] hover:-translate-y-0.5 hover:bg-white/[0.08]'
                    : 'border-black/10 bg-black/[0.02] hover:-translate-y-0.5 hover:bg-black/[0.045]',
                )}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                    isDark
                      ? 'border-white/10 bg-white/8 text-white'
                      : 'border-black/10 bg-white/80 text-slate-950',
                  )}>
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('truncate text-[15px] font-semibold', isDark ? 'text-white' : 'text-slate-950')}>
                      {option.name}
                    </p>
                    <p className={cn('mt-1 text-sm', isDark ? 'text-white/68' : 'text-slate-600')}>
                      {option.id === 'controller'
                        ? 'Social login and fast onboarding for the dashboard workspace.'
                        : 'Use the installed connector and continue in the same management shell.'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={cn(
                    'hidden rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] sm:inline-flex',
                    isDark
                      ? 'border-white/10 bg-white/8 text-white/55'
                      : 'border-black/10 bg-white/70 text-black/60',
                  )}>
                    {isActive || isConnecting ? 'Connecting' : connectorState}
                  </span>
                  <ChevronRight className={cn(
                    'h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5',
                    isDark ? 'text-white/55' : 'text-slate-500',
                  )} />
                </div>
              </button>
            );
          })}
        </div>

        <div className={cn(
          'px-6 py-4 text-xs uppercase tracking-[0.16em] sm:px-7',
          isDark ? 'border-t border-white/10 text-white/50' : 'border-t border-black/8 text-slate-500',
        )}>
          One connection unlocks the full CircleSave workspace.
        </div>
      </DialogContent>
    </Dialog>
  );
}
