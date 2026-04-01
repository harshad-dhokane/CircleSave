import { getVoyagerTxUrl } from '@/lib/constants';

export type StarkZapLogKind = 'swap' | 'dca' | 'lending';
export type StarkZapLogStatus = 'submitted' | 'confirmed' | 'failed';

export interface StarkZapLogDetails {
  action?: 'deposit' | 'withdraw';
  inputAmount?: string;
  inputToken?: string;
  outputAmount?: string;
  outputToken?: string;
  totalAmount?: string;
  totalToken?: string;
  cycleAmount?: string;
  cycleToken?: string;
  frequency?: string;
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
}

const STORAGE_KEY = 'circlesave-starkzap-logs';
const LOGS_UPDATED_EVENT = 'starkzap-logs-updated';

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitLogsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOGS_UPDATED_EVENT));
  }
}

function inferLegacyDetails(entry: StarkZapLogEntry): StarkZapLogDetails | undefined {
  if (entry.details) {
    return entry.details;
  }

  const summary = entry.summary.trim();

  if (entry.kind === 'lending') {
    const depositMatch = summary.match(/^Deposit\s+([\d.]+)\s+([A-Z0-9]+)\s+into\b/i);
    if (depositMatch) {
      return {
        action: 'deposit',
        inputAmount: depositMatch[1],
        inputToken: depositMatch[2],
      };
    }

    const withdrawMatch = summary.match(/^Withdraw\s+([\d.]+)\s+([A-Z0-9]+)\s+from\b/i);
    if (withdrawMatch) {
      return {
        action: 'withdraw',
        inputAmount: withdrawMatch[1],
        inputToken: withdrawMatch[2],
      };
    }
  }

  if (entry.kind === 'swap') {
    const swapMatch = summary.match(/^([\d.]+)\s+([A-Z0-9]+)\s+->\s+([A-Z0-9]+)/i);
    if (swapMatch) {
      return {
        inputAmount: swapMatch[1],
        inputToken: swapMatch[2],
        outputToken: swapMatch[3],
      };
    }
  }

  if (entry.kind === 'dca') {
    const dcaMatch = summary.match(
      /^([\d.]+)\s+([A-Z0-9]+)\s+budget\s+•\s+([\d.]+)\s+([A-Z0-9]+)\s+every\s+([A-Z0-9]+)\s+into\s+([A-Z0-9]+)/i,
    );

    if (dcaMatch) {
      return {
        totalAmount: dcaMatch[1],
        totalToken: dcaMatch[2],
        cycleAmount: dcaMatch[3],
        cycleToken: dcaMatch[4],
        frequency: dcaMatch[5],
        outputToken: dcaMatch[6],
      };
    }
  }

  return undefined;
}

function normalizeLogEntry(entry: StarkZapLogEntry): StarkZapLogEntry {
  const details = inferLegacyDetails(entry);

  if (details === entry.details) {
    return entry;
  }

  return {
    ...entry,
    details,
  };
}

export function getStarkZapLogsEventName() {
  return LOGS_UPDATED_EVENT;
}

export function readStarkZapLogs(): StarkZapLogEntry[] {
  if (!hasBrowserStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StarkZapLogEntry[];
    return parsed
      .map(normalizeLogEntry)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

function writeStarkZapLogs(logs: StarkZapLogEntry[]) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  emitLogsUpdated();
}

export function appendStarkZapLog(input: {
  kind: StarkZapLogKind;
  title: string;
  summary: string;
  account: string;
  provider: string;
  txHash: string;
  explorerUrl?: string;
  details?: StarkZapLogDetails;
}): StarkZapLogEntry {
  const now = new Date().toISOString();
  const entry: StarkZapLogEntry = {
    id: `${input.kind}-${input.txHash}-${Date.now()}`,
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    account: input.account,
    provider: input.provider,
    status: 'submitted',
    txHash: input.txHash,
    explorerUrl: input.explorerUrl || getVoyagerTxUrl(input.txHash),
    createdAt: now,
    updatedAt: now,
    details: input.details,
  };

  writeStarkZapLogs([entry, ...readStarkZapLogs()]);
  return entry;
}

export function updateStarkZapLog(
  id: string,
  patch: Partial<Pick<StarkZapLogEntry, 'status' | 'error' | 'summary' | 'explorerUrl' | 'details'>>,
) {
  const nextLogs = readStarkZapLogs().map((entry) => {
    if (entry.id !== id) return entry;
    return {
      ...entry,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  });

  writeStarkZapLogs(nextLogs);
}

export function clearStarkZapLogs() {
  writeStarkZapLogs([]);
}

export function getStarkZapLogAmountText(entry: StarkZapLogEntry): string | null {
  const details = entry.details || inferLegacyDetails(entry);

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

  if (entry.kind === 'lending' && details.inputAmount && details.inputToken) {
    const action = details.action === 'withdraw' ? 'Withdraw' : 'Deposit';
    return `${action} ${details.inputAmount} ${details.inputToken}`;
  }

  return null;
}
