import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownUp,
  ExternalLink,
  FileText,
  Wallet,
} from 'lucide-react';
import { ProcessInfoButton } from '@/components/help/ProcessInfoButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type StarkZapSwapComparison,
  type StarkZapSwapProviderId,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useStarkZapModuleStats } from '@/hooks/useStarkZapModuleStats';
import { useWallet } from '@/hooks/useWallet';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const AMOUNT_PRESETS = ['1', '5', '10'];
const ROUTE_PRESETS: Array<{
  label: string;
  tokenIn: StarkZapTokenKey;
  tokenOut: StarkZapTokenKey;
}> = [
  { label: 'USDC to STRK', tokenIn: 'USDC', tokenOut: 'STRK' },
  { label: 'ETH to STRK', tokenIn: 'ETH', tokenOut: 'STRK' },
  { label: 'STRK to ETH', tokenIn: 'STRK', tokenOut: 'ETH' },
];

function pickComparison(
  comparisons: StarkZapSwapComparison[],
  providerId: StarkZapSwapProviderId,
) {
  if (comparisons.length === 0) return null;
  if (providerId === 'best') return comparisons[0];
  return comparisons.find((comparison) => comparison.providerId === providerId) || comparisons[0];
}

export function SwapPage() {
  const { isConnected } = useWallet();
  const {
    compareSwapProviders,
    executeSwap,
    isWalletReady,
    recommendedExecutionMode,
    supportsSponsoredExecution,
    swapProviderOptions,
  } = useStarkZapActions();
  const [tokenIn, setTokenIn] = useState<StarkZapTokenKey>('USDC');
  const [tokenOut, setTokenOut] = useState<StarkZapTokenKey>('STRK');
  const [amount, setAmount] = useState('5');
  const [providerId, setProviderId] = useState<StarkZapSwapProviderId>('best');
  const [comparisons, setComparisons] = useState<StarkZapSwapComparison[]>([]);
  const [lastTx, setLastTx] = useState<{ hash: string; explorerUrl: string } | null>(null);
  const [activeAction, setActiveAction] = useState<'preview' | 'execute' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const feeMode = recommendedExecutionMode === 'sponsored' && supportsSponsoredExecution
    ? 'sponsored'
    : 'user_pays';
  const moduleStats = useStarkZapModuleStats('swap');

  const selectedComparison = useMemo(
    () => pickComparison(comparisons, providerId),
    [comparisons, providerId],
  );
  const selectedPreset = useMemo(
    () => ROUTE_PRESETS.find((route) => route.tokenIn === tokenIn && route.tokenOut === tokenOut) || null,
    [tokenIn, tokenOut],
  );

  const handlePreview = async () => {
    try {
      setActiveAction('preview');
      setErrorMessage(null);
      setComparisons(await compareSwapProviders({ tokenIn, tokenOut, amount }));
    } catch (error) {
      setComparisons([]);
      setErrorMessage(error instanceof Error ? error.message : 'Swap preview failed');
    } finally {
      setActiveAction(null);
    }
  };

  const handleExecute = async () => {
    try {
      setActiveAction('execute');
      setErrorMessage(null);
      setLastTx(await executeSwap({ tokenIn, tokenOut, amount, providerId, feeMode }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setActiveAction(null);
    }
  };

  const applyPresetRoute = (route: typeof ROUTE_PRESETS[number]) => {
    setTokenIn(route.tokenIn);
    setTokenOut(route.tokenOut);
    setComparisons([]);
    setErrorMessage(null);
  };

  const flipRoute = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setComparisons([]);
    setErrorMessage(null);
  };

  if (!isConnected) {
    return (
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <Wallet className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Connect to use swap
          </h2>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
        <section className="neo-panel p-4 md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Swap
              </p>
              <h2 className="mt-1 font-display text-[1.3rem] font-semibold tracking-[-0.04em] text-foreground">
                Route setup
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick the sell and buy asset, compare live providers, then submit the route you want to use.
              </p>
            </div>
            <ProcessInfoButton
              title="Swap route setup"
              description="This page helps you compare swap routes before sending a transaction."
              items={[
                {
                  label: 'Sell and buy assets',
                  description: 'Sell asset is what leaves your wallet. Buy asset is what you expect to receive after execution.',
                },
                {
                  label: 'Provider',
                  description: 'Best route automatically uses the strongest current quote. Manual provider lets you force a specific route such as AVNU or Ekubo.',
                },
                {
                  label: 'Compare first',
                  description: 'Use Compare to preview outputs and price impact before you send the final swap transaction.',
                },
                {
                  label: 'If you feel stuck',
                  description: 'Start with one of the preset routes and a small amount, then compare before swapping.',
                },
              ]}
            />
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="neo-chip">{selectedPreset?.label || `${tokenIn} to ${tokenOut}`}</div>
              <div className="neo-chip">{providerId === 'best' ? 'Best route' : 'Manual provider'}</div>
            </div>
            <Button variant="sky" size="sm" asChild className="w-full sm:w-auto">
              <Link to="/logs">
                <FileText className="h-4 w-4" />
                Logs
              </Link>
            </Button>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Total transactions', value: String(moduleStats.totalTransactions) },
              { label: 'My transactions', value: String(moduleStats.myTransactions) },
              { label: 'Transaction amount', value: moduleStats.amountLabel },
            ].map((item) => (
              <div key={item.label} className="neo-stat-tile">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground sm:text-base">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="scrollbar-hidden mb-4 flex gap-2 overflow-x-auto pb-1">
            {ROUTE_PRESETS.map((route) => {
              const active = route.tokenIn === tokenIn && route.tokenOut === tokenOut;

              return (
                <button
                  key={route.label}
                  type="button"
                    onClick={() => applyPresetRoute(route)}
                    className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                      active
                      ? 'border-[#66b8ef]/35 bg-[#7CC8FF] text-slate-950'
                      : 'border-black/10 bg-black/[0.03] text-muted-foreground hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
                    }`}
                  >
                  {route.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5 md:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] md:items-end xl:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)_200px]">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sell asset</p>
                <Select value={tokenIn} onValueChange={(value) => setTokenIn(value as StarkZapTokenKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKEN_OPTIONS.map((token) => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-center lg:pb-1">
                <button
                  type="button"
                  onClick={flipRoute}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/[0.03] text-foreground transition hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                  aria-label="Flip route"
                >
                  <ArrowDownUp className="h-4.5 w-4.5" />
                </button>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Buy asset</p>
                <Select value={tokenOut} onValueChange={(value) => setTokenOut(value as StarkZapTokenKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOKEN_OPTIONS.map((token) => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3 xl:col-span-1">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Provider</p>
                <Select value={providerId} onValueChange={(value) => setProviderId(value as StarkZapSwapProviderId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {swapProviderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</p>
                <div className="flex flex-wrap items-center gap-2">
                  {AMOUNT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                        amount === preset
                          ? 'border-[#66b8ef]/35 bg-[#7CC8FF] text-slate-950'
                          : 'border-black/10 bg-black/[0.03] text-muted-foreground hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="5" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={activeAction !== null || !isWalletReady}
              className="w-full border-[#66b8ef]/26 hover:border-[#66b8ef]/38 hover:bg-[#7CC8FF]/14 dark:hover:bg-[#7CC8FF]/14 sm:w-auto"
            >
              {activeAction === 'preview' ? 'Comparing...' : 'Compare'}
            </Button>
            <Button variant="sky" onClick={handleExecute} disabled={activeAction !== null || !isWalletReady} className="w-full sm:w-auto">
              {activeAction === 'execute' ? 'Submitting...' : 'Swap'}
            </Button>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-[20px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <section className="neo-panel p-4 md:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Execution
                </p>
                <h3 className="mt-1 font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                  Result
                </h3>
              </div>
              <ProcessInfoButton
                title="Swap result"
                description="The result panel shows the quote you are currently about to send."
                items={[
                  {
                    label: 'Estimated output',
                    description: 'This is the expected receive amount from the selected comparison, not a guaranteed settlement amount.',
                  },
                  {
                    label: 'Calls and price impact',
                    description: 'Calls show how many contract calls the route uses. Price impact helps you judge how much the swap moves the market.',
                  },
                ]}
              />
            </div>

            {selectedComparison ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Estimated output
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{selectedComparison.amountOut}</p>
                </div>
                <div className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Provider
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedComparison.provider}</p>
                </div>
                <div className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Calls
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedComparison.callCount}</p>
                </div>
                <div className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5 sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Price impact
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedComparison.priceImpact || 'Unavailable'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                Compare routes to load an estimate.
              </div>
            )}
          </section>

          <section className="neo-panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Providers
                </p>
                <h3 className="mt-1 font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                  Comparison
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="neo-chip">{comparisons.length}</div>
                <ProcessInfoButton
                  title="Swap provider comparison"
                  description="This section lets you understand which provider currently has the strongest route."
                  items={[
                    {
                      label: 'Best badge',
                      description: 'The Best badge marks the strongest current comparison returned by the route query.',
                    },
                    {
                      label: 'Active badge',
                      description: 'Active shows which provider you will use if you submit right now.',
                    },
                    {
                      label: 'When to override',
                      description: 'Override Best only when you intentionally want a specific provider or want to compare route behavior manually.',
                    },
                  ]}
                />
              </div>
            </div>

            {comparisons.length > 0 ? (
              <div className="space-y-2">
                {comparisons.map((comparison) => {
                  const isSelected = providerId === 'best'
                    ? comparison.recommended
                    : comparison.providerId === providerId;

                  return (
                    <div
                      key={comparison.providerId}
                      className={`flex items-center justify-between gap-3 rounded-[16px] border px-3.5 py-3 ${
                        isSelected
                          ? 'border-[#66b8ef]/34 bg-[#7CC8FF]/18 dark:bg-[#7CC8FF]/14'
                          : 'border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{comparison.provider}</p>
                        <p className="truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {comparison.amountOut}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {comparison.recommended ? (
                          <span className="rounded-full bg-[#B5F36B]/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                            Best
                          </span>
                        ) : null}
                        {isSelected ? (
                          <span className="rounded-full bg-[#7CC8FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950">
                            Active
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                No provider comparison yet.
              </div>
            )}
          </section>

          <section className="neo-panel p-4 md:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Last transaction
              </p>
              <h3 className="mt-1 font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                Submission
              </h3>
            </div>

            {lastTx ? (
              <div className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-wrap-safe text-sm text-foreground">{lastTx.hash}</p>
                <a
                  href={lastTx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  Open on Voyager
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-black/10 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                No submitted swap yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
