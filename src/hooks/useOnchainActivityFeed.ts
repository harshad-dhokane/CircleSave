import { useCallback, useEffect, useState } from 'react';
import { CallData, RpcProvider, createAbiParser, events as starknetEvents, type Abi } from 'starknet';
import {
  BADGE_NAMES,
  CONTRACTS,
  LEVEL_NAMES,
  feltToString,
  formatAddress,
  getVoyagerContractUrl,
  getVoyagerTxUrl,
} from '@/lib/constants';
import {
  CIRCLE_ABI,
  CIRCLE_FACTORY_ABI,
  COLLATERAL_MANAGER_ABI,
  REPUTATION_ABI,
} from '@/lib/abis';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const rpc = new RpcProvider({ nodeUrl: RPC_URL });
const REFRESH_INTERVAL_MS = 15_000;
const ACTIVITY_FEED_CACHE_KEY = 'circlesave:onchain-activity-feed:v1';

type ActivityCategory = 'factory' | 'circle' | 'reputation' | 'collateral';
type ActivityTone = 'success' | 'warning' | 'highlight' | 'neutral';

type RawContractEvent = {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  from_address: string;
  keys: string[];
  data: string[];
};

type ParsedContractEvent = Record<string, unknown> & {
  block_hash?: string;
  block_number?: number;
  transaction_hash?: string;
};

type EventDecoder = {
  abiEvents: ReturnType<typeof starknetEvents.getAbiEvents>;
  abiStructs: ReturnType<typeof CallData.getAbiStruct>;
  abiEnums: ReturnType<typeof CallData.getAbiEnum>;
  parser: ReturnType<typeof createAbiParser>;
};

type CircleMeta = {
  id: string;
  name: string;
  address: string;
};

type DecodedEvent = {
  blockNumber: number | null;
  fullName: string;
  payload: Record<string, unknown>;
  transactionHash: string;
};

type ActivityEntryInput = {
  actor?: string;
  blockNumber: number | null;
  category: ActivityCategory;
  circleAddress?: string;
  circleName?: string;
  eventName: string;
  occurredAt?: number | null;
  sourceAddress: string;
  sourceLabel: string;
  summary: string;
  title: string;
  tone?: ActivityTone;
  txHash: string;
  valueText?: string | null;
};

export interface OnchainActivityEntry {
  actor?: string;
  blockNumber: number | null;
  category: ActivityCategory;
  circleAddress?: string;
  circleName?: string;
  contractUrl: string;
  eventName: string;
  explorerUrl: string;
  id: string;
  occurredAt: number | null;
  sortValue: number;
  sourceAddress: string;
  sourceLabel: string;
  summary: string;
  timeLabel: string;
  title: string;
  tone: ActivityTone;
  txHash: string;
  valueText?: string | null;
}

type CachedActivityFeed = {
  entries: OnchainActivityEntry[];
  lastUpdatedAt: number | null;
};

const FACTORY_DECODER = createEventDecoder(CIRCLE_FACTORY_ABI as unknown as Abi);
const CIRCLE_DECODER = createEventDecoder(CIRCLE_ABI as unknown as Abi);
const REPUTATION_DECODER = createEventDecoder(REPUTATION_ABI as unknown as Abi);
const COLLATERAL_DECODER = createEventDecoder(COLLATERAL_MANAGER_ABI as unknown as Abi);

function createEventDecoder(abi: Abi): EventDecoder {
  return {
    abiEvents: starknetEvents.getAbiEvents(abi),
    abiStructs: CallData.getAbiStruct(abi),
    abiEnums: CallData.getAbiEnum(abi),
    parser: createAbiParser(abi),
  };
}

function isConfiguredAddress(address: string) {
  return Boolean(address) && address !== '0x0';
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

function toHexAddress(value: unknown) {
  if (typeof value === 'string') {
    try {
      const normalized = value.startsWith('0x') ? value : `0x${BigInt(value).toString(16)}`;
      return `0x${BigInt(normalized).toString(16)}`;
    } catch {
      return value;
    }
  }

  return `0x${toBigIntValue(value).toString(16)}`;
}

function formatTokenAmount(value: bigint, symbol = 'STRK', decimals = 18) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  const trimmedFraction = fraction.slice(0, whole > 0n ? 2 : 4);
  const formatted = trimmedFraction ? `${whole.toString()}.${trimmedFraction}` : whole.toString();
  return `${negative ? '-' : ''}${formatted} ${symbol}`;
}

function readTimestampMs(value: unknown) {
  try {
    const parsed = Number(toBigIntValue(value));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed > 1_000_000_000_000 ? parsed : parsed * 1000;
  } catch {
    return null;
  }
}

function humanizeConstantLabel(value: string, fallback: string) {
  if (!value) return fallback;
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function readFeltLabel(value: unknown, fallback: string) {
  try {
    const parsed = feltToString(value as string | bigint).trim();
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

function getReadableTimeLabel(occurredAt: number | null, blockNumber: number | null) {
  if (occurredAt) {
    return new Date(occurredAt).toLocaleString();
  }

  if (blockNumber !== null) {
    return `Block #${blockNumber}`;
  }

  return 'Pending';
}

function buildActivityEntry(input: ActivityEntryInput): OnchainActivityEntry {
  return {
    actor: input.actor,
    blockNumber: input.blockNumber,
    category: input.category,
    circleAddress: input.circleAddress,
    circleName: input.circleName,
    contractUrl: getVoyagerContractUrl(input.sourceAddress),
    eventName: input.eventName,
    explorerUrl: getVoyagerTxUrl(input.txHash),
    id: `${input.category}:${input.txHash}:${input.eventName}:${input.sourceAddress}`,
    occurredAt: input.occurredAt ?? null,
    sortValue: input.blockNumber ?? 0,
    sourceAddress: input.sourceAddress,
    sourceLabel: input.sourceLabel,
    summary: input.summary,
    timeLabel: getReadableTimeLabel(input.occurredAt ?? null, input.blockNumber),
    title: input.title,
    tone: input.tone ?? 'success',
    txHash: input.txHash,
    valueText: input.valueText,
  };
}

function readCachedActivityFeed(): CachedActivityFeed {
  if (typeof window === 'undefined') {
    return { entries: [], lastUpdatedAt: null };
  }

  try {
    const raw = window.localStorage.getItem(ACTIVITY_FEED_CACHE_KEY);
    if (!raw) {
      return { entries: [], lastUpdatedAt: null };
    }

    const parsed = JSON.parse(raw) as Partial<CachedActivityFeed>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      lastUpdatedAt: typeof parsed.lastUpdatedAt === 'number' ? parsed.lastUpdatedAt : null,
    };
  } catch {
    return { entries: [], lastUpdatedAt: null };
  }
}

function writeCachedActivityFeed(feed: CachedActivityFeed) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(ACTIVITY_FEED_CACHE_KEY, JSON.stringify(feed));
  } catch {
    return;
  }
}

export async function primeOnchainActivityFeedCache() {
  const hasConfiguredContracts = [CONTRACTS.CIRCLE_FACTORY, CONTRACTS.REPUTATION, CONTRACTS.COLLATERAL_MANAGER]
    .some(isConfiguredAddress);

  if (!hasConfiguredContracts) {
    return;
  }

  try {
    const nextEntries = await loadOnchainActivityFeed();
    writeCachedActivityFeed({
      entries: nextEntries,
      lastUpdatedAt: Date.now(),
    });
  } catch {
    return;
  }
}

function unpackParsedEvent(event: ParsedContractEvent): DecodedEvent | null {
  const decodedEntry = Object.entries(event).find(
    ([key]) => key !== 'block_hash' && key !== 'block_number' && key !== 'transaction_hash',
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
  };
}

function decodeEvents(rawEvents: RawContractEvent[], decoder: EventDecoder) {
  return (starknetEvents.parseEvents(
    rawEvents,
    decoder.abiEvents,
    decoder.abiStructs,
    decoder.abiEnums,
    decoder.parser,
  ) as ParsedContractEvent[])
    .map(unpackParsedEvent)
    .filter((event): event is DecodedEvent => Boolean(event?.transactionHash));
}

async function fetchContractEvents(address: string) {
  if (!isConfiguredAddress(address)) {
    return [] as RawContractEvent[];
  }

  const normalizedAddress = toHexAddress(address);
  const collected: RawContractEvent[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await rpc.getEvents({
      address: normalizedAddress,
      chunk_size: 100,
      continuation_token: continuationToken,
      from_block: { block_number: 0 },
      to_block: 'latest',
    } as never);

    const chunk = response as { continuation_token?: string; events?: RawContractEvent[] };
    collected.push(...(chunk.events || []));
    continuationToken = chunk.continuation_token;
  } while (continuationToken);

  return collected;
}

function mapFactoryEvents(events: DecodedEvent[]) {
  const circleMetaMap = new Map<string, CircleMeta>();
  const entries: OnchainActivityEntry[] = [];

  for (const event of events) {
    if (event.fullName !== 'circlesave::circle_factory::CircleFactory::CircleCreated') {
      continue;
    }

    const circleId = toBigIntValue(event.payload.circle_id).toString();
    const creator = toHexAddress(event.payload.creator);
    const circleAddress = toHexAddress(event.payload.contract_address);
    const circleName = readFeltLabel(event.payload.name, `Circle #${circleId}`);
    const occurredAt = readTimestampMs(event.payload.timestamp);

    circleMetaMap.set(circleAddress.toLowerCase(), {
      id: circleId,
      name: circleName,
      address: circleAddress,
    });

    entries.push(buildActivityEntry({
      actor: creator,
      blockNumber: event.blockNumber,
      category: 'factory',
      circleAddress,
      circleName,
      eventName: 'CircleCreated',
      occurredAt,
      sourceAddress: CONTRACTS.CIRCLE_FACTORY,
      sourceLabel: 'Circle Factory',
      summary: `${formatAddress(creator)} created ${circleName}.`,
      title: 'Circle Created',
      tone: 'highlight',
      txHash: event.transactionHash,
      valueText: `Circle #${circleId}`,
    }));
  }

  return { circleMetaMap, entries };
}

function mapCircleEvent(event: DecodedEvent, circleMeta: CircleMeta) {
  const { payload } = event;

  switch (event.fullName) {
    case 'circlesave::circle::Circle::MemberJoined': {
      const member = toHexAddress(payload.member);
      const collateralLocked = formatTokenAmount(toBigIntValue(payload.collateral_locked));
      return buildActivityEntry({
        actor: member,
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'MemberJoined',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${formatAddress(member)} joined ${circleMeta.name} and locked ${collateralLocked}.`,
        title: 'Member Joined',
        txHash: event.transactionHash,
        valueText: collateralLocked,
      });
    }
    case 'circlesave::circle::Circle::MemberApproved': {
      const applicant = toHexAddress(payload.applicant);
      const approvedBy = toHexAddress(payload.approved_by);
      return buildActivityEntry({
        actor: applicant,
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'MemberApproved',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${formatAddress(applicant)} was approved by ${formatAddress(approvedBy)} in ${circleMeta.name}.`,
        title: 'Member Approved',
        txHash: event.transactionHash,
      });
    }
    case 'circlesave::circle::Circle::ContributionMade': {
      const member = toHexAddress(payload.member);
      const amount = formatTokenAmount(toBigIntValue(payload.amount));
      const month = Number(toBigIntValue(payload.month));
      return buildActivityEntry({
        actor: member,
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'ContributionMade',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${formatAddress(member)} contributed ${amount} to ${circleMeta.name} for month ${month}.`,
        title: 'Contribution Made',
        txHash: event.transactionHash,
        valueText: amount,
      });
    }
    case 'circlesave::circle::Circle::PotDistributed': {
      const recipient = toHexAddress(payload.recipient);
      const amount = formatTokenAmount(toBigIntValue(payload.amount));
      const month = Number(toBigIntValue(payload.month));
      return buildActivityEntry({
        actor: recipient,
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'PotDistributed',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${formatAddress(recipient)} received ${amount} from ${circleMeta.name} for month ${month}.`,
        title: 'Pot Distributed',
        txHash: event.transactionHash,
        valueText: amount,
      });
    }
    case 'circlesave::circle::Circle::CircleStarted': {
      const firstRecipient = toHexAddress(payload.first_recipient);
      return buildActivityEntry({
        actor: firstRecipient,
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'CircleStarted',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${circleMeta.name} started with ${formatAddress(firstRecipient)} as the first payout recipient.`,
        title: 'Circle Started',
        tone: 'highlight',
        txHash: event.transactionHash,
      });
    }
    case 'circlesave::circle::Circle::CircleCompleted': {
      const totalVolume = formatTokenAmount(toBigIntValue(payload.total_volume));
      return buildActivityEntry({
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'CircleCompleted',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${circleMeta.name} completed with ${totalVolume} in total volume.`,
        title: 'Circle Completed',
        tone: 'highlight',
        txHash: event.transactionHash,
        valueText: totalVolume,
      });
    }
    case 'circlesave::circle::Circle::PaymentMissed': {
      const member = toHexAddress(payload.member);
      const month = Number(toBigIntValue(payload.month));
      const slashedAmount = formatTokenAmount(toBigIntValue(payload.collateral_slashed));
      return buildActivityEntry({
        actor: member,
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'PaymentMissed',
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${formatAddress(member)} missed month ${month} in ${circleMeta.name}; ${slashedAmount} was slashed.`,
        title: 'Payment Missed',
        tone: 'warning',
        txHash: event.transactionHash,
        valueText: slashedAmount,
      });
    }
    case 'circlesave::circle::Circle::CollateralSlashed': {
      const member = toHexAddress(payload.member);
      const amount = formatTokenAmount(toBigIntValue(payload.amount));
      const reason = humanizeConstantLabel(
        readFeltLabel(payload.reason, 'Circle penalty').toUpperCase(),
        'Circle penalty',
      );
      return buildActivityEntry({
        actor: member,
        blockNumber: event.blockNumber,
        category: 'circle',
        circleAddress: circleMeta.address,
        circleName: circleMeta.name,
        eventName: 'CollateralSlashed',
        sourceAddress: circleMeta.address,
        sourceLabel: circleMeta.name,
        summary: `${formatAddress(member)} lost ${amount} in ${circleMeta.name}. Reason: ${reason}.`,
        title: 'Collateral Slashed',
        tone: 'warning',
        txHash: event.transactionHash,
        valueText: amount,
      });
    }
    default:
      return null;
  }
}

function mapReputationEvent(event: DecodedEvent) {
  const { payload } = event;

  switch (event.fullName) {
    case 'circlesave::reputation::Reputation::BadgeAwarded': {
      const user = toHexAddress(payload.user);
      const badgeId = readFeltLabel(payload.badge_id, 'Badge');
      const badgeName = BADGE_NAMES[badgeId] || humanizeConstantLabel(badgeId, 'Badge');
      return buildActivityEntry({
        actor: user,
        blockNumber: event.blockNumber,
        category: 'reputation',
        eventName: 'BadgeAwarded',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: CONTRACTS.REPUTATION,
        sourceLabel: 'Reputation',
        summary: `${formatAddress(user)} earned the ${badgeName} badge.`,
        title: 'Badge Awarded',
        tone: 'highlight',
        txHash: event.transactionHash,
        valueText: badgeName,
      });
    }
    case 'circlesave::reputation::Reputation::StatsUpdated': {
      const user = toHexAddress(payload.user);
      const circlesJoined = Number(toBigIntValue(payload.circles_joined));
      const paymentsMade = Number(toBigIntValue(payload.payments_made));
      const reputationScore = Number(toBigIntValue(payload.reputation_score));
      return buildActivityEntry({
        actor: user,
        blockNumber: event.blockNumber,
        category: 'reputation',
        eventName: 'StatsUpdated',
        sourceAddress: CONTRACTS.REPUTATION,
        sourceLabel: 'Reputation',
        summary: `${formatAddress(user)} is now at ${reputationScore} reputation with ${paymentsMade} payments and ${circlesJoined} circles joined.`,
        title: 'Reputation Updated',
        tone: 'neutral',
        txHash: event.transactionHash,
        valueText: `${reputationScore} pts`,
      });
    }
    case 'circlesave::reputation::Reputation::LevelUp': {
      const user = toHexAddress(payload.user);
      const rawLevel = readFeltLabel(payload.new_level, 'NEWCOMER').toUpperCase();
      const levelName = LEVEL_NAMES[rawLevel] || humanizeConstantLabel(rawLevel, 'Newcomer');
      return buildActivityEntry({
        actor: user,
        blockNumber: event.blockNumber,
        category: 'reputation',
        eventName: 'LevelUp',
        occurredAt: readTimestampMs(payload.timestamp),
        sourceAddress: CONTRACTS.REPUTATION,
        sourceLabel: 'Reputation',
        summary: `${formatAddress(user)} leveled up to ${levelName}.`,
        title: 'Level Up',
        tone: 'highlight',
        txHash: event.transactionHash,
        valueText: levelName,
      });
    }
    default:
      return null;
  }
}

function mapCollateralEvent(event: DecodedEvent) {
  const { payload } = event;

  switch (event.fullName) {
    case 'circlesave::collateral_manager::CollateralManager::CollateralLocked': {
      const user = toHexAddress(payload.user);
      const amount = formatTokenAmount(toBigIntValue(payload.amount));
      const newTotal = formatTokenAmount(toBigIntValue(payload.new_total));
      return buildActivityEntry({
        actor: user,
        blockNumber: event.blockNumber,
        category: 'collateral',
        eventName: 'CollateralLocked',
        sourceAddress: CONTRACTS.COLLATERAL_MANAGER,
        sourceLabel: 'Collateral Manager',
        summary: `${formatAddress(user)} locked ${amount}. New collateral total: ${newTotal}.`,
        title: 'Collateral Locked',
        txHash: event.transactionHash,
        valueText: amount,
      });
    }
    case 'circlesave::collateral_manager::CollateralManager::CollateralReleased': {
      const user = toHexAddress(payload.user);
      const amount = formatTokenAmount(toBigIntValue(payload.amount));
      const newTotal = formatTokenAmount(toBigIntValue(payload.new_total));
      return buildActivityEntry({
        actor: user,
        blockNumber: event.blockNumber,
        category: 'collateral',
        eventName: 'CollateralReleased',
        sourceAddress: CONTRACTS.COLLATERAL_MANAGER,
        sourceLabel: 'Collateral Manager',
        summary: `${formatAddress(user)} released ${amount}. Remaining collateral total: ${newTotal}.`,
        title: 'Collateral Released',
        txHash: event.transactionHash,
        valueText: amount,
      });
    }
    case 'circlesave::collateral_manager::CollateralManager::CollateralSlashed': {
      const user = toHexAddress(payload.user);
      const recipient = toHexAddress(payload.recipient);
      const amount = formatTokenAmount(toBigIntValue(payload.amount));
      const reason = humanizeConstantLabel(
        readFeltLabel(payload.reason, 'Collateral penalty').toUpperCase(),
        'Collateral penalty',
      );
      return buildActivityEntry({
        actor: user,
        blockNumber: event.blockNumber,
        category: 'collateral',
        eventName: 'CollateralSlashed',
        sourceAddress: CONTRACTS.COLLATERAL_MANAGER,
        sourceLabel: 'Collateral Manager',
        summary: `${formatAddress(user)} had ${amount} slashed to ${formatAddress(recipient)}. Reason: ${reason}.`,
        title: 'Collateral Slashed',
        tone: 'warning',
        txHash: event.transactionHash,
        valueText: amount,
      });
    }
    default:
      return null;
  }
}

async function loadOnchainActivityFeed() {
  const entries: OnchainActivityEntry[] = [];
  const failures: string[] = [];
  const circleMetaMap = new Map<string, CircleMeta>();

  if (isConfiguredAddress(CONTRACTS.CIRCLE_FACTORY)) {
    try {
      const factoryRawEvents = await fetchContractEvents(CONTRACTS.CIRCLE_FACTORY);
      const factoryEntries = mapFactoryEvents(decodeEvents(factoryRawEvents, FACTORY_DECODER));
      entries.push(...factoryEntries.entries);
      factoryEntries.circleMetaMap.forEach((value, key) => circleMetaMap.set(key, value));
    } catch {
      failures.push('factory');
    }
  }

  const tasks: Array<Promise<OnchainActivityEntry[]>> = [];

  for (const circleMeta of circleMetaMap.values()) {
    tasks.push((async () => {
      const rawEvents = await fetchContractEvents(circleMeta.address);
      return decodeEvents(rawEvents, CIRCLE_DECODER)
        .map((event) => mapCircleEvent(event, circleMeta))
        .filter((entry): entry is OnchainActivityEntry => Boolean(entry));
    })());
  }

  if (isConfiguredAddress(CONTRACTS.REPUTATION)) {
    tasks.push((async () => {
      const rawEvents = await fetchContractEvents(CONTRACTS.REPUTATION);
      return decodeEvents(rawEvents, REPUTATION_DECODER)
        .map(mapReputationEvent)
        .filter((entry): entry is OnchainActivityEntry => Boolean(entry));
    })());
  }

  if (isConfiguredAddress(CONTRACTS.COLLATERAL_MANAGER)) {
    tasks.push((async () => {
      const rawEvents = await fetchContractEvents(CONTRACTS.COLLATERAL_MANAGER);
      return decodeEvents(rawEvents, COLLATERAL_DECODER)
        .map(mapCollateralEvent)
        .filter((entry): entry is OnchainActivityEntry => Boolean(entry));
    })());
  }

  const settled = await Promise.allSettled(tasks);

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      entries.push(...result.value);
      continue;
    }

    failures.push('contract');
  }

  if (entries.length === 0 && failures.length > 0) {
    throw new Error('Unable to read on-chain activity right now. Please try again in a moment.');
  }

  return entries.sort((left, right) => {
    if (right.sortValue !== left.sortValue) {
      return right.sortValue - left.sortValue;
    }

    return (right.occurredAt || 0) - (left.occurredAt || 0);
  });
}

export function useOnchainActivityFeed() {
  const [entries, setEntries] = useState<OnchainActivityEntry[]>(() => readCachedActivityFeed().entries);
  const [isLoading, setIsLoading] = useState(() => readCachedActivityFeed().entries.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(() => readCachedActivityFeed().lastUpdatedAt);

  const refresh = useCallback(async (background = false) => {
    if (!background && entries.length === 0) {
      setIsLoading(true);
    }

    try {
      const nextEntries = await loadOnchainActivityFeed();
      const syncedAt = Date.now();
      setEntries(nextEntries);
      setError(null);
      setLastUpdatedAt(syncedAt);
      writeCachedActivityFeed({
        entries: nextEntries,
        lastUpdatedAt: syncedAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load on-chain activity.';
      if (entries.length === 0) {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [entries.length]);

  useEffect(() => {
    void refresh();

    const intervalId = window.setInterval(() => {
      void refresh(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  return {
    entries,
    error,
    hasConfiguredContracts: [CONTRACTS.CIRCLE_FACTORY, CONTRACTS.REPUTATION, CONTRACTS.COLLATERAL_MANAGER]
      .some(isConfiguredAddress),
    isLoading,
    lastUpdatedAt,
    refresh: () => refresh(),
  };
}
