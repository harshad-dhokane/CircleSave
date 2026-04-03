import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  FileText,
  Layers3,
  Plus,
  Wallet,
} from 'lucide-react';
import { ProcessInfoButton } from '@/components/help/ProcessInfoButton';
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
  type StarkZapBatchTransferItem,
  type StarkZapBatchTransferPreview,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useStarkZapModuleStats } from '@/hooks/useStarkZapModuleStats';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/constants';

const TOKEN_OPTIONS: StarkZapTokenKey[] = ['STRK', 'USDC', 'ETH'];
const AMOUNT_PRESETS = ['0.01', '0.05', '0.1'];
const DEFAULT_ITEMS: StarkZapBatchTransferItem[] = [
  { address: '', amount: '0.05', token: 'STRK' },
  { address: '', amount: '0.05', token: 'STRK' },
];

function formatLocalAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
    maximumFractionDigits: value >= 100 ? 2 : 4,
  });
}

export function BatchingPage() {
  const { isConnected, address } = useWallet();
  const {
    executeBatchTransfer,
    isWalletReady,
    previewBatchTransfer,
    recommendedExecutionMode,
    supportsSponsoredExecution,
  } = useStarkZapActions();
  const [items, setItems] = useState<StarkZapBatchTransferItem[]>(DEFAULT_ITEMS);
  const [preview, setPreview] = useState<StarkZapBatchTransferPreview | null>(null);
  const [lastTx, setLastTx] = useState<{ hash: string; explorerUrl: string } | null>(null);
  const [activeAction, setActiveAction] = useState<'preview' | 'execute' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const feeMode = recommendedExecutionMode === 'sponsored' && supportsSponsoredExecution
    ? 'sponsored'
    : 'user_pays';
  const moduleStats = useStarkZapModuleStats('batch');

  useEffect(() => {
    if (!address) return;

    setItems((current) => current.map((item) => (
      item.address ? item : { ...item, address }
    )));
  }, [address]);

  const localBreakdown = useMemo(() => {
    const grouped = new Map<StarkZapTokenKey, { token: StarkZapTokenKey; total: number; transferCount: number }>();

    items.forEach((item) => {
      const amount = Number.parseFloat(item.amount || '0');
      const next = grouped.get(item.token) || {
        token: item.token,
        total: 0,
        transferCount: 0,
      };

      next.transferCount += 1;
      if (Number.isFinite(amount)) {
        next.total += amount;
      }

      grouped.set(item.token, next);
    });

    return [...grouped.values()];
  }, [items]);

  const breakdownCards = preview?.breakdown || localBreakdown.map((group) => ({
    token: group.token,
    totalAmount: group.total.toString(),
    totalAmountLabel: `${formatLocalAmount(group.total)} ${group.token}`,
    transferCount: group.transferCount,
  }));

  const updateItem = (index: number, field: keyof StarkZapBatchTransferItem, value: string) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
    setPreview(null);
    setErrorMessage(null);
  };

  const applyAmountPreset = (amount: string) => {
    setItems((current) => current.map((item) => ({ ...item, amount })));
    setPreview(null);
    setErrorMessage(null);
  };

  const fillSelfTransferDemo = () => {
    if (!address) return;

    setItems((current) => current.map((item) => ({ ...item, address })));
    setPreview(null);
    setErrorMessage(null);
  };

  const addTransferRow = () => {
    setItems((current) => [
      ...current,
      {
        address: address || '',
        amount: current[current.length - 1]?.amount || '0.05',
        token: current[current.length - 1]?.token || 'STRK',
      },
    ]);
    setPreview(null);
    setErrorMessage(null);
  };

  const removeTransferRow = (index: number) => {
    if (items.length <= 2) {
      return;
    }

    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreview(null);
    setErrorMessage(null);
  };

  const handlePreview = async () => {
    try {
      setActiveAction('preview');
      setErrorMessage(null);
      setPreview(await previewBatchTransfer({ items, feeMode }));
    } catch (error) {
      setPreview(null);
      setErrorMessage(error instanceof Error ? error.message : 'Batch preview failed');
    } finally {
      setActiveAction(null);
    }
  };

  const handleExecute = async () => {
    try {
      setActiveAction('execute');
      setErrorMessage(null);
      setLastTx(await executeBatchTransfer({ items, feeMode }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Batch execution failed');
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
            Connect to use batching
          </h2>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid gap-4 xl:items-start xl:grid-cols-[1.08fr_0.92fr]">
        <section className="neo-panel p-4 md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Batch
              </p>
              <h2 className="mt-1 font-display text-[1.3rem] font-semibold tracking-[-0.04em] text-foreground">
                Transfer builder
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Build multiple transfers, preview the atomic batch, then submit them in one transaction.
              </p>
            </div>
            <ProcessInfoButton
              title="Batch transfer builder"
              description="Batching lets you group several token transfers into one on-chain submission."
              items={[
                {
                  label: 'Rows',
                  description: 'Each row is one recipient, token, and amount. Add rows until the batch matches the transfer plan you want.',
                },
                {
                  label: 'Use my address',
                  description: 'This quickly fills all recipient rows with your connected wallet so you can test or duplicate transfers faster.',
                },
                {
                  label: 'Preview first',
                  description: 'Preview checks the grouped call structure before you submit the full atomic batch.',
                },
                {
                  label: 'What batching means',
                  description: 'If the batch succeeds, every row is sent together. If it fails, none of the rows execute.',
                },
              ]}
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <div className="neo-chip">
              <Wallet className="h-4 w-4" />
              <span className="text-wrap-safe min-w-0 normal-case tracking-normal">{formatAddress(address || '')}</span>
            </div>
            <CopyButton value={address || ''} successMessage="Wallet address copied" />
            <div className="neo-chip">{items.length} rows</div>
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
            <Button variant="outline" onClick={fillSelfTransferDemo} className="w-full border-[#e09938]/24 hover:border-[#e09938]/36 hover:bg-[#FFB457]/14 dark:hover:bg-[#FFB457]/14 sm:w-auto">
              Use my address
            </Button>
            <Button variant="amber" onClick={addTransferRow} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add row
            </Button>
            <Button variant="amber" asChild className="w-full sm:w-auto">
              <Link to="/logs">
                <FileText className="h-4 w-4" />
                Logs
              </Link>
            </Button>
          </div>

          <div className="scrollbar-hidden mb-5 flex gap-2 overflow-x-auto pb-1">
            {AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyAmountPreset(preset)}
                className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  items.every((item) => item.amount === preset)
                    ? 'border-[#e09938]/34 bg-[#FFB457] text-slate-950'
                    : 'border-black/10 bg-black/[0.03] text-muted-foreground hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid items-end gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] p-3.5 dark:border-white/10 dark:bg-white/5 sm:grid-cols-2 xl:grid-cols-[120px_minmax(0,1fr)_170px_112px]"
              >
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Token</p>
                  <Select value={item.token} onValueChange={(value) => updateItem(index, 'token', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKEN_OPTIONS.map((tokenOption) => (
                        <SelectItem key={tokenOption} value={tokenOption}>
                          {tokenOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 xl:col-span-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recipient</p>
                  <Input
                    value={item.address}
                    onChange={(event) => updateItem(index, 'address', event.target.value)}
                    placeholder="0x..."
                  />
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Amount</p>
                  <Input
                    value={item.amount}
                    onChange={(event) => updateItem(index, 'amount', event.target.value)}
                    placeholder="0.05"
                  />
                </div>

                <div className="flex items-end sm:col-span-2 xl:col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTransferRow(index)}
                    disabled={items.length <= 2}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={activeAction !== null || !isWalletReady}
              className="w-full border-[#e09938]/24 hover:border-[#e09938]/36 hover:bg-[#FFB457]/14 dark:hover:bg-[#FFB457]/14 sm:w-auto"
            >
              {activeAction === 'preview' ? 'Previewing...' : 'Preview'}
            </Button>
            <Button variant="amber" onClick={handleExecute} disabled={activeAction !== null || !isWalletReady} className="w-full sm:w-auto">
              {activeAction === 'execute' ? 'Submitting...' : 'Send batch'}
            </Button>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <section className="neo-panel p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Breakdown
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Token totals
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-[#7CC8FF]" />
                <ProcessInfoButton
                  title="Batch breakdown"
                  description="The breakdown groups your rows by token so you can verify totals before submitting."
                  items={[
                    {
                      label: 'Token totals',
                      description: 'Each card combines all rows for one token into a single visible total.',
                    },
                    {
                      label: 'Transfer count',
                      description: 'Rows show how many transfers for that token are included in the current batch.',
                    },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-3">
              {breakdownCards.map((group) => (
                <div key={group.token} className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{group.token}</p>
                    <span className="text-sm text-muted-foreground">{group.transferCount} rows</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-foreground">{group.totalAmountLabel}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="neo-panel p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Preview
                </p>
                <h3 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground">
                  Simulation
                </h3>
              </div>
              <ProcessInfoButton
                title="Batch simulation"
                description="The preview summarizes the batch before you spend gas on the final submission."
                items={[
                  {
                    label: 'Summary',
                    description: 'The summary explains how many grouped transfers and token types are currently part of the atomic batch.',
                  },
                  {
                    label: 'Calls',
                    description: 'Calls show the contract-call complexity of the batch, which helps you understand what the transaction is doing.',
                  },
                ]}
              />
            </div>

            {preview ? (
              <div className="space-y-3">
                <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Summary
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground">{preview.summary}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Transfers
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">{preview.transferCount}</p>
                  </div>
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Calls
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">{preview.callCount}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                Run preview to verify the atomic batch.
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
                No submitted batch yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
