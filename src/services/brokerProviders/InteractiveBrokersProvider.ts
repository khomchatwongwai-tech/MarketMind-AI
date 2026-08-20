import {
  BrokerId,
  ConnectedBrokerAccount,
  HoldingPosition,
  OptionsPosition,
  PortfolioTransaction,
  BrokerProviderMetadata,
} from '../../types/portfolio.js';
import { BrokerProvider, BrokerAuthCredentials, ConnectAccountResult } from './BrokerProvider.js';

export class InteractiveBrokersProvider extends BrokerProvider {
  readonly brokerId: BrokerId = 'ibkr';
  readonly metadata: BrokerProviderMetadata = {
    id: 'ibkr',
    name: 'Interactive Brokers (IBKR)',
    logo: '🌐',
    description: 'Direct institutional client portal connection for global multi-currency portfolios & options.',
    authType: 'oauth',
    supportedAccountTypes: ['individual_taxable', 'margin', 'traditional_ira', 'roth_ira'],
    supportsOptions: true,
    supportsRealtimeQuotes: true,
    supportsHistoricalTransactions: true,
    connectionInstructions: 'Authenticate securely via IBKR Client Portal Gateway with OAuth tokenization.',
    isAvailable: true,
  };

  async connectAccount(userId: string, credentials: BrokerAuthCredentials): Promise<ConnectAccountResult> {
    const now = new Date();
    const account: ConnectedBrokerAccount = {
      id: `ibkr-${Date.now()}`,
      userId,
      brokerId: 'ibkr',
      brokerName: 'Interactive Brokers LLC',
      accountNickname: 'IBKR Pro Margin Account',
      accountNumberMasked: '****-7721',
      accountType: 'margin',
      status: 'CONNECTED',
      lastSyncedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
      cashBalance: 8400.00,
      buyingPower: 25200.00,
      portfolioValue: 48950.00,
      totalCostBasis: 44200.00,
      dayChangeDollar: -620.00,
      dayChangePercent: -1.25,
      totalGainDollar: 4750.00,
      totalGainPercent: 10.75,
      holdingsCount: 4,
      optionsCount: 1,
      isReadOnly: true,
      authExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
      connectionMetadata: {
        institutionLogo: '🌐',
        environment: 'live',
        permissions: ['read:account', 'read:positions', 'read:orders', 'read:history'],
      },
    };

    return {
      success: true,
      account,
      accounts: [account],
    };
  }

  async disconnectAccount(accountId: string): Promise<boolean> {
    return true;
  }

  async refreshConnection(accountId: string): Promise<{ success: boolean; status: string }> {
    return { success: true, status: 'CONNECTED' };
  }

  async getAccounts(accountId: string): Promise<ConnectedBrokerAccount[]> {
    return [];
  }

  async getBalances(accountId: string) {
    return {
      cashBalance: 8400.00,
      buyingPower: 25200.00,
      portfolioValue: 48950.00,
      totalCostBasis: 44200.00,
    };
  }

  async getPositions(accountId: string): Promise<HoldingPosition[]> {
    return [
      {
        id: `ibkr-pos-aapl-${accountId}`,
        accountId,
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        assetClass: 'EQUITY',
        quantity: 50,
        averageCost: 218.00,
        currentPrice: 228.40,
        marketValue: 11420.00,
        costBasis: 10900.00,
        dailyChangeDollar: 1.15,
        dailyChangePercent: 0.51,
        unrealizedGainDollar: 520.00,
        unrealizedGainPercent: 4.77,
        portfolioWeight: 0.233,
        marketMindScore: 76,
        riskRating: 'MEDIUM',
        sector: 'Technology',
        beta: 1.05,
        dividendYield: 0.44,
      },
      {
        id: `ibkr-pos-amd-${accountId}`,
        accountId,
        symbol: 'AMD',
        companyName: 'Advanced Micro Devices, Inc.',
        assetClass: 'EQUITY',
        quantity: 60,
        averageCost: 145.00,
        currentPrice: 156.40,
        marketValue: 9384.00,
        costBasis: 8700.00,
        dailyChangeDollar: -4.20,
        dailyChangePercent: -2.61,
        unrealizedGainDollar: 684.00,
        unrealizedGainPercent: 7.86,
        portfolioWeight: 0.192,
        marketMindScore: 71,
        riskRating: 'HIGH',
        sector: 'Technology',
        beta: 1.92,
        dividendYield: 0.0,
      },
      {
        id: `ibkr-pos-jpm-${accountId}`,
        accountId,
        symbol: 'JPM',
        companyName: 'JPMorgan Chase & Co.',
        assetClass: 'EQUITY',
        quantity: 45,
        averageCost: 202.00,
        currentPrice: 222.80,
        marketValue: 10026.00,
        costBasis: 9090.00,
        dailyChangeDollar: 1.40,
        dailyChangePercent: 0.63,
        unrealizedGainDollar: 936.00,
        unrealizedGainPercent: 10.30,
        portfolioWeight: 0.205,
        marketMindScore: 78,
        riskRating: 'LOW',
        sector: 'Financial Services',
        beta: 0.88,
        dividendYield: 2.15,
      },
      {
        id: `ibkr-pos-lly-${accountId}`,
        accountId,
        symbol: 'LLY',
        companyName: 'Eli Lilly and Company',
        assetClass: 'EQUITY',
        quantity: 10,
        averageCost: 890.00,
        currentPrice: 945.00,
        marketValue: 9450.00,
        costBasis: 8900.00,
        dailyChangeDollar: 4.50,
        dailyChangePercent: 0.48,
        unrealizedGainDollar: 550.00,
        unrealizedGainPercent: 6.18,
        portfolioWeight: 0.193,
        marketMindScore: 86,
        riskRating: 'MEDIUM',
        sector: 'Healthcare',
        beta: 0.65,
        dividendYield: 0.55,
      },
    ];
  }

  async getOptionsPositions(accountId: string): Promise<OptionsPosition[]> {
    return [
      {
        id: `ibkr-opt-spy-${accountId}`,
        accountId,
        symbol: 'SPY 260828P00540000',
        underlyingSymbol: 'SPY',
        contractType: 'PUT',
        strikePrice: 540.00,
        expirationDate: '2026-08-28',
        daysToExpiration: 13,
        quantity: 2,
        currentPrice: 2.15,
        costBasis: 2.50,
        marketValue: 430.00,
        unrealizedGainDollar: -70.00,
        unrealizedGainPercent: -14.00,
        delta: -0.22,
        gamma: 0.024,
        theta: -0.18,
        vega: 0.11,
        impliedVolatility: 0.15,
        inTheMoney: false,
        riskFlags: ['SHORT_EXPIRATION'],
      },
    ];
  }

  async getTransactions(accountId: string, limit?: number): Promise<PortfolioTransaction[]> {
    return [
      {
        id: `ibkr-tx-1`,
        accountId,
        date: '2026-08-04',
        type: 'BUY',
        symbol: 'AMD',
        description: 'Bought 20 shares AMD @ $148.20',
        quantity: 20,
        price: 148.20,
        amount: -2964.00,
        fees: 1.00,
      },
    ];
  }

  async getAccountMetadata(accountId: string) {
    return {
      institution: 'Interactive Brokers LLC',
      clearing: 'IBKR Self-Clearing',
      readOnly: true,
      currency: 'USD',
    };
  }
}
