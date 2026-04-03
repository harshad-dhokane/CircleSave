import { useMemo } from 'react';
import { getStarkZapLogDetails, type StarkZapLogKind } from '@/lib/starkzapLogs';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { useWallet } from '@/hooks/useWallet';

type ModuleStats = {
  totalTransactions: number;
  myTransactions: number;
  amountLabel: string;
};

function parseAmount(value?: string) {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
    maximumFractionDigits: value >= 100 ? 2 : 4,
  });
}

function formatVolumeLabel(totals: Map<string, number>) {
  if (totals.size === 0) {
    return 'No amount yet';
  }

  const ordered = [...totals.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((left, right) => right[1] - left[1]);

  if (ordered.length === 0) {
    return 'No amount yet';
  }

  const visible = ordered.slice(0, 3).map(([token, amount]) => `${formatAmount(amount)} ${token}`);
  const overflow = ordered.length - visible.length;

  return overflow > 0 ? `${visible.join(' • ')} +${overflow}` : visible.join(' • ');
}

export function useStarkZapModuleStats(kind: StarkZapLogKind): ModuleStats {
  const { logs } = useStarkZapLogs();
  const { address } = useWallet();

  return useMemo(() => {
    const moduleLogs = logs.filter((entry) => entry.kind === kind && entry.status !== 'failed');
    const myLogs = address
      ? moduleLogs.filter((entry) => entry.account.toLowerCase() === address.toLowerCase())
      : [];
    const amountTotals = new Map<string, number>();

    myLogs.forEach((entry) => {
      const details = getStarkZapLogDetails(entry);

      if (!details) {
        return;
      }

      if (entry.kind === 'batch' && details.batchTransfers?.length) {
        details.batchTransfers.forEach((transfer) => {
          const amount = parseAmount(transfer.totalAmount);
          if (!amount) return;
          amountTotals.set(transfer.token, (amountTotals.get(transfer.token) || 0) + amount);
        });
        return;
      }

      const amount = parseAmount(
        entry.kind === 'dca'
          ? details.totalAmount
          : details.inputAmount || details.totalAmount,
      );
      const token = entry.kind === 'dca'
        ? details.totalToken
        : details.inputToken || details.totalToken;

      if (!amount || !token) {
        return;
      }

      amountTotals.set(token, (amountTotals.get(token) || 0) + amount);
    });

    return {
      totalTransactions: moduleLogs.length,
      myTransactions: myLogs.length,
      amountLabel: formatVolumeLabel(amountTotals),
    };
  }, [address, kind, logs]);
}
