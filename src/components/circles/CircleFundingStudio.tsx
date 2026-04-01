import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, PiggyBank, Repeat, Sparkles } from 'lucide-react';
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
  type StarkZapCircleStrategy,
  type StarkZapDcaFrequency,
  type StarkZapDcaProviderId,
  type StarkZapExecutionMode,
  type StarkZapLendingHealthView,
  type StarkZapSwapComparison,
  type StarkZapSwapProviderId,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';

const LENDING_ACTION_OPTIONS = [
  { value: 'withdraw', label: 'Withdraw From Vesu' },
  { value: 'withdraw_max', label: 'Withdraw Max STRK' },
  { value: 'borrow', label: 'Borrow From Vesu' },
] as const;

function formatStrkAmount(value: bigint) {
  const divisor = 10n ** 18n;
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function parseFormattedAmount(value: string) {
  const parsed = Number.parseFloat(value.split(' ')[0] || value);
  return Number.isFinite(parsed) ? parsed : 0;
}

type CircleFundingStudioProps = {
  circleAddress: string;
  circleLabel: string;
  action: StarkZapCircleStrategy;
  requiredStrkAmount: bigint;
};

export function CircleFundingStudio(props: CircleFundingStudioProps) {
  const {
    compareSwapProviders,
    createDca,
    dcaProviderOptions,
    fundCircleFromLending,
    fundCircleWithSwap,
    getMaxBorrowQuote,
    quoteLendingHealth,
    recommendedExecutionMode,
    swapProviderOptions,
  } = useStarkZapActions();

  const requiredAmountLabel = useMemo(() => formatStrkAmount(props.requiredStrkAmount), [props.requiredStrkAmount]);

  const [swapSourceToken, setSwapSourceToken] = useState<Exclude<StarkZapTokenKey, 'STRK'>>('USDC');
  const [swapAmount, setSwapAmount] = useState(requiredAmountLabel);
  const [swapProviderId, setSwapProviderId] = useState<StarkZapSwapProviderId>('best');
  const [swapFeeMode, setSwapFeeMode] = useState<StarkZapExecutionMode>(recommendedExecutionMode);
  const [swapComparisons, setSwapComparisons] = useState<StarkZapSwapComparison[]>([]);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapBusy, setSwapBusy] = useState<'preview' | 'submit' | null>(null);

  const [dcaSellToken, setDcaSellToken] = useState<StarkZapTokenKey>('USDC');
  const [dcaBudget, setDcaBudget] = useState((Number.parseFloat(requiredAmountLabel || '0') * 3 || 3).toString());
  const [dcaPerCycle, setDcaPerCycle] = useState(requiredAmountLabel);
  const [dcaFrequency, setDcaFrequency] = useState<StarkZapDcaFrequency>('P1W');
  const [dcaProviderId, setDcaProviderId] = useState<StarkZapDcaProviderId>('avnu');
  const [dcaFeeMode, setDcaFeeMode] = useState<StarkZapExecutionMode>(recommendedExecutionMode);
  const [dcaBusy, setDcaBusy] = useState(false);
  const [dcaError, setDcaError] = useState<string | null>(null);

  const [lendingAction, setLendingAction] = useState<'withdraw' | 'withdraw_max' | 'borrow'>('withdraw');
  const [lendingSourceToken, setLendingSourceToken] = useState<StarkZapTokenKey>('STRK');
  const [lendingAmount, setLendingAmount] = useState(requiredAmountLabel);
  const [lendingCollateralToken, setLendingCollateralToken] = useState<Exclude<StarkZapTokenKey, 'STRK'>>('ETH');
  const [lendingSwapProviderId, setLendingSwapProviderId] = useState<StarkZapSwapProviderId>('avnu');
  const [lendingFeeMode, setLendingFeeMode] = useState<StarkZapExecutionMode>(recommendedExecutionMode);
  const [lendingMaxBorrow, setLendingMaxBorrow] = useState<string | null>(null);
  const [lendingHealth, setLendingHealth] = useState<StarkZapLendingHealthView | null>(null);
  const [lendingError, setLendingError] = useState<string | null>(null);
  const [lendingBusy, setLendingBusy] = useState<'max' | 'health' | 'submit' | null>(null);

  const targetAmount = Number.parseFloat(requiredAmountLabel || '0');
  const swapBestOutput = swapComparisons[0] ? parseFormattedAmount(swapComparisons[0].amountOut) : 0;
  const swapMeetsTarget = swapBestOutput >= targetAmount && targetAmount > 0;

  const showBorrowControls = lendingAction === 'borrow';
  const showFixedAmount = lendingAction !== 'withdraw_max';

  useEffect(() => {
    setSwapFeeMode(recommendedExecutionMode);
    setDcaFeeMode(recommendedExecutionMode);
    setLendingFeeMode(recommendedExecutionMode);
  }, [recommendedExecutionMode]);

  const handlePreviewSwap = async () => {
    try {
      setSwapBusy('preview');
      setSwapError(null);
      const nextComparisons = await compareSwapProviders({
        tokenIn: swapSourceToken,
        tokenOut: 'STRK',
        amount: swapAmount,
      });
      setSwapComparisons(nextComparisons);
    } catch (error) {
      setSwapComparisons([]);
      setSwapError(error instanceof Error ? error.message : 'Swap comparison failed');
    } finally {
      setSwapBusy(null);
    }
  };

  const handleSwapFunding = async () => {
    try {
      setSwapBusy('submit');
      setSwapError(null);
      await fundCircleWithSwap({
        circleAddress: props.circleAddress,
        circleLabel: props.circleLabel,
        action: props.action,
        requiredStrkAmount: props.requiredStrkAmount,
        sourceToken: swapSourceToken,
        sourceAmount: swapAmount,
        providerId: swapProviderId,
        feeMode: swapFeeMode,
      });
    } catch (error) {
      setSwapError(error instanceof Error ? error.message : 'Circle funding swap failed');
    } finally {
      setSwapBusy(null);
    }
  };

  const handleDcaSetup = async () => {
    try {
      setDcaBusy(true);
      setDcaError(null);
      await createDca({
        sellToken: dcaSellToken,
        buyToken: 'STRK',
        sellAmount: dcaBudget,
        sellAmountPerCycle: dcaPerCycle,
        frequency: dcaFrequency,
        providerId: dcaProviderId,
        feeMode: dcaFeeMode,
        summaryLabel: props.circleLabel,
      });
    } catch (error) {
      setDcaError(error instanceof Error ? error.message : 'Circle DCA setup failed');
    } finally {
      setDcaBusy(false);
    }
  };

  const handleLendingMaxBorrow = async () => {
    try {
      setLendingBusy('max');
      setLendingError(null);
      const maxBorrow = await getMaxBorrowQuote({
        collateralToken: lendingCollateralToken,
        debtToken: lendingSourceToken,
      });
      setLendingMaxBorrow(maxBorrow);
    } catch (error) {
      setLendingError(error instanceof Error ? error.message : 'Max borrow quote failed');
    } finally {
      setLendingBusy(null);
    }
  };

  const handleLendingHealth = async () => {
    if (!showBorrowControls) {
      return;
    }

    try {
      setLendingBusy('health');
      setLendingError(null);
      const nextHealth = await quoteLendingHealth({
        action: 'borrow',
        collateralToken: lendingCollateralToken,
        debtToken: lendingSourceToken,
        amount: lendingAmount,
        feeMode: lendingFeeMode,
      });
      setLendingHealth(nextHealth);
    } catch (error) {
      setLendingHealth(null);
      setLendingError(error instanceof Error ? error.message : 'Health quote failed');
    } finally {
      setLendingBusy(null);
    }
  };

  const handleLendingFunding = async () => {
    try {
      setLendingBusy('submit');
      setLendingError(null);
      await fundCircleFromLending({
        circleAddress: props.circleAddress,
        circleLabel: props.circleLabel,
        action: props.action,
        lendingAction,
        sourceToken: lendingSourceToken,
        sourceAmount: showFixedAmount ? lendingAmount : undefined,
        collateralToken: showBorrowControls ? lendingCollateralToken : undefined,
        providerId: lendingSourceToken === 'STRK' ? undefined : lendingSwapProviderId,
        feeMode: lendingFeeMode,
        requiredStrkAmount: props.requiredStrkAmount,
      });
    } catch (error) {
      setLendingError(error instanceof Error ? error.message : 'Lending funding failed');
    } finally {
      setLendingBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-[2px] border-black bg-[#FEFAE0] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#FFE66D] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em]">
              <Sparkles className="h-4 w-4" />
              In-Circle Automation
            </div>
            <h3 className="text-2xl font-black md:text-3xl">
              Fund This Circle Without Leaving The Page
            </h3>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-black/70">
              Use StarkZap directly inside the circle flow: swap into STRK, set up a recurring STRK plan,
              or pull funding from Vesu before you {props.action === 'join' ? 'join' : 'contribute'}.
            </p>
          </div>
          <div className="border-[2px] border-black bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.08em]">
            Target: {requiredAmountLabel} STRK
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="neo-card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-black bg-[#4ECDC4]">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Swap Into STRK And {props.action === 'join' ? 'Join' : 'Contribute'}</h3>
              <p className="text-[15px] text-black/60">Atomic swap + circle action using the same connected wallet.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="mb-2 text-sm font-bold">Source Token</p>
              <Select value={swapSourceToken} onValueChange={(value) => setSwapSourceToken(value as Exclude<StarkZapTokenKey, 'STRK'>)}>
                <SelectTrigger className="border-[2px] border-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[2px] border-black">
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Source Amount</p>
              <Input
                value={swapAmount}
                onChange={(event) => setSwapAmount(event.target.value)}
                className="border-[2px] border-black bg-white"
                placeholder={requiredAmountLabel}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Route</p>
              <Select value={swapProviderId} onValueChange={(value) => setSwapProviderId(value as StarkZapSwapProviderId)}>
                <SelectTrigger className="border-[2px] border-black bg-white">
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

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void handlePreviewSwap()} disabled={swapBusy !== null} className="neo-button-secondary">
              {swapBusy === 'preview' ? 'Comparing Routes...' : 'Compare Routes'}
            </Button>
            <Button type="button" onClick={() => void handleSwapFunding()} disabled={swapBusy !== null} className="neo-button-primary">
              {swapBusy === 'submit' ? 'Submitting...' : `${props.action === 'join' ? 'Swap + Join' : 'Swap + Contribute'}`}
            </Button>
          </div>

          {swapError && (
            <div className="mt-5 border-[2px] border-black bg-[#FF6B6B]/15 p-4 text-[15px] text-[#8b1e1e]">
              <p className="font-black">Swap Strategy Error</p>
              <p className="mt-1 text-black/75">{swapError}</p>
            </div>
          )}

          {swapComparisons.length > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {swapComparisons.map((comparison) => (
                <div key={comparison.providerId} className={`border-[2px] border-black p-4 ${comparison.recommended ? 'bg-[#FEFAE0]' : 'bg-white'}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-black">{comparison.provider}</p>
                    {comparison.recommended && (
                      <div className="border-[2px] border-black bg-[#FFE66D] px-2 py-1 text-xs font-black uppercase tracking-[0.08em]">
                        Best
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-black/65">Output</p>
                  <p className="mt-1 text-2xl font-black">{comparison.amountOut}</p>
                  <p className="mt-2 text-sm text-black/65">
                    {comparison.callCount} call{comparison.callCount === 1 ? '' : 's'} • {comparison.priceImpact || 'No impact data'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="neo-card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-black bg-[#FFE66D]">
              <Repeat className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Auto-Fund This Circle With DCA</h3>
              <p className="text-[15px] text-black/60">Create a recurring STRK accumulation plan tied to this circle.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="mb-2 text-sm font-bold">Sell Token</p>
              <Select value={dcaSellToken} onValueChange={(value) => setDcaSellToken(value as StarkZapTokenKey)}>
                <SelectTrigger className="border-[2px] border-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[2px] border-black">
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="STRK">STRK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Budget</p>
              <Input value={dcaBudget} onChange={(event) => setDcaBudget(event.target.value)} className="border-[2px] border-black bg-white" />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Per Cycle</p>
              <Input value={dcaPerCycle} onChange={(event) => setDcaPerCycle(event.target.value)} className="border-[2px] border-black bg-white" />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Frequency</p>
              <Select value={dcaFrequency} onValueChange={(value) => setDcaFrequency(value as StarkZapDcaFrequency)}>
                <SelectTrigger className="border-[2px] border-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[2px] border-black">
                  <SelectItem value="PT12H">Every 12 Hours</SelectItem>
                  <SelectItem value="P1D">Daily</SelectItem>
                  <SelectItem value="P1W">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">Provider</p>
              <Select value={dcaProviderId} onValueChange={(value) => setDcaProviderId(value as StarkZapDcaProviderId)}>
                <SelectTrigger className="border-[2px] border-black bg-white">
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
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void handleDcaSetup()} disabled={dcaBusy} className="neo-button-primary">
              {dcaBusy ? 'Creating DCA...' : 'Create Circle DCA'}
            </Button>
          </div>

          {dcaError && (
            <div className="mt-5 border-[2px] border-black bg-[#FF6B6B]/15 p-4 text-[15px] text-[#8b1e1e]">
              <p className="font-black">Circle DCA Error</p>
              <p className="mt-1 text-black/75">{dcaError}</p>
            </div>
          )}
        </div>

        <div className="neo-card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-black bg-[#96CEB4]">
              <PiggyBank className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Use A Vesu Position To Fund The Circle</h3>
              <p className="text-[15px] text-black/60">Withdraw or borrow, optionally route to STRK, then finish the circle action atomically.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <p className="mb-2 text-sm font-bold">Strategy</p>
              <Select value={lendingAction} onValueChange={(value) => setLendingAction(value as 'withdraw' | 'withdraw_max' | 'borrow')}>
                <SelectTrigger className="border-[2px] border-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[2px] border-black">
                  {LENDING_ACTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">{showBorrowControls ? 'Borrow Token' : 'Withdraw Token'}</p>
              <Select value={lendingSourceToken} onValueChange={(value) => setLendingSourceToken(value as StarkZapTokenKey)}>
                <SelectTrigger className="border-[2px] border-black bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[2px] border-black">
                  <SelectItem value="STRK">STRK</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">{showFixedAmount ? 'Amount' : 'Amount'}</p>
              <Input
                value={showFixedAmount ? lendingAmount : 'MAX'}
                onChange={(event) => setLendingAmount(event.target.value)}
                className="border-[2px] border-black bg-white"
                disabled={!showFixedAmount}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold">{showBorrowControls ? 'Collateral Token' : 'Swap Route'}</p>
              {showBorrowControls ? (
                <Select value={lendingCollateralToken} onValueChange={(value) => setLendingCollateralToken(value as Exclude<StarkZapTokenKey, 'STRK'>)}>
                  <SelectTrigger className="border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={lendingSwapProviderId} onValueChange={(value) => setLendingSwapProviderId(value as StarkZapSwapProviderId)}>
                  <SelectTrigger className="border-[2px] border-black bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[2px] border-black">
                    {swapProviderOptions.filter((option) => option.value !== 'best').map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {showBorrowControls && (
              <>
                <Button type="button" onClick={() => void handleLendingMaxBorrow()} disabled={lendingBusy !== null} className="neo-button-secondary">
                  {lendingBusy === 'max' ? 'Checking Max...' : 'Get Max Borrow'}
                </Button>
                <Button type="button" onClick={() => void handleLendingHealth()} disabled={lendingBusy !== null} variant="outline" className="border-[2px] border-black">
                  {lendingBusy === 'health' ? 'Quoting Health...' : 'Preview Health'}
                </Button>
              </>
            )}
            <Button type="button" onClick={() => void handleLendingFunding()} disabled={lendingBusy !== null} className="neo-button-primary">
              {lendingBusy === 'submit' ? 'Submitting...' : `${showBorrowControls ? 'Borrow' : 'Withdraw'} + ${props.action === 'join' ? 'Join' : 'Contribute'}`}
            </Button>
          </div>

          {(lendingMaxBorrow || lendingHealth) && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {lendingMaxBorrow && (
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Max Borrow</p>
                  <p className="mt-2 text-2xl font-black">{lendingMaxBorrow}</p>
                </div>
              )}
              {lendingHealth && (
                <div className="border-[2px] border-black bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Health Preview</p>
                  <p className="mt-2 text-sm font-black">Current debt: {lendingHealth.currentDebtValue}</p>
                  <p className="mt-1 text-sm font-black">Projected debt: {lendingHealth.projectedDebtValue || 'Unavailable'}</p>
                  <p className="mt-1 text-sm text-black/65">
                    {lendingHealth.simulationOk ? 'Simulation passed.' : lendingHealth.simulationReason || 'Simulation failed.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {lendingError && (
            <div className="mt-5 border-[2px] border-black bg-[#FF6B6B]/15 p-4 text-[15px] text-[#8b1e1e]">
              <p className="font-black">Lending Strategy Error</p>
              <p className="mt-1 text-black/75">{lendingError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border-[2px] border-black bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Required STRK</p>
          <p className="mt-2 text-3xl font-black">{requiredAmountLabel}</p>
          <p className="mt-2 text-sm text-black/65">
            This is the amount the circle needs for the next {props.action === 'join' ? 'membership lock' : 'payment'}.
          </p>
        </div>
        <div className="border-[2px] border-black bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Best Current Swap</p>
          <p className="mt-2 text-3xl font-black">{swapComparisons[0]?.provider || '—'}</p>
          <p className="mt-2 text-sm text-black/65">
            {swapComparisons.length > 0
              ? `${swapComparisons[0].amountOut}${swapMeetsTarget ? ' covers the target.' : ' may need a larger input.'}`
              : 'Compare AVNU and Ekubo to choose the strongest route.'}
          </p>
        </div>
        <div className="border-[2px] border-black bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Automation Hint</p>
          <p className="mt-2 text-3xl font-black">{dcaFrequency === 'P1W' ? 'Weekly' : dcaFrequency === 'P1D' ? 'Daily' : '12H'}</p>
          <p className="mt-2 text-sm text-black/65">
            A recurring STRK build keeps the circle funded before the next cycle arrives.
          </p>
        </div>
      </div>
    </div>
  );
}
