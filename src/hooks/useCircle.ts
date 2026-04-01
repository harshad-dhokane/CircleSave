// CircleSave - Circle Hook (Real Contract Integration)
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { CairoCustomEnum, Contract, RpcProvider, cairo, CallData } from 'starknet';
import { CONTRACTS, getVoyagerTxUrl } from '@/lib/constants';
import { CIRCLE_FACTORY_ABI, CIRCLE_ABI, ERC20_ABI } from '@/lib/abis';
import type { Circle, CircleMember } from '@/types';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const rpc = new RpcProvider({ nodeUrl: RPC_URL });

function newContract(abi: any, address: string, providerOrAccount?: any) {
  return new Contract({ abi, address, providerOrAccount: providerOrAccount || rpc });
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

function toCairoEnum(index: number, variants: string[]) {
  return new CairoCustomEnum(
    Object.fromEntries(variants.map((variant, variantIndex) => [
      variant,
      variantIndex === index ? {} : undefined,
    ])),
  );
}

async function fetchAllCirclesFromFactory(): Promise<Circle[]> {
  const contract = newContract(CIRCLE_FACTORY_ABI, CONTRACTS.CIRCLE_FACTORY);
  const count = await contract.get_circle_count();
  const circleCount = Number(count);

  if (circleCount === 0) {
    return [];
  }

  const batchSize = 10;
  const allCircles: Circle[] = [];

  for (let offset = 0; offset < circleCount; offset += batchSize) {
    const limit = Math.min(batchSize, circleCount - offset);
    const result = await contract.get_circles(offset, limit);
    for (const info of result) {
      allCircles.push(parseCircleInfo(info));
    }
  }

  return allCircles;
}

// ============================================================
// Hook: useCircles - Fetch all circles from CircleFactory
// ============================================================
export function useCircles() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    if (CONTRACTS.CIRCLE_FACTORY === '0x0') {
      setCircles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCircles(await fetchAllCirclesFromFactory());
    } catch (err: any) {
      console.error('Error fetching circles:', err);
      setError(err.message || 'Failed to fetch circles');
      setCircles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCircles(); }, [fetchCircles]);

  return { 
    circles, isLoading, error, refetch: fetchCircles,
    activeCircles: circles.filter(c => c.status === 'ACTIVE'),
    pendingCircles: circles.filter(c => c.status === 'PENDING'),
  };
}

// ============================================================
// Hook: useCircleDetail - Fetch a single circle's full details
// ============================================================
export function useCircleDetail(circleId: string) {
  const { address } = useAccount();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (CONTRACTS.CIRCLE_FACTORY === '0x0' || !circleId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const factory = newContract(CIRCLE_FACTORY_ABI, CONTRACTS.CIRCLE_FACTORY);
      const circleInfo = await factory.get_circle_by_id(cairo.uint256(circleId));
      const circleAddr = toHexAddress(circleInfo.contract_address);
      
      const circleContract = newContract(CIRCLE_ABI, circleAddr);
      const info = await circleContract.get_info();
      setCircle(parseCircleInfo(info));

      const memberList = await circleContract.get_members();
      const parsedMembers: CircleMember[] = memberList.map((m: any) => ({
        address: toHexAddress(m.address),
        joinedAt: Number(m.joined_at),
        collateralLocked: toBigIntValue(m.collateral_locked),
        paymentsMade: Number(m.payments_made),
        paymentsLate: Number(m.payments_late),
        hasReceivedPot: m.has_received_pot,
        isActive: m.is_active,
      }));
      setMembers(parsedMembers);

      if (address) {
        const isMem = await circleContract.is_member(address);
        setIsMember(isMem);
        const isCreate = await circleContract.is_creator(address);
        setIsCreator(isCreate);
      }
    } catch (err: any) {
      console.error('Error fetching circle detail:', err);
      setError(err.message || 'Failed to fetch circle details');
    } finally {
      setIsLoading(false);
    }
  }, [circleId, address]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { circle, members, isLoading, error, isMember, isCreator, refetch: fetchDetail };
}

// ============================================================
// Hook: useCreateCircle
// ============================================================
export function useCreateCircle() {
  const { account } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createCircle = useCallback(async (params: {
    name: string; description: string; monthlyAmount: string;
    maxMembers: number; circleType: number; category: number; collateralRatio: number;
  }) => {
    if (!account) { setError('Please connect your wallet'); return null; }
    if (CONTRACTS.CIRCLE_FACTORY === '0x0') { setError('Contracts not deployed yet'); return null; }

    try {
      setIsSubmitting(true);
      setError(null);
      setTxHash(null);

      const contract = newContract(CIRCLE_FACTORY_ABI, CONTRACTS.CIRCLE_FACTORY, account);
      const nameAsFelt = CallData.compile([params.name])[0];
      const descAsFelt = CallData.compile([params.description])[0];
      const monthlyAmountWei = BigInt(Math.floor(parseFloat(params.monthlyAmount) * 1e18));
      
      const result = await contract.create_circle(
        nameAsFelt, descAsFelt,
        cairo.uint256(monthlyAmountWei),
        params.maxMembers,
        toCairoEnum(params.circleType, ['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY']),
        toCairoEnum(params.category, ['FRIENDS', 'FAMILY', 'COWORKERS', 'NEIGHBORS', 'INTEREST']),
        params.collateralRatio
      );

      setTxHash(result.transaction_hash);
      await rpc.waitForTransaction(result.transaction_hash);
      
      return {
        txHash: result.transaction_hash,
        voyagerUrl: getVoyagerTxUrl(result.transaction_hash),
      };
    } catch (err: any) {
      console.error('Error creating circle:', err);
      setError(err.message || 'Failed to create circle');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [account]);

  return { createCircle, isSubmitting, txHash, error, voyagerUrl: txHash ? getVoyagerTxUrl(txHash) : null };
}

// ============================================================
// Hook: useJoinCircle
// ============================================================
export function useJoinCircle() {
  const { account } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinCircle = useCallback(async (circleAddress: string) => {
    if (!account) { setError('Please connect your wallet'); return null; }

    try {
      setIsSubmitting(true);
      setError(null);

      const circleContract = newContract(CIRCLE_ABI, circleAddress, account);
      const collateralRequired = toBigIntValue(await circleContract.get_collateral_required());
      
      const strk = newContract(ERC20_ABI, CONTRACTS.STRK_TOKEN, account);
      const approveResult = await strk.approve(circleAddress, cairo.uint256(collateralRequired));
      await rpc.waitForTransaction(approveResult.transaction_hash);
      
      const joinResult = await circleContract.join();
      setTxHash(joinResult.transaction_hash);
      await rpc.waitForTransaction(joinResult.transaction_hash);
      
      return {
        txHash: joinResult.transaction_hash,
        voyagerUrl: getVoyagerTxUrl(joinResult.transaction_hash),
      };
    } catch (err: any) {
      console.error('Error joining circle:', err);
      setError(err.message || 'Failed to join circle');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [account]);

  return { joinCircle, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useContribute
// ============================================================
export function useContribute() {
  const { account } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contribute = useCallback(async (circleAddress: string, amount: bigint) => {
    if (!account) { setError('Please connect your wallet'); return null; }

    try {
      setIsSubmitting(true);
      setError(null);

      const strk = newContract(ERC20_ABI, CONTRACTS.STRK_TOKEN, account);
      const approveResult = await strk.approve(circleAddress, cairo.uint256(amount));
      await rpc.waitForTransaction(approveResult.transaction_hash);
      
      const circleContract = newContract(CIRCLE_ABI, circleAddress, account);
      const result = await circleContract.contribute();
      setTxHash(result.transaction_hash);
      await rpc.waitForTransaction(result.transaction_hash);
      
      return {
        txHash: result.transaction_hash,
        voyagerUrl: getVoyagerTxUrl(result.transaction_hash),
      };
    } catch (err: any) {
      console.error('Error contributing:', err);
      setError(err.message || 'Failed to contribute');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [account]);

  return { contribute, isSubmitting, txHash, error };
}

// ============================================================
// Hook: useStartCircle
// ============================================================
export function useStartCircle() {
  const { account } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCircle = useCallback(async (circleAddress: string) => {
    if (!account) { setError('Please connect your wallet'); return null; }

    try {
      setIsSubmitting(true);
      setError(null);

      const circleContract = newContract(CIRCLE_ABI, circleAddress, account);
      const result = await circleContract.start_circle();
      await rpc.waitForTransaction(result.transaction_hash);
      
      return {
        txHash: result.transaction_hash,
        voyagerUrl: getVoyagerTxUrl(result.transaction_hash),
      };
    } catch (err: any) {
      console.error('Error starting circle:', err);
      setError(err.message || 'Failed to start circle');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [account]);

  return { startCircle, isSubmitting, error };
}

// ============================================================
// Hook: useUserCircles
// ============================================================
export function useUserCircles() {
  const { address } = useAccount();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      if (!address || CONTRACTS.CIRCLE_FACTORY === '0x0') {
        setCircles([]);
        setIsLoading(false);
        setError(null);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);

        const normalizedAddress = address.toLowerCase();
        const allCircles = await fetchAllCirclesFromFactory();

        const membershipChecks = await Promise.all(
          allCircles.map(async (circle) => {
            if (circle.creator.toLowerCase() === normalizedAddress) {
              return true;
            }

            try {
              const circleContract = newContract(CIRCLE_ABI, circle.contractAddress);
              return await circleContract.is_member(address);
            } catch (membershipError) {
              console.error(`Error checking membership for circle ${circle.id}:`, membershipError);
              return false;
            }
          }),
        );

        setCircles(allCircles.filter((_, index) => membershipChecks[index]));
      } catch (err: any) {
        console.error('Error fetching user circles:', err);
        setCircles([]);
        setError(err.message || 'Failed to fetch wallet circles');
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [address]);

  return { circles, isLoading, error };
}

// ============================================================
// Helper: Parse on-chain CircleInfo struct into frontend Circle type
// ============================================================
function parseCircleInfo(info: any): Circle {
  const statusMap: Record<number, string> = { 0: 'PENDING', 1: 'ACTIVE', 2: 'COMPLETED', 3: 'FAILED' };
  
  const getEnumIndex = (val: any, keys: string[]): number => {
    if (typeof val === 'number' || typeof val === 'bigint') return Number(val);
    if (typeof val?.activeVariant === 'function') {
      const key = val.activeVariant();
      const idx = keys.indexOf(key);
      return idx >= 0 ? idx : 0;
    }
    if (val?.variant && typeof val.variant === 'object') {
      const activeEntry = Object.entries(val.variant).find(([, content]) => content !== undefined);
      const key = activeEntry?.[0];
      const idx = key ? keys.indexOf(key) : -1;
      return idx >= 0 ? idx : 0;
    }
    if (val && typeof val === 'object') {
      const activeEntry = Object.entries(val).find(([, content]) => content !== undefined);
      const key = activeEntry?.[0];
      const idx = key ? keys.indexOf(key) : -1;
      return idx >= 0 ? idx : 0;
    }
    return 0;
  };

  const statusIdx = getEnumIndex(info.status, ['PENDING', 'ACTIVE', 'COMPLETED', 'FAILED']);
  const categoryIdx = getEnumIndex(info.category, ['FRIENDS', 'FAMILY', 'COWORKERS', 'NEIGHBORS', 'INTEREST']);
  const typeIdx = getEnumIndex(info.circle_type, ['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY']);

  return {
    id: toBigIntValue(info.id).toString(),
    name: feltToString(info.name),
    description: feltToString(info.description),
    creator: toHexAddress(info.creator),
    monthlyAmount: toBigIntValue(info.monthly_amount),
    maxMembers: Number(info.max_members),
    currentMembers: Number(info.current_members),
    collateralRatio: Number(info.collateral_ratio),
    status: statusMap[statusIdx] || 'PENDING',
    category: categoryIdx,
    circleType: typeIdx,
    createdAt: Number(info.created_at),
    currentMonth: Number(info.current_month),
    contractAddress: toHexAddress(info.contract_address),
  };
}

function feltToString(felt: any): string {
  try {
    const hex = BigInt(felt).toString(16);
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const charCode = parseInt(hex.slice(i, i + 2), 16);
      if (charCode > 0 && charCode < 128) result += String.fromCharCode(charCode);
    }
    return result || `Circle #${felt}`;
  } catch {
    return String(felt);
  }
}
