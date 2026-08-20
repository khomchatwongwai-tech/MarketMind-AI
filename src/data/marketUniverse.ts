export interface UniverseItem {
  symbol: string;
  name: string;
  type: 'STOCK' | 'ETF';
  sector: string;
  marketCap?: string;
  presetTags: ('sp500' | 'nasdaq100' | 'dow30' | 'sector_etf' | 'top_movers' | 'most_active')[];
}

export const MARKET_UNIVERSE: UniverseItem[] = [
  // Technology
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', sector: 'Technology', marketCap: '$3.45T', presetTags: ['sp500', 'nasdaq100', 'dow30', 'most_active'] },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'STOCK', sector: 'Technology', marketCap: '$3.12T', presetTags: ['sp500', 'nasdaq100', 'dow30', 'most_active'] },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'STOCK', sector: 'Technology', marketCap: '$3.18T', presetTags: ['sp500', 'nasdaq100', 'top_movers', 'most_active'] },
  { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'STOCK', sector: 'Technology', marketCap: '$780B', presetTags: ['sp500', 'nasdaq100'] },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', type: 'STOCK', sector: 'Technology', marketCap: '$240B', presetTags: ['sp500', 'nasdaq100', 'top_movers', 'most_active'] },
  { symbol: 'ORCL', name: 'Oracle Corporation', type: 'STOCK', sector: 'Technology', marketCap: '$380B', presetTags: ['sp500'] },
  { symbol: 'CRM', name: 'Salesforce, Inc.', type: 'STOCK', sector: 'Technology', marketCap: '$280B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.', type: 'STOCK', sector: 'Technology', marketCap: '$200B', presetTags: ['sp500', 'nasdaq100', 'dow30'] },
  { symbol: 'ACN', name: 'Accenture plc', type: 'STOCK', sector: 'Technology', marketCap: '$210B', presetTags: ['sp500'] },
  { symbol: 'ADBE', name: 'Adobe Inc.', type: 'STOCK', sector: 'Technology', marketCap: '$230B', presetTags: ['sp500', 'nasdaq100'] },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated', type: 'STOCK', sector: 'Technology', marketCap: '$185B', presetTags: ['sp500', 'nasdaq100'] },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated', type: 'STOCK', sector: 'Technology', marketCap: '$190B', presetTags: ['sp500', 'nasdaq100'] },
  { symbol: 'IBM', name: 'International Business Machines', type: 'STOCK', sector: 'Technology', marketCap: '$195B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'INTC', name: 'Intel Corporation', type: 'STOCK', sector: 'Technology', marketCap: '$95B', presetTags: ['sp500', 'nasdaq100', 'most_active'] },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', type: 'STOCK', sector: 'Technology', marketCap: '$95B', presetTags: ['sp500', 'top_movers', 'most_active'] },

  // Communication Services & Tech Giants
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'STOCK', sector: 'Consumer Discretionary', marketCap: '$1.95T', presetTags: ['sp500', 'nasdaq100', 'dow30', 'most_active'] },
  { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'STOCK', sector: 'Communication Services', marketCap: '$1.35T', presetTags: ['sp500', 'nasdaq100', 'top_movers', 'most_active'] },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', type: 'STOCK', sector: 'Communication Services', marketCap: '$2.05T', presetTags: ['sp500', 'nasdaq100', 'most_active'] },
  { symbol: 'NFLX', name: 'Netflix, Inc.', type: 'STOCK', sector: 'Communication Services', marketCap: '$290B', presetTags: ['sp500', 'nasdaq100', 'top_movers'] },
  { symbol: 'TMUS', name: 'T-Mobile US, Inc.', type: 'STOCK', sector: 'Communication Services', marketCap: '$230B', presetTags: ['sp500', 'nasdaq100'] },
  { symbol: 'DIS', name: 'The Walt Disney Company', type: 'STOCK', sector: 'Communication Services', marketCap: '$175B', presetTags: ['sp500', 'dow30'] },

  // Consumer Discretionary & Automotive
  { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'STOCK', sector: 'Consumer Discretionary', marketCap: '$680B', presetTags: ['sp500', 'nasdaq100', 'top_movers', 'most_active'] },
  { symbol: 'HD', name: 'The Home Depot, Inc.', type: 'STOCK', sector: 'Consumer Discretionary', marketCap: '$380B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'MCD', name: "McDonald's Corporation", type: 'STOCK', sector: 'Consumer Discretionary', marketCap: '$210B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'NKE', name: 'NIKE, Inc.', type: 'STOCK', sector: 'Consumer Discretionary', marketCap: '$120B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'SBUX', name: 'Starbucks Corporation', type: 'STOCK', sector: 'Consumer Discretionary', marketCap: '$110B', presetTags: ['sp500', 'nasdaq100'] },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', type: 'STOCK', sector: 'Consumer Discretionary', marketCap: '$140B', presetTags: ['sp500', 'nasdaq100'] },

  // Financials
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'STOCK', sector: 'Financials', marketCap: '$620B', presetTags: ['sp500', 'dow30', 'most_active'] },
  { symbol: 'V', name: 'Visa Inc.', type: 'STOCK', sector: 'Financials', marketCap: '$560B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'MA', name: 'Mastercard Incorporated', type: 'STOCK', sector: 'Financials', marketCap: '$440B', presetTags: ['sp500'] },
  { symbol: 'BAC', name: 'Bank of America Corporation', type: 'STOCK', sector: 'Financials', marketCap: '$310B', presetTags: ['sp500', 'most_active'] },
  { symbol: 'WFC', name: 'Wells Fargo & Company', type: 'STOCK', sector: 'Financials', marketCap: '$210B', presetTags: ['sp500'] },
  { symbol: 'GS', name: 'The Goldman Sachs Group, Inc.', type: 'STOCK', sector: 'Financials', marketCap: '$160B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'MS', name: 'Morgan Stanley', type: 'STOCK', sector: 'Financials', marketCap: '$165B', presetTags: ['sp500'] },
  { symbol: 'COIN', name: 'Coinbase Global, Inc.', type: 'STOCK', sector: 'Financials', marketCap: '$55B', presetTags: ['top_movers', 'most_active'] },

  // Healthcare & Biotech
  { symbol: 'LLY', name: 'Eli Lilly and Company', type: 'STOCK', sector: 'Healthcare', marketCap: '$840B', presetTags: ['sp500', 'top_movers'] },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', type: 'STOCK', sector: 'Healthcare', marketCap: '$520B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'STOCK', sector: 'Healthcare', marketCap: '$390B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'ABBV', name: 'AbbVie Inc.', type: 'STOCK', sector: 'Healthcare', marketCap: '$310B', presetTags: ['sp500'] },
  { symbol: 'MRK', name: 'Merck & Co., Inc.', type: 'STOCK', sector: 'Healthcare', marketCap: '$290B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', type: 'STOCK', sector: 'Healthcare', marketCap: '$215B', presetTags: ['sp500'] },
  { symbol: 'PFE', name: 'Pfizer Inc.', type: 'STOCK', sector: 'Healthcare', marketCap: '$160B', presetTags: ['sp500', 'most_active'] },

  // Industrials & Aerospace
  { symbol: 'CAT', name: 'Caterpillar Inc.', type: 'STOCK', sector: 'Industrials', marketCap: '$175B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'GE', name: 'GE Aerospace', type: 'STOCK', sector: 'Industrials', marketCap: '$190B', presetTags: ['sp500'] },
  { symbol: 'BA', name: 'The Boeing Company', type: 'STOCK', sector: 'Industrials', marketCap: '$115B', presetTags: ['sp500', 'dow30', 'most_active'] },
  { symbol: 'HON', name: 'Honeywell International Inc.', type: 'STOCK', sector: 'Industrials', marketCap: '$135B', presetTags: ['sp500', 'dow30'] },

  // Consumer Staples
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'STOCK', sector: 'Consumer Staples', marketCap: '$580B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'PG', name: 'The Procter & Gamble Company', type: 'STOCK', sector: 'Consumer Staples', marketCap: '$410B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', type: 'STOCK', sector: 'Consumer Staples', marketCap: '$385B', presetTags: ['sp500', 'nasdaq100'] },
  { symbol: 'KO', name: 'The Coca-Cola Company', type: 'STOCK', sector: 'Consumer Staples', marketCap: '$290B', presetTags: ['sp500', 'dow30'] },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', type: 'STOCK', sector: 'Consumer Staples', marketCap: '$235B', presetTags: ['sp500', 'nasdaq100'] },

  // Energy & Materials
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', type: 'STOCK', sector: 'Energy', marketCap: '$460B', presetTags: ['sp500'] },
  { symbol: 'CVX', name: 'Chevron Corporation', type: 'STOCK', sector: 'Energy', marketCap: '$275B', presetTags: ['sp500', 'dow30'] },

  // Benchmark Index ETFs & Sector ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'ETF', sector: 'Broad Market ETF', marketCap: '$560B', presetTags: ['sp500', 'sector_etf', 'most_active'] },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', sector: 'Technology ETF', marketCap: '$285B', presetTags: ['nasdaq100', 'sector_etf', 'most_active'] },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', type: 'ETF', sector: 'Broad Market ETF', marketCap: '$34B', presetTags: ['dow30', 'sector_etf'] },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'ETF', sector: 'Small Cap ETF', marketCap: '$72B', presetTags: ['sector_etf', 'most_active'] },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', type: 'ETF', sector: 'Technology ETF', marketCap: '$68B', presetTags: ['sector_etf'] },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', type: 'ETF', sector: 'Financials ETF', marketCap: '$42B', presetTags: ['sector_etf'] },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR Fund', type: 'ETF', sector: 'Healthcare ETF', marketCap: '$40B', presetTags: ['sector_etf'] },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund', type: 'ETF', sector: 'Energy ETF', marketCap: '$38B', presetTags: ['sector_etf'] },
  { symbol: 'XLY', name: 'Consumer Discretionary Select Sector SPDR', type: 'ETF', sector: 'Consumer Discretionary ETF', marketCap: '$22B', presetTags: ['sector_etf'] },
  { symbol: 'XLP', name: 'Consumer Staples Select Sector SPDR', type: 'ETF', sector: 'Consumer Staples ETF', marketCap: '$18B', presetTags: ['sector_etf'] },
  { symbol: 'XLI', name: 'Industrial Select Sector SPDR Fund', type: 'ETF', sector: 'Industrials ETF', marketCap: '$20B', presetTags: ['sector_etf'] },
  { symbol: 'XLC', name: 'Communication Services Select Sector SPDR', type: 'ETF', sector: 'Communication ETF', marketCap: '$19B', presetTags: ['sector_etf'] },
  { symbol: 'XLB', name: 'Materials Select Sector SPDR Fund', type: 'ETF', sector: 'Materials ETF', marketCap: '$6B', presetTags: ['sector_etf'] },
  { symbol: 'XLRE', name: 'Real Estate Select Sector SPDR Fund', type: 'ETF', sector: 'Real Estate ETF', marketCap: '$5B', presetTags: ['sector_etf'] },
  { symbol: 'XLU', name: 'Utilities Select Sector SPDR Fund', type: 'ETF', sector: 'Utilities ETF', marketCap: '$16B', presetTags: ['sector_etf'] },
  { symbol: 'SMH', name: 'VanEck Semiconductor ETF', type: 'ETF', sector: 'Technology ETF', marketCap: '$24B', presetTags: ['sector_etf', 'most_active'] },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'ETF', sector: 'Growth ETF', marketCap: '$6B', presetTags: ['sector_etf', 'top_movers'] },
];
