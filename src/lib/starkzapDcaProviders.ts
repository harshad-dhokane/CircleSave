import { AvnuDcaProvider, type AvnuDcaProviderOptions } from '../../node_modules/starkzap/dist/src/dca/avnu.js';
import type { DcaCreateRequest, DcaProviderContext, PreparedDcaAction } from '../../node_modules/starkzap/dist/src/dca/interface.js';
import { validateDcaCreateAmounts } from '../../node_modules/starkzap/dist/src/dca/utils.js';
import { assertAmountMatchesToken } from '../../node_modules/starkzap/dist/src/types/index.js';
import {
  DEFAULT_AVNU_API_BASES,
  normalizeAvnuCalls,
  supportsAvnuChain,
  withAvnuApiBaseFallback,
} from '../../node_modules/starkzap/dist/src/utils/avnu.js';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toHexAmount(value: bigint) {
  return `0x${value.toString(16)}`;
}

function toAvnuFrequency(frequency: string) {
  // AVNU Sepolia accepts day-based weekly durations more reliably than `P1W`.
  return frequency === 'P1W' ? 'P7D' : frequency;
}

function validatePricingStrategy(request: DcaCreateRequest) {
  const minBuyAmount = request.pricingStrategy?.minBuyAmount;
  const maxBuyAmount = request.pricingStrategy?.maxBuyAmount;

  if (minBuyAmount) {
    assertAmountMatchesToken(minBuyAmount, request.buyToken);
  }

  if (maxBuyAmount) {
    assertAmountMatchesToken(maxBuyAmount, request.buyToken);
  }

  if (
    minBuyAmount &&
    maxBuyAmount &&
    minBuyAmount.toBase() > maxBuyAmount.toBase()
  ) {
    throw new Error('DCA pricingStrategy.minBuyAmount cannot exceed pricingStrategy.maxBuyAmount');
  }
}

function toPricingStrategy(request: DcaCreateRequest) {
  const minBuyAmountBase = request.pricingStrategy?.minBuyAmount?.toBase();
  const maxBuyAmountBase = request.pricingStrategy?.maxBuyAmount?.toBase();

  if (minBuyAmountBase == null && maxBuyAmountBase == null) {
    return {};
  }

  return {
    ...(minBuyAmountBase != null && {
      tokenToMinAmount: toHexAmount(minBuyAmountBase),
    }),
    ...(maxBuyAmountBase != null && {
      tokenToMaxAmount: toHexAmount(maxBuyAmountBase),
    }),
  };
}

async function readAvnuError(response: Response) {
  const fallback = `${response.status} ${response.statusText}`.trim() || 'AVNU request failed';

  try {
    const payload = await response.json();

    if (isRecord(payload)) {
      if (Array.isArray(payload.messages)) {
        const firstMessage = payload.messages.find(
          (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
        );

        if (firstMessage) {
          return firstMessage;
        }
      }

      if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
        return payload.message;
      }

      if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
        return payload.error;
      }

      if (typeof payload.revertError === 'string' && payload.revertError.trim().length > 0) {
        return payload.revertError;
      }
    }
  } catch {
    // Ignore parse failures and fall back to the status text.
  }

  return fallback;
}

async function requestAvnuDcaCreateCalls(baseUrl: string, request: DcaCreateRequest) {
  const response = await fetch(`${baseUrl}/dca/v3/orders`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sellTokenAddress: request.sellToken.address,
      buyTokenAddress: request.buyToken.address,
      sellAmount: toHexAmount(request.sellAmount.toBase()),
      sellAmountPerCycle: toHexAmount(request.sellAmountPerCycle.toBase()),
      frequency: toAvnuFrequency(request.frequency),
      pricingStrategy: toPricingStrategy(request),
      traderAddress: request.traderAddress,
    }),
  });

  if (!response.ok) {
    throw new Error(await readAvnuError(response));
  }

  const payload = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.calls)) {
    throw new Error('AVNU DCA create returned an invalid payload');
  }

  return normalizeAvnuCalls(payload.calls, 'AVNU DCA create returned no calls');
}

export class CircleSaveAvnuDcaProvider extends AvnuDcaProvider {
  private readonly apiBasesByChain: Record<'SN_MAIN' | 'SN_SEPOLIA', string[]>;

  constructor(options: AvnuDcaProviderOptions = {}) {
    super(options);
    this.apiBasesByChain = {
      SN_MAIN: options.apiBases?.SN_MAIN ?? [...DEFAULT_AVNU_API_BASES.SN_MAIN],
      SN_SEPOLIA: options.apiBases?.SN_SEPOLIA ?? [...DEFAULT_AVNU_API_BASES.SN_SEPOLIA],
    };
  }

  override supportsChain(chainId: DcaProviderContext['chainId']) {
    return supportsAvnuChain(chainId);
  }

  override async prepareCreate(
    context: DcaProviderContext,
    request: DcaCreateRequest,
  ): Promise<PreparedDcaAction> {
    validateDcaCreateAmounts(request);
    validatePricingStrategy(request);

    const calls = await withAvnuApiBaseFallback({
      apiBasesByChain: this.apiBasesByChain,
      chainId: context.chainId,
      feature: 'DCA',
      action: 'prepare DCA create',
      run: (baseUrl) => requestAvnuDcaCreateCalls(baseUrl, request),
    });

    return {
      providerId: this.id,
      action: 'create',
      calls,
    };
  }
}
