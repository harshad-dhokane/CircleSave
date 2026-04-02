import { useAccount, useProvider } from '@starknet-react/core';
import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  appendStarkZapLog,
  updateStarkZapLog,
  type StarkZapLogDetails,
} from '@/lib/starkzapLogs';
import {
  Amount,
  ChainId,
  Tx,
  fromAddress,
  sepoliaTokens,
} from '@/lib/starkzap-v2-runtime';
import { createConnectedStarkZapWallet } from '@/lib/starkzapConnectedWallet';
import {
  buildContributeCall,
  buildCreateCircleCall,
  buildJoinCircleCall,
} from '@/lib/circleCalls';
import { CONTRACTS } from '@/lib/constants';

export type StarkZapTokenKey = 'ETH' | 'USDC' | 'STRK';
export type StarkZapDcaFrequency = 'PT12H' | 'P1D' | 'P1W';
export type StarkZapSwapProviderId = 'best' | 'avnu' | 'ekubo';
export type StarkZapDcaProviderId = 'avnu' | 'ekubo';
export type StarkZapExecutionMode = 'user_pays' | 'sponsored';
export type StarkZapLendingStrategy = 'deposit' | 'withdraw' | 'withdraw_max' | 'borrow' | 'repay';
export type StarkZapCircleStrategy = 'join' | 'contribute';

export interface StarkZapSwapPreview {
  provider: string;
  providerId: Exclude<StarkZapSwapProviderId, 'best'>;
  amountIn: string;
  amountOut: string;
  priceImpact?: string;
  callCount: number;
}

export interface StarkZapSwapComparison extends StarkZapSwapPreview {
  recommended: boolean;
}

export interface StarkZapDcaPreview {
  provider: string;
  providerId: StarkZapDcaProviderId;
  sellAmountPerCycle: string;
  estimatedBuyAmount: string;
}

export interface StarkZapOrderView {
  id: string;
  orderAddress: string;
  provider: string;
  providerId: StarkZapDcaProviderId;
  sellToken: string;
  buyToken: string;
  totalSellAmount: string;
  soldAmount: string;
  boughtAmount: string;
  frequency: string;
  status: string;
  createdAt: string;
}

export interface StarkZapMarketView {
  poolName: string;
  asset: string;
  protocol: string;
  supplyApy?: string;
  borrowApr?: string;
  totalSupplied?: string;
  totalBorrowed?: string;
  canBeBorrowed?: boolean;
}

export interface StarkZapPositionView {
  type: string;
  poolName: string;
  collateral: string;
  debt?: string;
}

export interface StarkZapLendingHealthView {
  collateralToken: string;
  debtToken: string;
  currentCollateralValue: string;
  currentDebtValue: string;
  projectedCollateralValue?: string;
  projectedDebtValue?: string;
  maxBorrowAmount?: string;
  simulationOk: boolean;
  simulationReason?: string;
}

export interface StarkZapTxView {
  hash: string;
  explorerUrl: string;
}

export interface StarkZapStakingPositionView {
  staked: string;
  rewards: string;
  unpoolTime?: string;
  commission?: string;
}

const PRIMARY_TOKENS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];
const SWAP_PROVIDER_IDS: Array<Exclude<StarkZapSwapProviderId, 'best'>> = ['avnu', 'ekubo'];
const DCA_PROVIDER_IDS: StarkZapDcaProviderId[] = ['avnu', 'ekubo'];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatBps(value?: bigint | null) {
  if (value === null || value === undefined) return undefined;
  return `${(Number(value) / 100).toFixed(2)}%`;
}

function formatUsd(value?: bigint | null) {
  if (value === null || value === undefined) return undefined;
  return Amount.fromRaw(value, 18, 'USD').toFormatted(true);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unexpected StarkZap error';
}

const WALLET_INITIALIZING_MESSAGE = 'Wallet account is still initializing. Please try again in a moment.';

function isWalletInitializingError(error: unknown) {
  return getErrorMessage(error).toLowerCase().includes('wallet account is still initializing');
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function toFriendlyActionError(kind: 'swap' | 'dca' | 'lending' | 'staking', error: unknown) {
  const message = getErrorMessage(error).trim();
  const lower = message.toLowerCase();

  if (lower.includes('sellamountpercycle cannot exceed sellamount')) {
    return 'Sell per cycle cannot be greater than total sell amount.';
  }

  if (lower.includes('unknown swap provider') || lower.includes('unknown dca provider')) {
    return 'That provider is not available for the current action.';
  }

  if (
    lower.includes('insufficient liquidity') ||
    lower.includes('returned no routes') ||
    lower.includes('quote failed') ||
    lower.includes('zero output')
  ) {
    return kind === 'dca'
      ? 'No live DCA route is available for this pair on Sepolia right now. Try STRK -> ETH first.'
      : 'No live swap route is available for this pair on Sepolia right now. Try STRK -> ETH first.';
  }

  if (
    lower.includes('transfer amount exceeds balance') ||
    lower.includes('insufficient balance') ||
    lower.includes('insufficient_balance')
  ) {
    return 'Your wallet does not have enough balance for this action.';
  }

  if (
    lower.includes('user rejected') ||
    lower.includes('rejected') ||
    lower.includes('cancelled') ||
    lower.includes('canceled') ||
    lower.includes('user abort')
  ) {
    return 'The transaction was cancelled in the wallet.';
  }

  if (
    lower.includes('snip-9') ||
    lower.includes('snip9') ||
    lower.includes('sponsored execution is not available') ||
    lower.includes('paymaster') ||
    lower.includes('fee mode')
  ) {
    return 'This Cartridge session uses regular wallet signing in CircleSave. Gasless execution is not available for this account.';
  }

  if (
    lower.includes('networkerror') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout') ||
    (lower.includes('rpc') && (lower.includes('unavailable') || lower.includes('error') || lower.includes('connect')))
  ) {
    return 'The Sepolia RPC or StarkZap provider API did not respond. Please try again in a moment.';
  }

  return message || 'Unexpected StarkZap error';
}

function getSwapProviderLabel(providerId: Exclude<StarkZapSwapProviderId, 'best'>) {
  return providerId === 'ekubo' ? 'Ekubo' : 'AVNU';
}

function getDcaProviderLabel(providerId: StarkZapDcaProviderId) {
  return providerId === 'ekubo' ? 'Ekubo' : 'AVNU';
}

function toExecutionOptions(feeMode?: StarkZapExecutionMode) {
  if (!feeMode || feeMode === 'user_pays') {
    return undefined;
  }

  return {
    feeMode,
  } as const;
}

function supportsSponsoredExecutionForAccount(
  account: unknown,
  paymasterProvider: unknown,
): account is {
  executePaymasterTransaction: (
    calls: unknown[],
    paymasterDetails: unknown,
  ) => Promise<{ transaction_hash: string }>;
} {
  if (!paymasterProvider || !account || typeof account !== 'object') {
    return false;
  }

  const constructorName = (account as { constructor?: { name?: string } }).constructor?.name;
  if (constructorName === 'WalletAccount' || constructorName === '_WalletAccount') {
    return false;
  }

  return typeof (account as { executePaymasterTransaction?: unknown }).executePaymasterTransaction === 'function';
}

function getSponsoredExecutionNotice(account: unknown, paymasterProvider: unknown) {
  if (!paymasterProvider) {
    return 'Gasless mode is disabled because the AVNU paymaster provider is not configured for this environment.';
  }

  if (!account || typeof account !== 'object') {
    return 'Gasless support will be checked as soon as the wallet session finishes loading.';
  }

  const constructorName = (account as { constructor?: { name?: string } }).constructor?.name;
  if (constructorName === 'WalletAccount' || constructorName === '_WalletAccount') {
    return 'This Cartridge wallet session uses regular signing only in CircleSave because the connected account is not SNIP-9 compatible for sponsored execution.';
  }

  if (supportsSponsoredExecutionForAccount(account, paymasterProvider)) {
    return null;
  }

  return 'This wallet connection does not expose paymaster execution, so CircleSave will use regular signing instead.';
}

function needsSwap(providerId: StarkZapSwapProviderId, sourceToken: StarkZapTokenKey) {
  return providerId && sourceToken !== 'STRK';
}

export function useStarkZapActions() {
  const { account, address, isConnected } = useAccount();
  const { provider, paymasterProvider } = useProvider();
  const isWalletReady = Boolean(isConnected && address && account);
  const sponsoredExecutionNotice = getSponsoredExecutionNotice(account, paymasterProvider);
  const supportsSponsoredExecution = sponsoredExecutionNotice === null;
  const recommendedExecutionMode = supportsSponsoredExecution
    ? 'sponsored' as StarkZapExecutionMode
    : 'user_pays' as StarkZapExecutionMode;
  const normalizeExecutionMode = useCallback((feeMode?: StarkZapExecutionMode) => {
    if (feeMode === 'sponsored' && !supportsSponsoredExecution) {
      return 'user_pays' as StarkZapExecutionMode;
    }

    return feeMode;
  }, [supportsSponsoredExecution]);

  const getWallet = useCallback((defaultFeeMode?: StarkZapExecutionMode) => {
    if (!isConnected || !address) {
      throw new Error('Connect your wallet first.');
    }

    if (!account) {
      throw new Error(WALLET_INITIALIZING_MESSAGE);
    }

    return createConnectedStarkZapWallet({
      account: account as any,
      address,
      provider: provider as any,
      chainId: ChainId.SEPOLIA,
      defaultFeeMode: normalizeExecutionMode(defaultFeeMode),
    });
  }, [account, address, isConnected, normalizeExecutionMode, provider]);

  const trackTransaction = useCallback(async (params: {
    title: string;
    summary: string;
    kind: 'swap' | 'dca' | 'lending' | 'staking';
    providerId: string;
    transactionHash: string;
    details?: StarkZapLogDetails;
  }): Promise<StarkZapTxView> => {
    if (!address) {
      throw new Error('Connect your wallet first.');
    }

    const tx = new Tx(params.transactionHash, provider as any, ChainId.SEPOLIA);

    const logEntry = appendStarkZapLog({
      kind: params.kind,
      title: params.title,
      summary: params.summary,
      account: address,
      provider: params.providerId,
      txHash: params.transactionHash,
      explorerUrl: tx.explorerUrl,
      details: params.details,
    });

    void (async () => {
      try {
        await tx.wait();
        updateStarkZapLog(logEntry.id, { status: 'confirmed' });
        toast.success(`${params.title} confirmed`);
      } catch (error) {
        updateStarkZapLog(logEntry.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Transaction failed',
        });
        toast.error(`${params.title} failed`);
      }
    })();

    return {
      hash: params.transactionHash,
      explorerUrl: tx.explorerUrl,
    };
  }, [address, provider]);

  const runAction = useCallback(async <T,>(
    kind: 'swap' | 'dca' | 'lending' | 'staking',
    action: () => Promise<T>,
  ): Promise<T> => {
    try {
      return await action();
    } catch (error) {
      const friendly = toFriendlyActionError(kind, error);
      if (isWalletInitializingError(error) || isWalletInitializingError(friendly)) {
        throw new Error(friendly);
      }
      toast.error(friendly);
      throw new Error(friendly);
    }
  }, []);

  const buildSwapComparisons = useCallback(async (params: {
    tokenIn: StarkZapTokenKey;
    tokenOut: StarkZapTokenKey;
    amount: string;
  }) => {
    if (params.tokenIn === params.tokenOut) {
      throw new Error('Choose two different tokens.');
    }

    const wallet = getWallet();
    const tokenIn = sepoliaTokens[params.tokenIn];
    const tokenOut = sepoliaTokens[params.tokenOut];
    const amountIn = Amount.parse(params.amount, tokenIn);

    const settled = await Promise.allSettled(
      SWAP_PROVIDER_IDS.map(async (providerId) => {
        const prepared = await withTimeout(
          wallet.prepareSwap({
            provider: providerId,
            tokenIn,
            tokenOut,
            amountIn,
            slippageBps: 100n,
          }),
          12000,
          `${getSwapProviderLabel(providerId)} route preparation`,
        );

        return {
          provider: getSwapProviderLabel(providerId),
          providerId,
          amountIn: amountIn.toFormatted(true),
          amountOut: Amount.fromRaw(prepared.quote.amountOutBase, tokenOut).toFormatted(true),
          amountOutBase: prepared.quote.amountOutBase,
          priceImpact: formatBps(prepared.quote.priceImpactBps),
          callCount: prepared.calls.length,
        };
      }),
    );

    const successful = settled
      .flatMap((item) => item.status === 'fulfilled' ? [item.value] : [])
      .sort((left, right) => {
        if (left.amountOutBase === right.amountOutBase) {
          return left.callCount - right.callCount;
        }

        return left.amountOutBase > right.amountOutBase ? -1 : 1;
      });

    if (successful.length === 0) {
      const firstFailure = settled.find((item) => item.status === 'rejected');
      throw firstFailure?.status === 'rejected'
        ? firstFailure.reason
        : new Error('No live swap providers are available for this pair right now.');
    }

    return successful.map((item, index) => ({
      provider: item.provider,
      providerId: item.providerId,
      amountIn: item.amountIn,
      amountOut: item.amountOut,
      priceImpact: item.priceImpact,
      callCount: item.callCount,
      recommended: index === 0,
    })) satisfies StarkZapSwapComparison[];
  }, [getWallet]);

  const previewSwap = useCallback(async (params: {
    tokenIn: StarkZapTokenKey;
    tokenOut: StarkZapTokenKey;
    amount: string;
    providerId?: StarkZapSwapProviderId;
  }): Promise<StarkZapSwapPreview> => {
    return runAction('swap', async () => {
      const comparisons = await buildSwapComparisons(params);
      const selectedProviderId = params.providerId && params.providerId !== 'best'
        ? params.providerId
        : comparisons[0].providerId;
      const match = comparisons.find((item) => item.providerId === selectedProviderId) || comparisons[0];

      return {
        provider: match.provider,
        providerId: match.providerId,
        amountIn: match.amountIn,
        amountOut: match.amountOut,
        priceImpact: match.priceImpact,
        callCount: match.callCount,
      };
    });
  }, [buildSwapComparisons, runAction]);

  const compareSwapProviders = useCallback(async (params: {
    tokenIn: StarkZapTokenKey;
    tokenOut: StarkZapTokenKey;
    amount: string;
  }): Promise<StarkZapSwapComparison[]> => {
    return runAction('swap', async () => buildSwapComparisons(params));
  }, [buildSwapComparisons, runAction]);

  const executeSwap = useCallback(async (params: {
    tokenIn: StarkZapTokenKey;
    tokenOut: StarkZapTokenKey;
    amount: string;
    providerId?: StarkZapSwapProviderId;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('swap', async () => {
      if (params.tokenIn === params.tokenOut) {
        throw new Error('Choose two different tokens.');
      }

      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const tokenIn = sepoliaTokens[params.tokenIn];
      const tokenOut = sepoliaTokens[params.tokenOut];
      const amountIn = Amount.parse(params.amount, tokenIn);
      const comparisons = params.providerId === 'best' || !params.providerId
        ? await buildSwapComparisons(params)
        : null;
      const providerId = params.providerId && params.providerId !== 'best'
        ? params.providerId
        : comparisons?.[0]?.providerId || 'avnu';
      const prepared = await withTimeout(
        wallet.prepareSwap({
          provider: providerId,
          tokenIn,
          tokenOut,
          amountIn,
          slippageBps: 100n,
        }),
        12000,
        'Swap route preparation',
      );
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('Swap submitted');

      return trackTransaction({
        title: 'Swap',
        summary: `${params.amount} ${params.tokenIn} -> ${params.tokenOut} via ${getSwapProviderLabel(providerId)}`,
        kind: 'swap',
        providerId,
        transactionHash: tx.hash,
        details: {
          inputAmount: params.amount,
          inputToken: params.tokenIn,
          outputAmount: Amount.fromRaw(prepared.quote.amountOutBase, tokenOut).toFormatted(true),
          outputToken: params.tokenOut,
        },
      });
    });
  }, [buildSwapComparisons, getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const previewDca = useCallback(async (params: {
    sellToken: StarkZapTokenKey;
    buyToken: StarkZapTokenKey;
    sellAmountPerCycle: string;
    providerId?: StarkZapDcaProviderId;
  }): Promise<StarkZapDcaPreview> => {
    return runAction('dca', async () => {
      if (params.sellToken === params.buyToken) {
        throw new Error('Choose two different DCA tokens.');
      }

      const wallet = getWallet();
      const sellToken = sepoliaTokens[params.sellToken];
      const buyToken = sepoliaTokens[params.buyToken];
      const sellAmountPerCycle = Amount.parse(params.sellAmountPerCycle, sellToken);
      const providerId = params.providerId || 'avnu';
      const quote = await withTimeout(
        wallet.dca().previewCycle({
          sellToken,
          buyToken,
          sellAmountPerCycle,
          swapProvider: providerId,
          slippageBps: 100n,
        }),
        12000,
        'DCA cycle preview',
      );

      return {
        provider: getDcaProviderLabel(providerId),
        providerId,
        sellAmountPerCycle: sellAmountPerCycle.toFormatted(true),
        estimatedBuyAmount: Amount.fromRaw(quote.amountOutBase, buyToken).toFormatted(true),
      };
    });
  }, [getWallet, runAction]);

  const createDca = useCallback(async (params: {
    sellToken: StarkZapTokenKey;
    buyToken: StarkZapTokenKey;
    sellAmount: string;
    sellAmountPerCycle: string;
    frequency: StarkZapDcaFrequency;
    providerId?: StarkZapDcaProviderId;
    feeMode?: StarkZapExecutionMode;
    summaryLabel?: string;
  }): Promise<StarkZapTxView> => {
    return runAction('dca', async () => {
      if (params.sellToken === params.buyToken) {
        throw new Error('Choose two different DCA tokens.');
      }

      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const providerId = params.providerId || 'avnu';
      const sellToken = sepoliaTokens[params.sellToken];
      const buyToken = sepoliaTokens[params.buyToken];
      const prepared = await withTimeout(
        wallet.dca().prepareCreate({
          provider: providerId,
          sellToken,
          buyToken,
          sellAmount: Amount.parse(params.sellAmount, sellToken),
          sellAmountPerCycle: Amount.parse(params.sellAmountPerCycle, sellToken),
          frequency: params.frequency,
        }),
        12000,
        'DCA order preparation',
      );
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('DCA order submitted');

      const summarySuffix = params.summaryLabel ? ` for ${params.summaryLabel}` : '';
      return trackTransaction({
        title: 'DCA Order',
        summary: `${params.sellAmount} ${params.sellToken} budget • ${params.sellAmountPerCycle} ${params.sellToken} every ${params.frequency} into ${params.buyToken}${summarySuffix}`,
        kind: 'dca',
        providerId,
        transactionHash: tx.hash,
        details: {
          totalAmount: params.sellAmount,
          totalToken: params.sellToken,
          cycleAmount: params.sellAmountPerCycle,
          cycleToken: params.sellToken,
          frequency: params.frequency,
          outputToken: params.buyToken,
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const loadDcaOrders = useCallback(async (params?: {
    providerId?: StarkZapDcaProviderId | 'all';
  }): Promise<StarkZapOrderView[]> => {
    return runAction('dca', async () => {
      const wallet = getWallet();
      const providerIds = !params?.providerId || params.providerId === 'all'
        ? DCA_PROVIDER_IDS
        : [params.providerId];

      const pages = await Promise.allSettled(
        providerIds.map((providerId) => withTimeout(
          wallet.dca().getOrders({
            provider: providerId,
            size: 12,
          }),
          12000,
          `${getDcaProviderLabel(providerId)} orders refresh`,
        )),
      );

      const tokensByAddress = new Map(
        Object.values(sepoliaTokens).map((token) => [token.address.toLowerCase(), token]),
      );

      const content = pages
        .flatMap((page) => page.status === 'fulfilled' ? page.value.content : [])
        .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime());

      return content.map((order) => {
        const sellToken = tokensByAddress.get(order.sellTokenAddress.toLowerCase());
        const buyToken = tokensByAddress.get(order.buyTokenAddress.toLowerCase());
        const providerId = order.providerId === 'ekubo' ? 'ekubo' : 'avnu';

        return {
          id: order.id,
          orderAddress: order.orderAddress.toString(),
          provider: getDcaProviderLabel(providerId),
          providerId,
          sellToken: sellToken?.symbol || 'TOKEN',
          buyToken: buyToken?.symbol || 'TOKEN',
          totalSellAmount: sellToken
            ? Amount.fromRaw(order.sellAmountBase, sellToken).toFormatted(true)
            : order.sellAmountBase.toString(),
          soldAmount: sellToken
            ? Amount.fromRaw(order.amountSoldBase, sellToken).toFormatted(true)
            : order.amountSoldBase.toString(),
          boughtAmount: buyToken
            ? Amount.fromRaw(order.amountBoughtBase, buyToken).toFormatted(true)
            : order.amountBoughtBase.toString(),
          frequency: order.frequency,
          status: order.status,
          createdAt: formatDate(order.timestamp),
        };
      });
    });
  }, [getWallet, runAction]);

  const cancelDca = useCallback(async (params: {
    providerId: StarkZapDcaProviderId;
    orderId?: string;
    orderAddress?: string;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('dca', async () => {
      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const prepared = await withTimeout(
        wallet.dca().prepareCancel({
          provider: params.providerId,
          orderId: params.orderId,
          orderAddress: params.orderAddress,
        }),
        12000,
        'DCA cancellation preparation',
      );
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('DCA cancellation submitted');

      return trackTransaction({
        title: 'DCA Cancel',
        summary: `Cancel ${getDcaProviderLabel(params.providerId)} DCA order`,
        kind: 'dca',
        providerId: params.providerId,
        transactionHash: tx.hash,
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const loadLendingMarkets = useCallback(async (): Promise<StarkZapMarketView[]> => {
    return runAction('lending', async () => {
      const wallet = getWallet();
      const markets = await wallet.lending().getMarkets();

      return markets
        .filter((market) => PRIMARY_TOKENS.includes(market.asset.symbol as StarkZapTokenKey))
        .slice(0, 8)
        .map((market) => ({
          poolName: market.poolName || 'Vesu Pool',
          asset: market.asset.symbol,
          protocol: market.protocol,
          supplyApy: market.stats?.supplyApy?.toFormatted(true),
          borrowApr: market.stats?.borrowApr?.toFormatted(true),
          totalSupplied: market.stats?.totalSupplied?.toFormatted(true),
          totalBorrowed: market.stats?.totalBorrowed?.toFormatted(true),
          canBeBorrowed: market.canBeBorrowed,
        }));
    });
  }, [getWallet, runAction]);

  const loadLendingPositions = useCallback(async (): Promise<StarkZapPositionView[]> => {
    return runAction('lending', async () => {
      const wallet = getWallet();
      const rawPositions = await wallet.lending().getPositions();

      return (rawPositions || []).slice(0, 8).map((position) => ({
        type: position.type,
        poolName: position.pool.name || 'Vesu Pool',
        collateral: `${position.collateral.amount.toString()} ${position.collateral.token.symbol}`,
        debt: position.debt ? `${position.debt.amount.toString()} ${position.debt.token.symbol}` : undefined,
      }));
    });
  }, [getWallet, runAction]);

  const getMaxBorrowQuote = useCallback(async (params: {
    collateralToken: StarkZapTokenKey;
    debtToken: StarkZapTokenKey;
  }) => {
    return runAction('lending', async () => {
      const wallet = getWallet();
      const collateralToken = sepoliaTokens[params.collateralToken];
      const debtToken = sepoliaTokens[params.debtToken];
      const amount = await wallet.lending().getMaxBorrowAmount({
        collateralToken,
        debtToken,
      });

      return Amount.fromRaw(amount, debtToken).toFormatted(true);
    });
  }, [getWallet, runAction]);

  const quoteLendingHealth = useCallback(async (params: {
    action: 'borrow' | 'repay';
    collateralToken: StarkZapTokenKey;
    debtToken: StarkZapTokenKey;
    amount: string;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapLendingHealthView> => {
    return runAction('lending', async () => {
      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const collateralToken = sepoliaTokens[params.collateralToken];
      const debtToken = sepoliaTokens[params.debtToken];
      const amount = Amount.parse(params.amount, debtToken);
      const actionRequest = params.action === 'borrow'
        ? {
          action: 'borrow' as const,
          request: {
            collateralToken,
            debtToken,
            amount,
          },
        }
        : {
          action: 'repay' as const,
          request: {
            collateralToken,
            debtToken,
            amount,
          },
        };

      const quote = await wallet.lending().quoteHealth({
        action: actionRequest,
        health: {
          collateralToken,
          debtToken,
        },
        feeMode: executionMode,
      });

      let maxBorrowAmount: string | undefined;
      if (params.action === 'borrow') {
        const maxBorrow = await wallet.lending().getMaxBorrowAmount({
          collateralToken,
          debtToken,
        });
        maxBorrowAmount = Amount.fromRaw(maxBorrow, debtToken).toFormatted(true);
      }

      return {
        collateralToken: params.collateralToken,
        debtToken: params.debtToken,
        currentCollateralValue: formatUsd(quote.current.collateralValue) || '$0.00 USD',
        currentDebtValue: formatUsd(quote.current.debtValue) || '$0.00 USD',
        projectedCollateralValue: formatUsd(quote.projected?.collateralValue),
        projectedDebtValue: formatUsd(quote.projected?.debtValue),
        maxBorrowAmount,
        simulationOk: quote.simulation.ok,
        simulationReason: quote.simulation.ok ? undefined : quote.simulation.reason,
      };
    });
  }, [getWallet, normalizeExecutionMode, runAction]);

  const depositToLending = useCallback(async (params: {
    token: StarkZapTokenKey;
    amount: string;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const token = sepoliaTokens[params.token];
      const prepared = await wallet.lending().prepareDeposit({
        token,
        amount: Amount.parse(params.amount, token),
      });
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('Lending deposit submitted');

      return trackTransaction({
        title: 'Lending Deposit',
        summary: `Deposit ${params.amount} ${params.token} into Vesu`,
        kind: 'lending',
        providerId: prepared.providerId,
        transactionHash: tx.hash,
        details: {
          action: 'deposit',
          inputAmount: params.amount,
          inputToken: params.token,
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const withdrawFromLending = useCallback(async (params: {
    token: StarkZapTokenKey;
    amount: string;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const token = sepoliaTokens[params.token];
      const prepared = await wallet.lending().prepareWithdraw({
        token,
        amount: Amount.parse(params.amount, token),
      });
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('Lending withdrawal submitted');

      return trackTransaction({
        title: 'Lending Withdraw',
        summary: `Withdraw ${params.amount} ${params.token} from Vesu`,
        kind: 'lending',
        providerId: prepared.providerId,
        transactionHash: tx.hash,
        details: {
          action: 'withdraw',
          inputAmount: params.amount,
          inputToken: params.token,
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const withdrawMaxFromLending = useCallback(async (params: {
    token: StarkZapTokenKey;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const token = sepoliaTokens[params.token];
      const prepared = await wallet.lending().prepareWithdrawMax({
        token,
      });
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('Max withdrawal submitted');

      return trackTransaction({
        title: 'Lending Withdraw Max',
        summary: `Withdraw max ${params.token} from Vesu`,
        kind: 'lending',
        providerId: prepared.providerId,
        transactionHash: tx.hash,
        details: {
          action: 'withdraw',
          inputToken: params.token,
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const borrowFromLending = useCallback(async (params: {
    collateralToken: StarkZapTokenKey;
    debtToken: StarkZapTokenKey;
    amount: string;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      if (params.collateralToken === params.debtToken) {
        throw new Error('Choose different collateral and debt assets.');
      }

      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const collateralToken = sepoliaTokens[params.collateralToken];
      const debtToken = sepoliaTokens[params.debtToken];
      const prepared = await wallet.lending().prepareBorrow({
        collateralToken,
        debtToken,
        amount: Amount.parse(params.amount, debtToken),
      });
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('Borrow submitted');

      return trackTransaction({
        title: 'Lending Borrow',
        summary: `Borrow ${params.amount} ${params.debtToken} against ${params.collateralToken} on Vesu`,
        kind: 'lending',
        providerId: prepared.providerId,
        transactionHash: tx.hash,
        details: {
          action: 'borrow',
          inputAmount: params.amount,
          inputToken: params.debtToken,
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const repayToLending = useCallback(async (params: {
    collateralToken: StarkZapTokenKey;
    debtToken: StarkZapTokenKey;
    amount: string;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      if (params.collateralToken === params.debtToken) {
        throw new Error('Choose different collateral and debt assets.');
      }

      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const collateralToken = sepoliaTokens[params.collateralToken];
      const debtToken = sepoliaTokens[params.debtToken];
      const prepared = await wallet.lending().prepareRepay({
        collateralToken,
        debtToken,
        amount: Amount.parse(params.amount, debtToken),
      });
      const tx = await wallet.execute(prepared.calls, toExecutionOptions(executionMode));
      toast.success('Repay submitted');

      return trackTransaction({
        title: 'Lending Repay',
        summary: `Repay ${params.amount} ${params.debtToken} on Vesu`,
        kind: 'lending',
        providerId: prepared.providerId,
        transactionHash: tx.hash,
        details: {
          action: 'repay',
          inputAmount: params.amount,
          inputToken: params.debtToken,
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const fundCircleWithSwap = useCallback(async (params: {
    circleAddress: string;
    circleLabel: string;
    action: StarkZapCircleStrategy;
    requiredStrkAmount: bigint;
    sourceToken: Exclude<StarkZapTokenKey, 'STRK'>;
    sourceAmount: string;
    providerId?: StarkZapSwapProviderId;
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('swap', async () => {
      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const strkToken = sepoliaTokens.STRK;
      const sourceToken = sepoliaTokens[params.sourceToken];
      const comparisons = params.providerId === 'best' || !params.providerId
        ? await buildSwapComparisons({
          tokenIn: params.sourceToken,
          tokenOut: 'STRK',
          amount: params.sourceAmount,
        })
        : null;
      const providerId = params.providerId && params.providerId !== 'best'
        ? params.providerId
        : comparisons?.[0]?.providerId || 'avnu';

      const builder = wallet.tx()
        .swap({
          provider: providerId,
          tokenIn: sourceToken,
          tokenOut: strkToken,
          amountIn: Amount.parse(params.sourceAmount, sourceToken),
          slippageBps: 100n,
        })
        .approve(strkToken, fromAddress(params.circleAddress), Amount.fromRaw(params.requiredStrkAmount, strkToken))
        .add(params.action === 'join' ? buildJoinCircleCall(params.circleAddress) : buildContributeCall(params.circleAddress));

      const simulation = await builder.preflight();
      if (!simulation.ok) {
        throw new Error(simulation.reason);
      }

      const tx = await builder.send(toExecutionOptions(executionMode));
      toast.success(`${params.action === 'join' ? 'Join' : 'Contribution'} strategy submitted`);

      return trackTransaction({
        title: params.action === 'join' ? 'Swap + Join Circle' : 'Swap + Contribute',
        summary: `${params.sourceAmount} ${params.sourceToken} -> STRK via ${getSwapProviderLabel(providerId)} for ${params.circleLabel}`,
        kind: 'swap',
        providerId,
        transactionHash: tx.hash,
        details: {
          inputAmount: params.sourceAmount,
          inputToken: params.sourceToken,
          outputToken: 'STRK',
        },
      });
    });
  }, [buildSwapComparisons, getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const fundCircleFromLending = useCallback(async (params: {
    circleAddress: string;
    circleLabel: string;
    action: StarkZapCircleStrategy;
    lendingAction: 'withdraw' | 'withdraw_max' | 'borrow';
    sourceToken: StarkZapTokenKey;
    sourceAmount?: string;
    collateralToken?: StarkZapTokenKey;
    providerId?: StarkZapSwapProviderId;
    feeMode?: StarkZapExecutionMode;
    requiredStrkAmount: bigint;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const strkToken = sepoliaTokens.STRK;
      const sourceToken = sepoliaTokens[params.sourceToken];
      const providerId = params.providerId && params.providerId !== 'best'
        ? params.providerId
        : 'avnu';
      const builder = wallet.tx();

      if (params.lendingAction === 'withdraw_max') {
        if (params.sourceToken !== 'STRK') {
          throw new Error('Max withdraw can only go straight into the circle when the source asset is STRK.');
        }
        builder.lendWithdrawMax({
          token: sourceToken,
        });
      }

      if (params.lendingAction === 'withdraw') {
        if (!params.sourceAmount) {
          throw new Error('Enter how much to withdraw from Vesu.');
        }

        builder.lendWithdraw({
          token: sourceToken,
          amount: Amount.parse(params.sourceAmount, sourceToken),
        });
      }

      if (params.lendingAction === 'borrow') {
        if (!params.sourceAmount) {
          throw new Error('Enter how much to borrow from Vesu.');
        }
        if (!params.collateralToken) {
          throw new Error('Choose the collateral asset for the borrow.');
        }
        if (params.collateralToken === params.sourceToken) {
          throw new Error('Choose different collateral and borrowed assets.');
        }

        builder.lendBorrow({
          collateralToken: sepoliaTokens[params.collateralToken],
          debtToken: sourceToken,
          amount: Amount.parse(params.sourceAmount, sourceToken),
        });
      }

      if (needsSwap(providerId, params.sourceToken)) {
        if (!params.sourceAmount) {
          throw new Error('Enter the funding amount first.');
        }

        builder.swap({
          provider: providerId,
          tokenIn: sourceToken,
          tokenOut: strkToken,
          amountIn: Amount.parse(params.sourceAmount, sourceToken),
          slippageBps: 100n,
        });
      }

      builder
        .approve(strkToken, fromAddress(params.circleAddress), Amount.fromRaw(params.requiredStrkAmount, strkToken))
        .add(params.action === 'join' ? buildJoinCircleCall(params.circleAddress) : buildContributeCall(params.circleAddress));

      const simulation = await builder.preflight();
      if (!simulation.ok) {
        throw new Error(simulation.reason);
      }

      const tx = await builder.send(toExecutionOptions(executionMode));
      toast.success(`${params.lendingAction === 'borrow' ? 'Borrow' : 'Lending'} strategy submitted`);

      const actionLabel = params.lendingAction === 'borrow'
        ? `Borrow ${params.sourceAmount} ${params.sourceToken}`
        : params.lendingAction === 'withdraw_max'
          ? `Withdraw max ${params.sourceToken}`
          : `Withdraw ${params.sourceAmount} ${params.sourceToken}`;
      const swapSuffix = params.sourceToken === 'STRK' ? '' : `, swap via ${getSwapProviderLabel(providerId)},`;

      return trackTransaction({
        title: params.action === 'join' ? 'Lending + Join Circle' : 'Lending + Contribute',
        summary: `${actionLabel}${swapSuffix} and ${params.action} ${params.circleLabel}`,
        kind: 'lending',
        providerId: 'vesu',
        transactionHash: tx.hash,
        details: {
          action: params.lendingAction === 'borrow' ? 'borrow' : 'withdraw',
          inputAmount: params.sourceAmount,
          inputToken: params.sourceToken,
          outputToken: 'STRK',
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const launchCircleWithAutomation = useCallback(async (params: {
    circle: {
      name: string;
      description: string;
      monthlyAmount: string;
      maxMembers: number;
      circleType: number;
      category: number;
      collateralRatio: number;
    };
    automation?: {
      enabled: boolean;
      sellToken: StarkZapTokenKey;
      sellAmount: string;
      sellAmountPerCycle: string;
      frequency: StarkZapDcaFrequency;
      providerId?: StarkZapDcaProviderId;
    };
    feeMode?: StarkZapExecutionMode;
  }): Promise<StarkZapTxView> => {
    return runAction('dca', async () => {
      if (CONTRACTS.CIRCLE_FACTORY === '0x0') {
        throw new Error('Circle factory is not configured.');
      }

      const executionMode = normalizeExecutionMode(params.feeMode);
      const wallet = getWallet(executionMode);
      const builder = wallet.tx().add(buildCreateCircleCall(params.circle));
      const automationEnabled = params.automation?.enabled;

      if (automationEnabled && params.automation) {
        const providerId = params.automation.providerId || 'avnu';
        const sellToken = sepoliaTokens[params.automation.sellToken];

        builder.dcaCreate({
          provider: providerId,
          sellToken,
          buyToken: sepoliaTokens.STRK,
          sellAmount: Amount.parse(params.automation.sellAmount, sellToken),
          sellAmountPerCycle: Amount.parse(params.automation.sellAmountPerCycle, sellToken),
          frequency: params.automation.frequency,
        });
      }

      const simulation = await builder.preflight();
      if (!simulation.ok) {
        throw new Error(simulation.reason);
      }

      const tx = await builder.send(toExecutionOptions(executionMode));
      toast.success(automationEnabled ? 'Circle and auto-funding plan submitted' : 'Circle creation submitted');

      if (!automationEnabled || !params.automation) {
        return trackTransaction({
          title: 'Create Circle',
          summary: `Create ${params.circle.name}`,
          kind: 'swap',
          providerId: 'circlesave',
          transactionHash: tx.hash,
        });
      }

      return trackTransaction({
        title: 'Launch Circle + DCA',
        summary: `Create ${params.circle.name} and auto-fund it with ${params.automation.sellAmountPerCycle} ${params.automation.sellToken} every ${params.automation.frequency}`,
        kind: 'dca',
        providerId: params.automation.providerId || 'avnu',
        transactionHash: tx.hash,
        details: {
          totalAmount: params.automation.sellAmount,
          totalToken: params.automation.sellToken,
          cycleAmount: params.automation.sellAmountPerCycle,
          cycleToken: params.automation.sellToken,
          frequency: params.automation.frequency,
          outputToken: 'STRK',
        },
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  // ── Staking ─────────────────────────────────────────────────────────

  const stakeTokens = useCallback(async (params: {
    poolAddress: string;
    amount: string;
    feeMode?: StarkZapExecutionMode;
  }) => {
    const executionMode = normalizeExecutionMode(params.feeMode);
    return runAction('staking', async () => {
      const wallet = getWallet();
      const strkToken = sepoliaTokens.STRK;
      const amount = Amount.parse(params.amount, strkToken);
      const tx = await wallet.stake(
        fromAddress(params.poolAddress),
        amount,
        { feeMode: executionMode },
      );
      return trackTransaction({
        title: 'Stake STRK',
        summary: `Stake ${params.amount} STRK in delegation pool`,
        kind: 'swap',
        providerId: 'starkzap',
        transactionHash: tx.hash,
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const loadStakingPosition = useCallback(async (params: {
    poolAddress: string;
  }): Promise<StarkZapStakingPositionView | null> => {
    return runAction('staking', async () => {
      const wallet = getWallet();
      const position = await wallet.getPoolPosition(fromAddress(params.poolAddress));
      if (!position) return null;
      return {
        staked: position.staked.toFormatted(),
        rewards: position.rewards.toFormatted(),
        unpoolTime: position.unpoolTime ? position.unpoolTime.toISOString() : undefined,
      };
    });
  }, [getWallet, runAction]);

  const claimStakingRewards = useCallback(async (params: {
    poolAddress: string;
    feeMode?: StarkZapExecutionMode;
  }) => {
    const executionMode = normalizeExecutionMode(params.feeMode);
    return runAction('staking', async () => {
      const wallet = getWallet();
      const tx = await wallet.claimPoolRewards(
        fromAddress(params.poolAddress),
        { feeMode: executionMode },
      );
      return trackTransaction({
        title: 'Claim Staking Rewards',
        summary: 'Claim accumulated delegation pool rewards',
        kind: 'swap',
        providerId: 'starkzap',
        transactionHash: tx.hash,
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const unstakeIntent = useCallback(async (params: {
    poolAddress: string;
    amount: string;
    feeMode?: StarkZapExecutionMode;
  }) => {
    const executionMode = normalizeExecutionMode(params.feeMode);
    return runAction('staking', async () => {
      const wallet = getWallet();
      const strkToken = sepoliaTokens.STRK;
      const amount = Amount.parse(params.amount, strkToken);
      const tx = await wallet.exitPoolIntent(
        fromAddress(params.poolAddress),
        amount,
        { feeMode: executionMode },
      );
      return trackTransaction({
        title: 'Unstake Intent',
        summary: `Request unstake of ${params.amount} STRK`,
        kind: 'swap',
        providerId: 'starkzap',
        transactionHash: tx.hash,
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  const unstakeComplete = useCallback(async (params: {
    poolAddress: string;
    feeMode?: StarkZapExecutionMode;
  }) => {
    const executionMode = normalizeExecutionMode(params.feeMode);
    return runAction('staking', async () => {
      const wallet = getWallet();
      const tx = await wallet.exitPool(
        fromAddress(params.poolAddress),
        { feeMode: executionMode },
      );
      return trackTransaction({
        title: 'Complete Unstake',
        summary: 'Finalize pool exit and receive STRK',
        kind: 'swap',
        providerId: 'starkzap',
        transactionHash: tx.hash,
      });
    });
  }, [getWallet, normalizeExecutionMode, runAction, trackTransaction]);

  return {
    isConnected,
    address,
    isWalletReady,
    supportsSponsoredExecution,
    sponsoredExecutionNotice,
    recommendedExecutionMode,
    swapProviderOptions: [
      { value: 'best' as const, label: 'Best Route' },
      { value: 'avnu' as const, label: 'AVNU' },
      { value: 'ekubo' as const, label: 'Ekubo' },
    ],
    dcaProviderOptions: [
      { value: 'avnu' as const, label: 'AVNU' },
      { value: 'ekubo' as const, label: 'Ekubo' },
    ],
    previewSwap,
    compareSwapProviders,
    executeSwap,
    previewDca,
    createDca,
    loadDcaOrders,
    cancelDca,
    loadLendingMarkets,
    loadLendingPositions,
    getMaxBorrowQuote,
    quoteLendingHealth,
    depositToLending,
    withdrawFromLending,
    withdrawMaxFromLending,
    borrowFromLending,
    repayToLending,
    fundCircleWithSwap,
    fundCircleFromLending,
    launchCircleWithAutomation,
    stakeTokens,
    loadStakingPosition,
    claimStakingRewards,
    unstakeIntent,
    unstakeComplete,
  };
}
