import { NormalizedInstrument, UniversalAssetClass } from '../../types/instrument.js';

type CatalogSpec = {
  symbol: string; display?: string; name: string; assetClass: UniversalAssetClass;
  exchange: string; currency?: string; country?: string; yahoo?: string; massive?: string; alpaca?: string; fred?: string;
};

const specs: CatalogSpec[] = [
  // Broad US equity universe
  ...[
    ['GOOGL','Alphabet Class A'],['GOOG','Alphabet Class C'],['NFLX','Netflix'],['AVGO','Broadcom'],['ORCL','Oracle'],
    ['CRM','Salesforce'],['ADBE','Adobe'],['INTC','Intel'],['QCOM','Qualcomm'],['MU','Micron Technology'],
    ['ARM','Arm Holdings ADR'],['SMCI','Super Micro Computer'],['IBM','IBM'],['CSCO','Cisco Systems'],['NOW','ServiceNow'],
    ['JPM','JPMorgan Chase'],['BAC','Bank of America'],['WFC','Wells Fargo'],['GS','Goldman Sachs'],['MS','Morgan Stanley'],
    ['V','Visa'],['MA','Mastercard'],['AXP','American Express'],['BRK.B','Berkshire Hathaway Class B'],['BLK','BlackRock'],
    ['WMT','Walmart'],['COST','Costco'],['HD','Home Depot'],['MCD','McDonald’s'],['NKE','Nike'],
    ['DIS','Walt Disney'],['UBER','Uber Technologies'],['ABNB','Airbnb'],['SBUX','Starbucks'],['TGT','Target'],
    ['XOM','Exxon Mobil'],['CVX','Chevron'],['COP','ConocoPhillips'],['SLB','SLB'],['OXY','Occidental Petroleum'],
    ['LLY','Eli Lilly'],['UNH','UnitedHealth'],['JNJ','Johnson & Johnson'],['PFE','Pfizer'],['MRK','Merck'],
    ['ABBV','AbbVie'],['TMO','Thermo Fisher'],['CAT','Caterpillar'],['BA','Boeing'],['GE','GE Aerospace'],
    ['LMT','Lockheed Martin'],['RTX','RTX'],['DE','Deere'],['FDX','FedEx'],['UPS','United Parcel Service'],
    ['PLTR','Palantir'],['COIN','Coinbase'],['MSTR','Strategy'],['HOOD','Robinhood Markets'],['RBLX','Roblox'],
  ].map(([symbol,name]) => ({ symbol, name, assetClass: 'STOCK' as const, exchange: 'NYSE/NASDAQ', country: 'United States', alpaca: symbol, massive: symbol })),

  // Index and sector ETFs
  ...[
    ['DIA','SPDR Dow Jones Industrial Average ETF'],['VOO','Vanguard S&P 500 ETF'],['VTI','Vanguard Total Stock Market ETF'],
    ['ARKK','ARK Innovation ETF'],['SMH','VanEck Semiconductor ETF'],['SOXX','iShares Semiconductor ETF'],['XLK','Technology Select Sector SPDR'],
    ['XLF','Financial Select Sector SPDR'],['XLE','Energy Select Sector SPDR'],['XLV','Health Care Select Sector SPDR'],
    ['XLY','Consumer Discretionary Select Sector SPDR'],['XLP','Consumer Staples Select Sector SPDR'],['XLI','Industrial Select Sector SPDR'],
    ['XLU','Utilities Select Sector SPDR'],['XLB','Materials Select Sector SPDR'],['XLRE','Real Estate Select Sector SPDR'],
    ['EEM','iShares MSCI Emerging Markets ETF'],['EFA','iShares MSCI EAFE ETF'],['TLT','iShares 20+ Year Treasury Bond ETF'],
    ['IEF','iShares 7–10 Year Treasury Bond ETF'],['SHY','iShares 1–3 Year Treasury Bond ETF'],['HYG','iShares High Yield Corporate Bond ETF'],
    ['LQD','iShares Investment Grade Corporate Bond ETF'],['GLD','SPDR Gold Shares'],['SLV','iShares Silver Trust'],['USO','United States Oil Fund'],
  ].map(([symbol,name]) => ({ symbol, name, assetClass: 'ETF' as const, exchange: 'NYSE Arca', country: 'United States', alpaca: symbol, massive: symbol })),

  // Crypto pairs — provider-native Yahoo display symbols, with Massive mappings where supported
  ...[
    ['BTC-USD','BTC/USD','Bitcoin'],['ETH-USD','ETH/USD','Ethereum'],['SOL-USD','SOL/USD','Solana'],['XRP-USD','XRP/USD','XRP'],
    ['DOGE-USD','DOGE/USD','Dogecoin'],['ADA-USD','ADA/USD','Cardano'],['AVAX-USD','AVAX/USD','Avalanche'],['LINK-USD','LINK/USD','Chainlink'],
    ['DOT-USD','DOT/USD','Polkadot'],['LTC-USD','LTC/USD','Litecoin'],['BCH-USD','BCH/USD','Bitcoin Cash'],['UNI7083-USD','UNI/USD','Uniswap'],
    ['AAVE-USD','AAVE/USD','Aave'],['SHIB-USD','SHIB/USD','Shiba Inu'],['XLM-USD','XLM/USD','Stellar'],['HBAR-USD','HBAR/USD','Hedera'],
  ].map(([symbol,display,name]) => ({ symbol, display, name, assetClass: 'CRYPTO' as const, exchange: 'Global Crypto', currency: 'USD', country: 'Global', massive: `X:${symbol.replace('-','')}` })),

  // Major, minor and emerging-market FX pairs
  ...[
    ['EURUSD=X','EUR/USD','Euro / US Dollar'],['GBPUSD=X','GBP/USD','British Pound / US Dollar'],['USDJPY=X','USD/JPY','US Dollar / Japanese Yen'],
    ['AUDUSD=X','AUD/USD','Australian Dollar / US Dollar'],['USDCAD=X','USD/CAD','US Dollar / Canadian Dollar'],['USDCHF=X','USD/CHF','US Dollar / Swiss Franc'],
    ['NZDUSD=X','NZD/USD','New Zealand Dollar / US Dollar'],['EURGBP=X','EUR/GBP','Euro / British Pound'],['EURJPY=X','EUR/JPY','Euro / Japanese Yen'],
    ['GBPJPY=X','GBP/JPY','British Pound / Japanese Yen'],['AUDJPY=X','AUD/JPY','Australian Dollar / Japanese Yen'],['EURCHF=X','EUR/CHF','Euro / Swiss Franc'],
    ['USDCNY=X','USD/CNY','US Dollar / Chinese Yuan'],['USDHKD=X','USD/HKD','US Dollar / Hong Kong Dollar'],['USDSGD=X','USD/SGD','US Dollar / Singapore Dollar'],
    ['USDINR=X','USD/INR','US Dollar / Indian Rupee'],['USDMXN=X','USD/MXN','US Dollar / Mexican Peso'],['USDZAR=X','USD/ZAR','US Dollar / South African Rand'],
  ].map(([symbol,display,name]) => ({ symbol, display, name, assetClass: 'FOREX' as const, exchange: 'Global FX OTC', currency: display.split('/')[1], country: 'Global', massive: `C:${display.replace('/','')}` })),

  // Front/continuous futures symbols supported by the Yahoo fallback
  ...[
    ['ES=F','/ES','E-mini S&P 500 Futures'],['NQ=F','/NQ','E-mini Nasdaq-100 Futures'],['YM=F','/YM','E-mini Dow Futures'],['RTY=F','/RTY','E-mini Russell 2000 Futures'],
    ['CL=F','/CL','WTI Crude Oil Futures'],['BZ=F','/BZ','Brent Crude Oil Futures'],['NG=F','/NG','Natural Gas Futures'],
    ['GC=F','/GC','Gold Futures'],['SI=F','/SI','Silver Futures'],['HG=F','/HG','Copper Futures'],['PL=F','/PL','Platinum Futures'],['PA=F','/PA','Palladium Futures'],
    ['ZC=F','/ZC','Corn Futures'],['ZW=F','/ZW','Wheat Futures'],['ZS=F','/ZS','Soybean Futures'],['KC=F','/KC','Coffee Futures'],
    ['SB=F','/SB','Sugar Futures'],['CC=F','/CC','Cocoa Futures'],['CT=F','/CT','Cotton Futures'],['LE=F','/LE','Live Cattle Futures'],
    ['ZB=F','/ZB','30-Year U.S. Treasury Bond Futures'],['ZN=F','/ZN','10-Year U.S. Treasury Note Futures'],['ZF=F','/ZF','5-Year U.S. Treasury Note Futures'],
  ].map(([symbol,display,name]) => ({ symbol, display, name, assetClass: 'FUTURES' as const, exchange: 'CME/ICE/COMEX/CBOT', country: 'United States' })),

  // Commodity spot/benchmarks
  ...[
    ['XAUUSD=X','XAU/USD','Spot Gold'],['XAGUSD=X','XAG/USD','Spot Silver'],['CL=F','WTI','West Texas Intermediate Crude Oil'],
    ['BZ=F','BRENT','Brent Crude Oil'],['NG=F','NATGAS','Natural Gas'],['HG=F','COPPER','Copper'],
  ].map(([symbol,display,name]) => ({ symbol: `CMD:${display}`, display, name, assetClass: 'COMMODITY' as const, exchange: 'Global Commodity Market', country: 'Global', yahoo: symbol })),

  // Government yields and liquid bond benchmarks
  ...[
    ['^IRX','US3M','U.S. 3-Month Treasury Bill Yield'],['^FVX','US5Y','U.S. 5-Year Treasury Note Yield'],
    ['^TNX','US10Y','U.S. 10-Year Treasury Note Yield'],['^TYX','US30Y','U.S. 30-Year Treasury Bond Yield'],
    ['TLT','UST20Y+','20+ Year U.S. Treasury Bond ETF'],['IEF','UST7-10Y','7–10 Year U.S. Treasury Bond ETF'],
    ['BND','US AGG','Vanguard Total Bond Market ETF'],['AGG','US AGG','iShares Core U.S. Aggregate Bond ETF'],
    ['HYG','US HY','U.S. High-Yield Corporate Bond ETF'],['LQD','US IG','U.S. Investment-Grade Corporate Bond ETF'],
  ].map(([symbol,display,name]) => ({ symbol: `BOND:${display}`, display, name, assetClass: 'BOND' as const, exchange: 'U.S. Fixed Income', country: 'United States', yahoo: symbol })),

  // International listings and American depositary receipts
  ...[
    ['TSM','Taiwan Semiconductor Manufacturing ADR'],['ASML','ASML Holding ADR'],['NVO','Novo Nordisk ADR'],['SAP','SAP ADR'],
    ['SONY','Sony Group ADR'],['TM','Toyota Motor ADR'],['HMC','Honda Motor ADR'],['BABA','Alibaba Group ADR'],
    ['JD','JD.com ADR'],['PDD','PDD Holdings ADR'],['BIDU','Baidu ADR'],['NVS','Novartis ADR'],
    ['AZN','AstraZeneca ADR'],['GSK','GSK ADR'],['SNY','Sanofi ADR'],['RIO','Rio Tinto ADR'],
    ['BHP','BHP Group ADR'],['VALE','Vale ADR'],['BP','BP ADR'],['SHEL','Shell ADR'],
    ['HSBC','HSBC Holdings ADR'],['UBS','UBS Group'],['DB','Deutsche Bank'],['MELI','MercadoLibre'],
    ['SE','Sea Limited ADR'],['GRAB','Grab Holdings'],['CPNG','Coupang'],['INFY','Infosys ADR'],
  ].map(([symbol,name]) => ({ symbol, name, assetClass: 'ADR' as const, exchange: 'NYSE/NASDAQ', country: 'International', alpaca: symbol, massive: symbol })),

  // Additional equities across major US sectors
  ...[
    ['AMAT','Applied Materials'],['LRCX','Lam Research'],['KLAC','KLA'],['PANW','Palo Alto Networks'],['CRWD','CrowdStrike'],
    ['SNOW','Snowflake'],['SHOP','Shopify'],['SQ','Block'],['PYPL','PayPal'],['SOFI','SoFi Technologies'],
    ['C','Citigroup'],['SCHW','Charles Schwab'],['PGR','Progressive'],['CB','Chubb'],['SPGI','S&P Global'],
    ['AMGN','Amgen'],['GILD','Gilead Sciences'],['ISRG','Intuitive Surgical'],['VRTX','Vertex Pharmaceuticals'],['REGN','Regeneron'],
    ['KO','Coca-Cola'],['PEP','PepsiCo'],['PG','Procter & Gamble'],['PM','Philip Morris International'],['MO','Altria'],
    ['LOW','Lowe’s'],['TJX','TJX Companies'],['BKNG','Booking Holdings'],['MAR','Marriott International'],['CMG','Chipotle'],
    ['NEE','NextEra Energy'],['DUK','Duke Energy'],['SO','Southern Company'],['CEG','Constellation Energy'],['VST','Vistra'],
    ['HON','Honeywell'],['ETN','Eaton'],['UNP','Union Pacific'],['WM','Waste Management'],['MMM','3M'],
  ].map(([symbol,name]) => ({ symbol, name, assetClass: 'STOCK' as const, exchange: 'NYSE/NASDAQ', country: 'United States', alpaca: symbol, massive: symbol })),

  // Additional ETFs and mutual funds
  ...[
    ['SCHD','Schwab U.S. Dividend Equity ETF'],['VUG','Vanguard Growth ETF'],['VTV','Vanguard Value ETF'],['VXUS','Vanguard Total International Stock ETF'],
    ['QQQM','Invesco Nasdaq 100 ETF'],['IWM','iShares Russell 2000 ETF'],['IJH','iShares Core S&P Mid-Cap ETF'],['IJR','iShares Core S&P Small-Cap ETF'],
    ['EWJ','iShares MSCI Japan ETF'],['EWZ','iShares MSCI Brazil ETF'],['FXI','iShares China Large-Cap ETF'],['KWEB','KraneShares China Internet ETF'],
    ['INDA','iShares MSCI India ETF'],['VGK','Vanguard FTSE Europe ETF'],['XBI','SPDR S&P Biotech ETF'],['IBB','iShares Biotechnology ETF'],
    ['TAN','Invesco Solar ETF'],['ICLN','iShares Global Clean Energy ETF'],['GDX','VanEck Gold Miners ETF'],['GDXJ','VanEck Junior Gold Miners ETF'],
    ['IAU','iShares Gold Trust'],['DBC','Invesco DB Commodity Index Tracking Fund'],['PDBC','Invesco Optimum Yield Diversified Commodity Strategy ETF'],
    ['BIL','SPDR Bloomberg 1-3 Month T-Bill ETF'],['SGOV','iShares 0-3 Month Treasury Bond ETF'],['TIP','iShares TIPS Bond ETF'],
    ['MUB','iShares National Muni Bond ETF'],['EMB','iShares J.P. Morgan USD Emerging Markets Bond ETF'],['JNK','SPDR Bloomberg High Yield Bond ETF'],
  ].map(([symbol,name]) => ({ symbol, name, assetClass: 'ETF' as const, exchange: 'NYSE Arca/NASDAQ', country: 'United States', alpaca: symbol, massive: symbol })),
  ...[
    ['VTSAX','Vanguard Total Stock Market Index Fund Admiral Shares'],['VFIAX','Vanguard 500 Index Fund Admiral Shares'],
    ['FXAIX','Fidelity 500 Index Fund'],['VBTLX','Vanguard Total Bond Market Index Fund Admiral Shares'],
    ['SWPPX','Schwab S&P 500 Index Fund'],['FZROX','Fidelity ZERO Total Market Index Fund'],
  ].map(([symbol,name]) => ({ symbol, name, assetClass: 'FUND' as const, exchange: 'Mutual Fund', country: 'United States', yahoo: symbol })),

  // Additional digital assets
  ...[
    ['BNB-USD','BNB/USD','BNB'],['TRX-USD','TRX/USD','TRON'],['SUI20947-USD','SUI/USD','Sui'],['NEAR-USD','NEAR/USD','NEAR Protocol'],
    ['ICP-USD','ICP/USD','Internet Computer'],['ETC-USD','ETC/USD','Ethereum Classic'],['FIL-USD','FIL/USD','Filecoin'],['ATOM-USD','ATOM/USD','Cosmos'],
    ['ALGO-USD','ALGO/USD','Algorand'],['VET-USD','VET/USD','VeChain'],['OP-USD','OP/USD','Optimism'],['ARB11841-USD','ARB/USD','Arbitrum'],
    ['INJ-USD','INJ/USD','Injective'],['RENDER-USD','RENDER/USD','Render'],['MKR-USD','MKR/USD','Maker'],['PEPE24478-USD','PEPE/USD','Pepe'],
  ].map(([symbol,display,name]) => ({ symbol, display, name, assetClass: 'CRYPTO' as const, exchange: 'Global Crypto', currency: 'USD', country: 'Global', massive: `X:${display.replace('/','')}` })),

  // Additional FX crosses and emerging-market pairs
  ...[
    ['CADJPY=X','CAD/JPY','Canadian Dollar / Japanese Yen'],['CHFJPY=X','CHF/JPY','Swiss Franc / Japanese Yen'],
    ['EURAUD=X','EUR/AUD','Euro / Australian Dollar'],['EURCAD=X','EUR/CAD','Euro / Canadian Dollar'],
    ['GBPAUD=X','GBP/AUD','British Pound / Australian Dollar'],['GBPCAD=X','GBP/CAD','British Pound / Canadian Dollar'],
    ['AUDCAD=X','AUD/CAD','Australian Dollar / Canadian Dollar'],['AUDNZD=X','AUD/NZD','Australian Dollar / New Zealand Dollar'],
    ['NZDJPY=X','NZD/JPY','New Zealand Dollar / Japanese Yen'],['EURSEK=X','EUR/SEK','Euro / Swedish Krona'],
    ['EURNOK=X','EUR/NOK','Euro / Norwegian Krone'],['USDSEK=X','USD/SEK','US Dollar / Swedish Krona'],
    ['USDNOK=X','USD/NOK','US Dollar / Norwegian Krone'],['USDTRY=X','USD/TRY','US Dollar / Turkish Lira'],
    ['USDPLN=X','USD/PLN','US Dollar / Polish Zloty'],['USDBRL=X','USD/BRL','US Dollar / Brazilian Real'],
  ].map(([symbol,display,name]) => ({ symbol, display, name, assetClass: 'FOREX' as const, exchange: 'Global FX OTC', currency: display.split('/')[1], country: 'Global', massive: `C:${display.replace('/','')}` })),

  // Additional agriculture, energy, livestock and rates futures
  ...[
    ['ZO=F','/ZO','Oat Futures'],['KE=F','/KE','KC Hard Red Winter Wheat Futures'],['HE=F','/HE','Lean Hogs Futures'],
    ['GF=F','/GF','Feeder Cattle Futures'],['OJ=F','/OJ','Orange Juice Futures'],['LBS=F','/LBS','Lumber Futures'],
    ['RB=F','/RB','RBOB Gasoline Futures'],['HO=F','/HO','Heating Oil Futures'],['ZR=F','/ZR','Rough Rice Futures'],
    ['ZM=F','/ZM','Soybean Meal Futures'],['ZL=F','/ZL','Soybean Oil Futures'],['ZT=F','/ZT','2-Year U.S. Treasury Note Futures'],
  ].map(([symbol,display,name]) => ({ symbol, display, name, assetClass: 'FUTURES' as const, exchange: 'CME/ICE/COMEX/CBOT', country: 'United States' })),

  // Additional commodity benchmarks (mapped to verified liquid proxies)
  ...[
    ['ZC=F','CORN','Corn'],['ZW=F','WHEAT','Wheat'],['ZS=F','SOYBEANS','Soybeans'],['KC=F','COFFEE','Coffee'],
    ['SB=F','SUGAR','Sugar'],['CC=F','COCOA','Cocoa'],['CT=F','COTTON','Cotton'],['PL=F','PLATINUM','Platinum'],
    ['PA=F','PALLADIUM','Palladium'],['LE=F','CATTLE','Live Cattle'],
  ].map(([symbol,display,name]) => ({ symbol: `CMD:${display}`, display, name, assetClass: 'COMMODITY' as const, exchange: 'Global Commodity Market', country: 'Global', yahoo: symbol })),

  // Additional bond and Treasury benchmarks
  ...[
    ['VGSH','UST1-3Y','Vanguard Short-Term Treasury ETF'],['VGIT','UST3-10Y','Vanguard Intermediate-Term Treasury ETF'],
    ['VGLT','UST10Y+','Vanguard Long-Term Treasury ETF'],['GOVT','UST ALL','iShares U.S. Treasury Bond ETF'],
  ].map(([symbol,display,name]) => ({ symbol: `TREASURY:${display}`, display, name, assetClass: 'TREASURY' as const, exchange: 'U.S. Treasury Market', country: 'United States', yahoo: symbol })),
  ...[
    ['BIV','US INT BOND','Vanguard Intermediate-Term Bond ETF'],['VCIT','US CORP INT','Vanguard Intermediate-Term Corporate Bond ETF'],
    ['VCSH','US CORP SHORT','Vanguard Short-Term Corporate Bond ETF'],['SPTL','US LONG TREAS','SPDR Portfolio Long Term Treasury ETF'],
    ['SCHP','US TIPS','Schwab U.S. TIPS ETF'],['FLOT','US FLOAT','iShares Floating Rate Bond ETF'],
    ['BKLN','US LOANS','Invesco Senior Loan ETF'],['EMB','EM USD BOND','Emerging Markets USD Sovereign Bond ETF'],
    ['MUB','US MUNI','National Municipal Bond ETF'],['JNK','US HIGH YIELD','High-Yield Corporate Bond ETF'],
  ].map(([symbol,display,name]) => ({ symbol: `BOND:${display}`, display, name, assetClass: 'BOND' as const, exchange: 'U.S. Fixed Income', country: 'United States', yahoo: symbol })),

  // Major global indexes
  ...[
    ['^GSPC','SPX','S&P 500 Index'],['^DJI','DJIA','Dow Jones Industrial Average'],['^IXIC','COMP','Nasdaq Composite'],
    ['^RUT','RUT','Russell 2000 Index'],['^VIX','VIX','CBOE Volatility Index'],['^NDX','NDX','Nasdaq-100 Index'],
    ['^NYA','NYA','NYSE Composite'],['^FTSE','FTSE 100','FTSE 100 Index'],['^GDAXI','DAX','DAX Performance Index'],
    ['^FCHI','CAC 40','CAC 40 Index'],['^N225','NIKKEI 225','Nikkei 225 Index'],['^HSI','HANG SENG','Hang Seng Index'],
    ['000001.SS','SSE COMP','Shanghai Composite'],['^STOXX50E','EURO STOXX 50','EURO STOXX 50 Index'],
    ['^BVSP','BOVESPA','Bovespa Index'],['^AXJO','ASX 200','S&P/ASX 200 Index'],['^KS11','KOSPI','KOSPI Composite'],
    ['^BSESN','SENSEX','S&P BSE SENSEX'],
  ].map(([symbol,display,name]) => ({ symbol, display, name, assetClass: 'INDEX' as const, exchange: 'Global Index', country: 'Global', yahoo: symbol })),

  // Searchable option roots; live contracts and expirations must be discovered from the provider
  ...[
    ['SPY','SPY Options'],['QQQ','QQQ Options'],['IWM','IWM Options'],['AAPL','AAPL Options'],['MSFT','Microsoft Options'],
    ['NVDA','NVIDIA Options'],['TSLA','Tesla Options'],['AMZN','Amazon Options'],['META','Meta Options'],['GOOGL','Alphabet Options'],
    ['AMD','AMD Options'],['NFLX','Netflix Options'],
  ].map(([underlying,name]) => ({ symbol: `OPT:${underlying}`, display: `${underlying} OPT`, name: `${name} — contracts loaded dynamically`, assetClass: 'OPTION' as const, exchange: 'OPRA/CBOE', country: 'United States', yahoo: underlying })),
  ...[
    ['^GSPC','SPX','S&P 500 Index Options'],['^NDX','NDX','Nasdaq-100 Index Options'],['^VIX','VIX','CBOE Volatility Index Options'],
  ].map(([underlying,display,name]) => ({ symbol: `IDXOPT:${display}`, display: `${display} OPT`, name: `${name} — contracts loaded dynamically`, assetClass: 'INDEX_OPTION' as const, exchange: 'CBOE', country: 'United States', yahoo: underlying })),

  // Official macroeconomic series identifiers (FRED)
  ...[
    ['CPIAUCSL','Consumer Price Index'],['CPILFESL','Core Consumer Price Index'],['PCEPI','PCE Price Index'],
    ['PCEPILFE','Core PCE Price Index'],['UNRATE','U.S. Unemployment Rate'],['PAYEMS','U.S. Nonfarm Payrolls'],
    ['ICSA','Initial Unemployment Claims'],['GDP','U.S. Gross Domestic Product'],['GDPC1','Real U.S. Gross Domestic Product'],
    ['FEDFUNDS','Effective Federal Funds Rate'],['DGS2','2-Year Treasury Constant Maturity Rate'],['DGS10','10-Year Treasury Constant Maturity Rate'],
    ['T10Y2Y','10-Year Minus 2-Year Treasury Spread'],['M2SL','M2 Money Stock'],['INDPRO','Industrial Production Index'],
    ['RSAFS','Advance Retail Sales'],['HOUST','Housing Starts'],['UMCSENT','University of Michigan Consumer Sentiment'],
    ['VIXCLS','CBOE Volatility Index Close'],['BAMLH0A0HYM2','U.S. High Yield Option-Adjusted Spread'],
  ].map(([symbol,name]) => ({ symbol: `ECON:${symbol}`, display: symbol, name, assetClass: 'ECONOMIC_INDICATOR' as const, exchange: 'FRED / U.S. Government', country: 'United States', fred: symbol })),
];

function createInstrument(spec: CatalogSpec, index: number): NormalizedInstrument {
  const providerSymbol = spec.yahoo || spec.fred || spec.symbol;
  const assetSlug = spec.assetClass.toLowerCase();
  const isContinuous = spec.assetClass === 'CRYPTO' || spec.assetClass === 'CRYPTO_PAIR';
  const isFx = spec.assetClass === 'FOREX';
  const isFuture = spec.assetClass === 'FUTURES' || spec.assetClass === 'COMMODITY';
  return {
    instrumentId: `catalog_${assetSlug}_${index}_${spec.symbol.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    symbol: spec.symbol,
    displaySymbol: spec.display || spec.symbol,
    name: spec.name,
    assetClass: spec.assetClass,
    instrumentType: spec.assetClass === 'STOCK' ? 'Common Stock' : spec.assetClass === 'ADR' ? 'American Depositary Receipt' :
      spec.assetClass === 'ETF' ? 'Exchange-Traded Fund' : spec.assetClass === 'FUND' ? 'Mutual Fund' : spec.assetClass === 'INDEX' ? 'Market Index' :
      spec.assetClass === 'CRYPTO' || spec.assetClass === 'CRYPTO_PAIR' ? 'Spot Crypto Pair' : spec.assetClass === 'FOREX' ? 'Spot FX Pair' :
      spec.assetClass === 'FUTURES' ? 'Continuous Futures Contract' : spec.assetClass === 'BOND' ? 'Fixed-Income Benchmark' :
      spec.assetClass === 'TREASURY' ? 'Treasury Benchmark' : spec.assetClass === 'OPTION' ? 'Listed Option Root' :
      spec.assetClass === 'INDEX_OPTION' ? 'Index Option Root' : spec.assetClass === 'ECONOMIC_INDICATOR' ? 'Macroeconomic Series' : 'Commodity Benchmark',
    exchange: spec.exchange,
    country: spec.country || 'Global',
    currency: spec.currency || 'USD',
    providerSymbol,
    providerSymbols: { yahoo: spec.yahoo, massive: spec.massive, alpaca: spec.alpaca, fred: spec.fred },
    marketTimezone: isContinuous ? 'UTC' : 'America/New_York',
    tradingSession: spec.assetClass === 'ECONOMIC_INDICATOR' ? 'MACRO_SCHEDULED' : spec.assetClass === 'BOND' || spec.assetClass === 'TREASURY' ? 'BOND_SIFMA' :
      isContinuous ? 'CONTINUOUS_24_7' : isFx ? 'REGULAR_24_5' : isFuture ? 'US_FUTURES_CME' : 'US_EQUITIES_EXTENDED',
    activeStatus: 'ACTIVE',
    primaryProvider: spec.fred ? 'fred' : spec.alpaca ? 'alpaca' : spec.massive ? 'massive' : 'yahoo',
    realTimeStatus: spec.alpaca || spec.massive ? 'REAL_TIME' : 'DELAYED_15M',
    feedDelayMinutes: spec.alpaca || spec.massive ? 0 : 15,
    isEntitled: true,
    price: 0, change: 0, changePercent: 0, volume: 0, previousClose: 0,
    lastUpdated: new Date().toISOString(),
  };
}

export const ADDITIONAL_INSTRUMENTS: NormalizedInstrument[] = specs.map(createInstrument);
