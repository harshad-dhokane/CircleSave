import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  ExternalLink,
  FileText,
  Info,
  Repeat,
  Wallet,
} from 'lucide-react';
import { ProcessInfoButton } from '@/components/help/ProcessInfoButton';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getUnsupportedDcaPairMessage,
  isSupportedDcaPairForProvider,
  type StarkZapDcaFrequency,
  type StarkZapDcaPreview,
  type StarkZapDcaProviderId,
  type StarkZapOrderView,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useStarkZapModuleStats } from '@/hooks/useStarkZapModuleStats';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/constants';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const DCA_FREQUENCIES: Array<{ value: StarkZapDcaFrequency; label: string }> = [
  { value: 'PT12H', label: 'Every 12 Hours' },
  { value: 'P1D', label: 'Daily' },
  { value: 'P1W', label: 'Weekly' },
];
const DCA_TEMPLATES: Array<{
  title: string;
  sellToken: StarkZapTokenKey;
  buyToken: StarkZapTokenKey;
  sellAmount: string;
  sellAmountPerCycle: string;
  frequency: StarkZapDcaFrequency;
  providerId: StarkZapDcaProviderId;
}> = [
  { title: 'STRK to ETH • AVNU', sellToken: 'STRK', buyToken: 'ETH', sellAmount: '5', sellAmountPerCycle: '1', frequency: 'P1D', providerId: 'avnu' },
  { title: 'ETH to STRK • Ekubo', sellToken: 'ETH', buyToken: 'STRK', sellAmount: '1', sellAmountPerCycle: '0.25', frequency: 'P1D', providerId: 'ekubo' },
  { title: 'STRK to ETH • Ekubo', sellToken: 'STRK', buyToken: 'ETH', sellAmount: '5', sellAmountPerCycle: '1', frequency: 'P1D', providerId: 'ekubo' },
];

function getOrderStatusClasses(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'border border-[#b7f064]/30 bg-[#B5F36B] text-slate-950 shadow-[0_14px_30px_-22px_rgba(126,192,86,0.58)]';
    case 'COMPLETED':
      return 'border border-sky-400/24 bg-sky-400/18 text-sky-200';
    case 'CANCELLED':
      return 'border border-rose-400/24 bg-rose-400/16 text-rose-200';
    default:
      return 'border border-white/14 bg-white/9 text-white/84';
  }
}

export function DcaPage() {
  const { isConnected, address } = useWallet();
  const {
    cancelDca,
    createDca,
    dcaProviderOptions,
    isWalletReady,
    loadDcaOrders,
    previewDca,
    recommendedExecutionMode,
    supportsSponsoredExecution,
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
  const [selectedOrder, setSelectedOrder] = useState<StarkZapOrderView | null>(null);
  const feeMode = recommendedExecutionMode === 'sponsored' && supportsSponsoredExecution
    ? 'sponsored'
    : 'user_pays';
  const moduleStats = useStarkZapModuleStats('dca');
  const providerPairMessage = sellToken === buyToken
    ? null
    : getUnsupportedDcaPairMessage(providerId, sellToken, buyToken);
  const pairSupported = sellToken !== buyToken
    && isSupportedDcaPairForProvider(providerId, sellToken, buyToken);

  const totalCycles = useMemo(() => {
    const total = Number.parseFloat(sellAmount);
    const perCycle = Number.parseFloat(sellAmountPerCycle);
    if (!Number.isFinite(total) || !Number.isFinite(perCycle) || perCycle <= 0) return 0;
    return Math.ceil(total / perCycle);
  }, [sellAmount, sellAmountPerCycle]);

  const refreshOrders = useCallback(async (nextFilter: 'all' | StarkZapDcaProviderId = orderFilter) => {
    try {
      setLoadingOrders(true);
      setOrders(await loadDcaOrders({ providerId: nextFilter }));
    } catch {
      // hook toasts already
    } finally {
      setLoadingOrders(false);
    }
  }, [loadDcaOrders, orderFilter]);

  useEffect(() => {
    if (!isWalletReady) return;
    void refreshOrders(orderFilter);
  }, [isWalletReady, orderFilter, refreshOrders]);

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
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <Wallet className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Connect to use DCA
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
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  DCA
                </p>
                <h2 className="mt-1 font-display text-[1.3rem] font-semibold tracking-[-0.04em] text-foreground">
                  Plan builder
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set a recurring sell plan, preview one cycle, then create the long-running DCA order.
                </p>
              </div>
              <ProcessInfoButton
                title="DCA plan builder"
                description="DCA creates a recurring order that converts one asset into another on a schedule."
                items={[
                  {
                    label: 'Total amount',
                    description: 'This is the full budget for the whole DCA plan.',
                  },
                  {
                    label: 'Per cycle',
                    description: 'This is how much of the total budget is used each recurring run.',
                  },
                  {
                    label: 'Frequency and provider',
                    description: 'Frequency controls timing. Provider controls where the recurring swap order routes.',
                  },
                  {
                    label: 'Preview before create',
                    description: 'Preview one cycle first so you can sanity-check the live output before committing the order on-chain.',
                  },
                ]}
              />
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <div className="neo-chip">
                  <Wallet className="h-4 w-4" />
                  <span className="text-wrap-safe min-w-0 normal-case tracking-normal">{formatAddress(address || '')}</span>
                </div>
                <CopyButton value={address || ''} successMessage="Wallet address copied" />
                <div className="neo-chip">
                  {totalCycles > 0 ? `${totalCycles} cycles` : 'Set amounts'}
                </div>
              </div>
              <Button variant="violet" size="sm" asChild className="w-full sm:w-auto">
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

            <div className="scrollbar-hidden mb-5 flex gap-2 overflow-x-auto pb-1">
              {DCA_TEMPLATES.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                    template.sellToken === sellToken && template.buyToken === buyToken
                    && template.providerId === providerId && template.frequency === frequency
                      ? 'border-[#8a6fe0]/34 bg-[#A48DFF] text-slate-950'
                      : 'border-black/10 bg-black/[0.03] text-muted-foreground hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
                  }`}
                >
                  {template.title}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sell token</p>
                  <Select value={sellToken} onValueChange={(value) => setSellToken(value as StarkZapTokenKey)}>
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

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Buy token</p>
                  <Select value={buyToken} onValueChange={(value) => setBuyToken(value as StarkZapTokenKey)}>
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

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Provider</p>
                  <Select value={providerId} onValueChange={(value) => setProviderId(value as StarkZapDcaProviderId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dcaProviderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total amount</p>
                  <Input value={sellAmount} onChange={(event) => setSellAmount(event.target.value)} placeholder="10" />
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Per cycle</p>
                  <Input value={sellAmountPerCycle} onChange={(event) => setSellAmountPerCycle(event.target.value)} placeholder="2" />
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Frequency</p>
                  <Select value={frequency} onValueChange={(value) => setFrequency(value as StarkZapDcaFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DCA_FREQUENCIES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {providerPairMessage ? (
              <div className="mt-4 rounded-[22px] border border-[#f59e0b]/28 bg-[#f59e0b]/12 px-4 py-4 text-sm text-amber-100">
                {providerPairMessage}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={activeAction !== null || !isWalletReady || !pairSupported}
                className="w-full border-[#8a6fe0]/26 hover:border-[#8a6fe0]/38 hover:bg-[#A48DFF]/14 dark:hover:bg-[#A48DFF]/14 sm:w-auto"
              >
                {activeAction === 'preview' ? 'Previewing...' : 'Preview'}
              </Button>
              <Button
                variant="violet"
                onClick={handleCreate}
                disabled={activeAction !== null || !isWalletReady || !pairSupported}
                className="w-full sm:w-auto"
              >
                {activeAction === 'create' ? 'Creating...' : 'Create order'}
              </Button>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
                {errorMessage}
              </div>
            ) : null}
          </section>

          <section className="neo-panel p-4 md:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Orders
                </p>
                <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                  Existing plans
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Select value={orderFilter} onValueChange={(value) => setOrderFilter(value as 'all' | StarkZapDcaProviderId)}>
                  <SelectTrigger className="w-full sm:w-[10rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    {dcaProviderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ProcessInfoButton
                  title="Existing DCA plans"
                  description="This section lists the recurring orders already tied to your wallet."
                  items={[
                    {
                      label: 'Status',
                      description: 'Active plans are still running. Completed plans finished their budget. Cancelled plans were stopped manually.',
                    },
                    {
                      label: 'Budget and progress',
                      description: 'Budget is the total plan size. Sold and bought help you see how much of that plan already executed.',
                    },
                    {
                      label: 'Order details',
                      description: 'Use the info icon on an order row to open the full order detail dialog.',
                    },
                  ]}
                />
              </div>
            </div>

            {loadingOrders ? (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                Loading orders...
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedOrder(order)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedOrder(order);
                      }
                    }}
                    className="flex w-full flex-col gap-3 rounded-[22px] border border-black/10 bg-black/[0.03] px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#B5F36B]/18 hover:bg-black/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5F36B]/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-[#A48DFF]/14 text-[#A48DFF] dark:border-white/10">
                        <Repeat className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {order.sellToken} to {order.buyToken}
                          </p>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getOrderStatusClasses(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {order.provider} • {order.frequency} • {order.createdAt}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground md:hidden">
                          {order.totalSellAmount} budget • {order.soldAmount} sold • {order.boughtAmount} bought
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-4 md:ml-auto">
                      <div className="hidden min-w-0 text-right md:block">
                        <p className="text-sm font-semibold text-foreground">{order.totalSellAmount}</p>
                        <p className="text-xs text-muted-foreground">Budget</p>
                      </div>
                      <div className="hidden min-w-0 text-right lg:block">
                        <p className="text-sm font-semibold text-foreground">{order.soldAmount} sold</p>
                        <p className="text-xs text-muted-foreground">{order.boughtAmount} bought</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          aria-label="View order details"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={activeAction !== null || order.status !== 'ACTIVE' || !isWalletReady}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleCancel(order);
                          }}
                        >
                          {pendingOrderId === order.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                No DCA orders yet.
              </div>
            )}
          </section>
        </section>

        <div className="space-y-4">
          <section className="neo-panel p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Cycle estimate
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[#A48DFF]" />
                <ProcessInfoButton
                  title="DCA preview"
                  description="The preview estimates what one DCA cycle could buy under current market conditions."
                  items={[
                    {
                      label: 'Estimated buy per cycle',
                      description: 'This is the current expected output for one recurring execution, not the total plan output.',
                    },
                    {
                      label: 'Cycles',
                      description: 'Cycles are calculated from total amount divided by per-cycle amount so you know how long the plan should run.',
                    },
                  ]}
                />
              </div>
            </div>

            {preview ? (
              <div className="space-y-3">
                <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Estimated buy per cycle
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{preview.estimatedBuyAmount}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Provider
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">{preview.provider}</p>
                  </div>
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Cycles
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">{totalCycles || 'Unavailable'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                Preview the plan before creating it.
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
                No submitted DCA transaction yet.
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedOrder ? (
            <>
              <DialogHeader className="pr-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getOrderStatusClasses(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {selectedOrder.provider}
                  </span>
                </div>
                <DialogTitle className="mt-2">{selectedOrder.sellToken} to {selectedOrder.buyToken}</DialogTitle>
                <DialogDescription>
                  Review the plan, progress, and execution reference for this DCA order.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Plan', selectedOrder.totalSellAmount],
                  ['Bought', selectedOrder.boughtAmount],
                  ['Sold', selectedOrder.soldAmount],
                  ['Frequency', selectedOrder.frequency],
                  ['Provider', selectedOrder.provider],
                  ['Created', selectedOrder.createdAt],
                  ['Order ID', selectedOrder.id],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Order address
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{formatAddress(selectedOrder.orderAddress)}</p>
                  </div>
                  <CopyButton value={selectedOrder.orderAddress} successMessage="Order address copied" />
                </div>
              </div>

              <DialogFooter className="mt-2 sm:justify-between">
                <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      onClick={() => void handleCancel(selectedOrder)}
                      disabled={activeAction !== null || !isWalletReady}
                    >
                      {pendingOrderId === selectedOrder.id ? 'Cancelling...' : 'Cancel order'}
                    </Button>
                  ) : null}
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
