// CircleSave - Wallet Hook

import { useAccount, useConnect, useDisconnect, useBalance } from '@starknet-react/core';
import { useCallback, useEffect, useMemo } from 'react';
import { CONTRACTS } from '@/lib/constants';
import { formatAddress } from '@/lib/constants';
import { toast } from 'sonner';

function formatTokenBalance(balance: { formatted: string; symbol: string; value: bigint } | null) {
  if (!balance) {
    return null;
  }

  return {
    value: balance.value,
    symbol: balance.symbol,
    formatted: balance.formatted,
  };
}

export function useWallet() {
  const { address, isConnected, isConnecting, status } = useAccount();
  const { connectAsync, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: strkBalanceData, isLoading: strkBalanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    token: CONTRACTS.STRK_TOKEN as `0x${string}`,
    watch: true,
    refetchInterval: 15000,
  });
  const { data: ethBalanceData, isLoading: ethBalanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    token: CONTRACTS.ETH_TOKEN as `0x${string}`,
    watch: true,
    refetchInterval: 15000,
  });
  const { data: usdcBalanceData, isLoading: usdcBalanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    token: CONTRACTS.USDC_TOKEN as `0x${string}`,
    watch: true,
    refetchInterval: 15000,
  });

  const walletOptions = useMemo(() => {
    return connectors.map((connector) => {
      let installed = connector.id === 'controller';
      try {
        installed = connector.id === 'controller' ? true : connector.available();
      } catch {
        installed = connector.id === 'controller';
      }

      return {
        id: connector.id,
        name: connector.name,
        connector,
        installed,
      };
    });
  }, [connectors]);

  const connectWallet = useCallback(async (connectorId?: string) => {
    if (connectors.length === 0) {
      toast.error('No wallet connectors are available right now.');
      return;
    }

    const selected =
      (connectorId ? walletOptions.find((option) => option.id === connectorId) : undefined)
      ?? walletOptions.find((option) => option.id === 'controller')
      ?? walletOptions[0];

    if (!selected) {
      toast.error('No wallet connector found.');
      return;
    }

    if (!selected.installed) {
      toast.error(`"${selected.name}" is not installed or not available in this browser.`);
      return;
    }

    try {
      await connectAsync({ connector: selected.connector });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wallet connection failed';
      toast.error(message);
    }
  }, [connectAsync, connectors, walletOptions]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  useEffect(() => {
    if (connectError) {
      toast.error(connectError.message);
    }
  }, [connectError]);

  const formattedAddress = address ? formatAddress(address) : '';
  const strkBalance = formatTokenBalance(strkBalanceData ? {
    value: strkBalanceData.value,
    formatted: strkBalanceData.formatted,
    symbol: strkBalanceData.symbol,
  } : null);
  const ethBalance = formatTokenBalance(ethBalanceData ? {
    value: ethBalanceData.value,
    formatted: ethBalanceData.formatted,
    symbol: ethBalanceData.symbol,
  } : null);
  const usdcBalance = formatTokenBalance(usdcBalanceData ? {
    value: usdcBalanceData.value,
    formatted: usdcBalanceData.formatted,
    symbol: usdcBalanceData.symbol,
  } : null);

  const balance = strkBalance;
  const balanceLoading = strkBalanceLoading;

  const assetBalances = [
    { key: 'STRK', label: 'STRK', balance: strkBalance, isLoading: strkBalanceLoading },
    { key: 'ETH', label: 'ETH', balance: ethBalance, isLoading: ethBalanceLoading },
    { key: 'USDC', label: 'USDC', balance: usdcBalance, isLoading: usdcBalanceLoading },
  ];

  return {
    address,
    formattedAddress,
    isConnected,
    isConnecting,
    status,
    balance,
    balanceLoading,
    assetBalances,
    connectWallet,
    disconnectWallet,
    connectors,
    walletOptions,
    connectError,
  };
}
