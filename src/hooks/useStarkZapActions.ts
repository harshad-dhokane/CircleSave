import { useAccount, useProvider } from '@starknet-react/core';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  appendStarkZapLog,
  updateStarkZapLog,
  type StarkZapLogDetails,
} from '@/lib/starkzapLogs';

type StarkZapRuntime = typeof import('@/lib/starkzap-v2-runtime');

export type StarkZapTokenKey = 'ETH' | 'USDC' | 'STRK';
export type StarkZapDcaFrequency = 'PT12H' | 'P1D' | 'P1W';

export interface StarkZapSwapPreview {
  provider: string;
  amountIn: string;
  amountOut: string;
  priceImpact?: string;
  callCount: number;
}

export interface StarkZapDcaPreview {
  provider: string;
  sellAmountPerCycle: string;
  estimatedBuyAmount: string;
}

export interface StarkZapOrderView {
  id: string;
  provider: string;
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
  totalSupplied?: string;
  totalBorrowed?: string;
}

export interface StarkZapPositionView {
  type: string;
  poolName: string;
  collateral: string;
  debt?: string;
}

export interface StarkZapTxView {
  hash: string;
  explorerUrl: string;
}

const PRIMARY_TOKENS: StarkZapTokenKey[] = ['ETH', 'USDC', 'STRK'];

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unexpected StarkZap error';
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

function toFriendlyActionError(kind: 'swap' | 'dca' | 'lending', error: unknown) {
  const message = getErrorMessage(error).trim();
  const lower = message.toLowerCase();

  if (lower.includes('sellamountpercycle cannot exceed sellamount')) {
    return 'Sell per cycle cannot be greater than total sell amount.';
  }

  if (lower.includes('must be greater than zero')) {
    return message;
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
    lower.includes('twamm') ||
    lower.includes('pair pools') ||
    lower.includes('quote fallback also failed')
  ) {
    return 'This DCA provider is not available for this token pair on Sepolia right now. Try STRK -> ETH first.';
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
    lower.includes('networkerror') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout') ||
    lower.includes('rpc')
  ) {
    return 'The Sepolia RPC or StarkZap provider API did not respond. Please try again in a moment.';
  }

  return message || 'Unexpected StarkZap error';
}

export function useStarkZapActions() {
  const { account, address, isConnected } = useAccount();
  const { provider } = useProvider();
  const runtimeRef = useRef<Promise<StarkZapRuntime> | null>(null);

  const loadRuntime = useCallback(async () => {
    if (!runtimeRef.current) {
      runtimeRef.current = import('@/lib/starkzap-v2-runtime');
    }

    return runtimeRef.current;
  }, []);

  const getContext = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Connect your wallet first.');
    }

    if (!account) {
      throw new Error('Wallet account is still initializing. Please try again in a moment.');
    }

    const mod = await loadRuntime();
    const walletAddress = mod.fromAddress(address);

    return {
      mod,
      account,
      address,
      walletAddress,
      provider: provider as any,
      chainId: mod.ChainId.SEPOLIA,
    };
  }, [account, address, isConnected, loadRuntime, provider]);

  const trackTransaction = useCallback(async (params: {
    title: string;
    summary: string;
    kind: 'swap' | 'dca' | 'lending';
    providerId: string;
    transactionHash: string;
    details?: StarkZapLogDetails;
  }): Promise<StarkZapTxView> => {
    const { mod, provider: rpcProvider, chainId, address: walletAddress } = await getContext();
    const tx = new mod.Tx(params.transactionHash, rpcProvider, chainId);

    const logEntry = appendStarkZapLog({
      kind: params.kind,
      title: params.title,
      summary: params.summary,
      account: walletAddress,
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
  }, [getContext]);

  const runAction = useCallback(async <T,>(
    kind: 'swap' | 'dca' | 'lending',
    action: () => Promise<T>,
  ): Promise<T> => {
    try {
      return await action();
    } catch (error) {
      const friendly = toFriendlyActionError(kind, error);
      toast.error(friendly);
      throw new Error(friendly);
    }
  }, []);

  const previewSwap = useCallback(async (params: {
    tokenIn: StarkZapTokenKey;
    tokenOut: StarkZapTokenKey;
    amount: string;
  }): Promise<StarkZapSwapPreview> => {
    return runAction('swap', async () => {
      if (params.tokenIn === params.tokenOut) {
        throw new Error('Choose two different tokens.');
      }

      const { mod, walletAddress, chainId } = await getContext();
      const swapProvider = new mod.AvnuSwapProvider();
      const tokenIn = mod.sepoliaTokens[params.tokenIn];
      const tokenOut = mod.sepoliaTokens[params.tokenOut];
      const amountIn = mod.Amount.parse(params.amount, tokenIn);
      const request = {
        chainId,
        takerAddress: walletAddress,
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps: 100n,
      };

      const [quote, prepared] = await Promise.all([
        withTimeout(swapProvider.getQuote(request), 12000, 'Swap quote preview'),
        withTimeout(swapProvider.prepareSwap(request), 12000, 'Swap route preparation'),
      ]);

      return {
        provider: quote.provider || swapProvider.id,
        amountIn: amountIn.toFormatted(true),
        amountOut: mod.Amount.fromRaw(quote.amountOutBase, tokenOut).toFormatted(true),
        priceImpact: formatBps(quote.priceImpactBps),
        callCount: prepared.calls.length,
      };
    });
  }, [getContext, runAction]);

  const executeSwap = useCallback(async (params: {
    tokenIn: StarkZapTokenKey;
    tokenOut: StarkZapTokenKey;
    amount: string;
  }): Promise<StarkZapTxView> => {
    return runAction('swap', async () => {
      if (params.tokenIn === params.tokenOut) {
        throw new Error('Choose two different tokens.');
      }

      const { mod, walletAddress, chainId, account } = await getContext();
      const swapProvider = new mod.AvnuSwapProvider();
      const tokenIn = mod.sepoliaTokens[params.tokenIn];
      const tokenOut = mod.sepoliaTokens[params.tokenOut];
      const amountIn = mod.Amount.parse(params.amount, tokenIn);

      const prepared = await withTimeout(
        swapProvider.prepareSwap({
          chainId,
          takerAddress: walletAddress,
          tokenIn,
          tokenOut,
          amountIn,
          slippageBps: 100n,
        }),
        12000,
        'Swap route preparation',
      );

      const result = await account.execute(prepared.calls);
      toast.success('Swap submitted');

      return trackTransaction({
        title: 'Swap',
        summary: `${params.amount} ${params.tokenIn} -> ${params.tokenOut} via AVNU`,
        kind: 'swap',
        providerId: swapProvider.id,
        transactionHash: result.transaction_hash,
        details: {
          inputAmount: params.amount,
          inputToken: params.tokenIn,
          outputToken: params.tokenOut,
        },
      });
    });
  }, [getContext, runAction, trackTransaction]);

  const previewDca = useCallback(async (params: {
    sellToken: StarkZapTokenKey;
    buyToken: StarkZapTokenKey;
    sellAmountPerCycle: string;
  }): Promise<StarkZapDcaPreview> => {
    return runAction('dca', async () => {
      if (params.sellToken === params.buyToken) {
        throw new Error('Choose two different DCA tokens.');
      }

      const { mod, walletAddress, chainId } = await getContext();
      const swapProvider = new mod.AvnuSwapProvider();
      const sellToken = mod.sepoliaTokens[params.sellToken];
      const buyToken = mod.sepoliaTokens[params.buyToken];
      const sellAmountPerCycle = mod.Amount.parse(params.sellAmountPerCycle, sellToken);

      const quote = await withTimeout(
        swapProvider.getQuote({
          chainId,
          takerAddress: walletAddress,
          tokenIn: sellToken,
          tokenOut: buyToken,
          amountIn: sellAmountPerCycle,
          slippageBps: 100n,
        }),
        12000,
        'DCA cycle preview',
      );

      return {
        provider: swapProvider.id,
        sellAmountPerCycle: sellAmountPerCycle.toFormatted(true),
        estimatedBuyAmount: mod.Amount.fromRaw(quote.amountOutBase, buyToken).toFormatted(true),
      };
    });
  }, [getContext, runAction]);

  const createDca = useCallback(async (params: {
    sellToken: StarkZapTokenKey;
    buyToken: StarkZapTokenKey;
    sellAmount: string;
    sellAmountPerCycle: string;
    frequency: StarkZapDcaFrequency;
  }): Promise<StarkZapTxView> => {
    return runAction('dca', async () => {
      if (params.sellToken === params.buyToken) {
        throw new Error('Choose two different DCA tokens.');
      }

      const { mod, walletAddress, chainId, account, provider: rpcProvider } = await getContext();
      const dcaProvider = new mod.AvnuDcaProvider();
      const sellToken = mod.sepoliaTokens[params.sellToken];
      const buyToken = mod.sepoliaTokens[params.buyToken];

      const prepared = await withTimeout(
        dcaProvider.prepareCreate(
          {
            chainId,
            rpcProvider,
            walletAddress,
          },
          {
            sellToken,
            buyToken,
            sellAmount: mod.Amount.parse(params.sellAmount, sellToken),
            sellAmountPerCycle: mod.Amount.parse(params.sellAmountPerCycle, sellToken),
            frequency: params.frequency,
            traderAddress: walletAddress,
          },
        ),
        12000,
        'DCA order preparation',
      );

      const result = await account.execute(prepared.calls);
      toast.success('DCA order submitted');

      return trackTransaction({
        title: 'DCA Order',
        summary: `${params.sellAmount} ${params.sellToken} budget • ${params.sellAmountPerCycle} ${params.sellToken} every ${params.frequency} into ${params.buyToken}`,
        kind: 'dca',
        providerId: dcaProvider.id,
        transactionHash: result.transaction_hash,
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
  }, [getContext, runAction, trackTransaction]);

  const loadDcaOrders = useCallback(async (): Promise<StarkZapOrderView[]> => {
    return runAction('dca', async () => {
      const { mod, walletAddress, chainId, provider: rpcProvider } = await getContext();
      const dcaProvider = new mod.AvnuDcaProvider();
      const page = await withTimeout(
        dcaProvider.getOrders(
          {
            chainId,
            rpcProvider,
            walletAddress,
          },
          {
            traderAddress: walletAddress,
            size: 12,
          },
        ),
        12000,
        'DCA orders refresh',
      );

      const tokensByAddress = new Map(
        Object.values(mod.sepoliaTokens).map((token) => [token.address.toLowerCase(), token]),
      );

      return page.content.map((order) => {
        const sellToken = tokensByAddress.get(order.sellTokenAddress.toLowerCase());
        const buyToken = tokensByAddress.get(order.buyTokenAddress.toLowerCase());

        return {
          id: order.id,
          provider: order.providerId,
          sellToken: sellToken?.symbol || 'TOKEN',
          buyToken: buyToken?.symbol || 'TOKEN',
          totalSellAmount: sellToken
            ? mod.Amount.fromRaw(order.sellAmountBase, sellToken).toFormatted(true)
            : order.sellAmountBase.toString(),
          soldAmount: sellToken
            ? mod.Amount.fromRaw(order.amountSoldBase, sellToken).toFormatted(true)
            : order.amountSoldBase.toString(),
          boughtAmount: buyToken
            ? mod.Amount.fromRaw(order.amountBoughtBase, buyToken).toFormatted(true)
            : order.amountBoughtBase.toString(),
          frequency: order.frequency,
          status: order.status,
          createdAt: formatDate(order.timestamp),
        };
      });
    });
  }, [getContext, runAction]);

  const loadLendingMarkets = useCallback(async (): Promise<StarkZapMarketView[]> => {
    return runAction('lending', async () => {
      const { mod, chainId } = await getContext();
      const lendingProvider = new mod.VesuLendingProvider();
      const markets = await lendingProvider.getMarkets(chainId);

      return markets
        .filter((market) => PRIMARY_TOKENS.includes(market.asset.symbol as StarkZapTokenKey))
        .slice(0, 6)
        .map((market) => ({
          poolName: market.poolName || 'Vesu Pool',
          asset: market.asset.symbol,
          protocol: market.protocol,
          supplyApy: market.stats?.supplyApy?.toFormatted(true),
          totalSupplied: market.stats?.totalSupplied?.toFormatted(true),
          totalBorrowed: market.stats?.totalBorrowed?.toFormatted(true),
        }));
    });
  }, [getContext, runAction]);

  const loadLendingPositions = useCallback(async (): Promise<StarkZapPositionView[]> => {
    return runAction('lending', async () => {
      const { mod, chainId, provider: rpcProvider, walletAddress } = await getContext();
      const lendingProvider = new mod.VesuLendingProvider();
      const rawPositions = await lendingProvider.getPositions?.(
        {
          chainId,
          provider: rpcProvider,
          walletAddress,
        },
        {
          user: walletAddress,
        },
      );

      return (rawPositions || []).slice(0, 6).map((position) => ({
        type: position.type,
        poolName: position.pool.name || 'Vesu Pool',
        collateral: `${position.collateral.amount.toString()} ${position.collateral.token.symbol}`,
        debt: position.debt ? `${position.debt.amount.toString()} ${position.debt.token.symbol}` : undefined,
      }));
    });
  }, [getContext, runAction]);

  const depositToLending = useCallback(async (params: {
    token: StarkZapTokenKey;
    amount: string;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      const { mod, chainId, provider: rpcProvider, walletAddress, account } = await getContext();
      const lendingProvider = new mod.VesuLendingProvider();
      const token = mod.sepoliaTokens[params.token];
      const prepared = await lendingProvider.prepareDeposit(
        {
          chainId,
          provider: rpcProvider,
          walletAddress,
        },
        {
          token,
          amount: mod.Amount.parse(params.amount, token),
        },
      );

      const result = await account.execute(prepared.calls);
      toast.success('Lending deposit submitted');

      return trackTransaction({
        title: 'Lending Deposit',
        summary: `Deposit ${params.amount} ${params.token} into Vesu`,
        kind: 'lending',
        providerId: lendingProvider.id,
        transactionHash: result.transaction_hash,
        details: {
          action: 'deposit',
          inputAmount: params.amount,
          inputToken: params.token,
        },
      });
    });
  }, [getContext, runAction, trackTransaction]);

  const withdrawFromLending = useCallback(async (params: {
    token: StarkZapTokenKey;
    amount: string;
  }): Promise<StarkZapTxView> => {
    return runAction('lending', async () => {
      const { mod, chainId, provider: rpcProvider, walletAddress, account } = await getContext();
      const lendingProvider = new mod.VesuLendingProvider();
      const token = mod.sepoliaTokens[params.token];
      const prepared = await lendingProvider.prepareWithdraw(
        {
          chainId,
          provider: rpcProvider,
          walletAddress,
        },
        {
          token,
          amount: mod.Amount.parse(params.amount, token),
        },
      );

      const result = await account.execute(prepared.calls);
      toast.success('Lending withdrawal submitted');

      return trackTransaction({
        title: 'Lending Withdraw',
        summary: `Withdraw ${params.amount} ${params.token} from Vesu`,
        kind: 'lending',
        providerId: lendingProvider.id,
        transactionHash: result.transaction_hash,
        details: {
          action: 'withdraw',
          inputAmount: params.amount,
          inputToken: params.token,
        },
      });
    });
  }, [getContext, runAction, trackTransaction]);

  return {
    isConnected,
    address,
    previewSwap,
    executeSwap,
    previewDca,
    createDca,
    loadDcaOrders,
    loadLendingMarkets,
    loadLendingPositions,
    depositToLending,
    withdrawFromLending,
  };
}
