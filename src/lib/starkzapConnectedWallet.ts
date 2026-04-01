import type {
  AccountInterface,
  Call,
  EstimateFeeResponseOverhead,
  ProviderInterface,
  Signature,
  TypedData,
} from 'starknet';
import { type PaymasterDetails } from 'starknet';
import { BaseWallet } from '../../node_modules/starkzap/dist/src/wallet/base.js';
import { Tx } from '../../node_modules/starkzap/dist/src/tx/index.js';
import {
  type ChainId,
  type FeeMode,
  type PreflightOptions,
  type PreflightResult,
  type ExecuteOptions,
  fromAddress,
} from '../../node_modules/starkzap/dist/src/types/index.js';
import { AvnuDcaProvider } from '../../node_modules/starkzap/dist/src/dca/avnu.js';
import { EkuboDcaProvider } from '../../node_modules/starkzap/dist/src/dca/ekubo.js';
import { AvnuSwapProvider } from '../../node_modules/starkzap/dist/src/swap/avnu.js';
import { EkuboSwapProvider } from '../../node_modules/starkzap/dist/src/swap/ekubo.js';
import { VesuLendingProvider } from '../../node_modules/starkzap/dist/src/lending/vesu/provider.js';
import {
  checkDeployed,
  preflightTransaction,
} from '../../node_modules/starkzap/dist/src/wallet/utils.js';

type ConnectedStarkZapWalletOptions = {
  account: AccountInterface;
  address: string;
  provider: ProviderInterface;
  chainId: ChainId;
  defaultFeeMode?: FeeMode;
};

function toSponsoredDetails(): PaymasterDetails {
  return {
    feeMode: {
      mode: 'sponsored',
    },
  };
}

export class ConnectedStarkZapWallet extends BaseWallet {
  private readonly connectedAccount: AccountInterface;
  private readonly rpcProvider: ProviderInterface;
  private readonly chainIdValue: ChainId;
  private readonly defaultFeeModeValue: FeeMode;

  constructor(options: ConnectedStarkZapWalletOptions) {
    super({
      address: fromAddress(options.address),
      defaultSwapProvider: new AvnuSwapProvider(),
      defaultLendingProvider: new VesuLendingProvider(),
      defaultDcaProvider: new AvnuDcaProvider(),
    });

    this.connectedAccount = options.account;
    this.rpcProvider = options.provider;
    this.chainIdValue = options.chainId;
    this.defaultFeeModeValue = options.defaultFeeMode ?? 'user_pays';

    this.registerSwapProvider(new EkuboSwapProvider());
    this.dca().registerProvider(new EkuboDcaProvider());
  }

  async isDeployed(): Promise<boolean> {
    return checkDeployed(this.rpcProvider as any, this.address);
  }

  async ensureReady(): Promise<void> {
    const deployed = await this.isDeployed();
    if (!deployed) {
      throw new Error('The connected wallet account is not deployed on Starknet yet.');
    }
  }

  async deploy(): Promise<Tx> {
    throw new Error('Deploying the connected wallet account is not supported from CircleSave.');
  }

  async execute(calls: Call[], options?: ExecuteOptions): Promise<Tx> {
    const feeMode = options?.feeMode ?? this.defaultFeeModeValue;

    if (feeMode === 'sponsored') {
      const paymasterAwareAccount = this.connectedAccount as AccountInterface & {
        executePaymasterTransaction?: (
          calls: Call[],
          paymasterDetails: PaymasterDetails,
        ) => Promise<{ transaction_hash: string }>;
      };

      if (typeof paymasterAwareAccount.executePaymasterTransaction !== 'function') {
        const fallbackResult = await this.connectedAccount.execute(calls);
        return new Tx(fallbackResult.transaction_hash, this.rpcProvider as any, this.chainIdValue);
      }

      const result = await paymasterAwareAccount.executePaymasterTransaction(
        calls,
        toSponsoredDetails(),
      );
      return new Tx(result.transaction_hash, this.rpcProvider as any, this.chainIdValue);
    }

    const result = await this.connectedAccount.execute(calls);
    return new Tx(result.transaction_hash, this.rpcProvider as any, this.chainIdValue);
  }

  async signMessage(typedData: TypedData): Promise<Signature> {
    return this.connectedAccount.signMessage(typedData);
  }

  async preflight(options: PreflightOptions): Promise<PreflightResult> {
    return preflightTransaction(this as any, this.connectedAccount as any, {
      ...options,
      feeMode: options.feeMode ?? this.defaultFeeModeValue,
    });
  }

  getAccount(): any {
    return this.connectedAccount as any;
  }

  getProvider(): any {
    return this.rpcProvider as any;
  }

  getChainId(): ChainId {
    return this.chainIdValue;
  }

  getFeeMode(): FeeMode {
    return this.defaultFeeModeValue;
  }

  getClassHash(): string {
    return 'connected-wallet';
  }

  async estimateFee(calls: Call[]): Promise<EstimateFeeResponseOverhead> {
    const feeAccount = this.connectedAccount as AccountInterface & {
      estimateInvokeFee?: (calls: Call[]) => Promise<EstimateFeeResponseOverhead>;
      estimateFee?: (calls: Call[]) => Promise<EstimateFeeResponseOverhead>;
    };

    if (typeof feeAccount.estimateInvokeFee === 'function') {
      return feeAccount.estimateInvokeFee(calls);
    }

    if (typeof feeAccount.estimateFee === 'function') {
      return feeAccount.estimateFee(calls);
    }

    throw new Error('Fee estimation is not available for the current wallet connection.');
  }

  async disconnect(): Promise<void> {
    return;
  }
}

export function createConnectedStarkZapWallet(options: ConnectedStarkZapWalletOptions) {
  return new ConnectedStarkZapWallet(options);
}
