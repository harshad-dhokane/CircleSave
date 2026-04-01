// CircleSave - Reputation Hook (Real Contract Integration)
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { Contract, RpcProvider } from 'starknet';
import { CONTRACTS, BADGE_NAMES, BADGE_DESCRIPTIONS, LEVEL_NAMES, LEVEL_COLORS, feltToString } from '@/lib/constants';
import { REPUTATION_ABI } from '@/lib/abis';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const rpc = new RpcProvider({ nodeUrl: RPC_URL });

function newContract(abi: any, address: string) {
  return new Contract({ abi, address, providerOrAccount: rpc });
}

function toBigIntValue(value: any): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
    const low = BigInt(value.low);
    const high = BigInt(value.high);
    return low + (high << 128n);
  }
  return BigInt(0);
}

export interface UserReputationStats {
  circlesJoined: number;
  circlesCreated: number;
  paymentsMade: number;
  paymentsLate: number;
  totalVolume: bigint;
  currentCollateral: bigint;
  reputationScore: number;
  onTimePaymentRate: number;
  completionRate: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface LeaderboardEntry {
  address: string;
  reputationScore: number;
  circlesJoined: number;
  paymentsMade: number;
  level: string;
}

// ============================================================
// Hook: useReputation
// ============================================================
export function useReputation() {
  const { address } = useAccount();
  const [stats, setStats] = useState<UserReputationStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [level, setLevel] = useState<string>('NEWCOMER');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    if (!address || CONTRACTS.REPUTATION === '0x0') {
      setStats(null);
      setBadges([]);
      setLevel('NEWCOMER');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const contract = newContract(REPUTATION_ABI, CONTRACTS.REPUTATION);

      const rawStats = await contract.get_stats(address);
      const circlesJoined = Number(rawStats.circles_joined);
      const paymentsMade = Number(rawStats.payments_made);
      const paymentsLate = Number(rawStats.payments_late);
      
      const parsedStats: UserReputationStats = {
        circlesJoined,
        circlesCreated: Number(rawStats.circles_created),
        paymentsMade,
        paymentsLate,
        totalVolume: toBigIntValue(rawStats.total_volume),
        currentCollateral: toBigIntValue(rawStats.current_collateral),
        reputationScore: Number(rawStats.reputation_score),
        onTimePaymentRate: paymentsMade > 0 
          ? Math.round(((paymentsMade - paymentsLate) / paymentsMade) * 100) 
          : 100,
        completionRate: circlesJoined > 0 
          ? Math.round((Number(toBigIntValue(rawStats.total_volume)) / circlesJoined) * 100) 
          : 0,
      };
      setStats(parsedStats);

      const rawBadges = await contract.get_badges(address);
      const allBadgeIds = Object.keys(BADGE_NAMES);
      const earnedBadgeIds = rawBadges.map((b: any) => feltToString(b));
      
      const parsedBadges: Badge[] = allBadgeIds.map(id => ({
        id,
        name: BADGE_NAMES[id] || id,
        description: BADGE_DESCRIPTIONS[id] || '',
        earned: earnedBadgeIds.includes(id),
      }));
      setBadges(parsedBadges);

      const rawLevel = await contract.calculate_level(address);
      const levelStr = feltToString(rawLevel);
      setLevel(levelStr);
    } catch (err: any) {
      console.error('Error fetching reputation:', err);
      setError(err.message || 'Failed to fetch reputation');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => { fetchReputation(); }, [fetchReputation]);

  return { 
    stats, badges, level, 
    levelName: LEVEL_NAMES[level] || 'Newcomer',
    levelColor: LEVEL_COLORS[level] || '#9CA3AF',
    isLoading, error, refetch: fetchReputation 
  };
}

// ============================================================
// Hook: useLeaderboard
// ============================================================
export function useLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Leaderboard requires an off-chain indexer (e.g. Apibara).
    // Returns empty for now - the UI shows a "Coming Soon" placeholder.
    setLeaders([]);
    setIsLoading(false);
  }, []);

  return { leaders, isLoading };
}

// ============================================================
// Hook: useUserReputation
// ============================================================
export function useUserReputation(userAddress: string | null) {
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<string>('NEWCOMER');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!userAddress || CONTRACTS.REPUTATION === '0x0') {
        setIsLoading(false);
        return;
      }
      try {
        const contract = newContract(REPUTATION_ABI, CONTRACTS.REPUTATION);
        const rawScore = await contract.get_reputation_score(userAddress);
        setScore(Number(rawScore));
        const rawLevel = await contract.calculate_level(userAddress);
        setLevel(feltToString(rawLevel));
      } catch (err) {
        console.error('Error fetching user reputation:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [userAddress]);

  return { score, level, levelName: LEVEL_NAMES[level] || 'Newcomer', isLoading };
}
