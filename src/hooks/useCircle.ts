// CircleSave - Circle Hook (Real Contract Integration)
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from '@starknet-react/core';
import {
  CairoCustomEnum,
  CallData,
  Contract,
  RpcProvider,
  cairo,
  createAbiParser,
  hash,
  events as starknetEvents,
  type Abi,
} from 'starknet';
import { CIRCLE_ABI, CIRCLE_FACTORY_ABI } from '@/lib/abis';
import {
  buildApproveCall,
  buildApproveMemberCall,
  buildCompleteCircleCall,
  buildContributeCall,
  buildDistributePotCall,
  buildEmergencyWithdrawCall,
  buildJoinCircleCall,
  buildRejectMemberCall,
  buildRequestJoinCircleCall,
  buildStartCircleCall,
} from '@/lib/circleCalls';
import { addressesEqual, normalizeAddress } from '@/lib/address';
import { isCircleReadyToStart } from '@/lib/circleState';
import { CircleType, CONTRACTS, getVoyagerTxUrl } from '@/lib/constants';
import type {
  Circle,
  CircleJoinRequest,
  CircleMember,
  CircleMemberJoinNotice,
  CircleStartReadyNotice,
} from '@/types';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const CARTRIDGE_RPC_URL = import.meta.env.VITE_CARTRIDGE_RPC_URL || 'https://api.cartridge.gg/x/starknet/sepolia';
const rpc = new RpcProvider({ nodeUrl: RPC_URL });
const readProviders = Array.from(new Set([RPC_URL, CARTRIDGE_RPC_URL].filter(Boolean))).map(
  (nodeUrl) => new RpcProvider({ nodeUrl }),
);
const CREATOR_MEMBER_JOIN_NOTICE_STORAGE_KEY = 'circlesave.creator-member-joins.v1';
const CONTRIBUTION_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;
const DISTRIBUTION_EVENT_LOOKBACK_BLOCKS = 150_000;
const POT_DISTRIBUTED_SELECTOR = hash.getSelectorFromName('PotDistributed');
const CIRCLE_STARTED_SELECTOR = hash.getSelectorFromName('CircleStarted');

type CircleActionResult =
  | { ok: true; txHash: string; voyagerUrl: string }
  | { ok: false; error: string };

type ContractLike = {
  execute: (calls: unknown[]) => Promise<unknown>;
};

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

type DecodedEvent = {
  blockNumber: number | null;
  fullName: string;
  payload: Record<string, unknown>;
  transactionHash: string;
};

type CircleDistributionState = {
  currentPot: bigint;
  currentRecipient: string | null;
  roundStartedAt: number | null;
  contributionWindowEndsAt: number | null;
};

const EMPTY_CIRCLE_DISTRIBUTION_STATE: CircleDistributionState = {
  currentPot: 0n,
  currentRecipient: null,
  roundStartedAt: null,
  contributionWindowEndsAt: null,
};

const CIRCLE_EVENT_DECODER = createEventDecoder(CIRCLE_ABI as unknown as Abi);

function newContract(abi: unknown, address: string, providerOrAccount?: unknown) {
  return new Contract({
    abi: abi as never,
    address,
    providerOrAccount: (providerOrAccount || rpc) as never,
  });
}

function toBigIntValue(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);

  if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
    const low = BigInt((value as { low: bigint | number | string }).low);
    const high = BigInt((value as { high: bigint | number | string }).high);
    return low + (high << 128n);
  }

  return 0n;
}

function toHexAddress(value: unknown): string {
  if (typeof value === 'string') {
    return value.startsWith('0x') ? value : `0x${BigInt(value).toString(16)}`;
  }

  return `0x${toBigIntValue(value).toString(16)}`;
}

function toBooleanValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'bigint') {
    return value !== 0n;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    if (normalized === '') return false;

    try {
      return BigInt(normalized) !== 0n;
    } catch {
      return normalized !== '0x0' && normalized !== '0';
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return false;
    }

    if (value.length === 1) {
      return toBooleanValue(value[0]);
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if ('value' in record) {
      return toBooleanValue(record.value);
    }

    if ('0' in record) {
      return toBooleanValue(record['0']);
    }

    if ('low' in record || 'high' in record) {
      return toBigIntValue(record) !== 0n;
    }
  }

  return false;
}

function createEventDecoder(abi: Abi): EventDecoder {
  return {
    abiEvents: starknetEvents.getAbiEvents(abi),
    abiStructs: CallData.getAbiStruct(abi),
    abiEnums: CallData.getAbiEnum(abi),
    parser: createAbiParser(abi),
  };
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

function readTimestampMs(value: unknown) {
  const timestampSeconds = Number(toBigIntValue(value));
  return Number.isFinite(timestampSeconds) && timestampSeconds > 0 ? timestampSeconds * 1000 : null;
}

async function fetchContractEventsByKey(address: string, fromBlock: number, toBlock: number, selector: string) {
  if (fromBlock > toBlock) {
    return [] as RawContractEvent[];
  }

  const collected: RawContractEvent[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await rpc.getEvents({
      address: toHexAddress(address),
      chunk_size: 100,
      continuation_token: continuationToken,
      from_block: { block_number: fromBlock },
      to_block: { block_number: toBlock },
      keys: [[selector]],
    } as never);

    const chunk = response as { continuation_token?: string; events?: RawContractEvent[] };
    collected.push(...(chunk.events || []));
    continuationToken = chunk.continuation_token;
  } while (continuationToken);

  return collected;
}

function toCairoEnum(index: number, variants: string[]) {
  return new CairoCustomEnum(
    Object.fromEntries(variants.map((variant, variantIndex) => [
      variant,
      variantIndex === index ? {} : undefined,
    ])),
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

function buildFailure(message: string): CircleActionResult {
  return { ok: false, error: message };
}

function buildSuccess(txHash: string): CircleActionResult {
  return {
    ok: true,
    txHash,
    voyagerUrl: getVoyagerTxUrl(txHash),
  };
}

function extractTransactionHash(result: unknown) {
  if (
    result &&
    typeof result === 'object' &&
    'transaction_hash' in result &&
    typeof (result as { transaction_hash?: unknown }).transaction_hash === 'string'
  ) {
    return (result as { transaction_hash: string }).transaction_hash;
  }

  return null;
}

function extractReceiptExecutionStatus(receipt: unknown): string | null {
  if (!receipt || typeof receipt !== 'object') {
    return null;
  }

  const response = receipt as Record<string, unknown>;

  if (typeof response.execution_status === 'string') {
    return response.execution_status;
  }

  if (response.receipt && typeof response.receipt === 'object') {
    const nestedReceipt = response.receipt as Record<string, unknown>;
    if (typeof nestedReceipt.execution_status === 'string') {
      return nestedReceipt.execution_status;
    }
  }

  return null;
}

function extractReceiptRevertReason(receipt: unknown): string | null {
  if (!receipt || typeof receipt !== 'object') {
    return null;
  }

  const response = receipt as Record<string, unknown>;
  const directReason = response.revert_reason ?? response.reason;

  if (typeof directReason === 'string' && directReason.trim()) {
    return directReason.trim();
  }

  if (response.execution_result && typeof response.execution_result === 'object') {
    const executionResult = response.execution_result as Record<string, unknown>;
    const nestedReason = executionResult.revert_reason ?? executionResult.reason;

    if (typeof nestedReason === 'string' && nestedReason.trim()) {
      return nestedReason.trim();
    }
  }

  if (response.receipt && typeof response.receipt === 'object') {
    return extractReceiptRevertReason(response.receipt);
  }

  return null;
}

async function waitForTransactionResult(result: unknown, fallbackMessage: string) {
  const txHash = extractTransactionHash(result);

  if (!txHash) {
    return buildFailure(`${fallbackMessage}: transaction hash missing`);
  }

  try {
    const receipt = await rpc.waitForTransaction(txHash);
    const reverted = typeof (receipt as { isReverted?: (() => boolean) }).isReverted === 'function'
      ? Boolean((receipt as { isReverted: () => boolean }).isReverted())
      : extractReceiptExecutionStatus(receipt) === 'REVERTED';

    if (reverted) {
      return buildFailure(extractReceiptRevertReason(receipt) || `${fallbackMessage}: transaction reverted`);
    }

    return buildSuccess(txHash);
  } catch (error) {
    return buildFailure(getErrorMessage(error, fallbackMessage));
  }
}

async function executeAccountCalls(
  account: ContractLike,
  calls: unknown[],
  fallbackMessage: string,
) {
  const result = await account.execute(calls);
  return waitForTransactionResult(result, fallbackMessage);
}

async function callReadContract(params: {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}) {
  let lastError: unknown = null;

  for (const provider of readProviders) {
    try {
      return await provider.callContract(params);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Failed to call ${params.entrypoint}`);
}

function decodePrintableFelt(value: unknown): string {
  try {
    const normalized = typeof value === 'string' && value.startsWith('0x')
      ? value
      : `${value ?? ''}`;
    const hex = BigInt(normalized).toString(16);
    let result = '';

    for (let index = 0; index < hex.length; index += 2) {
      const charCode = Number.parseInt(hex.slice(index, index + 2), 16);
      if (Number.isNaN(charCode)) continue;
      if (charCode >= 32 && charCode < 127) {
        result += String.fromCharCode(charCode);
      }
    }

    return result.trim();
  } catch {
    return '';
  }
}

function feltToString(felt: unknown): string {
  const decoded = decodePrintableFelt(felt);
  if (decoded) {
    return decoded;
  }

  if (felt === undefined || felt === null) {
    return '';
  }

  return String(felt);
}

function requestMessageFromFelt(felt: unknown) {
  if (felt === 0 || felt === 0n || felt === '0' || felt === 1 || felt === 1n || felt === '1') {
    return '';
  }

  const decoded = decodePrintableFelt(felt);
  if (decoded) {
    return decoded;
  }

  const stringValue = String(felt ?? '').trim();
  return stringValue === '0' || stringValue === '1' ? '' : stringValue;
}

function parsePendingApplicantTuple(rawApplicant: unknown) {
  if (!rawApplicant) {
    return null;
  }

  if (Array.isArray(rawApplicant) && rawApplicant.length >= 2) {
    return {
      applicantAddress: toHexAddress(rawApplicant[0]),
      message: requestMessageFromFelt(rawApplicant[1]),
    };
  }

  if (typeof rawApplicant === 'object') {
    const tupleLike = rawApplicant as Record<string, unknown>;
    const addressValue = tupleLike.applicant ?? tupleLike.address ?? tupleLike['0'];
    const messageValue = tupleLike.message ?? tupleLike['1'];

    if (addressValue !== undefined && messageValue !== undefined) {
      return {
        applicantAddress: toHexAddress(addressValue),
        message: requestMessageFromFelt(messageValue),
      };
    }
  }

  return null;
}

function getCircleCollateralRequired(circle: Circle) {
  return (circle.monthlyAmount * BigInt(circle.collateralRatio)) / 100n;
}

const RAW_CIRCLE_INFO_FELT_LENGTH = 16;

function toHexFelt(value: bigint | number) {
  return `0x${BigInt(value).toString(16)}`;
}

function toUint256Calldata(value: bigint | number | string) {
  const normalized = toBigIntValue(value);
  const mask = (1n << 128n) - 1n;

  return [
    toHexFelt(normalized & mask),
    toHexFelt(normalized >> 128n),
  ];
}

function parseStatusIndex(statusIndex: number) {
  const statusMap: Record<number, string> = { 0: 'PENDING', 1: 'ACTIVE', 2: 'COMPLETED', 3: 'FAILED' };
  return statusMap[statusIndex] || 'PENDING';
}

function parseRawCircleInfo(fields: string[]): Circle {
  if (fields.length < RAW_CIRCLE_INFO_FELT_LENGTH) {
    throw new Error(`Received malformed raw circle info: expected ${RAW_CIRCLE_INFO_FELT_LENGTH} fields, got ${fields.length}`);
  }

  const [
    idLow,
    idHigh,
    name,
    description,
    monthlyAmountLow,
    monthlyAmountHigh,
    maxMembers,
    currentMembers,
    circleType,
    category,
    collateralRatio,
    status,
    creator,
    createdAt,
    currentMonth,
    contractAddress,
  ] = fields;

  return {
    id: toBigIntValue({ low: idLow, high: idHigh }).toString(),
    name: feltToString(name),
    description: feltToString(description),
    creator: toHexAddress(creator),
    monthlyAmount: toBigIntValue({ low: monthlyAmountLow, high: monthlyAmountHigh }),
    maxMembers: Number(toBigIntValue(maxMembers)),
    currentMembers: Number(toBigIntValue(currentMembers)),
    collateralRatio: Number(toBigIntValue(collateralRatio)),
    status: parseStatusIndex(Number(toBigIntValue(status))),
    category: Number(toBigIntValue(category)),
    circleType: Number(toBigIntValue(circleType)),
    createdAt: Number(toBigIntValue(createdAt)),
    currentMonth: Number(toBigIntValue(currentMonth)),
    contractAddress: toHexAddress(contractAddress),
  };
}

function parseRawCircleArray(response: string[]) {
  if (response.length === 0) {
    return [];
  }

  const circleCount = Number(toBigIntValue(response[0]));
  const circles: Circle[] = [];

  for (let index = 0; index < circleCount; index += 1) {
    const start = 1 + (index * RAW_CIRCLE_INFO_FELT_LENGTH);
    const end = start + RAW_CIRCLE_INFO_FELT_LENGTH;
    circles.push(parseRawCircleInfo(response.slice(start, end)));
  }

  return circles;
}

function mapPendingRequests(circle: Circle, rawApplicants: unknown): CircleJoinRequest[] {
  if (!Array.isArray(rawApplicants)) {
    return [];
  }

  const collateralRequired = getCircleCollateralRequired(circle);

  return rawApplicants
    .map(parsePendingApplicantTuple)
    .filter((request): request is { applicantAddress: string; message: string } => Boolean(request))
    .map((request) => ({
      id: `${circle.id}:${normalizeAddress(request.applicantAddress)}`,
      circleId: circle.id,
      circleName: circle.name,
      circleAddress: circle.contractAddress,
      applicantAddress: request.applicantAddress,
      message: request.message,
      collateralRequired,
    }));
}

function mapReadyToStartCircle(circle: Circle): CircleStartReadyNotice {
  return {
    id: `ready:${circle.id}`,
    circleId: circle.id,
    circleName: circle.name,
    circleAddress: circle.contractAddress,
    currentMembers: circle.currentMembers,
    maxMembers: circle.maxMembers,
  };
}

function mapRawMember(member: unknown): CircleMember {
  const source = member as Record<string, unknown>;

  return {
    address: toHexAddress(source.address),
    joinedAt: Number(source.joined_at ?? 0),
    collateralLocked: toBigIntValue(source.collateral_locked),
    paymentsMade: Number(source.payments_made ?? 0),
    paymentsLate: Number(source.payments_late ?? 0),
    hasReceivedPot: toBooleanValue(source.has_received_pot),
    isActive: toBooleanValue(source.is_active),
  };
}

function mapMemberJoinNotices(circle: Circle, members: CircleMember[]): CircleMemberJoinNotice[] {
  return members
    .filter((member) => !addressesEqual(member.address, circle.creator))
    .map((member) => ({
      id: `joined:${circle.id}:${normalizeAddress(member.address)}`,
      circleId: circle.id,
      circleName: circle.name,
      circleAddress: circle.contractAddress,
      memberAddress: member.address,
      joinedAt: member.joinedAt,
    }));
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readSeenMemberJoinNoticeMap() {
  if (!canUseLocalStorage()) {
    return {} as Record<string, string[]>;
  }

  try {
    const raw = window.localStorage.getItem(CREATOR_MEMBER_JOIN_NOTICE_STORAGE_KEY);
    if (!raw) {
      return {} as Record<string, string[]>;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {} as Record<string, string[]>;
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([creatorAddress, seenIds]) => [
        creatorAddress,
        Array.isArray(seenIds)
          ? seenIds.filter((value): value is string => typeof value === 'string')
          : [],
      ]),
    );
  } catch {
    return {} as Record<string, string[]>;
  }
}

async function fetchCircleDistributionState(circle: Circle): Promise<CircleDistributionState> {
  if (circle.status !== 'ACTIVE') {
    return EMPTY_CIRCLE_DISTRIBUTION_STATE;
  }

  let currentPot = 0n;
  let currentRecipient: string | null = null;
  let roundStartedAt: number | null = null;
  let canAssumeDistributionReady = false;

  try {
    const circleContract = newContract(CIRCLE_ABI, circle.contractAddress);
    const [potResponse, rotationQueueResponse] = await Promise.all([
      circleContract.get_current_pot(),
      circleContract.get_rotation_queue(),
    ]);

    currentPot = toBigIntValue(potResponse);

    if (Array.isArray(rotationQueueResponse) && circle.currentMonth > 0) {
      currentRecipient = rotationQueueResponse[circle.currentMonth - 1]
        ? toHexAddress(rotationQueueResponse[circle.currentMonth - 1])
        : null;
    }
  } catch (error) {
    console.warn('Unable to read circle distribution state:', error);
  }

  try {
    const latestBlock = await rpc.getBlock('latest');
    const fromBlock = Math.max(latestBlock.block_number - DISTRIBUTION_EVENT_LOOKBACK_BLOCKS, 0);

    if (circle.currentMonth <= 1) {
      const startEvents = decodeEvents(
        await fetchContractEventsByKey(circle.contractAddress, fromBlock, latestBlock.block_number, CIRCLE_STARTED_SELECTOR),
        CIRCLE_EVENT_DECODER,
      );
      const lastStartEvent = [...startEvents].reverse()[0];

      roundStartedAt = lastStartEvent ? readTimestampMs(lastStartEvent.payload.timestamp) : null;
      canAssumeDistributionReady = !lastStartEvent && fromBlock > 0;
    } else {
      const previousMonth = circle.currentMonth - 1;
      const distributionEvents = decodeEvents(
        await fetchContractEventsByKey(circle.contractAddress, fromBlock, latestBlock.block_number, POT_DISTRIBUTED_SELECTOR),
        CIRCLE_EVENT_DECODER,
      );
      const lastDistributionEvent = [...distributionEvents]
        .reverse()
        .find((event) => Number(toBigIntValue(event.payload.month)) === previousMonth);

      roundStartedAt = lastDistributionEvent ? readTimestampMs(lastDistributionEvent.payload.timestamp) : null;
      canAssumeDistributionReady = !lastDistributionEvent && fromBlock > 0;
    }
  } catch (error) {
    console.warn('Unable to read circle distribution timing:', error);
  }

  return {
    currentPot,
    currentRecipient,
    roundStartedAt,
    contributionWindowEndsAt: roundStartedAt
      ? roundStartedAt + CONTRIBUTION_WINDOW_MS
      : canAssumeDistributionReady
        ? 0
        : null,
  };
}

function readSeenMemberJoinNoticeIds(address: string) {
  const normalizedAddress = normalizeAddress(address);
  return new Set(readSeenMemberJoinNoticeMap()[normalizedAddress] ?? []);
}

function writeSeenMemberJoinNoticeIds(address: string, ids: Iterable<string>) {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedAddress = normalizeAddress(address);
  const nextMap = readSeenMemberJoinNoticeMap();
  nextMap[normalizedAddress] = Array.from(new Set(ids));
  window.localStorage.setItem(CREATOR_MEMBER_JOIN_NOTICE_STORAGE_KEY, JSON.stringify(nextMap));
}

async function fetchPendingRequestsForCircle(circle: Circle): Promise<CircleJoinRequest[]> {
  if (circle.circleType !== 1 || circle.status !== 'PENDING') {
    return [];
  }

  const circleContract = newContract(CIRCLE_ABI, circle.contractAddress);
  const rawApplicants = await circleContract.get_pending_applicants();

  return mapPendingRequests(circle, rawApplicants);
}

async function fetchMembersForCircle(circle: Circle): Promise<CircleMember[]> {
  if (circle.currentMembers === 0) {
    return [];
  }

  const circleContract = newContract(CIRCLE_ABI, circle.contractAddress);
  const memberList = await circleContract.get_members();
  return (memberList as Array<unknown>).map(mapRawMember);
}

async function fetchAllCirclesFromFactory(): Promise<Circle[]> {
  const countResponse = await callReadContract({
    contractAddress: CONTRACTS.CIRCLE_FACTORY,
    entrypoint: 'get_circle_count',
    calldata: [],
  });
  const circleCount = Number(toBigIntValue(countResponse[0] ?? 0));

  if (circleCount === 0) {
    return [];
  }

  const batchSize = 10;
  const allCircles: Circle[] = [];

  for (let offset = 0; offset < circleCount; offset += batchSize) {
    const limit = Math.min(batchSize, circleCount - offset);
    const result = await callReadContract({
      contractAddress: CONTRACTS.CIRCLE_FACTORY,
      entrypoint: 'get_circles',
      calldata: [toHexFelt(offset), toHexFelt(limit)],
    });

    allCircles.push(...parseRawCircleArray(result));
  }

  return allCircles;
}

// ============================================================
// Hook: useCircles - Fetch all circles from CircleFactory
// ============================================================
export function useCircles() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    if (CONTRACTS.CIRCLE_FACTORY === '0x0') {
      setCircles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCircles(await fetchAllCirclesFromFactory());
    } catch (error) {
      console.error('Error fetching circles:', error);
      setError(getErrorMessage(error, 'Failed to fetch circles'));
      setCircles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCircles();
  }, [fetchCircles]);

  return {
    circles,
    isLoading,
    error,
    refetch: fetchCircles,
    activeCircles: circles.filter((circle) => circle.status === 'ACTIVE'),
    pendingCircles: circles.filter((circle) => circle.status === 'PENDING'),
  };
}

// ============================================================
// Hook: useCircleDetail - Fetch a single circle's full details
// ============================================================
export function useCircleDetail(circleId: string) {
  const { address } = useAccount();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CircleJoinRequest[]>([]);
  const [distributionState, setDistributionState] = useState<CircleDistributionState>(EMPTY_CIRCLE_DISTRIBUTION_STATE);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (CONTRACTS.CIRCLE_FACTORY === '0x0' || !circleId) {
      setCircle(null);
      setMembers([]);
      setPendingRequests([]);
      setDistributionState(EMPTY_CIRCLE_DISTRIBUTION_STATE);
      setHasPendingRequest(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const factoryResponse = await callReadContract({
        contractAddress: CONTRACTS.CIRCLE_FACTORY,
        entrypoint: 'get_circle_by_id',
        calldata: toUint256Calldata(circleId),
      });
      const circleAddress = parseRawCircleInfo(factoryResponse).contractAddress;
      const circleContract = newContract(CIRCLE_ABI, circleAddress);
      const infoResponse = await callReadContract({
        contractAddress: circleAddress,
        entrypoint: 'get_info',
        calldata: [],
      });
      const parsedCircle = parseRawCircleInfo(infoResponse);
      setCircle(parsedCircle);
      setDistributionState(EMPTY_CIRCLE_DISTRIBUTION_STATE);
      const [membersResult, pendingRequestsResult] = await Promise.allSettled([
        fetchMembersForCircle(parsedCircle),
        fetchPendingRequestsForCircle(parsedCircle),
      ]);

      const parsedMembers = membersResult.status === 'fulfilled' ? membersResult.value : [];
      const nextPendingRequests = pendingRequestsResult.status === 'fulfilled' ? pendingRequestsResult.value : [];

      setMembers(parsedMembers);
      setPendingRequests(nextPendingRequests);

      if (address) {
        const memberCheck = await circleContract.is_member(address);

        setIsMember(toBooleanValue(memberCheck));
        setIsCreator(addressesEqual(parsedCircle.creator, address));
        setHasPendingRequest(
          nextPendingRequests.some((request) => addressesEqual(request.applicantAddress, address)),
        );
      } else {
        setIsMember(false);
        setIsCreator(false);
        setHasPendingRequest(false);
      }
    } catch (error) {
      console.error('Error fetching circle detail:', error);
      setError(getErrorMessage(error, 'Failed to fetch circle details'));
      setPendingRequests([]);
      setDistributionState(EMPTY_CIRCLE_DISTRIBUTION_STATE);
      setHasPendingRequest(false);
    } finally {
      setIsLoading(false);
    }
  }, [address, circleId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!circle || circle.status !== 'ACTIVE') {
      setDistributionState(EMPTY_CIRCLE_DISTRIBUTION_STATE);
      return undefined;
    }

    let cancelled = false;

    void fetchCircleDistributionState(circle)
      .then((nextState) => {
        if (!cancelled) {
          setDistributionState(nextState);
        }
      })
      .catch((distributionError) => {
        console.warn('Unable to sync distribution state:', distributionError);
        if (!cancelled) {
          setDistributionState(EMPTY_CIRCLE_DISTRIBUTION_STATE);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [circle, circle?.contractAddress, circle?.currentMembers, circle?.currentMonth, circle?.status]);

  return {
    circle,
    members,
    pendingRequests,
    distributionState,
    hasPendingRequest,
    isLoading,
    error,
    isMember,
    isCreator,
    refetch: fetchDetail,
  };
}

// ============================================================
// Hook: useCreateCircle
// ============================================================
export function useCreateCircle() {
  const { account } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createCircle = useCallback(async (params: {
    name: string;
    description: string;
    monthlyAmount: string;
    maxMembers: number;
    circleType: number;
    category: number;
    collateralRatio: number;
  }): Promise<CircleActionResult> => {
    if (!account) {
      const message = 'Please connect your wallet';
      setError(message);
      return buildFailure(message);
    }

    if (CONTRACTS.CIRCLE_FACTORY === '0x0') {
      const message = 'Contracts not deployed yet';
      setError(message);
      return buildFailure(message);
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setTxHash(null);

      const contract = newContract(CIRCLE_FACTORY_ABI, CONTRACTS.CIRCLE_FACTORY, account);
      const nameAsFelt = CallData.compile([params.name])[0];
      const descAsFelt = CallData.compile([params.description])[0];
      const monthlyAmountWei = BigInt(Math.floor(Number.parseFloat(params.monthlyAmount) * 1e18));

      const result = await contract.create_circle(
        nameAsFelt,
        descAsFelt,
        cairo.uint256(monthlyAmountWei),
        params.maxMembers,
        toCairoEnum(params.circleType, ['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY']),
        toCairoEnum(params.category, ['FRIENDS', 'FAMILY', 'COWORKERS', 'NEIGHBORS', 'INTEREST']),
        params.collateralRatio,
      );

      const outcome = await waitForTransactionResult(result, 'Failed to create circle');
      if (outcome.ok) {
        setTxHash(outcome.txHash);
        return outcome;
      }

      setError(outcome.error);
      return outcome;
    } catch (error) {
      console.error('Error creating circle:', error);
      const message = getErrorMessage(error, 'Failed to create circle');
      setError(message);
      return buildFailure(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [account]);

  return { createCircle, isSubmitting, txHash, error, voyagerUrl: txHash ? getVoyagerTxUrl(txHash) : null };
}

function useCircleTxExecutor() {
  const { account } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(async (
    buildCalls: (connectedAccount: ContractLike) => Promise<unknown[]>,
    fallbackMessage: string,
  ): Promise<CircleActionResult> => {
    if (!account) {
      const message = 'Please connect your wallet';
      setError(message);
      return buildFailure(message);
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const calls = await buildCalls(account as ContractLike);
      const outcome = await executeAccountCalls(account as ContractLike, calls, fallbackMessage);

      if (outcome.ok) {
        setTxHash(outcome.txHash);
      } else {
        setError(outcome.error);
      }

      return outcome;
    } catch (error) {
      console.error(fallbackMessage, error);
      const message = getErrorMessage(error, fallbackMessage);
      setError(message);
      return buildFailure(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [account]);

  return { runAction, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useJoinCircle
// ============================================================
export function useJoinCircle() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const joinCircle = useCallback((circleAddress: string) => {
    return runAction(async (account) => {
      const infoResponse = await callReadContract({
        contractAddress: circleAddress,
        entrypoint: 'get_info',
        calldata: [],
      });
      const circle = parseRawCircleInfo(infoResponse);

      if (circle.circleType === CircleType.APPROVAL_REQUIRED) {
        throw new Error('This circle requires approval first. Send a join request instead.');
      }

      if (circle.circleType === CircleType.INVITE_ONLY) {
        throw new Error('This circle is invite-only. Public joins are not available in CircleSave yet.');
      }

      const circleContract = newContract(CIRCLE_ABI, circleAddress, account);
      const collateralRequired = toBigIntValue(await circleContract.get_collateral_required());

      return [
        buildApproveCall(CONTRACTS.STRK_TOKEN, circleAddress, collateralRequired),
        buildJoinCircleCall(circleAddress),
      ];
    }, 'Failed to join circle');
  }, [runAction]);

  return { joinCircle, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useRequestJoinCircle
// ============================================================
export function useRequestJoinCircle() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const requestJoinCircle = useCallback((circleAddress: string, message: string) => {
    return runAction(async (account) => {
      const infoResponse = await callReadContract({
        contractAddress: circleAddress,
        entrypoint: 'get_info',
        calldata: [],
      });
      const circle = parseRawCircleInfo(infoResponse);

      if (circle.circleType === CircleType.OPEN) {
        throw new Error('This circle allows direct joins, so a request is not needed.');
      }

      if (circle.circleType === CircleType.INVITE_ONLY) {
        throw new Error('This circle is invite-only. Public join requests are not available in CircleSave yet.');
      }

      const circleContract = newContract(CIRCLE_ABI, circleAddress, account);
      const collateralRequired = toBigIntValue(await circleContract.get_collateral_required());
      const requestMessage = message.trim().slice(0, 31) || 'Requesting to join';

      return [
        buildApproveCall(CONTRACTS.STRK_TOKEN, circleAddress, collateralRequired),
        buildRequestJoinCircleCall(circleAddress, requestMessage),
      ];
    }, 'Failed to submit join request');
  }, [runAction]);

  return { requestJoinCircle, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useApproveMember
// ============================================================
export function useApproveMember() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const approveMember = useCallback((circleAddress: string, applicantAddress: string) => {
    return runAction(async () => [
      buildApproveMemberCall(circleAddress, applicantAddress),
    ], 'Failed to approve member');
  }, [runAction]);

  return { approveMember, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useRejectMember
// ============================================================
export function useRejectMember() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const rejectMember = useCallback((circleAddress: string, applicantAddress: string) => {
    return runAction(async () => [
      buildRejectMemberCall(circleAddress, applicantAddress),
    ], 'Failed to reject member');
  }, [runAction]);

  return { rejectMember, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useContribute
// ============================================================
export function useContribute() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const contribute = useCallback((circleAddress: string, amount: bigint) => {
    return runAction(async () => [
      buildApproveCall(CONTRACTS.STRK_TOKEN, circleAddress, amount),
      buildContributeCall(circleAddress),
    ], 'Failed to contribute');
  }, [runAction]);

  return { contribute, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useStartCircle
// ============================================================
export function useStartCircle() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const startCircle = useCallback((circleAddress: string) => {
    return runAction(async () => [
      buildStartCircleCall(circleAddress),
    ], 'Failed to start circle');
  }, [runAction]);

  return { startCircle, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useDistributePot
// ============================================================
export function useDistributePot() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const distributePot = useCallback((circleAddress: string) => {
    return runAction(async () => [
      buildDistributePotCall(circleAddress),
    ], 'Failed to distribute pot');
  }, [runAction]);

  return { distributePot, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useCompleteCircle
// ============================================================
export function useCompleteCircle() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const completeCircle = useCallback((circleAddress: string) => {
    return runAction(async () => [
      buildCompleteCircleCall(circleAddress),
    ], 'Failed to complete circle');
  }, [runAction]);

  return { completeCircle, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useEmergencyWithdraw
// ============================================================
export function useEmergencyWithdraw() {
  const { runAction, isSubmitting, txHash, error } = useCircleTxExecutor();

  const emergencyWithdraw = useCallback((circleAddress: string) => {
    return runAction(async () => [
      buildEmergencyWithdrawCall(circleAddress),
    ], 'Failed to withdraw collateral');
  }, [runAction]);

  return { emergencyWithdraw, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useIncomingCircleRequests
// ============================================================
export function useIncomingCircleRequests(options?: { pollMs?: number }) {
  const { address } = useAccount();
  const [requests, setRequests] = useState<CircleJoinRequest[]>([]);
  const [memberJoinNotices, setMemberJoinNotices] = useState<CircleMemberJoinNotice[]>([]);
  const [readyToStartCircles, setReadyToStartCircles] = useState<CircleStartReadyNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollMs = options?.pollMs ?? 0;

  const fetchRequests = useCallback(async () => {
    if (!address || CONTRACTS.CIRCLE_FACTORY === '0x0') {
      setRequests([]);
      setMemberJoinNotices([]);
      setReadyToStartCircles([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const allCircles = await fetchAllCirclesFromFactory();
      const creatorCircles = allCircles.filter((circle) =>
        addressesEqual(circle.creator, address) &&
        circle.status === 'PENDING',
      );
      const approvalCircles = creatorCircles.filter((circle) => circle.circleType === CircleType.APPROVAL_REQUIRED);
      const memberNoticeCircles = creatorCircles.filter((circle) => circle.currentMembers > 0);

      const [requestGroups, memberGroups] = await Promise.all([
        Promise.all(
          approvalCircles.map((circle) => fetchPendingRequestsForCircle(circle)),
        ),
        Promise.all(
          memberNoticeCircles.map(async (circle) => ({
            circle,
            members: await fetchMembersForCircle(circle),
          })),
        ),
      ]);

      const seenNoticeIds = readSeenMemberJoinNoticeIds(address);
      const nextMemberJoinNotices = memberGroups
        .flatMap(({ circle, members }) => mapMemberJoinNotices(circle, members))
        .filter((notice) => !seenNoticeIds.has(notice.id))
        .sort((left, right) =>
          right.joinedAt - left.joinedAt || left.circleName.localeCompare(right.circleName) || left.memberAddress.localeCompare(right.memberAddress),
        );

      setMemberJoinNotices(nextMemberJoinNotices);
      setRequests(
        requestGroups
          .flat()
          .sort((left, right) => left.circleName.localeCompare(right.circleName) || left.applicantAddress.localeCompare(right.applicantAddress)),
      );
      setReadyToStartCircles(
        creatorCircles
          .filter(isCircleReadyToStart)
          .map(mapReadyToStartCircle)
          .sort((left, right) => left.circleName.localeCompare(right.circleName)),
      );
    } catch (error) {
      console.error('Error fetching join requests:', error);
      setRequests([]);
      setMemberJoinNotices([]);
      setReadyToStartCircles([]);
      setError(getErrorMessage(error, 'Failed to fetch join requests'));
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!pollMs || !address || typeof window === 'undefined') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void fetchRequests();
    }, pollMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [address, fetchRequests, pollMs]);

  const markMemberJoinNoticesSeen = useCallback((noticeIds?: string[]) => {
    if (!address) {
      return;
    }

    setMemberJoinNotices((currentNotices) => {
      const idsToMark = new Set(
        noticeIds && noticeIds.length > 0
          ? noticeIds
          : currentNotices.map((notice) => notice.id),
      );

      if (idsToMark.size === 0) {
        return currentNotices;
      }

      const seenIds = readSeenMemberJoinNoticeIds(address);
      idsToMark.forEach((id) => seenIds.add(id));
      writeSeenMemberJoinNoticeIds(address, seenIds);

      return currentNotices.filter((notice) => !idsToMark.has(notice.id));
    });
  }, [address]);

  return {
    requests,
    memberJoinNotices,
    readyToStartCircles,
    pendingCount: requests.length,
    memberJoinCount: memberJoinNotices.length,
    readyToStartCount: readyToStartCircles.length,
    notificationCount: requests.length + readyToStartCircles.length + memberJoinNotices.length,
    isLoading,
    error,
    markMemberJoinNoticesSeen,
    refetch: fetchRequests,
  };
}

// ============================================================
// Hook: useUserCircles
// ============================================================
export function useUserCircles() {
  const { address } = useAccount();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    if (!address || CONTRACTS.CIRCLE_FACTORY === '0x0') {
      setCircles([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const allCircles = await fetchAllCirclesFromFactory();

      const membershipChecks = await Promise.all(
        allCircles.map(async (circle) => {
          if (addressesEqual(circle.creator, address)) {
            return true;
          }

          try {
            const circleContract = newContract(CIRCLE_ABI, circle.contractAddress);
            return toBooleanValue(await circleContract.is_member(address));
          } catch (membershipError) {
            console.error(`Error checking membership for circle ${circle.id}:`, membershipError);
            return false;
          }
        }),
      );

      setCircles(allCircles.filter((_, index) => membershipChecks[index]));
    } catch (error) {
      console.error('Error fetching user circles:', error);
      setCircles([]);
      setError(getErrorMessage(error, 'Failed to fetch wallet circles'));
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchCircles();
  }, [fetchCircles]);

  return { circles, isLoading, error, refetch: fetchCircles };
}
