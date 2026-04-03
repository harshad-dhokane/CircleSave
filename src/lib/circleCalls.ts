import { CairoCustomEnum, CallData, Contract, RpcProvider, cairo } from 'starknet';
import { CIRCLE_ABI, CIRCLE_FACTORY_ABI, ERC20_ABI } from '@/lib/abis';
import { CONTRACTS } from '@/lib/constants';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const populateProvider = new RpcProvider({ nodeUrl: RPC_URL });

function populateContractCall(abi: unknown, address: string, method: string, args: unknown[] = []) {
  const contract = new Contract({
    abi: abi as never,
    address,
    providerOrAccount: populateProvider as never,
  });

  return contract.populate(method, args as never);
}

function toCairoEnum(index: number, variants: string[]) {
  return new CairoCustomEnum(
    Object.fromEntries(
      variants.map((variant, variantIndex) => [
        variant,
        variantIndex === index ? {} : undefined,
      ]),
    ),
  );
}

export function buildApproveCall(tokenAddress: string, spender: string, amount: bigint) {
  return populateContractCall(ERC20_ABI, tokenAddress, 'approve', [
    spender,
    cairo.uint256(amount),
  ]);
}

export function buildJoinCircleCall(circleAddress: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'join');
}

export function buildRequestJoinCircleCall(circleAddress: string, message: string) {
  const messageAsFelt = CallData.compile([message])[0];

  return populateContractCall(CIRCLE_ABI, circleAddress, 'request_join', [messageAsFelt]);
}

export function buildApproveMemberCall(circleAddress: string, applicant: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'approve_member', [applicant]);
}

export function buildRejectMemberCall(circleAddress: string, applicant: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'reject_member', [applicant]);
}

export function buildContributeCall(circleAddress: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'contribute');
}

export function buildDistributePotCall(circleAddress: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'distribute_pot');
}

export function buildStartCircleCall(circleAddress: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'start_circle');
}

export function buildCompleteCircleCall(circleAddress: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'complete_circle');
}

export function buildEmergencyWithdrawCall(circleAddress: string) {
  return populateContractCall(CIRCLE_ABI, circleAddress, 'emergency_withdraw');
}

export function buildCreateCircleCall(params: {
  name: string;
  description: string;
  monthlyAmount: string;
  maxMembers: number;
  circleType: number;
  category: number;
  collateralRatio: number;
}) {
  const nameAsFelt = CallData.compile([params.name])[0];
  const descriptionAsFelt = CallData.compile([params.description])[0];
  const monthlyAmountWei = BigInt(Math.floor(Number.parseFloat(params.monthlyAmount) * 1e18));

  return populateContractCall(CIRCLE_FACTORY_ABI, CONTRACTS.CIRCLE_FACTORY, 'create_circle', [
    nameAsFelt,
    descriptionAsFelt,
    cairo.uint256(monthlyAmountWei),
    params.maxMembers,
    toCairoEnum(params.circleType, ['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY']),
    toCairoEnum(params.category, ['FRIENDS', 'FAMILY', 'COWORKERS', 'NEIGHBORS', 'INTEREST']),
    params.collateralRatio,
  ]);
}
