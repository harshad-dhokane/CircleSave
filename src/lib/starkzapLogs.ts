import { getVoyagerTxUrl } from '@/lib/constants';

export type StarkZapLogKind = 'swap' | 'dca' | 'lending' | 'staking' | 'batch';
export type StarkZapLogStatus = 'submitted' | 'confirmed' | 'failed';

export interface StarkZapLogDetails {
  action?: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  inputAmount?: string;
  inputToken?: string;
  outputAmount?: string;
  outputToken?: string;
  totalAmount?: string;
  totalToken?: string;
  cycleAmount?: string;
  cycleToken?: string;
  frequency?: string;
  transferCount?: number;
  batchTransfers?: Array<{
    token: string;
    totalAmount: string;
    transferCount: number;
  }>;
}

export interface StarkZapLogEntry {
  id: string;
  kind: StarkZapLogKind;
  title: string;
  summary: string;
  account: string;
  provider: string;
  status: StarkZapLogStatus;
  txHash: string;
  explorerUrl: string;
  createdAt: string;
  updatedAt: string;
  details?: StarkZapLogDetails;
  error?: string;
  executionMode?: 'user_pays' | 'sponsored';
  blockNumber?: number | null;
}

export function createSharedStarkZapLogEntry(input: Omit<StarkZapLogEntry, 'explorerUrl'> & {
  explorerUrl?: string;
}): StarkZapLogEntry {
  return {
    ...input,
    explorerUrl: input.explorerUrl || getVoyagerTxUrl(input.txHash),
  };
}

export function getStarkZapLogDetails(entry: StarkZapLogEntry): StarkZapLogDetails | undefined {
  return entry.details;
}

export function getStarkZapLogAmountText(entry: StarkZapLogEntry): string | null {
  const details = getStarkZapLogDetails(entry);

  if (!details) {
    return null;
  }

  if (entry.kind === 'swap' && details.inputAmount && details.inputToken) {
    return details.outputToken
      ? `${details.inputAmount} ${details.inputToken} -> ${details.outputToken}`
      : `${details.inputAmount} ${details.inputToken}`;
  }

  if (entry.kind === 'dca' && details.totalAmount && details.totalToken) {
    const cycleText = details.cycleAmount && details.cycleToken
      ? ` • ${details.cycleAmount} ${details.cycleToken}/cycle`
      : '';
    return `${details.totalAmount} ${details.totalToken} total${cycleText}`;
  }

  if (entry.kind === 'batch' && details.totalAmount && details.totalToken) {
    const prefix = details.transferCount ? `${details.transferCount} transfers • ` : '';
    return `${prefix}${details.totalAmount} ${details.totalToken} total`;
  }

  if (entry.kind === 'batch' && details.batchTransfers && details.batchTransfers.length > 0) {
    const prefix = details.transferCount ? `${details.transferCount} transfers • ` : '';
    const totals = details.batchTransfers
      .map((item) => `${item.totalAmount} ${item.token}`)
      .join(' • ');
    return `${prefix}${totals}`;
  }

  if (entry.kind === 'lending' && details.inputAmount && details.inputToken) {
    const action = details.action ? `${details.action} ` : '';
    return `${action}${details.inputAmount} ${details.inputToken}`;
  }

  return null;
}
