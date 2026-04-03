import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
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
import { useStarkZapModuleStats } from '@/hooks/useStarkZapModuleStats';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/constants';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const TOKEN_PRESETS = ['1', '5', '10'];
const LENDING_ACTIONS: Array<{ value: StarkZapLendingStrategy; label: string }> = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'withdraw_max', label: 'Withdraw Max' },
  { value: 'borrow', label: 'Borrow' },
  { value: 'repay', label: 'Repay' },
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
  const [activeAction, setActiveAction] = useState<'submit' | 'health' | 'max' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const feeMode: StarkZapExecutionMode = 'user_pays';
  const moduleStats = useStarkZapModuleStats('lending');

  const requiresPair = action === 'borrow' || action === 'repay';
  const requiresAmount = action !== 'withdraw_max';

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
      // hook toasts already
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
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <Wallet className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Connect to use lending
          </h2>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid gap-4 xl:items-start xl:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-4">
          <section className="neo-panel p-4 md:p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="neo-chip">
                <Wallet className="h-4 w-4" />
                <span className="text-wrap-safe min-w-0 normal-case tracking-normal">{formatAddress(address || '')}</span>
              </div>
              <CopyButton value={address || ''} successMessage="Wallet address copied" />
              <div className="neo-chip capitalize">{action}</div>
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

            <div className="mb-5 grid gap-3 sm:flex sm:flex-wrap">
              <Button variant="outline" onClick={() => void refresh()} disabled={!isWalletReady || refreshing} className="w-full sm:w-auto">
                <RefreshCcw className="h-4 w-4" />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/logs">
                  <FileText className="h-4 w-4" />
                  Logs
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Action</p>
                  <Select value={action} onValueChange={(value) => setAction(value as StarkZapLendingStrategy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENDING_ACTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{requiresPair ? 'Debt asset' : 'Asset'}</p>
                  <Select value={token} onValueChange={(value) => setToken(value as StarkZapTokenKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKEN_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresPair ? (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Collateral asset</p>
                    <Select value={collateralToken} onValueChange={(value) => setCollateralToken(value as StarkZapTokenKey)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TOKEN_OPTIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              {requiresAmount ? (
                <div className="rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</p>
                      <div className="scrollbar-hidden flex gap-2 overflow-x-auto pb-1">
                        {TOKEN_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(preset)}
                            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                              amount === preset
                                ? 'border-[#9ad255]/35 bg-[#B5F36B] text-slate-950'
                                : 'border-black/10 bg-black/[0.03] text-muted-foreground hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1" />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              {action === 'borrow' ? (
                <Button variant="outline" onClick={handleMaxBorrow} disabled={activeAction !== null || !isWalletReady} className="w-full sm:w-auto">
                  {activeAction === 'max' ? 'Checking...' : 'Max borrow'}
                </Button>
              ) : null}
              {requiresPair ? (
                <Button variant="outline" onClick={handlePreviewHealth} disabled={activeAction !== null || !isWalletReady} className="w-full sm:w-auto">
                  {activeAction === 'health' ? 'Previewing...' : 'Preview health'}
                </Button>
              ) : null}
              <Button onClick={handleSubmit} disabled={activeAction !== null || !isWalletReady} className="w-full sm:w-auto">
                {activeAction === 'submit' ? 'Submitting...' : LENDING_ACTIONS.find((item) => item.value === action)?.label || 'Submit'}
              </Button>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
                {errorMessage}
              </div>
            ) : null}
          </section>

          <section className="neo-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Positions
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Wallet positions
                </h3>
              </div>
            </div>

            {positions.length > 0 ? (
              <div className="space-y-3">
                {positions.map((position, index) => (
                  <div key={`${position.poolName}-${position.type}-${index}`} className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground capitalize">{position.type}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{position.poolName}</span>
                    </div>
                    <p className="mt-3 text-sm text-foreground">Collateral: {position.collateral}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Debt: {position.debt || 'None'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                No lending positions yet.
              </div>
            )}
          </section>
        </section>

        <div className="space-y-4">
          <section className="neo-panel p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Health
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Risk preview
                </h3>
              </div>
              <ShieldCheck className="h-5 w-5 text-[#B5F36B]" />
            </div>

            {health ? (
              <div className="space-y-3">
                <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Simulation
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{health.simulationOk ? 'OK' : 'Risky'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current collateral</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">{health.currentCollateralValue}</p>
                  </div>
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current debt</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">{health.currentDebtValue}</p>
                  </div>
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Projected collateral</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">{health.projectedCollateralValue || 'Unavailable'}</p>
                  </div>
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Projected debt</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">{health.projectedDebtValue || 'Unavailable'}</p>
                  </div>
                </div>
                {health.simulationReason ? (
                  <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
                    {health.simulationReason}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                Preview health for borrow or repay actions.
              </div>
            )}

            {maxBorrow ? (
              <div className="mt-4 rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Max borrow
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">{maxBorrow}</p>
              </div>
            ) : null}
          </section>

          <section className="neo-panel p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Markets
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Snapshot
                </h3>
              </div>
            </div>

            {markets.length > 0 ? (
              <div className="space-y-3">
                {markets.slice(0, 4).map((market) => (
                  <div key={`${market.protocol}-${market.asset}-${market.poolName}`} className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{market.asset}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{market.protocol} • {market.poolName}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950">
                        {market.canBeBorrowed ? 'Borrowable' : 'Supply only'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <p className="text-sm text-foreground">Supply APY: {market.supplyApy || 'Unavailable'}</p>
                      <p className="text-sm text-foreground">Borrow APR: {market.borrowApr || 'Unavailable'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                No market snapshot loaded yet.
              </div>
            )}
          </section>

          <section className="neo-panel p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Last transaction
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Submission
                </h3>
              </div>
            </div>

            {lastTx ? (
              <div className="space-y-3">
                <p className="text-wrap-safe text-sm text-muted-foreground">{lastTx.hash}</p>
                <a
                  href={lastTx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  Open on Voyager
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                No submitted lending transaction yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
