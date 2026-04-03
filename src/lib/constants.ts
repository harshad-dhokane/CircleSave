// CircleSave - Contract Addresses and Constants
// Update these addresses after running contracts/deploy.sh

// ============================================================
// CONTRACT ADDRESSES (Starknet Sepolia)
// Replace with your deployed addresses from deploy.sh output
// ============================================================
export const CONTRACTS = {
  CIRCLE_FACTORY: import.meta.env.VITE_CIRCLE_FACTORY || '0x0',
  REPUTATION: import.meta.env.VITE_REPUTATION || '0x0',
  COLLATERAL_MANAGER: import.meta.env.VITE_COLLATERAL_MANAGER || '0x0',
  STARKZAP_ACTIVITY_REGISTRY: import.meta.env.VITE_STARKZAP_ACTIVITY_REGISTRY || '0x0',
  STRK_TOKEN: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  ETH_TOKEN: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  USDC_TOKEN: '0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343',
} as const;

// Voyager explorer base URL
export const VOYAGER_BASE_URL = 'https://sepolia.voyager.online';
export const getVoyagerTxUrl = (txHash: string) => `${VOYAGER_BASE_URL}/tx/${txHash}`;
export const getVoyagerContractUrl = (address: string) => `${VOYAGER_BASE_URL}/contract/${address}`;

// ============================================================
// CIRCLE ENUMS (match Cairo contract)
// ============================================================
export const CircleType = {
  OPEN: 0,
  APPROVAL_REQUIRED: 1,
  INVITE_ONLY: 2,
} as const;

export const CircleCategory = {
  FRIENDS: 0,
  FAMILY: 1,
  COWORKERS: 2,
  NEIGHBORS: 3,
  INTEREST: 4,
} as const;

export const CircleStatus = {
  PENDING: 0,
  ACTIVE: 1,
  COMPLETED: 2,
  FAILED: 3,
} as const;

export const PaymentStatus = {
  PENDING: 0,
  PAID: 1,
  LATE: 2,
  MISSED: 3,
} as const;

// ============================================================
// FORMATTING HELPERS
// ============================================================
export function formatAmount(amount: bigint): string {
  const decimals = 18n;
  const divisor = 10n ** decimals;
  const whole = amount / divisor;
  const fraction = (amount % divisor).toString().padStart(Number(decimals), '0').slice(0, 2);
  return `${whole}.${fraction} STRK`;
}

export function formatAmountShort(amount: bigint): string {
  const decimals = 18n;
  const divisor = 10n ** decimals;
  const whole = Number(amount / divisor);
  if (whole >= 1000000) return `${(whole / 1000000).toFixed(1)}M STRK`;
  if (whole >= 1000) return `${(whole / 1000).toFixed(1)}K STRK`;
  return `${whole} STRK`;
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function parseStrkAmount(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(18, '0').slice(0, 18);
  return BigInt(whole) * 10n ** 18n + BigInt(paddedFraction);
}

// ============================================================
// UI HELPERS
// ============================================================
export function getCategoryColor(category: number): string {
  const colors: Record<number, string> = {
    [CircleCategory.FRIENDS]: '#FF6B6B',
    [CircleCategory.FAMILY]: '#4ECDC4',
    [CircleCategory.COWORKERS]: '#FFE66D',
    [CircleCategory.NEIGHBORS]: '#A8E6CF',
    [CircleCategory.INTEREST]: '#DDA0DD',
  };
  return colors[category] || '#FF6B6B';
}

export function getCategoryLabel(category: number): string {
  const labels: Record<number, string> = {
    [CircleCategory.FRIENDS]: 'Friends',
    [CircleCategory.FAMILY]: 'Family',
    [CircleCategory.COWORKERS]: 'Co-Workers',
    [CircleCategory.NEIGHBORS]: 'Neighbors',
    [CircleCategory.INTEREST]: 'Interest',
  };
  return labels[category] || 'General';
}

export function getStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    [CircleStatus.PENDING]: 'PENDING',
    [CircleStatus.ACTIVE]: 'ACTIVE',
    [CircleStatus.COMPLETED]: 'COMPLETED',
    [CircleStatus.FAILED]: 'FAILED',
  };
  return labels[status] || 'UNKNOWN';
}

export function getCircleTypeLabel(circleType: number): string {
  const labels: Record<number, string> = {
    [CircleType.OPEN]: 'Open',
    [CircleType.APPROVAL_REQUIRED]: 'Approval Required',
    [CircleType.INVITE_ONLY]: 'Invite Only',
  };
  return labels[circleType] || 'Open';
}

// ============================================================
// BADGE CONSTANTS
// ============================================================
export const BADGE_NAMES: Record<string, string> = {
  'FIRST_CIRCLE': 'First Circle',
  'PERFECT_PAYER': 'Perfect Payer',
  'COMMUNITY_BUILDER': 'Community Builder',
  'EARLY_ADOPTER': 'Early Adopter',
  'TRUSTED_MEMBER': 'Trusted Member',
  'CIRCLE_CHAMPION': 'Circle Champion',
  'SOCIAL_CONNECTOR': 'Social Connector',
  'COLLATERAL_KING': 'Collateral King',
};

export const BADGE_DESCRIPTIONS: Record<string, string> = {
  'FIRST_CIRCLE': 'Joined your first savings circle',
  'PERFECT_PAYER': '10+ on-time payments with no late ones',
  'COMMUNITY_BUILDER': 'Created 3+ circles',
  'EARLY_ADOPTER': 'Joined within the first month',
  'TRUSTED_MEMBER': '10+ circles with 90%+ completion',
  'CIRCLE_CHAMPION': 'Completed 10+ circles',
  'SOCIAL_CONNECTOR': 'Connected many people',
  'COLLATERAL_KING': 'Locked 1000+ STRK as collateral',
};

export const LEVEL_NAMES: Record<string, string> = {
  'NEWCOMER': 'Newcomer',
  'BRONZE': 'Bronze',
  'SILVER': 'Silver',
  'GOLD': 'Gold',
  'PLATINUM': 'Platinum',
  'DIAMOND': 'Diamond',
};

export const LEVEL_COLORS: Record<string, string> = {
  'NEWCOMER': '#9CA3AF',
  'BRONZE': '#CD7F32',
  'SILVER': '#C0C0C0',
  'GOLD': '#FFD700',
  'PLATINUM': '#E5E4E2',
  'DIAMOND': '#B9F2FF',
};

export function feltToString(felt: string | bigint): string {
  if (typeof felt === 'bigint') felt = felt.toString(16);
  if (felt.startsWith('0x')) felt = felt.slice(2);
  let result = '';
  for (let i = 0; i < felt.length; i += 2) {
    const charCode = parseInt(felt.slice(i, i + 2), 16);
    if (charCode > 0) result += String.fromCharCode(charCode);
  }
  return result;
}
