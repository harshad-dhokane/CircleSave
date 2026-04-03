import { CallData, Contract, RpcProvider, cairo } from 'starknet';
import { STARKZAP_ACTIVITY_REGISTRY_ABI } from '@/lib/abis';
import { CONTRACTS } from '@/lib/constants';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const populateProvider = new RpcProvider({ nodeUrl: RPC_URL });

export type StarkZapTrackedModule = 'swap' | 'batch' | 'dca' | 'lending';
export type StarkZapTrackedExecutionMode = 'user_pays' | 'sponsored';

export type StarkZapActivityVolume = {
  token: string;
  amount: bigint;
};

export type StarkZapActivityRecord = {
  module: StarkZapTrackedModule;
  action: string;
  provider: string;
  executionMode: StarkZapTrackedExecutionMode;
  volumes?: StarkZapActivityVolume[];
  count?: number;
  referenceOne?: string;
  referenceTwo?: string;
};

const MODULE_LABELS: Record<StarkZapTrackedModule, string> = {
  swap: 'SWAP',
  batch: 'BATCH',
  dca: 'DCA',
  lending: 'LENDING',
};

function normalizeLabel(value?: string) {
  return (value || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 31)
    .toUpperCase();
}

function toFeltText(value?: string) {
  const normalized = normalizeLabel(value);
  if (!normalized) {
    return '0x0';
  }

  return CallData.compile([normalized])[0];
}

function populateContractCall(method: string, args: unknown[] = []) {
  const contract = new Contract({
    abi: STARKZAP_ACTIVITY_REGISTRY_ABI as never,
    address: CONTRACTS.STARKZAP_ACTIVITY_REGISTRY,
    providerOrAccount: populateProvider as never,
  });

  return contract.populate(method, args as never);
}

export function hasSharedStarkZapRegistry() {
  return Boolean(CONTRACTS.STARKZAP_ACTIVITY_REGISTRY) && CONTRACTS.STARKZAP_ACTIVITY_REGISTRY !== '0x0';
}

export function buildStarkZapActivityCall(record: StarkZapActivityRecord) {
  if (!hasSharedStarkZapRegistry()) {
    return null;
  }

  const volumes = (record.volumes || []).slice(0, 3);
  while (volumes.length < 3) {
    volumes.push({ token: '', amount: 0n });
  }

  return populateContractCall('record_activity', [
    toFeltText(MODULE_LABELS[record.module]),
    toFeltText(record.action),
    toFeltText(record.provider),
    toFeltText(record.executionMode === 'sponsored' ? 'SPONSORED' : 'USER_PAYS'),
    toFeltText(volumes[0].token),
    cairo.uint256(volumes[0].amount),
    toFeltText(volumes[1].token),
    cairo.uint256(volumes[1].amount),
    toFeltText(volumes[2].token),
    cairo.uint256(volumes[2].amount),
    record.count || 1,
    toFeltText(record.referenceOne),
    toFeltText(record.referenceTwo),
  ]);
}
