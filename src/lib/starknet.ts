// CircleSave - Starknet Configuration
import type { Chain } from '@starknet-react/chains';
import { avnuPaymasterProvider, jsonRpcProvider } from '@starknet-react/core';
import { ControllerConnector } from '@cartridge/connector';
import { constants } from 'starknet';

const RPC_URL = import.meta.env.VITE_STARKNET_RPC_URL || 'https://starknet-sepolia-rpc.publicnode.com';
const CARTRIDGE_RPC_URL = import.meta.env.VITE_CARTRIDGE_RPC_URL || 'https://api.cartridge.gg/x/starknet/sepolia';
const AVNU_PAYMASTER_API_KEY = import.meta.env.VITE_AVNU_PAYMASTER_API_KEY?.trim();
const appChain: Chain = {
  id: BigInt('0x534e5f5345504f4c4941'),
  network: 'sepolia',
  name: 'Starknet Sepolia Testnet',
  nativeCurrency: {
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  testnet: true,
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
    cartridge: { http: [CARTRIDGE_RPC_URL] },
  },
  paymasterRpcUrls: {
    avnu: { http: ['https://sepolia.paymaster.avnu.fi/'] },
  },
  explorers: {
    cartridge: ['https://starknet-sepolia.explorer.cartridge.gg'],
    starkscan: ['https://sepolia.starkscan.co'],
    voyager: ['https://sepolia.voyager.online'],
  },
};

const cartridgeConnector = new ControllerConnector({
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
  rpcUrl: CARTRIDGE_RPC_URL,
  chains: [{ rpcUrl: CARTRIDGE_RPC_URL }],
  policies: [],
  lazyload: true,
});

export const connectors = [cartridgeConnector];

export const chains = [appChain];
export const provider = jsonRpcProvider({
  rpc: () => ({ nodeUrl: RPC_URL }),
});
export const paymasterProvider = AVNU_PAYMASTER_API_KEY
  ? avnuPaymasterProvider({
    apiKey: AVNU_PAYMASTER_API_KEY,
  })
  : undefined;

export const starknetConfig = {
  chains,
  provider,
  paymasterProvider,
  connectors,
};
