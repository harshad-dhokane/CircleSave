import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Blocks,
  CheckCircle2,
  ExternalLink,
  FileText,
  Layers3,
  Plus,
  Wallet,
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
  type StarkZapBatchTransferItem,
  type StarkZapBatchTransferPreview,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { useWallet } from '@/hooks/useWallet';

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
  const { isWalletReady, previewBatchTransfer, executeBatchTransfer } = useStarkZapActions();
  const [items, setItems] = useState<StarkZapBatchTransferItem[]>(DEFAULT_ITEMS);
  const [preview, setPreview] = useState<StarkZapBatchTransferPreview | null>(null);
  const [lastTx, setLastTx] = useState<{ hash: string; explorerUrl: string } | null>(null);
  const [activeAction, setActiveAction] = useState<'preview' | 'execute' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const txBuilderSnippet = useMemo(() => {
    const grouped = new Map<StarkZapTokenKey, StarkZapBatchTransferItem[]>();

    items.forEach((item) => {
      const current = grouped.get(item.token) || [];
      current.push(item);
      grouped.set(item.token, current);
    });

    const chainLines = [...grouped.entries()].map(([token, groupedItems]) => {
      const tokenRef = `sepoliaTokens.${token}`;
      const entries = groupedItems.map((item) => (
        `    { to: fromAddress('${item.address || '0x...'}'), amount: Amount.parse('${item.amount || '0.05'}', ${tokenRef}) },`
      )).join('\n');

      return `  .transfer(${tokenRef}, [\n${entries}\n  ])`;
    });

    return `const tx = await wallet.tx()\n${chainLines.join('\n')}\n  .send();`;
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
      setPreview(await previewBatchTransfer({ items }));
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
      setLastTx(await executeBatchTransfer({ items }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Batch execution failed');
    } finally {
      setActiveAction(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="neo-card max-w-xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-black bg-[#4ECDC4]">
            <Wallet className="h-9 w-9" />
          </div>
          <h2 className="mb-3 text-3xl font-black">Connect Your Wallet</h2>
          <p className="text-[15px] leading-relaxed text-black/70">
            The batching demo uses the same shared wallet session as swap, DCA, and lending. Connect from the header, then come back here to sign one TxBuilder transaction with as many transfer rows as you want.
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
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#F4A261] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <Blocks className="h-4 w-4" />
                StarkZap v2 TxBuilder
              </div>
              <h1 className="text-4xl font-black md:text-5xl">Transaction Batching Demo</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
                Batch any number of transfers into one signed transaction with <code>wallet.tx()</code>. Each row can use a different token and recipient, and the builder still resolves everything into one atomic v2 transaction.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="neo-chip bg-white">
                  <Wallet className="h-4 w-4" />
                  <span className="text-wrap-safe min-w-0 font-mono normal-case tracking-normal">{address}</span>
                </div>
                <div className="neo-chip bg-[#FEFAE0]">
                  <Layers3 className="h-4 w-4" />
                  1 signature • many transfers • 1 atomic tx
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
                  View Wallet Logs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell grid gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:py-10">
        {!isWalletReady && (
          <div className="xl:col-span-2 border-[2px] border-black bg-[#FFE66D] px-5 py-4 text-sm font-bold leading-relaxed shadow-[3px_3px_0px_0px_#1a1a1a]">
            Wallet session is finishing setup. Batch actions will unlock in a moment.
          </div>
        )}

        <section className="space-y-6">
          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Safe Demo Setup</p>
                <h2 className="text-2xl font-black">Compose A Custom Batch</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillSelfTransferDemo}
                  className="border-[2px] border-black"
                >
                  Use My Address
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTransferRow}
                  className="border-[2px] border-black"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add More Rows
                </Button>
              </div>
            </div>
            <div className="border-[2px] border-black bg-[#FEFAE0] p-4 text-[15px] leading-relaxed text-black/70">
              The row count is user-defined now, not fixed. Default everything to your own wallet if you want to prove batching without moving funds, then change any row to another token or another recipient when you want a real multi-asset batch.
            </div>
          </div>

          <div className="neo-panel p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Builder Input</p>
                <h2 className="text-3xl font-black">Compose The Batch</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {AMOUNT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyAmountPreset(preset)}
                    className={`border-[2px] border-black px-3 py-1.5 text-sm font-black ${
                      items.every((item) => item.amount === preset) ? 'bg-black text-white' : 'bg-white'
                    }`}
                  >
                    {preset} all rows
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Transfer Rows</p>
                <p className="mt-2 text-2xl font-black">{items.length}</p>
              </div>

              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Distinct Tokens</p>
                <p className="mt-2 text-2xl font-black">{preview?.tokenCount || localBreakdown.length}</p>
              </div>

              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Mode</p>
                <p className="mt-2 text-2xl font-black">Mixed Assets</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {breakdownCards.map((group) => (
                <div key={group.token} className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">{group.token} subtotal</p>
                  <p className="mt-2 text-2xl font-black">{group.totalAmountLabel}</p>
                  <p className="mt-2 text-sm text-black/65">
                    {group.transferCount} transfer{group.transferCount === 1 ? '' : 's'} in this token group
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-4 border-[2px] border-black bg-[#FEFAE0] p-4 md:grid-cols-[140px_minmax(0,1fr)_180px_auto]"
                >
                  <div>
                    <p className="mb-2 text-sm font-bold">Token</p>
                    <Select value={item.token} onValueChange={(value) => updateItem(index, 'token', value)}>
                      <SelectTrigger className="border-[2px] border-black bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[2px] border-black">
                        {TOKEN_OPTIONS.map((tokenOption) => (
                          <SelectItem key={tokenOption} value={tokenOption}>
                            {tokenOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold">Recipient {index + 1}</p>
                    <Input
                      value={item.address}
                      onChange={(event) => updateItem(index, 'address', event.target.value)}
                      className="border-[2px] border-black bg-white font-mono"
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-bold">Amount</p>
                    <Input
                      value={item.amount}
                      onChange={(event) => updateItem(index, 'amount', event.target.value)}
                      className="border-[2px] border-black bg-white"
                      placeholder="0.05"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeTransferRow(index)}
                      disabled={items.length <= 2}
                      className="border-[2px] border-black"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addTransferRow}
                className="w-full border-[2px] border-dashed border-black bg-white py-6 text-sm font-black uppercase tracking-[0.08em]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Transfer Row
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void handlePreview()}
                disabled={activeAction !== null || !isWalletReady}
                className="neo-button-secondary"
              >
                {activeAction === 'preview' ? 'Simulating Batch...' : 'Preview Batched Tx'}
              </Button>
              <Button
                type="button"
                onClick={() => void handleExecute()}
                disabled={activeAction !== null || !isWalletReady}
                className="neo-button-primary"
              >
                {activeAction === 'execute' ? 'Submitting Batch...' : 'Send One Batched Transaction'}
              </Button>
            </div>

            {errorMessage && (
              <div className="mt-6 border-[2px] border-black bg-[#FF6B6B]/15 p-4">
                <p className="font-black text-[#8b1e1e]">Batching Error</p>
                <p className="mt-1 text-[15px] leading-relaxed text-black/75">{errorMessage}</p>
              </div>
            )}
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#FFE66D]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Live Builder Code</p>
                <h2 className="text-2xl font-black">What This Page Signs</h2>
              </div>
            </div>
            <pre className="overflow-x-auto border-[2px] border-black bg-[#111111] p-4 text-sm leading-relaxed text-[#F8F8F2]">
              <code>{txBuilderSnippet}</code>
            </pre>
          </div>
        </section>

        <aside className="neo-sticky-rail space-y-5">
          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border-[2px] border-black bg-[#4ECDC4]">
                <Layers3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Batch Rail</p>
                <h2 className="text-2xl font-black">Current Batch</h2>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Rows</p>
                <p className="mt-2 text-2xl font-black">{items.length}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Transfers</p>
                  <p className="mt-2 text-xl font-black">{preview?.transferCount || items.length}</p>
                </div>
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Assets</p>
                  <p className="mt-2 text-xl font-black">{preview?.tokenCount || localBreakdown.length}</p>
                </div>
              </div>
              <div className="border-[2px] border-black bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Atomic Outcome</p>
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  Every row is signed and submitted together. If one transfer fails, the whole transaction reverts.
                </p>
              </div>
            </div>
          </div>

          <div className="neo-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Builder Preview</h2>
              {preview && <div className="neo-chip bg-[#4ECDC4]">Ready</div>}
            </div>
            {preview ? (
              <div className="space-y-3 text-[15px]">
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Simulation</p>
                  <p className="mt-2 text-3xl font-black">Pass</p>
                </div>
                <p><span className="font-black">Transfers:</span> {preview.transferCount}</p>
                <p><span className="font-black">Tokens:</span> {preview.tokenCount}</p>
                <p><span className="font-black">Contract Calls:</span> {preview.callCount}</p>
                <div className="space-y-2">
                  {preview.breakdown.map((group) => (
                    <p key={group.token}>
                      <span className="font-black">{group.token}:</span> {group.totalAmountLabel} across {group.transferCount} transfer{group.transferCount === 1 ? '' : 's'}
                    </p>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-black/70">{preview.summary}</p>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/70">
                Preview the builder first to confirm the transfer count, per-token grouping, and resolved Starknet call count before you sign.
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
                Submitted batch transactions appear here immediately and also land in the shared logs page with a dedicated TxBuilder label.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
