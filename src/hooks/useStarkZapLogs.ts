import { useEffect, useRef, useState } from 'react';
import { hash, RpcProvider } from 'starknet';
import { CONTRACTS } from '@/lib/constants';
import {
  clearStarkZapLogs,
  getStarkZapLogsEventName,
  readStarkZapLogs,
  updateStarkZapLog,
  type StarkZapLogEntry,
  type StarkZapLogDetails,
} from '@/lib/starkzapLogs';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const rpc = new RpcProvider({ nodeUrl: RPC_URL });
const TRANSFER_SELECTOR = hash.getSelectorFromName('Transfer').toLowerCase();

const TRACKED_TOKENS = new Map([
  [CONTRACTS.STRK_TOKEN.toLowerCase(), { symbol: 'STRK', decimals: 18 }],
  [CONTRACTS.ETH_TOKEN.toLowerCase(), { symbol: 'ETH', decimals: 18 }],
  [CONTRACTS.USDC_TOKEN.toLowerCase(), { symbol: 'USDC', decimals: 6 }],
]);

function normalizeHex(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) return null;

  try {
    const normalized = value.startsWith('0x') ? value : `0x${BigInt(value).toString(16)}`;
    return `0x${BigInt(normalized).toString(16)}`.toLowerCase();
  } catch {
    return null;
  }
}

function readTransferAmount(data: unknown[]) {
  if (data.length >= 4) {
    const low = BigInt(data[2] as string);
    const high = BigInt(data[3] as string);
    return low + (high << 128n);
  }

  if (data.length >= 3) {
    return BigInt(data[2] as string);
  }

  return null;
}

function formatUnits(value: bigint, decimals: number) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  const joined = fraction ? `${whole.toString()}.${fraction.slice(0, 6)}` : whole.toString();
  return negative ? `-${joined}` : joined;
}

function needsReceiptBackfill(log: StarkZapLogEntry) {
  if (log.kind === 'swap') {
    return !log.details?.inputAmount;
  }

  if (log.kind === 'dca') {
    return !log.details?.totalAmount;
  }

  return false;
}

async function deriveDetailsFromReceipt(log: StarkZapLogEntry): Promise<StarkZapLogDetails | null> {
  const receipt = await rpc.getTransactionReceipt(log.txHash);
  const rawEvents = ((receipt as any).events || (receipt as any).receipt?.events || []) as Array<{
    from_address?: string;
    keys?: string[];
    data?: string[];
  }>;
  const account = normalizeHex(log.account);

  if (!account || rawEvents.length === 0) {
    return null;
  }

  const outgoing = new Map<string, { symbol: string; decimals: number; amount: bigint }>();
  const incoming = new Map<string, { symbol: string; decimals: number; amount: bigint }>();

  for (const event of rawEvents) {
    const tokenAddress = normalizeHex(event.from_address);
    const eventKey = normalizeHex(event.keys?.[0]);
    const token = tokenAddress ? TRACKED_TOKENS.get(tokenAddress) : undefined;

    if (!token || eventKey !== TRANSFER_SELECTOR) {
      continue;
    }

    const data = event.data || [];
    const from = normalizeHex(data[0]);
    const to = normalizeHex(data[1]);
    const amount = readTransferAmount(data);

    if (!amount || amount <= 0n) {
      continue;
    }

    if (from === account) {
      const current = outgoing.get(token.symbol);
      outgoing.set(token.symbol, {
        ...token,
        amount: (current?.amount || 0n) + amount,
      });
    }

    if (to === account) {
      const current = incoming.get(token.symbol);
      incoming.set(token.symbol, {
        ...token,
        amount: (current?.amount || 0n) + amount,
      });
    }
  }

  const [firstOutgoing] = [...outgoing.values()].sort((left, right) => (left.amount > right.amount ? -1 : 1));
  const [firstIncoming] = [...incoming.values()].sort((left, right) => (left.amount > right.amount ? -1 : 1));

  if (log.kind === 'swap' && firstOutgoing) {
    return {
      inputAmount: formatUnits(firstOutgoing.amount, firstOutgoing.decimals),
      inputToken: firstOutgoing.symbol,
      outputAmount: firstIncoming ? formatUnits(firstIncoming.amount, firstIncoming.decimals) : undefined,
      outputToken: firstIncoming?.symbol,
    };
  }

  if (log.kind === 'dca' && firstOutgoing) {
    return {
      totalAmount: formatUnits(firstOutgoing.amount, firstOutgoing.decimals),
      totalToken: firstOutgoing.symbol,
    };
  }

  return null;
}

export function useStarkZapLogs() {
  const [logs, setLogs] = useState<StarkZapLogEntry[]>(() => readStarkZapLogs());
  const attemptedBackfills = useRef<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => setLogs(readStarkZapLogs());
    const customEvent = getStarkZapLogsEventName();

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener(customEvent, refresh as EventListener);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(customEvent, refresh as EventListener);
    };
  }, []);

  useEffect(() => {
    const pendingBackfills = logs.filter((log) => needsReceiptBackfill(log) && !attemptedBackfills.current.has(log.id));

    if (pendingBackfills.length === 0) {
      return;
    }

    pendingBackfills.forEach((log) => {
      attemptedBackfills.current.add(log.id);

      void deriveDetailsFromReceipt(log)
        .then((details) => {
          if (!details) return;
          updateStarkZapLog(log.id, { details });
        })
        .catch(() => {
          // Leave old entries untouched if the receipt cannot be decoded.
        });
    });
  }, [logs]);

  return {
    logs,
    clearLogs: clearStarkZapLogs,
  };
}
