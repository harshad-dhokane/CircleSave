import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  ExternalLink,
  FileText,
  Repeat,
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
  type StarkZapDcaFrequency,
  type StarkZapDcaProviderId,
  type StarkZapDcaPreview,
  type StarkZapExecutionMode,
  type StarkZapOrderView,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useWallet } from '@/hooks/useWallet';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const DCA_FREQUENCIES: Array<{ value: StarkZapDcaFrequency; label: string; helper: string }> = [
  { value: 'PT12H', label: 'Every 12 Hours', helper: 'Fastest test cadence on Sepolia.' },
  { value: 'P1D', label: 'Daily', helper: 'Best default for routine funding.' },
  { value: 'P1W', label: 'Weekly', helper: 'Low-touch recurring accumulation.' },
];
const DCA_TEMPLATES: Array<{
  title: string;
  sellToken: StarkZapTokenKey;
  buyToken: StarkZapTokenKey;
  sellAmount: string;
  sellAmountPerCycle: string;
  frequency: StarkZapDcaFrequency;
  providerId: StarkZapDcaProviderId;
  color: string;
}> = [
  { title: 'Starter STRK Build', sellToken: 'STRK', buyToken: 'ETH', sellAmount: '5', sellAmountPerCycle: '1', frequency: 'P1D', providerId: 'avnu', color: '#FFE66D' },
  { title: 'Weekly STRK Funding', sellToken: 'USDC', buyToken: 'STRK', sellAmount: '10', sellAmountPerCycle: '2', frequency: 'P1W', providerId: 'ekubo', color: '#4ECDC4' },
  { title: 'ETH To STRK Drip', sellToken: 'ETH', buyToken: 'STRK', sellAmount: '1', sellAmountPerCycle: '0.25', frequency: 'P1D', providerId: 'avnu', color: '#FF6B6B' },
] as const;

export function DcaPage() {
  const { isConnected, address } = useWallet();
  const {
    cancelDca,
    createDca,
    dcaProviderOptions,
    isWalletReady,
    loadDcaOrders,
    previewDca,
  } = useStarkZapActions();
  const [sellToken, setSellToken] = useState<StarkZapTokenKey>('STRK');
  const [buyToken, setBuyToken] = useState<StarkZapTokenKey>('ETH');
  const [sellAmount, setSellAmount] = useState('5');
  const [sellAmountPerCycle, setSellAmountPerCycle] = useState('1');
  const [frequency, setFrequency] = useState<StarkZapDcaFrequency>('P1D');
  const [providerId, setProviderId] = useState<StarkZapDcaProviderId>('avnu');
  const [orderFilter, setOrderFilter] = useState<'all' | StarkZapDcaProviderId>('all');
  const [preview, setPreview] = useState<StarkZapDcaPreview | null>(null);
  const [orders, setOrders] = useState<StarkZapOrderView[]>([]);
  const [lastTx, setLastTx] = useState<{ hash: string; explorerUrl: string } | null>(null);
  const [activeAction, setActiveAction] = useState<'preview' | 'create' | 'cancel' | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const accountInitializing = isConnected && !isWalletReady;
  const feeMode: StarkZapExecutionMode = 'user_pays';

  const totalCycles = useMemo(() => {
    const total = Number.parseFloat(sellAmount);
    const perCycle = Number.parseFloat(sellAmountPerCycle);
    if (!Number.isFinite(total) || !Number.isFinite(perCycle) || perCycle <= 0) return 0;
    return Math.ceil(total / perCycle);
  }, [sellAmount, sellAmountPerCycle]);

  const refreshOrders = async (nextFilter: 'all' | StarkZapDcaProviderId = orderFilter) => {
    try {
      setLoadingOrders(true);
      setOrders(await loadDcaOrders({ providerId: nextFilter }));
    } catch {
      // The hook already surfaces a toast and we preserve the current list.
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!isWalletReady) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingOrders(true);
        const result = await loadDcaOrders({ providerId: orderFilter });
        if (!cancelled) setOrders(result);
      } catch {
        // The hook already surfaces a toast and we preserve the current list.
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isWalletReady, orderFilter, loadDcaOrders]);

  const handlePreview = async () => {
    try {
      setActiveAction('preview');
      setErrorMessage(null);
      setPreview(await previewDca({ sellToken, buyToken, sellAmountPerCycle, providerId }));
    } catch (error) {
      setPreview(null);
      setErrorMessage(error instanceof Error ? error.message : 'DCA preview failed');
    } finally {
      setActiveAction(null);
    }
  };

  const handleCreate = async () => {
    try {
      setActiveAction('create');
      setErrorMessage(null);
      const tx = await createDca({
        sellToken,
        buyToken,
        sellAmount,
        sellAmountPerCycle,
        frequency,
        providerId,
        feeMode,
      });
      setLastTx(tx);
      await refreshOrders(orderFilter);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'DCA order failed');
    } finally {
      setActiveAction(null);
    }
  };

  const handleCancel = async (order: StarkZapOrderView) => {
    try {
      setActiveAction('cancel');
      setPendingOrderId(order.id);
      setErrorMessage(null);
      const tx = await cancelDca({
        providerId: order.providerId,
        orderId: order.id,
        orderAddress: order.orderAddress,
        feeMode,
      });
      setLastTx(tx);
      await refreshOrders(orderFilter);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'DCA cancellation failed');
    } finally {
      setActiveAction(null);
      setPendingOrderId(null);
    }
  };

  const applyTemplate = (template: typeof DCA_TEMPLATES[number]) => {
    setSellToken(template.sellToken);
    setBuyToken(template.buyToken);
    setSellAmount(template.sellAmount);
    setSellAmountPerCycle(template.sellAmountPerCycle);
    setFrequency(template.frequency);
    setProviderId(template.providerId);
    setPreview(null);
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
            DCA uses the same app-wide wallet session. Connect once from the header and use that same account here.
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
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#FFE66D] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <Zap className="h-4 w-4" />
                StarkZap v2 DCA
              </div>
              <h1 className="text-4xl font-black md:text-5xl">Recurring Funding Workspace</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
                Build AVNU or Ekubo recurring buys, preview each cycle, manage live orders, and cancel stale automation without leaving CircleSave.
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
                  Use this to auto-fund future circle contributions
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void refreshOrders(orderFilter)} disabled={!isWalletReady || loadingOrders} className="border-[2px] border-black">
                {loadingOrders ? 'Refreshing Orders...' : 'Refresh Orders'}
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
            Wallet session is finishing setup. DCA previews and order loading will start automatically in a moment.
          </div>
        )}
        <section className="space-y-6">
          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Recommended Templates</p>
                <h2 className="text-2xl font-black">Start From A Working Automation Pattern</h2>
              </div>
              <div className="neo-chip bg-white">Provider Aware</div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {DCA_TEMPLATES.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={`text-left border-[2px] border-black p-4 transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1a1a] ${
                    template.sellToken === sellToken && template.buyToken === buyToken ? 'bg-white' : 'bg-[#FEFAE0]'
                  }`}
                >
                  <div
                    className="mb-3 h-3 w-16 border-[2px] border-black"
                    style={{ backgroundColor: template.color }}
                  />
                  <p className="font-black">{template.title}</p>
                  <p className="mt-2 text-sm text-black/65">{template.sellToken} {'->'} {template.buyToken}</p>
                  <p className="mt-2 text-sm leading-relaxed text-black/60">
                    {template.sellAmountPerCycle} per cycle via {template.providerId.toUpperCase()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="neo-panel p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Order Builder</p>
                <h2 className="text-3xl font-black">Create DCA Order</h2>
              </div>
              <div className="neo-chip bg-[#FEFAE0]">
                <CalendarClock className="h-4 w-4" />
                {totalCycles > 0 ? `${totalCycles} cycle${totalCycles > 1 ? 's' : ''} estimated` : 'Set amounts to estimate cycles'}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="mb-2 text-sm font-bold">Sell Token</p>
                <Select value={sellToken} onValueChange={(value) => setSellToken(value as StarkZapTokenKey)}>
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
                <p className="mb-2 text-sm font-bold">Buy Token</p>
                <Select value={buyToken} onValueChange={(value) => setBuyToken(value as StarkZapTokenKey)}>
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
                <p className="mb-2 text-sm font-bold">Provider</p>
                <Select value={providerId} onValueChange={(value) => setProviderId(value as StarkZapDcaProviderId)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {dcaProviderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Total Sell Amount</p>
                <Input
                  value={sellAmount}
                  onChange={(event) => setSellAmount(event.target.value)}
                  className="border-[2px] border-black bg-white"
                  placeholder="5"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Sell Per Cycle</p>
                <Input
                  value={sellAmountPerCycle}
                  onChange={(event) => setSellAmountPerCycle(event.target.value)}
                  className="border-[2px] border-black bg-white"
                  placeholder="1"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Frequency</p>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as StarkZapDcaFrequency)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {DCA_FREQUENCIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-sm text-black/60">
                  {DCA_FREQUENCIES.find((item) => item.value === frequency)?.helper}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold">Order List Filter</p>
                <Select value={orderFilter} onValueChange={(value) => setOrderFilter(value as 'all' | StarkZapDcaProviderId)}>
                  <SelectTrigger className="w-full border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    <SelectItem value="all">All Providers</SelectItem>
                    {dcaProviderOptions.map((option) => (
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
                {activeAction === 'preview' ? 'Loading Preview...' : 'Preview Cycle'}
              </Button>
              <Button type="button" onClick={handleCreate} disabled={activeAction !== null || !isWalletReady} className="neo-button-primary">
                {activeAction === 'create' ? 'Creating Order...' : 'Create DCA Order'}
              </Button>
            </div>

            {errorMessage && (
              <div className="mt-6 border-[2px] border-black bg-[#FF6B6B]/15 p-4">
                <p className="font-black text-[#8b1e1e]">DCA Error</p>
                <p className="mt-1 text-[15px] leading-relaxed text-black/75">{errorMessage}</p>
              </div>
            )}
          </div>

          <div className="neo-panel p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Existing Orders</p>
                <h2 className="text-2xl font-black">Your DCA Orders</h2>
              </div>
              {loadingOrders && <p className="text-sm text-black/60">Refreshing...</p>}
            </div>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="grid gap-3 border-[2px] border-black bg-white p-4 md:grid-cols-[1.1fr_0.9fr_0.9fr_auto] md:items-center">
                    <div>
                      <p className="font-black">{order.sellToken} {'->'} {order.buyToken}</p>
                      <p className="mt-1 text-sm text-black/60">{order.frequency} • {order.provider} • {order.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Plan</p>
                      <p className="mt-1 font-black">{order.totalSellAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Progress</p>
                      <p className="mt-1 font-black">{order.soldAmount} sold • {order.boughtAmount} bought</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:justify-self-end">
                      <div className="border-[2px] border-black bg-[#FEFAE0] px-3 py-1 text-xs font-black uppercase tracking-[0.08em]">
                        {order.status}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[2px] border-black"
                        disabled={activeAction !== null || order.status !== 'ACTIVE' || !isWalletReady}
                        onClick={() => void handleCancel(order)}
                      >
                        {pendingOrderId === order.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-[2px] border-black bg-[#FEFAE0] p-6 text-center">
                <Repeat className="mx-auto mb-3 h-10 w-10 text-black/25" />
                <h3 className="text-xl font-black">No DCA orders yet</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/65">
                  Create your first recurring order and it will show here with provider, progress, and cancellation controls.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="neo-sticky-rail space-y-5">
          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#4ECDC4]">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Order Rail</p>
                <h2 className="text-2xl font-black">Current Setup</h2>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Route</p>
                <p className="mt-2 text-2xl font-black">{sellToken} {'->'} {buyToken}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Total</p>
                  <p className="mt-2 text-xl font-black">{sellAmount || '0'}</p>
                </div>
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Per Cycle</p>
                  <p className="mt-2 text-xl font-black">{sellAmountPerCycle || '0'}</p>
                </div>
              </div>
              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Provider + Mode</p>
                <p className="mt-2 text-xl font-black">
                  {dcaProviderOptions.find((option) => option.value === providerId)?.label}
                </p>
                <p className="mt-1 text-sm text-black/60">Regular Signing</p>
              </div>
            </div>
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Cycle Estimate</h2>
              {preview && <div className="neo-chip bg-[#FFE66D]">Ready</div>}
            </div>
            {preview ? (
              <div className="space-y-3 text-[15px]">
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Estimated Buy Per Cycle</p>
                  <p className="mt-2 text-3xl font-black">{preview.estimatedBuyAmount}</p>
                </div>
                <p><span className="font-black">Provider:</span> {preview.provider}</p>
                <p><span className="font-black">Sell Per Cycle:</span> {preview.sellAmountPerCycle}</p>
                <p><span className="font-black">Estimated Cycles:</span> {totalCycles || 'Unavailable'}</p>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/70">
                Preview the cycle first to estimate recurring buy output before creating the on-chain order.
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
                Submitted DCA orders appear here immediately and also land on the shared logs page.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
