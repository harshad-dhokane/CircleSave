import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  FileText,
  PiggyBank,
  RefreshCcw,
  ShieldCheck,
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
  type StarkZapLendingHealthView,
  type StarkZapLendingStrategy,
  type StarkZapMarketView,
  type StarkZapPositionView,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useWallet } from '@/hooks/useWallet';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const TOKEN_PRESETS = ['1', '5', '10'];
const LENDING_ACTIONS: Array<{ value: StarkZapLendingStrategy; label: string; helper: string }> = [
  { value: 'deposit', label: 'Deposit', helper: 'Supply idle assets into Vesu through StarkZap.' },
  { value: 'withdraw', label: 'Withdraw', helper: 'Pull a fixed amount out of Vesu.' },
  { value: 'withdraw_max', label: 'Withdraw Max', helper: 'Empty the selected supplied asset in one click.' },
  { value: 'borrow', label: 'Borrow', helper: 'Borrow against a chosen collateral asset and preview health before signing.' },
  { value: 'repay', label: 'Repay', helper: 'Repay outstanding debt while checking the resulting health path.' },
];
export function LendingPage() {
  const { isConnected, address } = useWallet();
  const {
    borrowFromLending,
    depositToLending,
    getMaxBorrowQuote,
    isWalletReady,
    loadLendingMarkets,
    loadLendingPositions,
    quoteLendingHealth,
    recommendedExecutionMode,
    repayToLending,
    withdrawFromLending,
    withdrawMaxFromLending,
  } = useStarkZapActions();
  const [action, setAction] = useState<StarkZapLendingStrategy>('deposit');
  const [token, setToken] = useState<StarkZapTokenKey>('STRK');
  const [collateralToken, setCollateralToken] = useState<StarkZapTokenKey>('ETH');
  const [amount, setAmount] = useState('1');
  const [markets, setMarkets] = useState<StarkZapMarketView[]>([]);
  const [positions, setPositions] = useState<StarkZapPositionView[]>([]);
  const [health, setHealth] = useState<StarkZapLendingHealthView | null>(null);
  const [maxBorrow, setMaxBorrow] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<{ hash: string; explorerUrl: string } | null>(null);
  const [feeMode, setFeeMode] = useState<StarkZapExecutionMode>(recommendedExecutionMode);
  const [activeAction, setActiveAction] = useState<'submit' | 'health' | 'max' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const accountInitializing = isConnected && !isWalletReady;

  const requiresPair = action === 'borrow' || action === 'repay';
  const requiresAmount = action !== 'withdraw_max';

  useEffect(() => {
    setFeeMode(recommendedExecutionMode);
  }, [recommendedExecutionMode]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      const [nextMarkets, nextPositions] = await Promise.all([
        loadLendingMarkets(),
        loadLendingPositions(),
      ]);
      setMarkets(nextMarkets);
      setPositions(nextPositions);
    } catch {
      // Errors are surfaced in the shared hook.
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isWalletReady) return;
    void refresh();
  }, [isWalletReady]);

  const handlePreviewHealth = async () => {
    if (!requiresPair) return;

    try {
      setActiveAction('health');
      setErrorMessage(null);
      setHealth(await quoteLendingHealth({
        action,
        collateralToken,
        debtToken: token,
        amount,
        feeMode,
      }));
    } catch (error) {
      setHealth(null);
      setErrorMessage(error instanceof Error ? error.message : 'Health preview failed');
    } finally {
      setActiveAction(null);
    }
  };

  const handleMaxBorrow = async () => {
    if (action !== 'borrow') return;

    try {
      setActiveAction('max');
      setErrorMessage(null);
      setMaxBorrow(await getMaxBorrowQuote({
        collateralToken,
        debtToken: token,
      }));
    } catch (error) {
      setMaxBorrow(null);
      setErrorMessage(error instanceof Error ? error.message : 'Max borrow quote failed');
    } finally {
      setActiveAction(null);
    }
  };

  const handleSubmit = async () => {
    try {
      setActiveAction('submit');
      setErrorMessage(null);

      let tx: { hash: string; explorerUrl: string };
      if (action === 'deposit') {
        tx = await depositToLending({ token, amount, feeMode });
      } else if (action === 'withdraw') {
        tx = await withdrawFromLending({ token, amount, feeMode });
      } else if (action === 'withdraw_max') {
        tx = await withdrawMaxFromLending({ token, feeMode });
      } else if (action === 'borrow') {
        tx = await borrowFromLending({
          collateralToken,
          debtToken: token,
          amount,
          feeMode,
        });
      } else {
        tx = await repayToLending({
          collateralToken,
          debtToken: token,
          amount,
          feeMode,
        });
      }

      setLastTx(tx);
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Lending action failed');
    } finally {
      setActiveAction(null);
    }
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
            Lending reuses the same CircleSave wallet session. Connect once from the header to access Vesu actions.
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
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#96CEB4] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <Zap className="h-4 w-4" />
                StarkZap v2 Lending
              </div>
              <h1 className="text-4xl font-black md:text-5xl">Vesu Strategy Workspace</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
                Deposit, withdraw, borrow, repay, and preview health inside CircleSave so your savings circles can tap real liquidity instead of isolated demo actions.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="neo-chip bg-white">
                  <Wallet className="h-4 w-4" />
                  <span className="text-wrap-safe min-w-0 font-mono normal-case tracking-normal">
                    {address}
                  </span>
                </div>
                <div className="neo-chip bg-[#FEFAE0]">
                  <ShieldCheck className="h-4 w-4" />
                  Vesu + StarkZap health checks
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void refresh()} disabled={!isWalletReady || refreshing} className="border-[2px] border-black">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Link to="/logs">
                <Button variant="outline" className="border-[2px] border-black">
                  View Logs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell grid gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:py-10">
        {accountInitializing && (
          <div className="xl:col-span-2 border-[2px] border-black bg-[#FFE66D] px-5 py-4 text-sm font-bold leading-relaxed shadow-[3px_3px_0px_0px_#1a1a1a]">
            Wallet session is finishing setup. Lending markets and positions will load automatically in a moment.
          </div>
        )}
        <section className="space-y-6">
          <div className="neo-panel p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Action Builder</p>
                <h2 className="text-3xl font-black">Lend, Borrow, Or Repay</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {TOKEN_PRESETS.map((preset) => (
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="mb-2 text-sm font-bold">Action</p>
                <Select value={action} onValueChange={(value) => setAction(value as StarkZapLendingStrategy)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {LENDING_ACTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-sm text-black/60">
                  {LENDING_ACTIONS.find((item) => item.value === action)?.helper}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">{requiresPair ? 'Debt Asset' : 'Asset'}</p>
                <Select value={token} onValueChange={(value) => setToken(value as StarkZapTokenKey)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {TOKEN_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requiresPair && (
                <div>
                  <p className="mb-2 text-sm font-bold">Collateral Asset</p>
                  <Select value={collateralToken} onValueChange={(value) => setCollateralToken(value as StarkZapTokenKey)}>
                    <SelectTrigger className="w-full border-[2px] border-black bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[2px] border-black">
                      {TOKEN_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {requiresAmount && (
                <div>
                  <p className="mb-2 text-sm font-bold">Amount</p>
                  <Input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="border-[2px] border-black bg-white"
                    placeholder="1"
                  />
                </div>
              )}

            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {action === 'borrow' && (
                <Button type="button" onClick={handleMaxBorrow} disabled={activeAction !== null || !isWalletReady} className="neo-button-secondary">
                  {activeAction === 'max' ? 'Checking Max Borrow...' : 'Get Max Borrow'}
                </Button>
              )}
              {requiresPair && (
                <Button type="button" onClick={handlePreviewHealth} disabled={activeAction !== null || !isWalletReady} className="neo-button-secondary">
                  {activeAction === 'health' ? 'Previewing Health...' : 'Preview Health'}
                </Button>
              )}
              <Button type="button" onClick={handleSubmit} disabled={activeAction !== null || !isWalletReady} className="neo-button-primary">
                {activeAction === 'submit' ? 'Submitting...' : `${LENDING_ACTIONS.find((item) => item.value === action)?.label} Now`}
              </Button>
            </div>

            {errorMessage && (
              <div className="mt-6 border-[2px] border-black bg-[#FF6B6B]/15 p-4">
                <p className="font-black text-[#8b1e1e]">Lending Error</p>
                <p className="mt-1 text-[15px] leading-relaxed text-black/75">{errorMessage}</p>
              </div>
            )}
          </div>

          <div className="neo-panel p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <PiggyBank className="h-6 w-6" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Market Snapshot</p>
                <h2 className="text-2xl font-black">Live Markets</h2>
              </div>
            </div>
            {markets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {markets.map((market) => (
                  <div key={`${market.protocol}-${market.asset}-${market.poolName}`} className="border-[2px] border-black bg-[#FEFAE0] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black">{market.asset}</p>
                        <p className="mt-1 text-sm text-black/60">{market.protocol} • {market.poolName}</p>
                      </div>
                      <div className="border-[2px] border-black bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.08em]">
                        {market.canBeBorrowed ? 'Borrowable' : 'Supply Only'}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-[15px]">
                      <p><span className="font-black">Supply APY:</span> {market.supplyApy || 'Unavailable'}</p>
                      <p><span className="font-black">Borrow APR:</span> {market.borrowApr || 'Unavailable'}</p>
                      <p><span className="font-black">Supplied:</span> {market.totalSupplied || 'Unavailable'}</p>
                      <p><span className="font-black">Borrowed:</span> {market.totalBorrowed || 'Unavailable'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-[2px] border-black bg-[#FEFAE0] p-6 text-center">
                <PiggyBank className="mx-auto mb-3 h-10 w-10 text-black/25" />
                <h3 className="text-xl font-black">No market snapshot yet</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/65">
                  Refresh the page data to load the latest Vesu market snapshot for this wallet session.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="neo-sticky-rail space-y-5">
          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#FFE66D]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Execution Rail</p>
                <h2 className="text-2xl font-black">Current Setup</h2>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Action</p>
                <p className="mt-2 text-2xl font-black">{LENDING_ACTIONS.find((item) => item.value === action)?.label}</p>
              </div>
              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">{requiresPair ? 'Debt / Collateral' : 'Selected Asset'}</p>
                <p className="mt-2 text-xl font-black">
                  {requiresPair ? `${token} / ${collateralToken}` : token}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Amount</p>
                  <p className="mt-2 text-xl font-black">{requiresAmount ? amount || '0' : 'Max'}</p>
                </div>
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Execution</p>
                  <p className="mt-2 text-xl font-black">Regular Signing</p>
                </div>
              </div>
              {maxBorrow && (
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Max Borrow</p>
                  <p className="mt-2 text-2xl font-black">{maxBorrow}</p>
                </div>
              )}
            </div>
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-2xl font-black">Health Preview</h2>
            </div>
            {health ? (
              <div className="space-y-3 text-[15px]">
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Simulation</p>
                  <p className="mt-2 text-3xl font-black">{health.simulationOk ? 'OK' : 'Risky'}</p>
                </div>
                <p><span className="font-black">Current Collateral:</span> {health.currentCollateralValue}</p>
                <p><span className="font-black">Current Debt:</span> {health.currentDebtValue}</p>
                <p><span className="font-black">Projected Collateral:</span> {health.projectedCollateralValue || 'Unavailable'}</p>
                <p><span className="font-black">Projected Debt:</span> {health.projectedDebtValue || 'Unavailable'}</p>
                <p><span className="font-black">Max Borrow:</span> {health.maxBorrowAmount || maxBorrow || 'Unavailable'}</p>
                {!health.simulationOk && health.simulationReason && (
                  <p className="text-[#8b1e1e]"><span className="font-black">Reason:</span> {health.simulationReason}</p>
                )}
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/70">
                Borrow and repay flows can preview projected health before you sign, so you can show judges the risk tooling behind the lending integration.
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
                Submitted lending actions appear here immediately and also get written to the shared logs page.
              </p>
            )}
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <PiggyBank className="h-5 w-5" />
              <h2 className="text-2xl font-black">Wallet Positions</h2>
            </div>
            {positions.length > 0 ? (
              <div className="space-y-3">
                {positions.map((position, index) => (
                  <div key={`${position.poolName}-${position.type}-${index}`} className="border-[2px] border-black bg-[#FEFAE0] p-4">
                    <p className="font-black capitalize">{position.type}</p>
                    <p className="mt-1 text-sm text-black/60">{position.poolName}</p>
                    <p className="mt-3 text-[15px]"><span className="font-black">Collateral:</span> {position.collateral}</p>
                    <p className="text-[15px]"><span className="font-black">Debt:</span> {position.debt || 'None'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/70">
                No lending positions found for this wallet yet.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
