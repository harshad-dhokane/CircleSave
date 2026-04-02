import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useStarkZapActions } from '@/hooks/useStarkZapActions';
import type { StarkZapStakingPositionView, StarkZapExecutionMode } from '@/hooks/useStarkZapActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Landmark, Loader2, RefreshCw, LogOut, Gift, ArrowDown, Info } from 'lucide-react';

// Sepolia delegation pool (from on-chain staking contract events)
const DEFAULT_POOL_ADDRESS = '0x3e615638e0b79444a70f8c695bf8f2a47033bf1cf95691ec3130f64939cee99';

export function StakingPage() {
  const {
    isWalletReady,
    stakeTokens,
    loadStakingPosition,
    claimStakingRewards,
    unstakeIntent,
    unstakeComplete,
    recommendedExecutionMode,
  } = useStarkZapActions();

  const poolAddress = DEFAULT_POOL_ADDRESS;
  const [amount, setAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [position, setPosition] = useState<StarkZapStakingPositionView | null>(null);
  const [loadingPosition, setLoadingPosition] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');

  const feeMode = recommendedExecutionMode as StarkZapExecutionMode;

  const refreshPosition = async () => {
    if (!isWalletReady || !poolAddress) return;
    setLoadingPosition(true);
    try {
      const result = await loadStakingPosition({ poolAddress });
      setPosition(result);
    } catch {
      // hook surfaces toast
    } finally {
      setLoadingPosition(false);
    }
  };

  useEffect(() => {
    if (isWalletReady && poolAddress.startsWith('0x') && poolAddress.length > 10) {
      void refreshPosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalletReady, poolAddress]);

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid STRK amount');
      return;
    }
    setBusy(true);
    try {
      await stakeTokens({ poolAddress, amount, feeMode });
      setAmount('');
      void refreshPosition();
    } catch {
      // hook surfaces toast
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    setBusy(true);
    try {
      await claimStakingRewards({ poolAddress, feeMode });
      void refreshPosition();
    } catch {
      // hook surfaces toast
    } finally {
      setBusy(false);
    }
  };

  const handleUnstakeIntent = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      toast.error('Enter a valid unstake amount');
      return;
    }
    setBusy(true);
    try {
      await unstakeIntent({ poolAddress, amount: unstakeAmount, feeMode });
      setUnstakeAmount('');
      void refreshPosition();
    } catch {
      // hook surfaces toast
    } finally {
      setBusy(false);
    }
  };

  const handleUnstakeComplete = async () => {
    setBusy(true);
    try {
      await unstakeComplete({ poolAddress, feeMode });
      void refreshPosition();
    } catch {
      // hook surfaces toast
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="mx-auto max-w-3xl space-y-8 pt-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-[2px] border-black bg-[#4ECDC4] shadow-[2px_2px_0px_0px_#1a1a1a]">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">STRK Staking</h1>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-black/65">
            Delegate STRK to a Starknet staking pool and earn protocol rewards. Powered by StarkZap v2 delegation pool integration.
          </p>
        </div>

        {/* Pool Address — fixed */}
        <div className="flex items-center gap-3 border-[2px] border-black bg-white p-4 shadow-[3px_3px_0px_0px_#1a1a1a]">
          <span className="text-[12px] font-black uppercase tracking-[0.12em] text-black/55">Pool</span>
          <span className="font-mono text-[11px] text-black/45 truncate">{poolAddress}</span>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr,300px]">
          {/* Main Action Panel */}
          <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-0 border-[2px] border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
              <button
                type="button"
                onClick={() => setActiveTab('stake')}
                className={`flex-1 py-3 text-center text-[13px] font-black uppercase tracking-[0.06em] transition-colors ${activeTab === 'stake' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
              >
                Stake
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unstake')}
                className={`flex-1 border-l-[2px] border-black py-3 text-center text-[13px] font-black uppercase tracking-[0.06em] transition-colors ${activeTab === 'unstake' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
              >
                Unstake
              </button>
            </div>

            {/* Stake Form */}
            {activeTab === 'stake' && (
              <div className="space-y-4 border-[2px] border-black bg-white p-5 shadow-[3px_3px_0px_0px_#1a1a1a]">
                <div className="space-y-2">
                  <label
                    htmlFor="stake-amount"
                    className="text-[12px] font-black uppercase tracking-[0.12em] text-black/55"
                  >
                    Amount (STRK)
                  </label>
                  <div className="relative">
                    <Input
                      id="stake-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-14 rounded-none border-[2px] border-black pr-16 text-xl font-bold shadow-none focus-visible:ring-0"
                      disabled={busy || !isWalletReady}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-black/40">
                      STRK
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleStake}
                  disabled={busy || !isWalletReady || !amount}
                  className="h-12 w-full rounded-none border-[2px] border-black bg-[#4ECDC4] text-sm font-black uppercase tracking-[0.06em] text-white shadow-[2px_2px_0px_0px_#1a1a1a] transition-all hover:bg-[#45b8b0] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1a1a]"
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDown className="mr-2 h-4 w-4" />
                  )}
                  {busy ? 'Staking...' : 'Stake STRK'}
                </Button>

                <div className="flex items-start gap-2 border-[2px] border-black/20 bg-[#F0F4C3] p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-black/50" />
                  <p className="text-xs leading-relaxed text-black/60">
                    Staking locks your STRK in a delegation pool. Rewards accrue automatically but unstaking requires a cooldown period.
                  </p>
                </div>
              </div>
            )}

            {/* Unstake Form */}
            {activeTab === 'unstake' && (
              <div className="space-y-4 border-[2px] border-black bg-white p-5 shadow-[3px_3px_0px_0px_#1a1a1a]">
                <div className="space-y-2">
                  <label
                    htmlFor="unstake-amount"
                    className="text-[12px] font-black uppercase tracking-[0.12em] text-black/55"
                  >
                    Unstake Amount (STRK)
                  </label>
                  <Input
                    id="unstake-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="h-14 rounded-none border-[2px] border-black text-xl font-bold shadow-none focus-visible:ring-0"
                    disabled={busy || !isWalletReady}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={handleUnstakeIntent}
                    disabled={busy || !isWalletReady || !unstakeAmount}
                    variant="outline"
                    className="h-12 rounded-none border-[2px] border-black text-sm font-black uppercase tracking-[0.06em] shadow-[2px_2px_0px_0px_#1a1a1a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1a1a]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {busy ? 'Processing...' : 'Request Unstake'}
                  </Button>

                  <Button
                    onClick={handleUnstakeComplete}
                    disabled={busy || !isWalletReady}
                    className="h-12 rounded-none border-[2px] border-black bg-[#FF6B6B] text-sm font-black uppercase tracking-[0.06em] text-white shadow-[2px_2px_0px_0px_#1a1a1a] transition-all hover:bg-[#ff6262] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1a1a]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {busy ? 'Finalizing...' : 'Complete Exit'}
                  </Button>
                </div>

                <div className="flex items-start gap-2 border-[2px] border-black/20 bg-[#FFCCBC] p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-black/50" />
                  <p className="text-xs leading-relaxed text-black/60">
                    Unstaking is a two-step process: (1) Request an unstake intent to begin the cooldown, then (2) Complete the exit to receive your STRK.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Position Sidebar */}
          <div className="space-y-4">
            <div className="border-[2px] border-black bg-white p-5 shadow-[3px_3px_0px_0px_#1a1a1a]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[12px] font-black uppercase tracking-[0.12em] text-black/55">
                  Your Position
                </h3>
                <button
                  type="button"
                  onClick={() => void refreshPosition()}
                  disabled={loadingPosition}
                  className="text-black/40 transition-colors hover:text-black"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingPosition ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {!isWalletReady ? (
                <div className="py-8 text-center">
                  <Landmark className="mx-auto mb-3 h-8 w-8 text-black/20" />
                  <p className="text-sm font-bold text-black/40">Connect wallet to view your staking position</p>
                </div>
              ) : loadingPosition ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-black/30" />
                </div>
              ) : position ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">Staked</p>
                    <p className="text-2xl font-black">{position.staked} <span className="text-sm text-black/40">STRK</span></p>
                  </div>
                  <div className="border-t-[2px] border-black/10 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">Rewards</p>
                    <p className="text-xl font-black text-[#4ECDC4]">{position.rewards} <span className="text-sm text-black/40">STRK</span></p>
                  </div>
                  {position.unpoolTime && (
                    <div className="border-t-[2px] border-black/10 pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">Exit Available</p>
                      <p className="text-sm font-bold">{new Date(position.unpoolTime).toLocaleString()}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleClaim}
                    disabled={busy || position.rewards === '0'}
                    className="mt-2 h-10 w-full rounded-none border-[2px] border-black bg-[#FFE66D] text-xs font-black uppercase tracking-[0.06em] text-black shadow-[2px_2px_0px_0px_#1a1a1a] transition-all hover:bg-[#fce054] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1a1a]"
                  >
                    <Gift className="mr-2 h-3.5 w-3.5" />
                    {busy ? 'Claiming...' : 'Claim Rewards'}
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Landmark className="mx-auto mb-3 h-8 w-8 text-black/20" />
                  <p className="text-sm font-bold text-black/40">No staking position found</p>
                  <p className="mt-1 text-xs text-black/30">Stake STRK to get started</p>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="border-[2px] border-black bg-[#F0F4C3] p-5 shadow-[3px_3px_0px_0px_#1a1a1a]">
              <h3 className="mb-3 text-[12px] font-black uppercase tracking-[0.12em] text-black/55">
                How It Works
              </h3>
              <ol className="space-y-2 text-xs leading-relaxed text-black/60">
                <li className="flex gap-2">
                  <span className="font-black text-black/40">1.</span>
                  Enter a STRK amount and click Stake
                </li>
                <li className="flex gap-2">
                  <span className="font-black text-black/40">2.</span>
                  Rewards accrue to your pool position
                </li>
                <li className="flex gap-2">
                  <span className="font-black text-black/40">3.</span>
                  Claim rewards anytime
                </li>
                <li className="flex gap-2">
                  <span className="font-black text-black/40">4.</span>
                  Request unstake → wait cooldown → complete exit
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
