import type {
  AccountInterface,
  ProviderInterface,
  Signature,
} from 'starknet';
import { type PaymasterDetails } from 'starknet';
import { BaseWallet } from '../../node_modules/starkzap/dist/src/wallet/base.js';
import { Tx } from '../../node_modules/starkzap/dist/src/tx/index.js';
import {
  type ChainId,
  type FeeMode,
  type PreflightResult,
  fromAddress,
} from '../../node_modules/starkzap/dist/src/types/index.js';
import { EkuboDcaProvider } from '../../node_modules/starkzap/dist/src/dca/ekubo.js';
import { AvnuSwapProvider } from '../../node_modules/starkzap/dist/src/swap/avnu.js';
import { EkuboSwapProvider } from '../../node_modules/starkzap/dist/src/swap/ekubo.js';
import { VesuLendingProvider } from '../../node_modules/starkzap/dist/src/lending/vesu/provider.js';
import {
  checkDeployed,
  preflightTransaction,
} from '../../node_modules/starkzap/dist/src/wallet/utils.js';
import { getStakingPreset } from '../../node_modules/starkzap/dist/src/staking/presets.js';
import { CircleSaveAvnuDcaProvider } from '@/lib/starkzapDcaProviders';

type ConnectedStarkZapWalletOptions = {
  account: AccountInterface;
  address: string;
  provider: ProviderInterface;
  chainId: ChainId;
  defaultFeeMode?: FeeMode;
};

type StakingConfigCarrier = {
  stakingConfig?: unknown;
};

type BaseWalletExecuteCalls = Parameters<BaseWallet['execute']>[0];
type BaseWalletExecuteOptions = Parameters<BaseWallet['execute']>[1];
type BaseWalletSignMessageInput = Parameters<BaseWallet['signMessage']>[0];
type BaseWalletPreflightOptions = Parameters<BaseWallet['preflight']>[0];
type BaseWalletEstimateFeeCalls = Parameters<BaseWallet['estimateFee']>[0];
type BaseWalletEstimateFeeResult = Awaited<ReturnType<BaseWallet['estimateFee']>>;
type StarkZapAccount =
  import('../../node_modules/starkzap/node_modules/starknet/dist/index.js').Account;
type StarkZapProvider =
  import('../../node_modules/starkzap/node_modules/starknet/dist/index.js').RpcProvider;

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
      defaultDcaProvider: new CircleSaveAvnuDcaProvider(),
    });

    this.connectedAccount = options.account;
    this.rpcProvider = options.provider;
    this.chainIdValue = options.chainId;
    this.defaultFeeModeValue = options.defaultFeeMode ?? 'user_pays';

    // Set staking config AFTER super() so chainId is available
    try {
      (this as unknown as StakingConfigCarrier).stakingConfig = getStakingPreset(options.chainId);
    } catch {
      // gracefully skip if preset not available
    }

    this.registerSwapProvider(new EkuboSwapProvider());
    this.dca().registerProvider(new EkuboDcaProvider());
  }

  async isDeployed(): Promise<boolean> {
    return checkDeployed(
      this.rpcProvider as unknown as Parameters<typeof checkDeployed>[0],
      this.address,
    );
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

  async execute(calls: BaseWalletExecuteCalls, options?: BaseWalletExecuteOptions): Promise<Tx> {
    const feeMode = options?.feeMode ?? this.defaultFeeModeValue;

    if (feeMode === 'sponsored') {
      const paymasterAwareAccount = this.connectedAccount as AccountInterface & {
        executePaymasterTransaction?: (
          calls: BaseWalletExecuteCalls,
          paymasterDetails: PaymasterDetails,
        ) => Promise<{ transaction_hash: string }>;
      };

      if (typeof paymasterAwareAccount.executePaymasterTransaction !== 'function') {
        const fallbackResult = await this.connectedAccount.execute(calls);
        return new Tx(
          fallbackResult.transaction_hash,
          this.rpcProvider as unknown as ConstructorParameters<typeof Tx>[1],
          this.chainIdValue,
        );
      }

      const result = await paymasterAwareAccount.executePaymasterTransaction(
        calls,
        toSponsoredDetails(),
      );
      return new Tx(
        result.transaction_hash,
        this.rpcProvider as unknown as ConstructorParameters<typeof Tx>[1],
        this.chainIdValue,
      );
    }

    const result = await this.connectedAccount.execute(calls);
    return new Tx(
      result.transaction_hash,
      this.rpcProvider as unknown as ConstructorParameters<typeof Tx>[1],
      this.chainIdValue,
    );
  }

  async signMessage(typedData: BaseWalletSignMessageInput): Promise<Signature> {
    return this.connectedAccount.signMessage(typedData);
  }

  async preflight(options: BaseWalletPreflightOptions): Promise<PreflightResult> {
    return preflightTransaction(
      this as unknown as Parameters<typeof preflightTransaction>[0],
      this.connectedAccount as unknown as Parameters<typeof preflightTransaction>[1],
      {
        ...options,
        feeMode: options.feeMode ?? this.defaultFeeModeValue,
      },
    );
  }

  getAccount(): StarkZapAccount {
    return this.connectedAccount as unknown as StarkZapAccount;
  }

  getProvider(): StarkZapProvider {
    return this.rpcProvider as unknown as StarkZapProvider;
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

  async estimateFee(calls: BaseWalletEstimateFeeCalls): Promise<BaseWalletEstimateFeeResult> {
    const feeAccount = this.connectedAccount as AccountInterface & {
      estimateInvokeFee?: (calls: BaseWalletEstimateFeeCalls) => Promise<BaseWalletEstimateFeeResult>;
      estimateFee?: (calls: BaseWalletEstimateFeeCalls) => Promise<BaseWalletEstimateFeeResult>;
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
