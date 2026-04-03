import { createSharedStarkZapLogEntry, type StarkZapLogEntry } from '@/lib/starkzapLogs';

const SUBMITTED_ACTIVITY_STORAGE_KEY = 'circlesave.starkzap.submitted-activity.v1';
const SUBMITTED_ACTIVITY_EVENT = 'circlesave:starkzap-submitted-activity';
const MAX_STORED_ENTRIES = 80;
const MAX_ENTRY_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function dispatchSubmittedActivityUpdate() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(SUBMITTED_ACTIVITY_EVENT));
}

function normalizeSubmittedEntries(entries: StarkZapLogEntry[]) {
  const cutoff = Date.now() - MAX_ENTRY_AGE_MS;

  return [...entries]
    .filter((entry) => entry.status === 'submitted' && Boolean(entry.account) && Boolean(entry.txHash))
    .filter((entry) => toTimestamp(entry.updatedAt) >= cutoff)
    .sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt))
    .slice(0, MAX_STORED_ENTRIES);
}

function parseStoredEntry(value: unknown): StarkZapLogEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const entry = value as Record<string, unknown>;

  if (
    typeof entry.id !== 'string' ||
    typeof entry.kind !== 'string' ||
    typeof entry.title !== 'string' ||
    typeof entry.summary !== 'string' ||
    typeof entry.account !== 'string' ||
    typeof entry.provider !== 'string' ||
    typeof entry.txHash !== 'string' ||
    typeof entry.createdAt !== 'string' ||
    typeof entry.updatedAt !== 'string'
  ) {
    return null;
  }

  return createSharedStarkZapLogEntry({
    id: entry.id,
    kind: entry.kind as StarkZapLogEntry['kind'],
    title: entry.title,
    summary: entry.summary,
    account: entry.account,
    provider: entry.provider,
    status: 'submitted',
    txHash: entry.txHash,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    details: entry.details as StarkZapLogEntry['details'],
    executionMode: entry.executionMode as StarkZapLogEntry['executionMode'],
    blockNumber: typeof entry.blockNumber === 'number' ? entry.blockNumber : null,
    explorerUrl: typeof entry.explorerUrl === 'string' ? entry.explorerUrl : undefined,
  });
}

function readStoredEntries() {
  if (!canUseStorage()) {
    return [] as StarkZapLogEntry[];
  }

  try {
    const raw = window.localStorage.getItem(SUBMITTED_ACTIVITY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeSubmittedEntries(
      parsed
        .map(parseStoredEntry)
        .filter((entry): entry is StarkZapLogEntry => Boolean(entry)),
    );
  } catch {
    return [];
  }
}

function writeStoredEntries(entries: StarkZapLogEntry[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    SUBMITTED_ACTIVITY_STORAGE_KEY,
    JSON.stringify(normalizeSubmittedEntries(entries)),
  );
  dispatchSubmittedActivityUpdate();
}

export function getSubmittedStarkZapActivityKey(entry: Pick<StarkZapLogEntry, 'kind' | 'txHash'>) {
  return `${entry.kind}:${entry.txHash.toLowerCase()}`;
}

export function getSubmittedStarkZapActivity() {
  return readStoredEntries();
}

export function saveSubmittedStarkZapActivity(entry: Omit<StarkZapLogEntry, 'explorerUrl' | 'status'> & {
  explorerUrl?: string;
}) {
  const normalizedEntry = createSharedStarkZapLogEntry({
    ...entry,
    status: 'submitted',
  });
  const entryKey = getSubmittedStarkZapActivityKey(normalizedEntry);
  const previousEntries = readStoredEntries();
  const nextEntries = [
    normalizedEntry,
    ...previousEntries.filter((item) => getSubmittedStarkZapActivityKey(item) !== entryKey),
  ];

  writeStoredEntries(nextEntries);
}

export function removeSubmittedStarkZapActivity(keys: string[]) {
  if (keys.length === 0) {
    return;
  }

  const blockedKeys = new Set(keys.map((key) => key.toLowerCase()));
  const previousEntries = readStoredEntries();
  const nextEntries = previousEntries.filter(
    (entry) => !blockedKeys.has(getSubmittedStarkZapActivityKey(entry)),
  );

  if (nextEntries.length === previousEntries.length) {
    return;
  }

  writeStoredEntries(nextEntries);
}

export function subscribeSubmittedStarkZapActivity(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleCustomEvent = () => listener();
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === SUBMITTED_ACTIVITY_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(SUBMITTED_ACTIVITY_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(SUBMITTED_ACTIVITY_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
