// CircleSave - TypeScript Type Definitions (matching on-chain contract data)

export interface Circle {
  id: string;
  name: string;
  description: string;
  monthlyAmount: bigint;
  maxMembers: number;
  currentMembers: number;
  circleType: number;
  category: number;
  collateralRatio: number;
  status: string; // 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED'
  creator: string;
  createdAt: number;
  currentMonth: number;
  contractAddress: string;
}

export interface CircleMember {
  address: string;
  joinedAt: number;
  collateralLocked: bigint;
  paymentsMade: number;
  paymentsLate: number;
  hasReceivedPot: boolean;
  isActive: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface Activity {
  id: string;
  type: string;
  circleName?: string;
  userAddress: string;
  amount?: bigint;
  timestamp: number;
  txHash?: string;
}

export interface CreateCircleInput {
  name: string;
  description: string;
  monthlyAmount: string;
  maxMembers: number;
  circleType: number;
  category: number;
  collateralRatio: number;
}
