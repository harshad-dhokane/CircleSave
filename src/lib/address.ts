export function normalizeAddress(address: string | null | undefined) {
  if (!address) {
    return '';
  }

  const trimmed = address.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const normalized = trimmed.startsWith('0x')
      ? BigInt(trimmed)
      : BigInt(trimmed);

    return `0x${normalized.toString(16)}`.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

export function addressesEqual(left: string | null | undefined, right: string | null | undefined) {
  if (!left || !right) {
    return false;
  }

  return normalizeAddress(left) === normalizeAddress(right);
}
