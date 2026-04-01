import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownUp,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
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
  type StarkZapExecutionMode,
  type StarkZapSwapComparison,
  type StarkZapSwapProviderId,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useWallet } from '@/hooks/useWallet';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const AMOUNT_PRESETS = ['1', '5', '10'];
const ROUTE_PRESETS: Array<{
  label: string;
  tokenIn: StarkZapTokenKey;
  tokenOut: StarkZapTokenKey;
  helper: string;
  color: string;
}> = [
  { label: 'Faucet Friendly', tokenIn: 'STRK', tokenOut: 'ETH', helper: 'Safest first test route on Sepolia.', color: '#4ECDC4' },
  { label: 'Stable To STRK', tokenIn: 'USDC', tokenOut: 'STRK', helper: 'Convert stable balance into contribution funds.', color: '#FFE66D' },
  { label: 'ETH To STRK', tokenIn: 'ETH', tokenOut: 'STRK', helper: 'Top up STRK balance for circle payments.', color: '#FF6B6B' },
] as const;

function pickComparison(
  comparisons: StarkZapSwapComparison[],
  providerId: StarkZapSwapProviderId,
) {
  if (comparisons.length === 0) return null;
  if (providerId === 'best') return comparisons[0];
  return comparisons.find((comparison) => comparison.providerId === providerId) || comparisons[0];
}

export function SwapPage() {
  const { isConnected, address } = useWallet();
  const {
    compareSwapProviders,
    executeSwap,
    isWalletReady,
    recommendedExecutionMode,
    swapProviderOptions,
  } = useStarkZapActions();
  const [tokenIn, setTokenIn] = useState<StarkZapTokenKey>('STRK');
  const [tokenOut, setTokenOut] = useState<StarkZapTokenKey>('ETH');
  const [amount, setAmount] = useState('5');
  const [providerId, setProviderId] = useState<StarkZapSwapProviderId>('best');
  const [feeMode, setFeeMode] = useState<StarkZapExecutionMode>(recommendedExecutionMode);
  const [comparisons, setComparisons] = useState<StarkZapSwapComparison[]>([]);
  const [lastTx, setLastTx] = useState<{ hash: string; explorerUrl: string } | null>(null);
  const [activeAction, setActiveAction] = useState<'preview' | 'execute' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedRoute = useMemo(
    () => ROUTE_PRESETS.find((route) => route.tokenIn === tokenIn && route.tokenOut === tokenOut),
    [tokenIn, tokenOut],
  );
  const selectedComparison = useMemo(
    () => pickComparison(comparisons, providerId),
    [comparisons, providerId],
  );
  const accountInitializing = isConnected && !isWalletReady;

  useEffect(() => {
    setFeeMode(recommendedExecutionMode);
  }, [recommendedExecutionMode]);

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
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="neo-card max-w-xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-black bg-[#FFE66D]">
            <Wallet className="h-9 w-9" />
          </div>
          <h2 className="mb-3 text-3xl font-black">Connect Your Wallet</h2>
          <p className="text-[15px] leading-relaxed text-black/70">
            Swap uses the same app-wide wallet session. Connect from the header once, then come back here to compare routes and trade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <div className="content-divider-bottom border-b-[2px] border-black bg-white">
        <div className="page-shell py-8 md:py-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#4ECDC4] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <Zap className="h-4 w-4" />
                StarkZap v2 Swap
              </div>
              <h1 className="text-4xl font-black md:text-5xl">Routing Workspace</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
                Compare AVNU and Ekubo, pick the best route or force a venue, then execute with the same wallet session you use across circles, DCA, and lending.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="neo-chip bg-white">
                  <Wallet className="h-4 w-4" />
                  <span className="text-wrap-safe min-w-0 font-mono normal-case tracking-normal">
                    {address}
                  </span>
                </div>
                <div className="neo-chip bg-[#FEFAE0]">
                  <Sparkles className="h-4 w-4" />
                  STRK -&gt; ETH is the cleanest Sepolia first test
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/sdk">
                <Button variant="outline" className="border-[2px] border-black">
                  Help Center
                </Button>
              </Link>
              <Link to="/logs">
                <Button variant="outline" className="border-[2px] border-black">
                  View Swap Logs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell grid gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:py-10">
        {accountInitializing && (
          <div className="xl:col-span-2 border-[2px] border-black bg-[#FFE66D] px-5 py-4 text-sm font-bold leading-relaxed shadow-[3px_3px_0px_0px_#1a1a1a]">
            Wallet session is finishing setup. Swap actions will unlock in a moment.
          </div>
        )}
        <section className="space-y-6">
          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Recommended Routes</p>
                <h2 className="text-2xl font-black">Start From A Proven Pair</h2>
              </div>
              <div className="neo-chip bg-white">Best Route Engine</div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {ROUTE_PRESETS.map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => applyPresetRoute(route)}
                  className={`text-left border-[2px] border-black p-4 transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1a1a] ${
                    route.tokenIn === tokenIn && route.tokenOut === tokenOut ? 'bg-white' : 'bg-[#FEFAE0]'
                  }`}
                >
                  <div
                    className="mb-3 h-3 w-16 border-[2px] border-black"
                    style={{ backgroundColor: route.color }}
                  />
                  <p className="font-black">{route.label}</p>
                  <p className="mt-2 text-sm text-black/65">{route.tokenIn} {'->'} {route.tokenOut}</p>
                  <p className="mt-2 text-sm leading-relaxed text-black/60">{route.helper}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="neo-panel p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Trade Builder</p>
                <h2 className="text-3xl font-black">Build A Route</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {AMOUNT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`border-[2px] border-black px-3 py-1.5 text-sm font-black ${
                      amount === preset ? 'bg-black text-white' : 'bg-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div>
                <p className="mb-2 text-sm font-bold">Sell Token</p>
                <Select value={tokenIn} onValueChange={(value) => setTokenIn(value as StarkZapTokenKey)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {TOKEN_OPTIONS.map((token) => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-center">
                <button
                  type="button"
                  onClick={flipRoute}
                  className="flex h-12 w-12 items-center justify-center border-[2px] border-black bg-[#FEFAE0]"
                  title="Flip route"
                >
                  <ArrowDownUp className="h-5 w-5" />
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Buy Token</p>
                <Select value={tokenOut} onValueChange={(value) => setTokenOut(value as StarkZapTokenKey)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {TOKEN_OPTIONS.map((token) => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Amount</p>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="border-[2px] border-black bg-white"
                  placeholder="5"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Provider</p>
                <Select value={providerId} onValueChange={(value) => setProviderId(value as StarkZapSwapProviderId)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {swapProviderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={handlePreview} disabled={activeAction !== null || !isWalletReady} className="neo-button-secondary">
                {activeAction === 'preview' ? 'Comparing Routes...' : 'Compare Routes'}
              </Button>
              <Button type="button" onClick={handleExecute} disabled={activeAction !== null || !isWalletReady} className="neo-button-primary">
                {activeAction === 'execute' ? 'Submitting Swap...' : 'Execute Swap'}
              </Button>
            </div>

            {errorMessage && (
              <div className="mt-6 border-[2px] border-black bg-[#FF6B6B]/15 p-4">
                <p className="font-black text-[#8b1e1e]">Swap Error</p>
                <p className="mt-1 text-[15px] leading-relaxed text-black/75">{errorMessage}</p>
              </div>
            )}
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Provider Comparison</p>
                <h2 className="text-2xl font-black">AVNU vs Ekubo</h2>
              </div>
              {selectedComparison && <div className="neo-chip bg-[#4ECDC4]">Route Ready</div>}
            </div>
            {comparisons.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {comparisons.map((comparison) => {
                  const isSelected = providerId === 'best'
                    ? comparison.recommended
                    : comparison.providerId === providerId;

                  return (
                    <div
                      key={comparison.providerId}
                      className={`border-[2px] border-black p-5 ${isSelected ? 'bg-white' : 'bg-[#FEFAE0]'}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xl font-black">{comparison.provider}</p>
                        <div className="flex gap-2">
                          {comparison.recommended && (
                            <span className="border-[2px] border-black bg-[#FFE66D] px-2 py-1 text-xs font-black uppercase tracking-[0.08em]">
                              Best Output
                            </span>
                          )}
                          {isSelected && (
                            <span className="border-[2px] border-black bg-[#4ECDC4] px-2 py-1 text-xs font-black uppercase tracking-[0.08em]">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Estimated Output</p>
                      <p className="mt-2 text-3xl font-black">{comparison.amountOut}</p>
                      <div className="mt-4 space-y-2 text-[15px]">
                        <p><span className="font-black">Input:</span> {comparison.amountIn}</p>
                        <p><span className="font-black">Calls:</span> {comparison.callCount}</p>
                        <p><span className="font-black">Price Impact:</span> {comparison.priceImpact || 'Unavailable'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border-[2px] border-black bg-[#FEFAE0] p-5 text-[15px] leading-relaxed text-black/70">
                Compare routes to see which venue gives the best output and whether a forced AVNU or Ekubo route changes call count or price impact.
              </div>
            )}
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#FFE66D]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Execution Notes</p>
                <h2 className="text-2xl font-black">Why This Matters</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                'Best Route mode proves CircleSave understands StarkZap as a multi-provider engine, not a single hardcoded API.',
                'Forced AVNU and Ekubo routing lets judges inspect the actual venue choice and compare outputs directly.',
                'CircleSave uses regular wallet signing for this Cartridge session so swap execution stays stable and predictable.',
              ].map((item) => (
                <div key={item} className="border-[2px] border-black bg-[#FEFAE0] p-4 text-sm leading-relaxed text-black/70">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="neo-sticky-rail space-y-5">
          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#FF6B6B]">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Execution Rail</p>
                <h2 className="text-2xl font-black">Current Route</h2>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Selected Pair</p>
                <p className="mt-2 text-2xl font-black">{tokenIn} {'->'} {tokenOut}</p>
                <p className="mt-2 text-sm text-black/65">{selectedRoute?.helper || 'Custom route selected from the builder.'}</p>
              </div>
              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Route Mode</p>
                <p className="mt-2 text-2xl font-black">
                  {swapProviderOptions.find((option) => option.value === providerId)?.label}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Sell Amount</p>
                  <p className="mt-2 text-xl font-black">{amount || '0'}</p>
                </div>
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Execution</p>
                  <p className="mt-2 text-xl font-black">Regular Signing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Selected Quote</h2>
              {selectedComparison && <div className="neo-chip bg-[#4ECDC4]">Ready</div>}
            </div>
            {selectedComparison ? (
              <div className="space-y-3 text-[15px]">
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Estimated Output</p>
                  <p className="mt-2 text-3xl font-black">{selectedComparison.amountOut}</p>
                </div>
                <p><span className="font-black">Provider:</span> {selectedComparison.provider}</p>
                <p><span className="font-black">Input:</span> {selectedComparison.amountIn}</p>
                <p><span className="font-black">Calls:</span> {selectedComparison.callCount}</p>
                <p><span className="font-black">Price Impact:</span> {selectedComparison.priceImpact || 'Unavailable'}</p>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/70">
                Compare routes first to see expected output, provider choice, and call count before signing in your wallet.
              </p>
            )}
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <h2 className="text-2xl font-black">Last Submitted Transaction</h2>
            </div>
            {lastTx ? (
              <div className="space-y-3">
                <p className="text-wrap-safe font-mono text-sm text-black/60">{lastTx.hash}</p>
                <a
                  href={lastTx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[15px] font-bold underline underline-offset-4"
                >
                  Open on Voyager
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/70">
                Submitted swaps appear here immediately and also get written to the shared logs page.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
