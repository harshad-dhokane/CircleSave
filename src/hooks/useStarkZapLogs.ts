import { useCallback, useEffect, useRef, useState } from 'react';
import { CallData, RpcProvider, createAbiParser, events as starknetEvents, type Abi } from 'starknet';
import { STARKZAP_ACTIVITY_REGISTRY_ABI } from '@/lib/abis';
import { CONTRACTS, feltToString, getVoyagerTxUrl } from '@/lib/constants';
import { hasSharedStarkZapRegistry } from '@/lib/starkzapActivityRegistry';
import { createSharedStarkZapLogEntry, type StarkZapLogDetails, type StarkZapLogEntry } from '@/lib/starkzapLogs';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const rpc = new RpcProvider({ nodeUrl: RPC_URL });
const REFRESH_INTERVAL_MS = 15_000;
const INITIAL_LOOKBACK_BLOCKS = 60_000;

type RawContractEvent = {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  from_address: string;
  keys: string[];
  data: string[];
};

type ParsedContractEvent = Record<string, unknown> & {
  block_number?: number;
  transaction_hash?: string;
};

type EventDecoder = {
  abiEvents: ReturnType<typeof starknetEvents.getAbiEvents>;
  abiStructs: ReturnType<typeof CallData.getAbiStruct>;
  abiEnums: ReturnType<typeof CallData.getAbiEnum>;
  parser: ReturnType<typeof createAbiParser>;
};

type DecodedEvent = {
  blockNumber: number | null;
  fullName: string;
  payload: Record<string, unknown>;
  transactionHash: string;
};

type ActivityVolume = {
  token: string;
  amount: bigint;
  amountText: string;
};

const TOKEN_DECIMALS = new Map([
  ['STRK', 18],
  ['ETH', 18],
  ['USDC', 6],
]);

const DECODER = createEventDecoder(STARKZAP_ACTIVITY_REGISTRY_ABI as unknown as Abi);

function createEventDecoder(abi: Abi): EventDecoder {
  return {
    abiEvents: starknetEvents.getAbiEvents(abi),
    abiStructs: CallData.getAbiStruct(abi),
    abiEnums: CallData.getAbiEnum(abi),
    parser: createAbiParser(abi),
  };
}

function toBigIntValue(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);

  if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
    const low = BigInt((value as { low: string | number | bigint }).low);
    const high = BigInt((value as { high: string | number | bigint }).high);
    return low + (high << 128n);
  }

  return 0n;
}

function normalizeHex(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) return null;

  try {
    const normalized = value.startsWith('0x') ? value : `0x${BigInt(value).toString(16)}`;
    return `0x${BigInt(normalized).toString(16)}`.toLowerCase();
  } catch {
    return null;
  }
}

function readLabel(value: unknown) {
  try {
    return feltToString(value as string | bigint).trim();
  } catch {
    return '';
  }
}

function formatUnits(value: bigint, decimals: number) {
  if (value <= 0n) {
    return '0';
  }

  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  const visibleFraction = fraction.slice(0, whole > 0n ? 2 : 4);

  return visibleFraction ? `${whole}.${visibleFraction}` : whole.toString();
}

function formatTokenAmount(value: bigint, token: string) {
  const decimals = TOKEN_DECIMALS.get(token.toUpperCase()) ?? 18;
  return formatUnits(value, decimals);
}

function toIsoTimestamp(value: unknown) {
  const parsed = Number(toBigIntValue(value));
  const timestamp = parsed > 1_000_000_000_000 ? parsed : parsed * 1000;

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return new Date(0).toISOString();
  }

  return new Date(timestamp).toISOString();
}

function humanizeLabel(value: string, fallback: string) {
  if (!value) return fallback;

  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getProviderLabel(value: string) {
  switch (value) {
    case 'AVNU':
      return 'AVNU';
    case 'EKUBO':
      return 'Ekubo';
    case 'VESU':
      return 'Vesu';
    case 'TXBUILDER':
      return 'TxBuilder';
    case 'CIRCLESAVE':
      return 'CircleSave';
    default:
      return humanizeLabel(value, 'StarkZap');
  }
}

function getExecutionMode(value: string): 'user_pays' | 'sponsored' {
  return value === 'SPONSORED' ? 'sponsored' : 'user_pays';
}

function decodeEvents(rawEvents: RawContractEvent[]) {
  return (starknetEvents.parseEvents(
    rawEvents,
    DECODER.abiEvents,
    DECODER.abiStructs,
    DECODER.abiEnums,
    DECODER.parser,
  ) as ParsedContractEvent[])
    .map((event) => {
      const decodedEntry = Object.entries(event).find(
        ([key]) => key !== 'block_number' && key !== 'transaction_hash',
      );

      if (!decodedEntry) {
        return null;
      }

      const [fullName, payload] = decodedEntry;

      if (!payload || typeof payload !== 'object') {
        return null;
      }

      return {
        blockNumber: typeof event.block_number === 'number' ? event.block_number : null,
        fullName,
        payload: payload as Record<string, unknown>,
        transactionHash: typeof event.transaction_hash === 'string' ? event.transaction_hash : '',
      } satisfies DecodedEvent;
    })
    .filter((event): event is DecodedEvent => Boolean(event?.transactionHash));
}

function buildVolume(tokenValue: unknown, amountValue: unknown): ActivityVolume | null {
  const token = readLabel(tokenValue).toUpperCase();
  const amount = toBigIntValue(amountValue);

  if (!token || amount <= 0n) {
    return null;
  }

  return {
    token,
    amount,
    amountText: formatTokenAmount(amount, token),
  };
}

function buildVolumes(payload: Record<string, unknown>) {
  return [
    buildVolume(payload.volume_token_a, payload.volume_amount_a),
    buildVolume(payload.volume_token_b, payload.volume_amount_b),
    buildVolume(payload.volume_token_c, payload.volume_amount_c),
  ].filter((volume): volume is ActivityVolume => Boolean(volume));
}

function mapSharedActivity(event: DecodedEvent): StarkZapLogEntry | null {
  if (!event.fullName.endsWith('ActivityRecorded')) {
    return null;
  }

  const moduleLabel = readLabel(event.payload.module).toUpperCase();
  const actionLabel = readLabel(event.payload.action).toUpperCase();
  const providerLabel = getProviderLabel(readLabel(event.payload.provider).toUpperCase());
  const executionMode = getExecutionMode(readLabel(event.payload.execution_mode).toUpperCase());
  const volumes = buildVolumes(event.payload);
  const actor = normalizeHex(event.payload.actor) || '';
  const count = Number(toBigIntValue(event.payload.count));
  const referenceOne = readLabel(event.payload.reference_one).toUpperCase();
  const referenceTwo = readLabel(event.payload.reference_two).toUpperCase();
  const updatedAt = toIsoTimestamp(event.payload.timestamp);

  let kind: StarkZapLogEntry['kind'] | null = null;
  let title = 'StarkZap Activity';
  let summary = `${providerLabel} activity confirmed`;
  let details: StarkZapLogDetails | undefined;

  if (moduleLabel === 'SWAP') {
    kind = 'swap';
    title = 'Swap';
    const [input, output] = volumes;
    summary = input && output
      ? `${input.amountText} ${input.token} -> ${output.token} via ${providerLabel}`
      : `Swap via ${providerLabel}`;
    details = input
      ? {
        inputAmount: input.amountText,
        inputToken: input.token,
        outputAmount: output?.amountText,
        outputToken: output?.token,
      }
      : undefined;
  }

  if (moduleLabel === 'DCA') {
    kind = 'dca';

    if (actionLabel === 'CANCEL') {
      title = 'DCA Cancel';
      summary = `Cancel ${providerLabel} DCA order`;
    } else {
      title = actionLabel === 'LAUNCH' ? 'Launch Circle + DCA' : 'DCA Order';
      const [total, cycle] = volumes;
      summary = total && cycle
        ? `${total.amountText} ${total.token} budget • ${cycle.amountText} ${cycle.token} every ${referenceTwo || 'P1W'} into ${referenceOne || 'STRK'}`
        : `DCA order via ${providerLabel}`;
      details = total
        ? {
          totalAmount: total.amountText,
          totalToken: total.token,
          cycleAmount: cycle?.amountText,
          cycleToken: cycle?.token,
          frequency: referenceTwo || undefined,
          outputToken: referenceOne || undefined,
        }
        : undefined;
    }
  }

  if (moduleLabel === 'LENDING') {
    kind = 'lending';
    const lendingAction = actionLabel === 'WITHDRAW_MAX'
      ? 'Withdraw Max'
      : humanizeLabel(actionLabel, 'Lending');
    title = `Lending ${lendingAction}`;
    const [primary] = volumes;
    summary = primary
      ? `${lendingAction} ${primary.amountText} ${primary.token} via ${providerLabel}`
      : `${lendingAction} via ${providerLabel}`;
    details = primary
      ? {
        action: actionLabel === 'DEPOSIT'
          ? 'deposit'
          : actionLabel === 'WITHDRAW' || actionLabel === 'WITHDRAW_MAX'
            ? 'withdraw'
            : actionLabel === 'BORROW'
              ? 'borrow'
              : actionLabel === 'REPAY'
                ? 'repay'
                : undefined,
        inputAmount: primary.amountText,
        inputToken: primary.token,
        outputToken: referenceOne || undefined,
      }
      : undefined;
  }

  if (moduleLabel === 'BATCH') {
    kind = 'batch';
    title = 'TxBuilder Batch Transaction';
    summary = `${count || 1} transfers across ${volumes.length || 1} token${volumes.length === 1 ? '' : 's'} batched into one transaction`;
    details = {
      transferCount: count || 1,
      batchTransfers: volumes.map((volume) => ({
        token: volume.token,
        totalAmount: volume.amountText,
        transferCount: count || 1,
      })),
    };
  }

  if (!kind) {
    return null;
  }

  return createSharedStarkZapLogEntry({
    id: `${kind}:${event.transactionHash}:${event.blockNumber ?? 0}`,
    kind,
    title,
    summary,
    account: actor,
    provider: providerLabel,
    status: 'confirmed',
    txHash: event.transactionHash,
    createdAt: updatedAt,
    updatedAt,
    details,
    executionMode,
    blockNumber: event.blockNumber,
    explorerUrl: getVoyagerTxUrl(event.transactionHash),
  });
}

function mergeLogs(previous: StarkZapLogEntry[], next: StarkZapLogEntry[]) {
  const merged = new Map<string, StarkZapLogEntry>();

  previous.forEach((entry) => {
    merged.set(entry.id, entry);
  });

  next.forEach((entry) => {
    merged.set(entry.id, entry);
  });

  return [...merged.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

async function getLatestBlockNumber() {
  const latestBlock = await rpc.getBlock('latest');
  return latestBlock.block_number;
}

async function fetchContractEvents(address: string, fromBlock: number, toBlock: number) {
  if (!hasSharedStarkZapRegistry() || fromBlock > toBlock) {
    return [] as RawContractEvent[];
  }

  const collected: RawContractEvent[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await rpc.getEvents({
      address,
      chunk_size: 100,
      continuation_token: continuationToken,
      from_block: { block_number: fromBlock },
      to_block: { block_number: toBlock },
    } as never);

    const chunk = response as { continuation_token?: string; events?: RawContractEvent[] };
    collected.push(...(chunk.events || []));
    continuationToken = chunk.continuation_token;
  } while (continuationToken);

  return collected;
}

export function useStarkZapLogs() {
  const [logs, setLogs] = useState<StarkZapLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const latestFetchedBlockRef = useRef<number | null>(null);

  const loadLogs = useCallback(async (reset = false) => {
    if (!hasSharedStarkZapRegistry()) {
      setLogs([]);
      setError(null);
      setIsLoading(false);
      setLastUpdatedAt(Date.now());
      latestFetchedBlockRef.current = null;
      return;
    }

    try {
      if (reset || latestFetchedBlockRef.current === null) {
        setIsLoading(true);
      }

      const latestBlock = await getLatestBlockNumber();
      const fromBlock = reset || latestFetchedBlockRef.current === null
        ? Math.max(latestBlock - INITIAL_LOOKBACK_BLOCKS, 0)
        : Math.max(latestFetchedBlockRef.current - 5, 0);

      const rawEvents = await fetchContractEvents(CONTRACTS.STARKZAP_ACTIVITY_REGISTRY, fromBlock, latestBlock);
      const nextLogs = decodeEvents(rawEvents)
        .map(mapSharedActivity)
        .filter((entry): entry is StarkZapLogEntry => Boolean(entry));

      setLogs((previous) => mergeLogs(reset ? [] : previous, nextLogs));
      setError(null);
      setLastUpdatedAt(Date.now());
      latestFetchedBlockRef.current = latestBlock;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load shared StarkZap activity.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs(true);

    const interval = window.setInterval(() => {
      void loadLogs(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadLogs]);

  return {
    logs,
    error,
    isLoading,
    hasConfiguredRegistry: hasSharedStarkZapRegistry(),
    lastUpdatedAt,
    refresh: () => loadLogs(true),
  };
}
