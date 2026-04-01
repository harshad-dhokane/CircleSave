// CircleSave - Reputation Hook (Real Contract Integration)
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { Contract, RpcProvider } from 'starknet';
import { CONTRACTS, BADGE_NAMES, BADGE_DESCRIPTIONS, LEVEL_NAMES, LEVEL_COLORS, feltToString } from '@/lib/constants';
import { CIRCLE_ABI, CIRCLE_FACTORY_ABI, REPUTATION_ABI } from '@/lib/abis';

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

function toHexAddress(value: any): string {
  if (typeof value === 'string') {
    return value.startsWith('0x') ? value : `0x${BigInt(value).toString(16)}`;
  }
  return `0x${toBigIntValue(value).toString(16)}`;
}

function getLeaderboardLevel(score: number) {
  if (score >= 650) return 'DIAMOND';
  if (score >= 450) return 'PLATINUM';
  if (score >= 280) return 'GOLD';
  if (score >= 140) return 'SILVER';
  if (score >= 40) return 'BRONZE';
  return 'NEWCOMER';
}

async function fetchCircleSummaries() {
  const factory = newContract(CIRCLE_FACTORY_ABI, CONTRACTS.CIRCLE_FACTORY);
  const count = Number(await factory.get_circle_count());

  if (count === 0) {
    return [];
  }

  const circles: Array<{ monthlyAmount: bigint; creator: string; contractAddress: string }> = [];
  const batchSize = 10;

  for (let offset = 0; offset < count; offset += batchSize) {
    const limit = Math.min(batchSize, count - offset);
    const page = await factory.get_circles(offset, limit);

    for (const info of page) {
      circles.push({
        monthlyAmount: toBigIntValue(info.monthly_amount),
        creator: toHexAddress(info.creator).toLowerCase(),
        contractAddress: toHexAddress(info.contract_address),
      });
    }
  }

  return circles;
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
    let cancelled = false;

    async function fetchLeaderboard() {
      if (CONTRACTS.CIRCLE_FACTORY === '0x0') {
        setLeaders([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const circles = await fetchCircleSummaries();
        const stats = new Map<string, {
          circlesJoined: number;
          circlesCreated: number;
          paymentsMade: number;
          paymentsLate: number;
          totalVolume: bigint;
          collateralLocked: bigint;
        }>();

        const getWalletStats = (walletAddress: string) => {
          const normalized = walletAddress.toLowerCase();
          const current = stats.get(normalized);
          if (current) return current;

          const next = {
            circlesJoined: 0,
            circlesCreated: 0,
            paymentsMade: 0,
            paymentsLate: 0,
            totalVolume: 0n,
            collateralLocked: 0n,
          };
          stats.set(normalized, next);
          return next;
        };

        for (const circle of circles) {
          getWalletStats(circle.creator).circlesCreated += 1;

          const circleContract = newContract(CIRCLE_ABI, circle.contractAddress);
          const memberList = await circleContract.get_members();

          for (const member of memberList) {
            const memberAddress = toHexAddress(member.address);
            const memberStats = getWalletStats(memberAddress);
            const paymentsMade = Number(member.payments_made);
            const paymentsLate = Number(member.payments_late);
            const collateralLocked = toBigIntValue(member.collateral_locked);

            memberStats.circlesJoined += 1;
            memberStats.paymentsMade += paymentsMade;
            memberStats.paymentsLate += paymentsLate;
            memberStats.totalVolume += circle.monthlyAmount * BigInt(paymentsMade);
            memberStats.collateralLocked += collateralLocked;
          }
        }

        const nextLeaders = [...stats.entries()]
          .map(([walletAddress, walletStats]) => {
            const onTimePayments = Math.max(walletStats.paymentsMade - walletStats.paymentsLate, 0);
            const totalVolumeScore = Number(walletStats.totalVolume / 10n ** 19n);
            const collateralScore = Number(walletStats.collateralLocked / 10n ** 20n);
            const reputationScore = Math.max(
              walletStats.circlesJoined * 20 +
              walletStats.circlesCreated * 28 +
              onTimePayments * 12 -
              walletStats.paymentsLate * 10 +
              totalVolumeScore +
              collateralScore,
              0,
            );

            return {
              address: walletAddress,
              reputationScore,
              circlesJoined: walletStats.circlesJoined,
              paymentsMade: walletStats.paymentsMade,
              level: getLeaderboardLevel(reputationScore),
            };
          })
          .filter((entry) => entry.circlesJoined > 0 || entry.paymentsMade > 0)
          .sort((left, right) => {
            if (left.reputationScore === right.reputationScore) {
              return right.paymentsMade - left.paymentsMade;
            }
            return right.reputationScore - left.reputationScore;
          })
          .slice(0, 12);

        if (!cancelled) {
          setLeaders(nextLeaders);
        }
      } catch (error) {
        console.error('Error building leaderboard:', error);
        if (!cancelled) {
          setLeaders([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchLeaderboard();

    return () => {
      cancelled = true;
    };
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
