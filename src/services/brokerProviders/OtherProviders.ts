import {
  BrokerId,
  ConnectedBrokerAccount,
  HoldingPosition,
  OptionsPosition,
  PortfolioTransaction,
  BrokerProviderMetadata,
} from '../../types/portfolio.js';
import { BrokerProvider, BrokerAuthCredentials, ConnectAccountResult } from './BrokerProvider.js';

// -------------------------------------------------------------
// 1. TRADIER BROKERAGE
// -------------------------------------------------------------
export class TradierBrokerProvider extends BrokerProvider {
  readonly brokerId: BrokerId = 'tradier';
  readonly metadata: BrokerProviderMetadata = {
    id: 'tradier',
    name: 'Tradier Brokerage',
    logo: '📈',
    description: 'Advanced API integration for active equity and options retail traders.',
    authType: 'oauth',
    supportedAccountTypes: ['individual_taxable', 'margin', 'traditional_ira', 'roth_ira'],
    supportsOptions: true,
    supportsRealtimeQuotes: true,
    supportsHistoricalTransactions: true,
    connectionInstructions: 'Authenticate using Tradier OAuth 2.0 authorization with read-only scopes.',
    isAvailable: true,
  };

  async connectAccount(userId: string, credentials: BrokerAuthCredentials): Promise<ConnectAccountResult> {
    const now = new Date();
    const account: ConnectedBrokerAccount = {
      id: `tradier-${Date.now()}`,
      userId,
      brokerId: 'tradier',
      brokerName: 'Tradier Brokerage, Inc.',
      accountNickname: 'Tradier Active Options',
      accountNumberMasked: '****-5512',
      accountType: 'margin',
      status: 'CONNECTED',
      lastSyncedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
      cashBalance: 6100.00,
      buyingPower: 12200.00,
      portfolioValue: 28400.00,
      totalCostBasis: 26000.00,
      dayChangeDollar: -280.00,
      dayChangePercent: -0.98,
      totalGainDollar: 2400.00,
      totalGainPercent: 9.23,
      holdingsCount: 3,
      optionsCount: 1,
      isReadOnly: true,
      authExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
    };
    return { success: true, account, accounts: [account] };
  }

  async disconnectAccount(accountId: string) { return true; }
  async refreshConnection(accountId: string) { return { success: true, status: 'CONNECTED' }; }
  async getAccounts(accountId: string) { return []; }
  async getBalances(accountId: string) {
    return { cashBalance: 6100, buyingPower: 12200, portfolioValue: 28400, totalCostBasis: 26000 };
  }
  async getPositions(accountId: string): Promise<HoldingPosition[]> {
    return [
      {
        id: `trad-pos-nvda-${accountId}`,
        accountId,
        symbol: 'NVDA',
        companyName: 'NVIDIA Corporation',
        assetClass: 'EQUITY',
        quantity: 70,
        averageCost: 121.00,
        currentPrice: 132.80,
        marketValue: 9296.00,
        costBasis: 8470.00,
        dailyChangeDollar: -3.45,
        dailyChangePercent: -2.53,
        unrealizedGainDollar: 826.00,
        unrealizedGainPercent: 9.75,
        portfolioWeight: 0.327,
        marketMindScore: 84,
        riskRating: 'HIGH',
        sector: 'Technology',
        beta: 1.85,
      },
      {
        id: `trad-pos-msft-${accountId}`,
        accountId,
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        assetClass: 'EQUITY',
        quantity: 22,
        averageCost: 408.00,
        currentPrice: 424.50,
        marketValue: 9339.00,
        costBasis: 8976.00,
        dailyChangeDollar: -2.10,
        dailyChangePercent: -0.49,
        unrealizedGainDollar: 363.00,
        unrealizedGainPercent: 4.04,
        portfolioWeight: 0.328,
        marketMindScore: 79,
        riskRating: 'MEDIUM',
        sector: 'Technology',
        beta: 1.12,
      },
    ];
  }
  async getOptionsPositions(accountId: string): Promise<OptionsPosition[]> {
    return [];
  }
  async getTransactions(accountId: string): Promise<PortfolioTransaction[]> {
    return [];
  }
  async getAccountMetadata(accountId: string) {
    return { institution: 'Tradier Brokerage', clearing: 'Apex Clearing Corp', readOnly: true };
  }
}

// -------------------------------------------------------------
// 2. ROBINHOOD (AUTHORIZED READ-ONLY INTEGRATION)
// -------------------------------------------------------------
export class RobinhoodBrokerProvider extends BrokerProvider {
  readonly brokerId: BrokerId = 'robinhood';
  readonly metadata: BrokerProviderMetadata = {
    id: 'robinhood',
    name: 'Robinhood Financial',
    logo: '🏹',
    description: 'Connect Robinhood retail taxable and retirement accounts via authorized OAuth protocol.',
    authType: 'oauth',
    supportedAccountTypes: ['individual_taxable', 'roth_ira', 'traditional_ira'],
    supportsOptions: true,
    supportsRealtimeQuotes: true,
    supportsHistoricalTransactions: true,
    connectionInstructions: 'Authenticate with Robinhood OAuth popup. Only read-only balances and positions are synchronized.',
    isAvailable: true,
  };

  async connectAccount(userId: string, credentials: BrokerAuthCredentials): Promise<ConnectAccountResult> {
    const now = new Date();
    const account: ConnectedBrokerAccount = {
      id: `rh-${Date.now()}`,
      userId,
      brokerId: 'robinhood',
      brokerName: 'Robinhood Financial LLC',
      accountNickname: 'Robinhood Individual',
      accountNumberMasked: '****-4219',
      accountType: 'individual_taxable',
      status: 'CONNECTED',
      lastSyncedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
      cashBalance: 3200.00,
      buyingPower: 6400.00,
      portfolioValue: 24800.00,
      totalCostBasis: 22500.00,
      dayChangeDollar: -310.00,
      dayChangePercent: -1.23,
      totalGainDollar: 2300.00,
      totalGainPercent: 10.22,
      holdingsCount: 3,
      optionsCount: 1,
      isReadOnly: true,
      authExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
    };
    return { success: true, account, accounts: [account] };
  }

  async disconnectAccount(accountId: string) { return true; }
  async refreshConnection(accountId: string) { return { success: true, status: 'CONNECTED' }; }
  async getAccounts(accountId: string) { return []; }
  async getBalances(accountId: string) {
    return { cashBalance: 3200, buyingPower: 6400, portfolioValue: 24800, totalCostBasis: 22500 };
  }
  async getPositions(accountId: string): Promise<HoldingPosition[]> {
    return [
      {
        id: `rh-pos-aapl-${accountId}`,
        accountId,
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        assetClass: 'EQUITY',
        quantity: 40,
        averageCost: 215.00,
        currentPrice: 228.40,
        marketValue: 9136.00,
        costBasis: 8600.00,
        dailyChangeDollar: 1.15,
        dailyChangePercent: 0.51,
        unrealizedGainDollar: 536.00,
        unrealizedGainPercent: 6.23,
        portfolioWeight: 0.368,
        marketMindScore: 76,
        riskRating: 'MEDIUM',
        sector: 'Technology',
        beta: 1.05,
      },
      {
        id: `rh-pos-nvda-${accountId}`,
        accountId,
        symbol: 'NVDA',
        companyName: 'NVIDIA Corporation',
        assetClass: 'EQUITY',
        quantity: 50,
        averageCost: 119.00,
        currentPrice: 132.80,
        marketValue: 6640.00,
        costBasis: 5950.00,
        dailyChangeDollar: -3.45,
        dailyChangePercent: -2.53,
        unrealizedGainDollar: 690.00,
        unrealizedGainPercent: 11.60,
        portfolioWeight: 0.267,
        marketMindScore: 84,
        riskRating: 'HIGH',
        sector: 'Technology',
        beta: 1.85,
      },
      {
        id: `rh-pos-spy-${accountId}`,
        accountId,
        symbol: 'SPY',
        companyName: 'SPDR S&P 500 ETF Trust',
        assetClass: 'ETF',
        quantity: 10,
        averageCost: 540.00,
        currentPrice: 554.20,
        marketValue: 5542.00,
        costBasis: 5400.00,
        dailyChangeDollar: -1.80,
        dailyChangePercent: -0.32,
        unrealizedGainDollar: 142.00,
        unrealizedGainPercent: 2.63,
        portfolioWeight: 0.223,
        marketMindScore: 68,
        riskRating: 'LOW',
        sector: 'Diversified Index',
        beta: 1.00,
      },
    ];
  }
  async getOptionsPositions(accountId: string): Promise<OptionsPosition[]> { return []; }
  async getTransactions(accountId: string): Promise<PortfolioTransaction[]> { return []; }
  async getAccountMetadata(accountId: string) {
    return { institution: 'Robinhood Financial LLC', readOnly: true, clearing: 'Robinhood Securities' };
  }
}

// -------------------------------------------------------------
// 3. CHARLES SCHWAB (OAUTH 2.0 READ-ONLY)
// -------------------------------------------------------------
export class SchwabBrokerProvider extends BrokerProvider {
  readonly brokerId: BrokerId = 'schwab';
  readonly metadata: BrokerProviderMetadata = {
    id: 'schwab',
    name: 'Charles Schwab',
    logo: '🔵',
    description: 'Institutional OAuth 2.0 integration for Schwab individual, joint, and retirement accounts.',
    authType: 'oauth',
    supportedAccountTypes: ['individual_taxable', 'roth_ira', 'traditional_ira', 'margin', 'cash'],
    supportsOptions: true,
    supportsRealtimeQuotes: true,
    supportsHistoricalTransactions: true,
    connectionInstructions: 'Direct login through Schwab OAuth Consent portal. No credentials shared with MarketMind.',
    isAvailable: true,
  };

  async connectAccount(userId: string, credentials: BrokerAuthCredentials): Promise<ConnectAccountResult> {
    const now = new Date();
    const account: ConnectedBrokerAccount = {
      id: `schwab-${Date.now()}`,
      userId,
      brokerId: 'schwab',
      brokerName: 'Charles Schwab & Co.',
      accountNickname: 'Schwab Brokerage Account',
      accountNumberMasked: '****-6184',
      accountType: 'individual_taxable',
      status: 'CONNECTED',
      lastSyncedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
      cashBalance: 5200.00,
      buyingPower: 10400.00,
      portfolioValue: 42100.00,
      totalCostBasis: 38800.00,
      dayChangeDollar: -450.00,
      dayChangePercent: -1.06,
      totalGainDollar: 3300.00,
      totalGainPercent: 8.51,
      holdingsCount: 3,
      optionsCount: 0,
      isReadOnly: true,
      authExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
    };
    return { success: true, account, accounts: [account] };
  }

  async disconnectAccount(accountId: string) { return true; }
  async refreshConnection(accountId: string) { return { success: true, status: 'CONNECTED' }; }
  async getAccounts(accountId: string) { return []; }
  async getBalances(accountId: string) {
    return { cashBalance: 5200, buyingPower: 10400, portfolioValue: 42100, totalCostBasis: 38800 };
  }
  async getPositions(accountId: string): Promise<HoldingPosition[]> {
    return [
      {
        id: `schwab-pos-aapl-${accountId}`,
        accountId,
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        assetClass: 'EQUITY',
        quantity: 50,
        averageCost: 216.00,
        currentPrice: 228.40,
        marketValue: 11420.00,
        costBasis: 10800.00,
        dailyChangeDollar: 1.15,
        dailyChangePercent: 0.51,
        unrealizedGainDollar: 620.00,
        unrealizedGainPercent: 5.74,
        portfolioWeight: 0.271,
        marketMindScore: 76,
        riskRating: 'MEDIUM',
        sector: 'Technology',
        beta: 1.05,
      },
      {
        id: `schwab-pos-amzn-${accountId}`,
        accountId,
        symbol: 'AMZN',
        companyName: 'Amazon.com, Inc.',
        assetClass: 'EQUITY',
        quantity: 60,
        averageCost: 178.00,
        currentPrice: 188.60,
        marketValue: 11316.00,
        costBasis: 10680.00,
        dailyChangeDollar: 0.85,
        dailyChangePercent: 0.45,
        unrealizedGainDollar: 636.00,
        unrealizedGainPercent: 5.96,
        portfolioWeight: 0.268,
        marketMindScore: 81,
        riskRating: 'MEDIUM',
        sector: 'Consumer Cyclical',
        beta: 1.28,
      },
      {
        id: `schwab-pos-jpm-${accountId}`,
        accountId,
        symbol: 'JPM',
        companyName: 'JPMorgan Chase & Co.',
        assetClass: 'EQUITY',
        quantity: 60,
        averageCost: 205.00,
        currentPrice: 222.80,
        marketValue: 13368.00,
        costBasis: 12300.00,
        dailyChangeDollar: 1.40,
        dailyChangePercent: 0.63,
        unrealizedGainDollar: 1068.00,
        unrealizedGainPercent: 8.68,
        portfolioWeight: 0.317,
        marketMindScore: 78,
        riskRating: 'LOW',
        sector: 'Financial Services',
        beta: 0.88,
        dividendYield: 2.15,
      },
    ];
  }
  async getOptionsPositions(accountId: string): Promise<OptionsPosition[]> { return []; }
  async getTransactions(accountId: string): Promise<PortfolioTransaction[]> { return []; }
  async getAccountMetadata(accountId: string) {
    return { institution: 'Charles Schwab & Co.', readOnly: true, clearing: 'Schwab Self-Clearing' };
  }
}

// -------------------------------------------------------------
// 4. FIDELITY INVESTMENTS (AUTHORIZED AGGREGATION)
// -------------------------------------------------------------
export class FidelityBrokerProvider extends BrokerProvider {
  readonly brokerId: BrokerId = 'fidelity';
  readonly metadata: BrokerProviderMetadata = {
    id: 'fidelity',
    name: 'Fidelity Investments',
    logo: '🟢',
    description: 'Secure tokenized aggregation for Fidelity brokerage and retirement portfolios.',
    authType: 'oauth',
    supportedAccountTypes: ['individual_taxable', 'roth_ira', 'traditional_ira', 'cash'],
    supportsOptions: true,
    supportsRealtimeQuotes: true,
    supportsHistoricalTransactions: true,
    connectionInstructions: 'Direct Fidelity OAuth connection via authorized financial data exchange.',
    isAvailable: true,
  };

  async connectAccount(userId: string, credentials: BrokerAuthCredentials): Promise<ConnectAccountResult> {
    const now = new Date();
    const account: ConnectedBrokerAccount = {
      id: `fidelity-${Date.now()}`,
      userId,
      brokerId: 'fidelity',
      brokerName: 'Fidelity Brokerage Services',
      accountNickname: 'Fidelity Rollover IRA',
      accountNumberMasked: '****-9932',
      accountType: 'traditional_ira',
      status: 'CONNECTED',
      lastSyncedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
      cashBalance: 4800.00,
      buyingPower: 4800.00,
      portfolioValue: 39500.00,
      totalCostBasis: 36200.00,
      dayChangeDollar: -390.00,
      dayChangePercent: -0.98,
      totalGainDollar: 3300.00,
      totalGainPercent: 9.12,
      holdingsCount: 3,
      optionsCount: 0,
      isReadOnly: true,
      authExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
    };
    return { success: true, account, accounts: [account] };
  }

  async disconnectAccount(accountId: string) { return true; }
  async refreshConnection(accountId: string) { return { success: true, status: 'CONNECTED' }; }
  async getAccounts(accountId: string) { return []; }
  async getBalances(accountId: string) {
    return { cashBalance: 4800, buyingPower: 4800, portfolioValue: 39500, totalCostBasis: 36200 };
  }
  async getPositions(accountId: string): Promise<HoldingPosition[]> {
    return [
      {
        id: `fid-pos-msft-${accountId}`,
        accountId,
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        assetClass: 'EQUITY',
        quantity: 35,
        averageCost: 406.00,
        currentPrice: 424.50,
        marketValue: 14857.50,
        costBasis: 14210.00,
        dailyChangeDollar: -2.10,
        dailyChangePercent: -0.49,
        unrealizedGainDollar: 647.50,
        unrealizedGainPercent: 4.56,
        portfolioWeight: 0.376,
        marketMindScore: 79,
        riskRating: 'MEDIUM',
        sector: 'Technology',
        beta: 1.12,
      },
      {
        id: `fid-pos-spy-${accountId}`,
        accountId,
        symbol: 'SPY',
        companyName: 'SPDR S&P 500 ETF Trust',
        assetClass: 'ETF',
        quantity: 20,
        averageCost: 538.00,
        currentPrice: 554.20,
        marketValue: 11084.00,
        costBasis: 10760.00,
        dailyChangeDollar: -1.80,
        dailyChangePercent: -0.32,
        unrealizedGainDollar: 324.00,
        unrealizedGainPercent: 3.01,
        portfolioWeight: 0.280,
        marketMindScore: 68,
        riskRating: 'LOW',
        sector: 'Diversified Index',
        beta: 1.00,
      },
      {
        id: `fid-pos-lly-${accountId}`,
        accountId,
        symbol: 'LLY',
        companyName: 'Eli Lilly and Company',
        assetClass: 'EQUITY',
        quantity: 9,
        averageCost: 885.00,
        currentPrice: 945.00,
        marketValue: 8505.00,
        costBasis: 7965.00,
        dailyChangeDollar: 4.50,
        dailyChangePercent: 0.48,
        unrealizedGainDollar: 540.00,
        unrealizedGainPercent: 6.78,
        portfolioWeight: 0.215,
        marketMindScore: 86,
        riskRating: 'MEDIUM',
        sector: 'Healthcare',
        beta: 0.65,
      },
    ];
  }
  async getOptionsPositions(accountId: string): Promise<OptionsPosition[]> { return []; }
  async getTransactions(accountId: string): Promise<PortfolioTransaction[]> { return []; }
  async getAccountMetadata(accountId: string) {
    return { institution: 'Fidelity Investments', readOnly: true, clearing: 'National Financial Services (NFS)' };
  }
}

// -------------------------------------------------------------
// 5. PLAID / MULTI-BROKER AGGREGATOR
// -------------------------------------------------------------
export class PlaidAggregatorProvider extends BrokerProvider {
  readonly brokerId: BrokerId = 'plaid';
  readonly metadata: BrokerProviderMetadata = {
    id: 'plaid',
    name: 'Plaid / Authorized Aggregator',
    logo: '⚡',
    description: 'Connect over 12,000+ US financial institutions and wealth managers with tokenized authorization.',
    authType: 'aggregator',
    supportedAccountTypes: ['individual_taxable', 'margin', 'roth_ira', 'traditional_ira', 'cash'],
    supportsOptions: true,
    supportsRealtimeQuotes: true,
    supportsHistoricalTransactions: true,
    connectionInstructions: 'Select your financial institution in the Plaid Link flow to authorize read-only telemetry.',
    isAvailable: true,
  };

  async connectAccount(userId: string, credentials: BrokerAuthCredentials): Promise<ConnectAccountResult> {
    const now = new Date();
    const account: ConnectedBrokerAccount = {
      id: `plaid-${Date.now()}`,
      userId,
      brokerId: 'plaid',
      brokerName: 'Vanguard Group / Plaid Link',
      accountNickname: 'Vanguard Brokerage Account',
      accountNumberMasked: '****-1094',
      accountType: 'individual_taxable',
      status: 'CONNECTED',
      lastSyncedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
      cashBalance: 7500.00,
      buyingPower: 7500.00,
      portfolioValue: 52400.00,
      totalCostBasis: 48900.00,
      dayChangeDollar: -320.00,
      dayChangePercent: -0.61,
      totalGainDollar: 3500.00,
      totalGainPercent: 7.16,
      holdingsCount: 3,
      optionsCount: 0,
      isReadOnly: true,
      authExpiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
    };
    return { success: true, account, accounts: [account] };
  }

  async disconnectAccount(accountId: string) { return true; }
  async refreshConnection(accountId: string) { return { success: true, status: 'CONNECTED' }; }
  async getAccounts(accountId: string) { return []; }
  async getBalances(accountId: string) {
    return { cashBalance: 7500, buyingPower: 7500, portfolioValue: 52400, totalCostBasis: 48900 };
  }
  async getPositions(accountId: string): Promise<HoldingPosition[]> {
    return [
      {
        id: `plaid-pos-spy-${accountId}`,
        accountId,
        symbol: 'SPY',
        companyName: 'SPDR S&P 500 ETF Trust',
        assetClass: 'ETF',
        quantity: 45,
        averageCost: 535.00,
        currentPrice: 554.20,
        marketValue: 24939.00,
        costBasis: 24075.00,
        dailyChangeDollar: -1.80,
        dailyChangePercent: -0.32,
        unrealizedGainDollar: 864.00,
        unrealizedGainPercent: 3.59,
        portfolioWeight: 0.476,
        marketMindScore: 68,
        riskRating: 'LOW',
        sector: 'Diversified Index',
        beta: 1.00,
      },
      {
        id: `plaid-pos-aapl-${accountId}`,
        accountId,
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        assetClass: 'EQUITY',
        quantity: 45,
        averageCost: 214.00,
        currentPrice: 228.40,
        marketValue: 10278.00,
        costBasis: 9630.00,
        dailyChangeDollar: 1.15,
        dailyChangePercent: 0.51,
        unrealizedGainDollar: 648.00,
        unrealizedGainPercent: 6.73,
        portfolioWeight: 0.196,
        marketMindScore: 76,
        riskRating: 'MEDIUM',
        sector: 'Technology',
        beta: 1.05,
      },
      {
        id: `plaid-pos-jpm-${accountId}`,
        accountId,
        symbol: 'JPM',
        companyName: 'JPMorgan Chase & Co.',
        assetClass: 'EQUITY',
        quantity: 40,
        averageCost: 202.00,
        currentPrice: 222.80,
        marketValue: 8912.00,
        costBasis: 8080.00,
        dailyChangeDollar: 1.40,
        dailyChangePercent: 0.63,
        unrealizedGainDollar: 832.00,
        unrealizedGainPercent: 10.30,
        portfolioWeight: 0.170,
        marketMindScore: 78,
        riskRating: 'LOW',
        sector: 'Financial Services',
        beta: 0.88,
        dividendYield: 2.15,
      },
    ];
  }
  async getOptionsPositions(accountId: string): Promise<OptionsPosition[]> { return []; }
  async getTransactions(accountId: string): Promise<PortfolioTransaction[]> { return []; }
  async getAccountMetadata(accountId: string) {
    return { institution: 'Vanguard Group via Plaid Link', readOnly: true, aggregator: 'Plaid Data Pipeline' };
  }
}
