// ==========================================
// MarketMind AI — Institutional Research Provider Interface (Morningstar Preparation)
// STRICT RULE: No web scraping, no fabricated ratings.
// Returns CONFIGURATION_REQUIRED until legitimate enterprise credentials and licensing exist.
// ==========================================

export interface InstitutionalResearchReport {
  symbol: string;
  provider: 'Morningstar' | 'FactSet' | 'S&P Global' | 'MarketMind Fundamental';
  rating?: string; // e.g. 5-Star, 4-Star
  fairValueEstimate?: number;
  fairValueCurrency?: string;
  economicMoat?: 'WIDE' | 'NARROW' | 'NONE';
  moatTrend?: 'POSITIVE' | 'STABLE' | 'NEGATIVE';
  uncertainty?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';
  analystNotes?: string;
  status: 'CONFIGURATION_REQUIRED' | 'ACTIVE' | 'UNENTITLED';
  licensingNotice: string;
}

export class ResearchProvider {
  /**
   * Retrieves institutional research report.
   * By default, returns CONFIGURATION_REQUIRED to ensure compliance with data licensing.
   */
  public static async getResearch(symbol: string): Promise<InstitutionalResearchReport> {
    const hasMorningstarKey = Boolean(process.env.MORNINGSTAR_API_KEY || process.env.MORNINGSTAR_CLIENT_SECRET);

    if (!hasMorningstarKey) {
      return {
        symbol: symbol.toUpperCase(),
        provider: 'Morningstar',
        status: 'CONFIGURATION_REQUIRED',
        licensingNotice:
          'Morningstar Institutional Data requires direct enterprise licensing. Contact administrator to configure API credentials.',
      };
    }

    return {
      symbol: symbol.toUpperCase(),
      provider: 'Morningstar',
      status: 'CONFIGURATION_REQUIRED',
      licensingNotice: 'Enterprise Morningstar credentials configured. License verification in progress.',
    };
  }
}
