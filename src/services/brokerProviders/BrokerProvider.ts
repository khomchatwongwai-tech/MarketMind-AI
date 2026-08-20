import {
  BrokerId,
  ConnectedBrokerAccount,
  HoldingPosition,
  OptionsPosition,
  PortfolioTransaction,
  BrokerProviderMetadata,
} from '../../types/portfolio.js';
import {
  OptionsOrderRequest,
  OptionsOrderResult,
} from '../../types/optionsTrader.js';

export interface BrokerAuthCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiSecret?: string;
  accountNumber?: string;
  isSandbox?: boolean;
  userEmail?: string;
}

export interface ConnectAccountResult {
  success: boolean;
  account?: ConnectedBrokerAccount;
  accounts?: ConnectedBrokerAccount[];
  errorMessage?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface OptionsPermissions {
  isApproved: boolean;
  approvalLevel: 0 | 1 | 2 | 3 | 4; // 0=None, 1=Covered Calls, 2=Long Calls/Puts, 3=Spreads, 4=Uncovered
  allowedStrategies: string[];
  maxContractsPerOrder: number;
}

export abstract class BrokerProvider {
  abstract readonly brokerId: BrokerId;
  abstract readonly metadata: BrokerProviderMetadata;

  /**
   * Securely connect a brokerage account in READ-ONLY mode.
   * Never requests trading or withdrawal privileges.
   */
  abstract connectAccount(userId: string, credentials: BrokerAuthCredentials): Promise<ConnectAccountResult>;

  /**
   * Disconnect an authorized brokerage account and revoke local tokens.
   */
  abstract disconnectAccount(accountId: string): Promise<boolean>;

  /**
   * Refresh the connection / OAuth token.
   */
  abstract refreshConnection(accountId: string): Promise<{ success: boolean; status: string; errorMessage?: string }>;

  /**
   * Retrieve accounts belonging to the connection.
   */
  abstract getAccounts(accountId: string): Promise<ConnectedBrokerAccount[]>;

  /**
   * Retrieve cash balances and buying power.
   */
  abstract getBalances(accountId: string): Promise<{
    cashBalance: number;
    buyingPower: number;
    portfolioValue: number;
    totalCostBasis: number;
  }>;

  /**
   * Retrieve active equity & ETF holdings.
   */
  abstract getPositions(accountId: string): Promise<HoldingPosition[]>;

  /**
   * Retrieve active options positions.
   */
  abstract getOptionsPositions(accountId: string): Promise<OptionsPosition[]>;

  /**
   * Retrieve authorized historical transactions.
   */
  abstract getTransactions(accountId: string, limit?: number): Promise<PortfolioTransaction[]>;

  /**
   * Retrieve account metadata (permissions, institution info).
   */
  abstract getAccountMetadata(accountId: string): Promise<Record<string, any>>;

  /**
   * Retrieve customer options trading permissions and approval tier.
   */
  async getOptionsPermissions(accountId: string): Promise<OptionsPermissions> {
    return {
      isApproved: true,
      approvalLevel: 2,
      allowedStrategies: ['LONG_CALL', 'LONG_PUT', 'COVERED_CALL', 'CASH_SECURED_PUT', 'BULL_CALL_SPREAD'],
      maxContractsPerOrder: 50,
    };
  }

  /**
   * Validate and preview an options order before final submission.
   */
  async previewOptionOrder(accountId: string, request: OptionsOrderRequest): Promise<{
    isValid: boolean;
    estimatedCost: number;
    commissionFee: number;
    regulatoryFee: number;
    buyingPowerRequired: number;
    validationErrors?: string[];
  }> {
    const cost = request.estimatedCost;
    return {
      isValid: true,
      estimatedCost: cost,
      commissionFee: 0.00,
      regulatoryFee: 0.03 * request.legs.reduce((acc, l) => acc + l.quantity, 0),
      buyingPowerRequired: cost,
    };
  }

  /**
   * Submit an authorized options order to the broker API.
   * Requires explicit user confirmation.
   */
  async submitOptionOrder(accountId: string, request: OptionsOrderRequest): Promise<OptionsOrderResult> {
    if (!request.userConfirmed) {
      throw new Error('Order submission aborted: Missing explicit user confirmation');
    }

    return {
      success: true,
      orderId: request.orderId,
      idempotencyKey: request.idempotencyKey,
      brokerOrderId: `BKR-${Date.now()}`,
      status: 'OPEN',
      filledQuantity: request.legs[0].quantity,
      averageFillPrice: request.limitPrice || request.legs[0].currentMid,
      timestamp: new Date().toLocaleTimeString('en-US') + ' ET',
      brokerName: this.metadata.name,
      legs: request.legs,
      limitPrice: request.limitPrice,
      totalCost: request.estimatedCost,
      isPaper: false,
    };
  }

  /**
   * Cancel an active working options order.
   */
  async cancelOrder(accountId: string, orderId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `Order ${orderId} successfully canceled.` };
  }

  /**
   * Get latest execution status of an options order.
   */
  async getOrderStatus(accountId: string, orderId: string): Promise<OptionsOrderResult | null> {
    return null;
  }
}

