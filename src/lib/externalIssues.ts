export type ExternalIssueNotice = {
  code: 'liquidity' | 'rpc_unavailable' | 'fee_data';
  title: string;
  description: string;
};

function toJoinedText(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof Error) {
    return `${input.message} ${input.stack || ''}`.trim();
  }

  if (Array.isArray(input)) {
    return input.map((item) => toJoinedText(item)).join(' ');
  }

  if (input && typeof input === 'object') {
    return Object.values(input as Record<string, unknown>)
      .map((value) => toJoinedText(value))
      .join(' ');
  }

  return String(input ?? '');
}

export function getExternalIssueNotice(input: unknown): ExternalIssueNotice | null {
  const text = toJoinedText(input).toLowerCase();

  if (
    text.includes('insufficient liquidity in the routes') ||
    (text.includes('prod-api-quoter.ekubo.org') && text.includes('status of 404')) ||
    (text.includes('failed to fetch price for') && text.includes('0x'))
  ) {
    return {
      code: 'liquidity',
      title: 'No route on this venue right now',
      description: 'This Sepolia token pair does not have enough live liquidity on the selected provider. Try Best Route, AVNU, or a simpler pair like STRK to ETH.',
    };
  }

  if (
    text.includes('upstream service unavailable') ||
    text.includes('api.cartridge.gg/x/starknet/sepolia') ||
    text.includes('status of 502')
  ) {
    return {
      code: 'rpc_unavailable',
      title: 'Wallet balances may look stale',
      description: 'The Sepolia RPC behind the current wallet session is temporarily unavailable. Refresh in a moment or retry after the provider recovers.',
    };
  }

  if (
    text.includes('insufficient transaction data') &&
    text.includes('mintxsnecessary')
  ) {
    return {
      code: 'fee_data',
      title: 'Sepolia fee estimation is noisy',
      description: 'Recent testnet blocks do not have enough matching transactions for rich tip estimation. Retrying shortly usually works.',
    };
  }

  return null;
}

export function getFriendlyExternalMessage(input: unknown, fallback: string) {
  return getExternalIssueNotice(input)?.description || fallback;
}
