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
  type StarkZapMarketView,
  type StarkZapPositionView,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useWallet } from '@/hooks/useWallet';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const TOKEN_PRESETS = ['1', '5', '10'];

export function LendingPage() {
  const { isConnected, address } = useWallet();
  const {
    loadLendingMarkets,
    loadLendingPositions,
    depositToLending,
    withdrawFromLending,
  } = useStarkZapActions();
  const [token, setToken] = useState<StarkZapTokenKey>('STRK');
  const [amount, setAmount] = useState('1');
  const [markets, setMarkets] = useState<StarkZapMarketView[]>([]);
  const [positions, setPositions] = useState<StarkZapPositionView[]>([]);
  const [lastTx, setLastTx] = useState<{ hash: string; explorerUrl: string } | null>(null);
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (!isConnected) return;
    void refresh();
  }, [isConnected]);

  const handleDeposit = async () => {
    try {
      setActiveAction('deposit');
      setErrorMessage(null);
      const tx = await depositToLending({ token, amount });
      setLastTx(tx);
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Deposit failed');
    } finally {
      setActiveAction(null);
    }
  };

  const handleWithdraw = async () => {
    try {
      setActiveAction('withdraw');
      setErrorMessage(null);
      const tx = await withdrawFromLending({ token, amount });
      setLastTx(tx);
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Withdraw failed');
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
      <div className="border-b-[2px] border-black bg-white">
        <div className="page-shell py-8 md:py-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#96CEB4] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <Zap className="h-4 w-4" />
                StarkZap v2 Lending
              </div>
              <h1 className="text-4xl font-black md:text-5xl">Lending Workspace</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
                Deposit or withdraw through StarkZap&apos;s Vesu provider using the same CircleSave wallet session, then track positions and logs without switching context.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="neo-chip bg-white">
                  <Wallet className="h-4 w-4" />
                  {address}
                </div>
                <div className="neo-chip bg-[#FEFAE0]">
                  <ShieldCheck className="h-4 w-4" />
                  Vesu actions + shared logs
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void refresh()} className="border-[2px] border-black">
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
        <section className="space-y-6">
          <div className="neo-panel p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Action Builder</p>
                <h2 className="text-3xl font-black">Deposit Or Withdraw</h2>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-bold">Token</p>
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

              <div>
                <p className="mb-2 text-sm font-bold">Amount</p>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="border-[2px] border-black bg-white"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={handleDeposit} disabled={activeAction !== null} className="neo-button-secondary">
                {activeAction === 'deposit' ? 'Submitting Deposit...' : 'Deposit to Vesu'}
              </Button>
              <Button type="button" onClick={handleWithdraw} disabled={activeAction !== null} className="neo-button-primary">
                {activeAction === 'withdraw' ? 'Submitting Withdraw...' : 'Withdraw from Vesu'}
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
                    <p className="font-black">{market.asset}</p>
                    <p className="mt-1 text-sm text-black/60">{market.protocol} • {market.poolName}</p>
                    <div className="mt-4 space-y-2 text-[15px]">
                      <p><span className="font-black">Supply APY:</span> {market.supplyApy || 'Unavailable'}</p>
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
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Selected Asset</p>
                <p className="mt-2 text-2xl font-black">{token}</p>
              </div>
              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Action Size</p>
                <p className="mt-2 text-2xl font-black">{amount || '0'}</p>
              </div>
              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Checklist</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-bold">1. Connected app wallet</p>
                  <p className="font-bold">2. Refresh markets if data looks stale</p>
                  <p className="font-bold">3. Deposit or withdraw, then verify in logs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <h2 className="text-2xl font-black">Last Submitted Transaction</h2>
            </div>
            {lastTx ? (
              <div className="space-y-3">
                <p className="break-all text-sm text-black/60">{lastTx.hash}</p>
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
