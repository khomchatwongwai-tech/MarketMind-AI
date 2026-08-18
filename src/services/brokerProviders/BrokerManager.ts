import {
  BrokerId,
  ConnectedBrokerAccount,
  HoldingPosition,
  OptionsPosition,
  PortfolioTransaction,
  UnifiedPortfolioSummary,
  BrokerProviderMetadata,
} from '../../types/portfolio';
import { BrokerProvider, BrokerAuthCredentials, ConnectAccountResult } from './BrokerProvider';
import { DemoInstitutionalBrokerProvider } from './DemoInstitutionalBrokerProvider';
import { AlpacaBrokerProvider } from './AlpacaBrokerProvider';
import { InteractiveBrokersProvider } from './InteractiveBrokersProvider';
import {
  TradierBrokerProvider,
  RobinhoodBrokerProvider,
  SchwabBrokerProvider,
  FidelityBrokerProvider,
  PlaidAggregatorProvider,
} from './OtherProviders';

const LOCAL_STORAGE_KEY_ACCOUNTS = 'marketmind_connected_broker_accounts_v1';
const LOCAL_STORAGE_KEY_CONNECTED_INIT = 'marketmind_broker_init_done';

export class BrokerManager {
  private static instance: BrokerManager;
  private providers: Map<BrokerId, BrokerProvider> = new Map();

  private constructor() {
    this.registerProvider(new DemoInstitutionalBrokerProvider());
    this.registerProvider(new AlpacaBrokerProvider());
    this.registerProvider(new InteractiveBrokersProvider());
    this.registerProvider(new TradierBrokerProvider());
    this.registerProvider(new RobinhoodBrokerProvider());
    this.registerProvider(new SchwabBrokerProvider());
    this.registerProvider(new FidelityBrokerProvider());
    this.registerProvider(new PlaidAggregatorProvider());
  }

  public static getInstance(): BrokerManager {
    if (!BrokerManager.instance) {
      BrokerManager.instance = new BrokerManager();
    }
    return BrokerManager.instance;
  }

  public registerProvider(provider: BrokerProvider) {
    this.providers.set(provider.brokerId, provider);
  }

  public getProvider(brokerId: BrokerId): BrokerProvider | undefined {
    return this.providers.get(brokerId);
  }

  public getAllProvidersMetadata(): BrokerProviderMetadata[] {
    return Array.from(this.providers.values()).map((p) => p.metadata);
  }

  /**
   * Get all connected accounts for user.
   * If none exist yet, automatically initialize the Demo Institutional account for immediate evaluation.
   */
  public async getConnectedAccounts(userId: string): Promise<ConnectedBrokerAccount[]> {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ACCOUNTS);
      if (stored) {
        const parsed: ConnectedBrokerAccount[] = JSON.parse(stored);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local stored accounts:', e);
    }

    // Auto seed Demo Institutional Account on first load
    const demoProvider = this.providers.get('demo');
    if (demoProvider) {
      const result = await demoProvider.connectAccount(userId, {});
      if (result.success && result.account) {
        this.saveAccountsToStorage([result.account]);
        return [result.account];
      }
    }

    return [];
  }

  private saveAccountsToStorage(accounts: ConnectedBrokerAccount[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save connected accounts to localStorage:', e);
    }
  }

  /**
   * Connect a new brokerage account
   */
  public async connectBrokerAccount(
    userId: string,
    brokerId: BrokerId,
    credentials: BrokerAuthCredentials
  ): Promise<ConnectAccountResult> {
    const provider = this.providers.get(brokerId);
    if (!provider) {
      return { success: false, errorMessage: `Unsupported broker provider: ${brokerId}` };
    }

    const result = await provider.connectAccount(userId, credentials);
    if (result.success && result.account) {
      const existing = await this.getConnectedAccounts(userId);
      // Remove any existing with same ID or update
      const filtered = existing.filter((a) => a.id !== result.account!.id);
      const updated = [result.account, ...filtered];
      this.saveAccountsToStorage(updated);
    }

    return result;
  }

  /**
   * Disconnect an account and delete imported data
   */
  public async disconnectAccount(userId: string, accountId: string): Promise<boolean> {
    const existing = await this.getConnectedAccounts(userId);
    const target = existing.find((a) => a.id === accountId);
    if (target) {
      const provider = this.providers.get(target.brokerId);
      if (provider) {
        await provider.disconnectAccount(accountId);
      }
    }

    const updated = existing.filter((a) => a.id !== accountId);
    this.saveAccountsToStorage(updated);
    return true;
  }

  /**
   * Refresh synchronization for a specific account
   */
  public async syncAccount(userId: string, accountId: string): Promise<{ success: boolean; account?: ConnectedBrokerAccount }> {
    const existing = await this.getConnectedAccounts(userId);
    const target = existing.find((a) => a.id === accountId);
    if (!target) {
      return { success: false };
    }

    const provider = this.providers.get(target.brokerId);
    if (!provider) {
      return { success: false };
    }

    await provider.refreshConnection(accountId);
    const now = new Date();
    const updatedAccount: ConnectedBrokerAccount = {
      ...target,
      status: 'CONNECTED',
      lastSyncedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET',
    };

    const updated = existing.map((a) => (a.id === accountId ? updatedAccount : a));
    this.saveAccountsToStorage(updated);

    return { success: true, account: updatedAccount };
  }

  /**
   * Retrieve all aggregated holdings for a user (or filtered by account)
   */
  public async getHoldings(userId: string, accountId?: string): Promise<HoldingPosition[]> {
    const accounts = await this.getConnectedAccounts(userId);
    const targetAccounts = accountId && accountId !== 'ALL'
      ? accounts.filter((a) => a.id === accountId)
      : accounts;

    const allHoldings: HoldingPosition[] = [];

    for (const acc of targetAccounts) {
      const provider = this.providers.get(acc.brokerId);
      if (provider) {
        const positions = await provider.getPositions(acc.id);
        allHoldings.push(...positions);
      }
    }

    // If viewing Unified (ALL accounts), calculate unified portfolio weights
    const totalValue = allHoldings.reduce((sum, h) => sum + h.marketValue, 0);
    if (totalValue > 0) {
      allHoldings.forEach((h) => {
        h.portfolioWeight = +(h.marketValue / totalValue).toFixed(4);
      });
    }

    return allHoldings;
  }

  /**
   * Retrieve all aggregated options positions
   */
  public async getOptions(userId: string, accountId?: string): Promise<OptionsPosition[]> {
    const accounts = await this.getConnectedAccounts(userId);
    const targetAccounts = accountId && accountId !== 'ALL'
      ? accounts.filter((a) => a.id === accountId)
      : accounts;

    const allOptions: OptionsPosition[] = [];

    for (const acc of targetAccounts) {
      const provider = this.providers.get(acc.brokerId);
      if (provider) {
        const options = await provider.getOptionsPositions(acc.id);
        allOptions.push(...options);
      }
    }

    return allOptions;
  }

  /**
   * Retrieve all historical transactions
   */
  public async getTransactions(userId: string, accountId?: string, limit: number = 50): Promise<PortfolioTransaction[]> {
    const accounts = await this.getConnectedAccounts(userId);
    const targetAccounts = accountId && accountId !== 'ALL'
      ? accounts.filter((a) => a.id === accountId)
      : accounts;

    const allTx: PortfolioTransaction[] = [];

    for (const acc of targetAccounts) {
      const provider = this.providers.get(acc.brokerId);
      if (provider) {
        const txs = await provider.getTransactions(acc.id, limit);
        allTx.push(...txs);
      }
    }

    // Sort by date descending
    allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return allTx.slice(0, limit);
  }

  /**
   * Compute the Unified Portfolio Summary across all connected accounts
   */
  public async getUnifiedPortfolioSummary(userId: string, accountId?: string): Promise<UnifiedPortfolioSummary> {
    const accounts = await this.getConnectedAccounts(userId);
    const targetAccounts = accountId && accountId !== 'ALL'
      ? accounts.filter((a) => a.id === accountId)
      : accounts;

    const holdings = await this.getHoldings(userId, accountId);
    const options = await this.getOptions(userId, accountId);

    const totalEquitiesValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalOptionsValue = options.reduce((sum, o) => sum + o.marketValue, 0);
    const totalCash = targetAccounts.reduce((sum, a) => sum + a.cashBalance, 0);
    const totalValue = totalEquitiesValue + totalOptionsValue + totalCash;

    const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0) +
      options.reduce((sum, o) => sum + (o.costBasis * o.quantity * 100), 0);

    const dayChangeDollar = holdings.reduce((sum, h) => sum + (h.dailyChangeDollar * h.quantity), 0);
    const dayChangePercent = totalValue > 0 ? +(dayChangeDollar / (totalValue - dayChangeDollar) * 100).toFixed(2) : 0;

    const totalUnrealizedGainDollar = totalValue - totalCostBasis - totalCash;
    const totalUnrealizedGainPercent = totalCostBasis > 0 ? +(totalUnrealizedGainDollar / totalCostBasis * 100).toFixed(2) : 0;

    // Sector breakdown
    const sectorMap: Record<string, number> = {};
    holdings.forEach((h) => {
      const sec = h.sector || 'Other';
      sectorMap[sec] = (sectorMap[sec] || 0) + h.marketValue;
    });

    const sectorAllocation = Object.entries(sectorMap).map(([sector, val]) => ({
      sector,
      value: val,
      weight: totalValue > 0 ? +(val / totalValue * 100).toFixed(1) : 0,
    })).sort((a, b) => b.value - a.value);

    // Top holdings
    const topHoldings = holdings
      .map((h) => ({
        symbol: h.symbol,
        weight: totalValue > 0 ? +(h.marketValue / totalValue * 100).toFixed(1) : 0,
        value: h.marketValue,
        dayChangePercent: h.dailyChangePercent,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Asset allocation percentages
    const equitiesPct = totalValue > 0 ? +(totalEquitiesValue / totalValue * 100).toFixed(1) : 0;
    const optionsPct = totalValue > 0 ? +(totalOptionsValue / totalValue * 100).toFixed(1) : 0;
    const cashPct = totalValue > 0 ? +(totalCash / totalValue * 100).toFixed(1) : 0;

    return {
      totalValue: +totalValue.toFixed(2),
      dayChangeDollar: +dayChangeDollar.toFixed(2),
      dayChangePercent,
      totalCostBasis: +totalCostBasis.toFixed(2),
      totalUnrealizedGainDollar: +totalUnrealizedGainDollar.toFixed(2),
      totalUnrealizedGainPercent,
      cashBalance: +totalCash.toFixed(2),
      investedAssets: +(totalEquitiesValue + totalOptionsValue).toFixed(2),
      holdingsCount: holdings.length,
      connectedAccountsCount: targetAccounts.length,
      assetAllocation: {
        equities: equitiesPct,
        options: optionsPct,
        cash: cashPct,
        crypto: 0,
      },
      sectorAllocation,
      topHoldings,
      riskScore: 72,
      riskLevel: 'ELEVATED',
    };
  }
}
