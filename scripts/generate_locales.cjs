const fs = require('fs');
const path = require('path');

const en = {
  common: {
    live: "LIVE",
    delayed: "DELAYED",
    disconnected: "DISCONNECTED",
    reconnecting: "RECONNECTING",
    status: "Status",
    save: "Save Changes",
    saved: "Saved Successfully",
    cancel: "Cancel",
    close: "Close",
    search: "Search symbol, ETF, or company...",
    searchLanguage: "Search language / ภาษา / 语言...",
    refresh: "Refresh",
    loading: "Loading Market Data...",
    learnMore: "Learn More",
    viewDetails: "View Details",
    all: "All",
    active: "Active",
    paused: "Paused",
    triggered: "Triggered",
    filter: "Filter",
    export: "Export",
    share: "Share",
    copy: "Copy",
    copied: "Copied!",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    upgrade: "Upgrade to Pro",
    signIn: "Sign In",
    signOut: "Sign Out",
    signUp: "Sign Up",
    account: "Account",
    settings: "Settings",
    guest: "Guest Mode",
    etTimezone: "Eastern Time (ET)",
    localTimezone: "Local Time",
    back: "Back",
    next: "Next",
    submit: "Submit",
    retry: "Retry",
    viewAll: "View All",
    noData: "No data available",
    unavailable: "Unavailable",
    date: "Date",
    time: "Time",
    currency: "Currency",
    amount: "Amount",
    actions: "Actions",
    download: "Download",
    confirm: "Confirm",
    proceed: "Proceed",
    details: "Details",
    high: "High",
    low: "Low",
    open: "Open",
    volume: "Volume",
    price: "Price",
    change: "Change",
    changePercent: "Change %",
    marketCap: "Market Cap",
    confidence: "Confidence",
    verified: "Verified",
    calculated: "Calculated",
    estimated: "Estimated",
    consensus: "Consensus",
    clear: "Clear",
    reset: "Reset",
    apply: "Apply",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    inProgress: "In Progress"
  },
  nav: {
    overview: "Decision Center",
    research: "Deep Research",
    multiAsset: "Multi-Asset Markets",
    portfolio: "Connected Portfolio",
    chart: "Pro Chart",
    technical: "Technical Engine",
    supportResistance: "Pivots & Key Levels",
    breadth: "Breadth & Intermarket",
    heatmap: "Sector Heatmap",
    options: "Options Flow",
    economic: "Economic & Fed",
    news: "News Intelligence",
    community: "Community & Ideas",
    chat: "AI Market Analyst",
    simulator: "Trade Simulator",
    backtest: "Strategy Backtest",
    watchlists: "Watchlists",
    alerts: "Market Alerts",
    history: "Prediction History",
    reports: "Export Reports",
    help: "Help & Education",
    systemStatus: "Data Status",
    admin: "Admin Center"
  },
  dashboard: {
    marketDecisionCenter: "MARKET DECISION CENTER",
    aiMarketOutlook: "AI MARKET OUTLOOK",
    whyMovingTitle: "WHY IS IT MOVING?",
    whyMovingSubtitle: "Multi-factor quantitative and structural evidence engine",
    bullish: "BULLISH",
    bearish: "BEARISH",
    neutral: "NEUTRAL",
    bullishProbability: "Bullish Probability",
    bearishProbability: "Bearish Probability",
    neutralProbability: "Neutral Probability",
    setupQuality: "SETUP QUALITY",
    strongSetup: "STRONG SETUP",
    moderateSetup: "MODERATE SETUP",
    weakSetup: "WEAK SETUP",
    riskLevel: "RISK LEVEL",
    lowRisk: "LOW RISK",
    moderateRisk: "MODERATE RISK",
    highRisk: "HIGH RISK",
    extremeRisk: "EXTREME RISK",
    whyBullish: "WHY BULLISH?",
    whyBearish: "WHY BEARISH?",
    bullishFactors: "Bullish Evidence Factors",
    bearishFactors: "Bearish Warning Factors",
    confirmation: "CONFIRMATION",
    invalidation: "INVALIDATION",
    bullishConfirmation: "BULLISH CONFIRMATION",
    bearishConfirmation: "BEARISH CONFIRMATION",
    keySupport: "KEY SUPPORT",
    keyResistance: "KEY RESISTANCE",
    target1: "TARGET 1",
    target2: "TARGET 2",
    target3: "TARGET 3",
    waitForConfirmation: "WAIT FOR CONFIRMATION",
    similarSignals: "Similar Historical Signals",
    historicalSuccess: "Historical Success Rate",
    averageMove: "Average Realized Move",
    insufficientHistory: "INSUFFICIENT HISTORICAL DATA",
    tf15m: "15 MIN",
    tf1h: "1 HOUR",
    tfToday: "TODAY",
    tfNextDay: "NEXT DAY",
    tf5d: "5 DAYS",
    askInChat: "Ask AI Analyst to Explain",
    updatedAt: "Updated at",
    dayHigh: "Day High",
    dayLow: "Day Low",
    prevClose: "Prev Close",
    relVol: "Rel Vol",
    latency: "Latency",
    bias: "BIAS",
    aiConfidence: "AI Confidence",
    matchingSymbols: "MATCHING MARKET SYMBOLS"
  },
  chart: {
    title: "Real-Time Institutional Chart",
    indicators: "Indicators",
    overlays: "Overlays",
    vwap: "VWAP",
    ema9: "9 EMA",
    ema20: "20 EMA",
    ema50: "50 EMA",
    ema200: "200 EMA",
    sma20: "20 SMA",
    sma50: "50 SMA",
    sma200: "200 SMA",
    bollinger: "Bollinger Bands",
    supportResistance: "Support & Resistance",
    pdh: "Previous Day High (PDH)",
    pdl: "Previous Day Low (PDL)",
    pmh: "Premarket High (PMH)",
    pml: "Premarket Low (PML)",
    orh: "Opening Range High (ORH)",
    orl: "Opening Range Low (ORL)",
    volume: "Volume Sub-Pane",
    rsi: "RSI (14)",
    macd: "MACD (12,26,9)",
    crosshair: "Crosshair",
    extendedHours: "Extended Hours (ETH)",
    timeframe: "Timeframe"
  },
  signalEngine: {
    title: "TRANSPARENT SIGNAL ENGINE",
    technical: "Technical Analysis",
    priceAction: "Price Action & Structure",
    volume: "Volume & Institutional Flow",
    breadth: "Market Breadth",
    options: "Options Sentiment",
    macro: "Macro & Intermarket",
    news: "News Sentiment",
    sector: "Sector Leadership",
    confidenceBreakdown: "Confidence Score Breakdown",
    evidenceWeight: "Evidence Weighting"
  },
  aiAnalyst: {
    title: "AI Market Analyst",
    subtitle: "Powered by Gemini with real-time multi-factor market context",
    inputPlaceholder: "Ask a market question (e.g. Why is SPY moving?)...",
    askButton: "Analyze",
    translateButton: "Translate to My Language",
    viewOriginal: "View Original",
    beginnerMode: "Beginner Mode",
    standardMode: "Standard Mode",
    advancedMode: "Advanced Quant Mode",
    suggestedQuestions: "Suggested Questions",
    disclaimer: "AI interpretations are based on mathematical models and should be combined with your own risk management.",
    analyzing: "Analyzing market data...",
    sourceVerified: "Verified Market Evidence"
  },
  research: {
    workspaceTitle: "INSTITUTIONAL DEEP RESEARCH",
    workspaceSubtitle: "Evidence-grounded fundamental, macro, and SEC regulatory intelligence",
    newResearch: "New Deep Research",
    searchPlaceholder: "Enter research thesis or question (e.g. 'NVDA AI capex sustainability', 'MSFT vs GOOGL cloud margins')...",
    startResearch: "Run Deep Research",
    activeResearchJob: "Active Research Pipeline",
    jobStatus: {
      queued: "Queued",
      planning: "Planning Methodology",
      collecting_sources: "Retrieving Authoritative Sources",
      extracting_claims: "Extracting Financial Claims",
      verifying: "Verifying SEC Filings & Citations",
      analyzing: "Cross-Factor Risk Modeling",
      synthesizing: "Gemini Evidence Synthesis",
      completed: "Report Completed",
      failed: "Pipeline Error",
      cancelled: "Cancelled"
    },
    tabs: {
      overview: "Executive Overview",
      thesis: "Bull vs Bear Debate",
      filings: "SEC Filings (10-K/10-Q)",
      financials: "Financial Metrics & DCF",
      scenarios: "Scenario Sensitivity",
      comparison: "Peer Comparison",
      macro: "Macro & Fed Impact",
      citations: "Sources & Citations",
      memo: "Investment Memo"
    },
    executiveSummary: "Executive Summary",
    bullThesis: "Institutional Bull Thesis",
    bearThesis: "Institutional Bear Thesis",
    keyCatalysts: "Upcoming Catalysts",
    keyRisks: "Structural & Regulatory Risks",
    valuationTitle: "Valuation & Consensus Metrics",
    secAnalysisTitle: "SEC Edgar Filing Audit",
    macroSensitivityTitle: "Macro & Monetary Sensitivity",
    competitorComparisonTitle: "Multi-Company Competitive Matrix",
    whatToMonitorNextTitle: "What To Monitor Next",
    sourcesAndCitationsTitle: "Verified Sources & Primary Citations",
    tier1Sources: "Tier 1: Regulatory & Central Banks",
    tier2Sources: "Tier 2: Verified Exchange Feeds",
    tier3Sources: "Tier 3: Institutional Financial News",
    confidenceScore: "Evidence Confidence Score",
    dataFreshness: "Data Freshness",
    exportPdf: "Export PDF Report",
    shareReport: "Share Report",
    saveNote: "Save Research Note",
    addWatchlist: "Add to Research Watchlist"
  },
  options: {
    title: "Institutional Options Flow & Chain",
    subtitle: "Real-time volatility skew, Greeks surface, and zero-DTE risk modeling",
    chain: "Options Chain",
    strategyBuilder: "Strategy Builder",
    payoffChart: "Payoff Diagram",
    plSimulator: "P&L Simulator",
    contractAnalyzer: "Contract Analyzer",
    journal: "Options Trade Journal",
    orderTicket: "Order Ticket",
    zeroDteRisk: "Zero-DTE Risk Guard",
    strike: "Strike",
    call: "CALL",
    put: "PUT",
    calls: "Calls",
    puts: "Puts",
    bid: "Bid",
    ask: "Ask",
    last: "Last",
    volume: "Volume",
    openInterest: "Open Interest (OI)",
    impliedVol: "IV (%)",
    delta: "Delta (Δ)",
    gamma: "Gamma (Γ)",
    theta: "Theta (Θ)",
    vega: "Vega (ν)",
    putCallRatio: "Put/Call Ratio",
    orderType: "Order Type",
    limit: "Limit",
    market: "Market",
    buyToOpen: "Buy to Open",
    sellToOpen: "Sell to Open",
    buyToClose: "Buy to Close",
    sellToClose: "Sell to Close",
    previewOrder: "Preview Order",
    submitOrder: "Submit Order",
    paperTrade: "Submit Paper Trade",
    riskWarning: "Options involve significant risk and are not suitable for all investors."
  },
  portfolio: {
    title: "Connected Brokerage & Holdings",
    subtitle: "Consolidated multi-broker portfolio intelligence and automated risk exposure",
    connectBroker: "Connect Broker",
    syncHoldings: "Sync Holdings",
    totalValue: "Total Portfolio Value",
    dayChange: "Today's P&L",
    unrealizedPl: "Unrealized P&L",
    cashBalance: "Cash Balance",
    buyingPower: "Buying Power",
    portfolioBeta: "Portfolio Beta (vs SPY)",
    riskScore: "Risk Concentration Score",
    holdings: "Holdings & Allocations",
    symbol: "Symbol",
    quantity: "Qty",
    avgCost: "Avg Cost",
    currentValue: "Market Value",
    weight: "Weight",
    aiExposureQuery: "Ask AI About Portfolio Exposure",
    noBrokersConnected: "No brokerages linked yet. Connect Alpaca, Interactive Brokers, or Robinhood."
  },
  billing: {
    title: "Subscription & Entitlements",
    subtitle: "Choose your institutional financial intelligence tier",
    freePlan: "Starter Tier",
    proPlan: "Pro Institutional",
    enterprisePlan: "Enterprise Hedge Fund",
    monthly: "Monthly",
    annual: "Annual (Save 20%)",
    currentPlan: "Current Plan",
    activeSubscription: "Active Subscription",
    upgradeNow: "Upgrade Now",
    startTrial: "Start 7-Day Free Trial",
    manageBilling: "Manage Subscription in Stripe",
    billingHistory: "Billing & Invoices",
    features: "Tier Capabilities",
    featuresList: {
      proDeepResearch: "Unlimited Deep Research Reports",
      proLiveWs: "Sub-50ms Real-Time Institutional Feed",
      proOptionsAi: "AI Options Flow & Greeks Simulator",
      proSecEdgar: "Real-time SEC 10-K/10-Q & 8-K Parser",
      proPdfExport: "Full Localized PDF Institutional Exports"
    },
    cancelSubscription: "Cancel Subscription",
    secureCheckout: "Encrypted 256-bit Stripe Secure Checkout"
  },
  community: {
    title: "MarketMind Trader Community",
    subtitle: "Share verified analyses, debate theses, and follow quantitative traders",
    newPost: "Share Market Insight",
    composerPlaceholder: "Share trade thesis, setup, or research note (use $TICKER)...",
    post: "Post",
    repost: "Repost",
    quoteRepost: "Quote Repost",
    comment: "Comment",
    like: "Like",
    liked: "Liked",
    bookmark: "Bookmark",
    follow: "Follow",
    following: "Following",
    followers: "Followers",
    verifiedTrader: "Verified Trader",
    guidelines: "Community Guidelines",
    safetyWarning: "No financial manipulation, spam, or unsubstantiated pump-and-dump claims permitted."
  },
  alerts: {
    title: "Market Intelligence Alerts",
    subtitle: "Algorithmic breakout, VWAP cross, volatility spike, and news triggers",
    createAlert: "Create Smart Alert",
    activeAlerts: "Active Alert Triggers",
    savedAlerts: "Saved Watchlist Alerts",
    alertType: "Trigger Condition",
    breakout: "Price Breakout above Resistance",
    breakdown: "Price Breakdown below Support",
    vwapCross: "Session VWAP Cross",
    unusualVolume: "Unusual Institutional Volume (>2x)",
    earningsTrigger: "Earnings Announcement Approach",
    severity: "Priority",
    info: "Info",
    warning: "Warning",
    critical: "Critical",
    notifications: "Notification Center",
    markAllRead: "Mark All Read"
  },
  market: {
    multiAssetTitle: "Multi-Asset Global Markets",
    multiAssetSubtitle: "Institutional cross-asset directory, live quotes, and sector leadership",
    assetClasses: {
      all: "All Asset Classes",
      equities: "Equities & Stocks",
      crypto: "Cryptocurrencies",
      forex: "Foreign Exchange (FX)",
      commodities: "Commodities & Metals",
      indices: "Indices & ETFs"
    },
    exchanges: {
      us: "US Markets (NYSE / NASDAQ)",
      eu: "European Exchanges (LSE, Euronext, XETRA)",
      asia: "Asian Markets (TSE, HKEX, SET, SGX)",
      crypto: "Global 24/7 Digital Assets"
    },
    statusLabels: {
      open: "Market Open",
      closed: "Market Closed",
      preMarket: "Pre-Market",
      afterHours: "After Hours",
      realTime: "Real-Time Verified",
      delayed: "Delayed 15m",
      endOfDay: "End of Day Close",
      unavailable: "Feed Offline"
    },
    searchTape: "LIVE MARKET TAPE",
    scanner: "Global Asset Scanner"
  },
  news: {
    title: "Financial News & Macro Intelligence",
    subtitle: "Filtered verified sources, real-time sentiment scoring, and breaking market events",
    breaking: "BREAKING NEWS",
    aiBrief: "AI MORNING & EOD BRIEF",
    economicCalendar: "Economic Calendar & FOMC",
    earningsCalendar: "Earnings Intelligence",
    whyMoving: "Why Is This Moving?",
    sentiment: "Sentiment",
    bullishSentiment: "Bullish Flow",
    bearishSentiment: "Bearish Friction",
    neutralSentiment: "Neutral Context",
    filterSources: "Verified Sources",
    savedArticles: "Bookmarked News"
  },
  settings: {
    title: "Account & Terminal Settings",
    subtitle: "Manage profile, strategy preferences, language and global localization",
    tabs: {
      profile: "Profile & Strategy",
      global: "Language & Region",
      notifications: "Notifications & Alerts",
      api: "API Keys & Feeds",
      security: "Security & 2FA"
    },
    globalPreferences: "GLOBAL LOCALIZATION & PREFERENCES",
    language: "Interface Language",
    languageHelp: "Select your preferred language for the terminal interface",
    region: "Home Region",
    regionHelp: "Adjusts localized calendar, regulatory context and primary benchmarks",
    timezone: "Display Timezone",
    timezoneHelp: "Select your local timezone alongside Eastern Time (ET)",
    currency: "Display Currency",
    currencyHelp: "Securities display in their native market currency with optional conversion",
    primaryMarket: "Primary Market Focus",
    primaryMarketHelp: "Default exchange benchmark for initial dashboard load",
    aiResponseLanguage: "AI Response Language",
    aiResponseLanguageHelp: "Gemini will provide market analysis and reasoning in this language",
    dateFormat: "Date Format",
    numberFormat: "Number Format",
    savePreferences: "Save Global Preferences",
    resetDefaults: "Reset to Defaults"
  },
  auth: {
    titleSignIn: "Sign In to MarketMind",
    titleSignUp: "Create Your Account",
    guestNotice: "You are exploring in Guest Mode. Sign in to sync watchlists, brokerages, and alerts across devices.",
    email: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    forgotPassword: "Forgot Password?",
    rememberMe: "Remember Me",
    orContinueWith: "Or continue with",
    continueAsGuest: "Continue as Guest",
    alreadyHaveAccount: "Already have an account? Sign In",
    dontHaveAccount: "Don't have an account? Sign Up",
    termsAgree: "By continuing you agree to MarketMind Terms of Service and Privacy Policy.",
    errorInvalidCredentials: "Invalid email or password combination.",
    errorUserNotFound: "User account not found.",
    errorEmailInUse: "Email address is already registered.",
    errorWeakPassword: "Password must contain at least 6 characters."
  },
  errors: {
    authRequired: "Authentication required to access this feature.",
    unauthorized: "Unauthorized request. Please sign in.",
    forbidden: "Access forbidden. Subscription upgrade required.",
    rateLimited: "Rate limit exceeded. Please wait a moment before trying again.",
    dataUnavailable: "Market data feed is temporarily unavailable for this symbol.",
    researchFailed: "Deep research execution failed. Please verify ticker and try again.",
    networkError: "Network connection lost. Reconnecting to terminal feeds...",
    invalidRequest: "Invalid request parameters.",
    paymentRequired: "Active Pro subscription required.",
    notFound: "Requested resource or ticker was not found.",
    internalError: "An unexpected server error occurred.",
    sessionExpired: "Session expired. Please sign in again.",
    genericError: "An unexpected error occurred. Please try again."
  },
  disclaimer: {
    title: "Risk & Regulatory Disclosure",
    text: "MarketMind provides algorithmic probability modeling and market data visualization for educational and analytical purposes only. Trading involves substantial risk of loss and is not suitable for every investor.",
    aiNotice: "AI market explanations are generated from structured quantitative indicators and do not constitute financial advice.",
    secNotice: "SEC filings and regulatory disclosures are sourced directly from public EDGAR records."
  },
  onboarding: {
    welcome: "Welcome to MarketMind AI",
    subtitle: "Next-generation institutional financial intelligence and multi-factor decision engine",
    fastOnboardingTitle: "Personalize Your Terminal Experience",
    tradingStyle: "Primary Trading Style",
    experienceLevel: "Market Experience Level",
    primaryAsset: "Primary Focus Asset Class",
    getStarted: "Launch MarketMind Terminal",
    tour: {
      step1Title: "Decision Center",
      step1Desc: "Synthesizes real-time price action, volume, VWAP, and quantitative bias into actionable probabilities.",
      step2Title: "Real-Time Institutional Chart",
      step2Desc: "Interactive candlestick chart with automated institutional pivot levels, VWAP bands, and indicators.",
      step3Title: "Deep Research Workspace",
      step3Desc: "Comprehensive institutional fundamental research grounded in authoritative SEC filings and macro data.",
      step4Title: "AI Market Analyst",
      step4Desc: "Ask complex market questions in any language and receive verified quantitative answers powered by Gemini."
    }
  },
  export: {
    title: "Institutional Research & PDF Reports",
    subtitle: "Generate institutional-grade PDF reports and morning briefs in your selected language",
    downloadPdf: "Download PDF Report",
    generateBrief: "Generate Morning Market Brief",
    eodBrief: "Generate End-of-Day Wrap",
    deepResearchMemo: "Full Deep Research Dossier",
    confidentiality: "CONFIDENTIAL & PROPRIETARY — FOR PROFESSIONAL USE ONLY",
    generatedAt: "Generated On",
    preparedBy: "MarketMind AI Quantitative Research",
    legalNotice: "Past performance does not guarantee future results. MarketMind models are for informational analysis only."
  },
  support: {
    contactTitle: "Contact Support & Client Services",
    helpCenterTitle: "Help Center & Documentation",
    reportIssueTitle: "Report Data or Market Issue",
    submitTicket: "Submit Support Ticket",
    feedback: "Submit Product Feedback",
    systemStatus: "Live Systems & Data Health"
  }
};

// Complete translation maps for other locales:
const locales = ['es', 'th', 'zh-CN', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'pt', 'vi', 'hi', 'ar', 'it'];

// Helper to deeply translate/localize keys based on curated financial terminology dictionaries
const translations = {
  th: {
    common: {
      live: "เรียลไทม์",
      delayed: "ดีเลย์",
      disconnected: "ไม่ได้เชื่อมต่อ",
      reconnecting: "กำลังเชื่อมต่อใหม่",
      status: "สถานะ",
      save: "บันทึกการเปลี่ยนแปลง",
      saved: "บันทึกสำเร็จ",
      cancel: "ยกเลิก",
      close: "ปิด",
      search: "ค้นหาหุ้น, ETF, หรือบริษัท...",
      searchLanguage: "ค้นหาภาษา / Search language...",
      refresh: "รีเฟรช",
      loading: "กำลังโหลดข้อมูลตลาด...",
      learnMore: "เรียนรู้เพิ่มเติม",
      viewDetails: "ดูรายละเอียด",
      all: "ทั้งหมด",
      active: "เปิดใช้งาน",
      paused: "หยุดชั่วคราว",
      triggered: "ถูกกระตุ้นแล้ว",
      filter: "ตัวกรอง",
      export: "ส่งออก",
      share: "แชร์",
      copy: "คัดลอก",
      copied: "คัดลอกแล้ว!",
      delete: "ลบ",
      edit: "แก้ไข",
      create: "สร้าง",
      upgrade: "อัปเกรดเป็น Pro",
      signIn: "เข้าสู่ระบบ",
      signOut: "ออกจากระบบ",
      signUp: "สมัครสมาชิก",
      account: "บัญชี",
      settings: "การตั้งค่า",
      guest: "โหมดผู้เยี่ยมชม",
      etTimezone: "เวลาฝั่งตะวันออก (ET)",
      localTimezone: "เวลาท้องถิ่น",
      back: "ย้อนกลับ",
      next: "ถัดไป",
      submit: "ส่งข้อมูล",
      retry: "ลองใหม่อีกครั้ง",
      viewAll: "ดูทั้งหมด",
      noData: "ไม่มีข้อมูล",
      unavailable: "ไม่พร้อมใช้งาน",
      date: "วันที่",
      time: "เวลา",
      currency: "สกุลเงิน",
      amount: "จำนวน",
      actions: "การดำเนินการ",
      download: "ดาวน์โหลด",
      confirm: "ยืนยัน",
      proceed: "ดำเนินการต่อ",
      details: "รายละเอียด",
      high: "สูงสุด",
      low: "ต่ำสุด",
      open: "ราคาเปิด",
      volume: "ปริมาณการซื้อขาย",
      price: "ราคา",
      change: "เปลี่ยนแปลง",
      changePercent: "เปลี่ยนแปลง %",
      marketCap: "มูลค่าหลักทรัพย์ตามราคาตลาด",
      confidence: "ความเชื่อมั่น",
      verified: "ตรวจสอบแล้ว",
      calculated: "คำนวณแล้ว",
      estimated: "ประมาณการ",
      consensus: "ฉันทามติ",
      clear: "ล้างข้อมูล",
      reset: "รีเซ็ต",
      apply: "นำไปใช้",
      completed: "เสร็จสมบูรณ์",
      failed: "ล้มเหลว",
      pending: "รอดำเนินการ",
      inProgress: "กำลังดำเนินการ"
    },
    nav: {
      overview: "ศูนย์การตัดสินใจ",
      research: "งานวิจัยเชิงลึก (Deep Research)",
      multiAsset: "ตลาดสินทรัพย์หลากหลาย",
      portfolio: "พอร์ตการลงทุนที่เชื่อมต่อ",
      chart: "กราฟสถาบันระดับ Pro",
      technical: "เครื่องมือวิเคราะห์เชิงเทคนิค",
      supportResistance: "จุด Pivot และแนวรับ-แนวต้าน",
      breadth: "ความกว้างของตลาดและข้ามสินทรัพย์",
      heatmap: "แผนที่ความร้อนรายกลุ่มอุตสาหกรรม",
      options: "กระแส Options และ Greeks",
      economic: "ตัวชี้วัดเศรษฐกิจและ Fed",
      news: "ข่าวกรองทางการเงินอัจฉริยะ",
      community: "ชุมชนนักเทรดและไอเดีย",
      chat: "นักวิเคราะห์ AI ประจำตลาด",
      simulator: "แบบจำลองการเทรด",
      backtest: "ทดสอบย้อนหลังกลยุทธ์",
      watchlists: "รายการเฝ้าดู",
      alerts: "การแจ้งเตือนตลาด",
      history: "ประวัติการคาดการณ์",
      reports: "ส่งออกรายงานสรุป",
      help: "ศูนย์ช่วยเหลือและการเรียนรู้",
      systemStatus: "สถานะข้อมูลและระบบ",
      admin: "ศูนย์ควบคุมผู้ดูแลระบบ"
    },
    dashboard: {
      marketDecisionCenter: "ศูนย์การตัดสินใจของตลาด (DECISION CENTER)",
      aiMarketOutlook: "มุมมองตลาดโดย AI",
      whyMovingTitle: "ทำไมราคาถึงเคลื่อนไหว? (WHY IS IT MOVING?)",
      whyMovingSubtitle: "เครื่องยนต์หลักฐานเชิงปริมาณและโครงสร้างราคาหลายมิติ",
      bullish: "ขาขึ้น (BULLISH)",
      bearish: "ขาลง (BEARISH)",
      neutral: "เป็นกลาง (NEUTRAL)",
      bullishProbability: "ความน่าจะเป็นขาขึ้น",
      bearishProbability: "ความน่าจะเป็นขาลง",
      neutralProbability: "ความน่าจะเป็นเป็นกลาง",
      setupQuality: "คุณภาพของเซ็ตอัพ",
      strongSetup: "เซ็ตอัพแข็งแกร่ง (STRONG SETUP)",
      moderateSetup: "เซ็ตอัพปานกลาง (MODERATE SETUP)",
      weakSetup: "เซ็ตอัพอ่อน (WEAK SETUP)",
      riskLevel: "ระดับความเสี่ยง",
      lowRisk: "ความเสี่ยงต่ำ",
      moderateRisk: "ความเสี่ยงปานกลาง",
      highRisk: "ความเสี่ยงสูง",
      extremeRisk: "ความเสี่ยงรุนแรง",
      whyBullish: "ทำไมถึงมองขาขึ้น?",
      whyBearish: "ทำไมถึงมองขาลง?",
      bullishFactors: "ปัจจัยสนับสนุนขาขึ้น",
      bearishFactors: "ปัจจัยเตือนระวังขาลง",
      confirmation: "จุดยืนยันสัญญาณ",
      invalidation: "จุดยกเลิกสัญญาณ",
      bullishConfirmation: "จุดยืนยันขาขึ้น",
      bearishConfirmation: "จุดยืนยันขาลง",
      keySupport: "แนวรับสำคัญ",
      keyResistance: "แนวต้านสำคัญ",
      target1: "เป้าหมายที่ 1",
      target2: "เป้าหมายที่ 2",
      target3: "เป้าหมายที่ 3",
      waitForConfirmation: "รอการยืนยันสัญญาณ",
      similarSignals: "สัญญาณในอดีตที่คล้ายกัน",
      historicalSuccess: "อัตราความสำเร็จในอดีต",
      averageMove: "การเคลื่อนไหวเฉลี่ยจริง",
      insufficientHistory: "ข้อมูลในอดีตไม่เพียงพอ",
      tf15m: "15 นาที",
      tf1h: "1 ชั่วโมง",
      tfToday: "วันนี้",
      tfNextDay: "วันถัดไป",
      tf5d: "5 วัน",
      askInChat: "ให้นักวิเคราะห์ AI อธิบายเพิ่มเติม",
      updatedAt: "อัปเดตเมื่อ",
      dayHigh: "ราคาสูงสุดของวัน",
      dayLow: "ราคาต่ำสุดของวัน",
      prevClose: "ราคาปิดวันก่อนหน้า",
      relVol: "ปริมาณสัมพัทธ์ (Rel Vol)",
      latency: "ความหน่วง",
      bias: "ทิศทางหลัก",
      aiConfidence: "ความเชื่อมั่นของ AI",
      matchingSymbols: "สัญลักษณ์ที่ตรงกันในตลาด"
    },
    research: {
      workspaceTitle: "งานวิจัยเชิงลึกระดับสถาบัน (DEEP RESEARCH)",
      workspaceSubtitle: "ข้อมูลปัจจัยพื้นฐาน มหภาค และเอกสาร SEC ที่มีหลักฐานอ้างอิงชัดเจน",
      newResearch: "สร้างงานวิจัยใหม่",
      searchPlaceholder: "ป้อนสมมติฐานหรือคำถามวิจัย (เช่น 'ความยั่งยืนของงบลงทุน AI ของ NVDA')...",
      startResearch: "เริ่มการวิจัยเชิงลึก",
      activeResearchJob: "ขั้นตอนการประมวลผลวิจัย",
      jobStatus: {
        queued: "อยู่ในคิว",
        planning: "วางแผนระเบียบวิธีวิจัย",
        collecting_sources: "กำลังรวบรวมแหล่งข้อมูลที่น่าเชื่อถือ",
        extracting_claims: "กำลังสกัดข้อเท็จจริงทางการเงิน",
        verifying: "กำลังตรวจสอบกับเอกสาร SEC และแหล่งอ้างอิง",
        analyzing: "กำลังจำลองความเสี่ยงหลายปัจจัย",
        synthesizing: "สังเคราะห์หลักฐานด้วย Gemini",
        completed: "สร้างรายงานเสร็จสมบูรณ์",
        failed: "เกิดข้อผิดพลาดในขั้นตอนวิจัย",
        cancelled: "ยกเลิกแล้ว"
      },
      tabs: {
        overview: "บทสรุปสำหรับผู้บริหาร",
        thesis: "การอภิปราย Bull vs Bear",
        filings: "เอกสาร SEC (10-K/10-Q)",
        financials: "เมทริกซ์การเงินและ DCF",
        scenarios: "การวิเคราะห์สถานการณ์จำลอง",
        comparison: "เปรียบเทียบคู่แข่งในอุตสาหกรรม",
        macro: "ผลกระทบเศรษฐกิจมหภาคและ Fed",
        citations: "แหล่งข้อมูลและการอ้างอิง",
        memo: "บันทึกข้อเสนอการลงทุน (Memo)"
      },
      executiveSummary: "บทสรุปสำหรับผู้บริหาร (Executive Summary)",
      bullThesis: "วิทยานิพนธ์เชิงบวกระดับสถาบัน (Bull Thesis)",
      bearThesis: "วิทยานิพนธ์เชิงลบระดับสถาบัน (Bear Thesis)",
      keyCatalysts: "ตัวเร่งปฏิกิริยาสำคัญที่กำลังจะมาถึง",
      keyRisks: "ความเสี่ยงเชิงโครงสร้างและกฎระเบียบ",
      valuationTitle: "การประเมินมูลค่าและฉันทามติตลาด",
      secAnalysisTitle: "การตรวจสอบเอกสาร SEC EDGAR",
      macroSensitivityTitle: "ความอ่อนไหวต่อเศรษฐกิจมหภาคและนโยบายการเงิน",
      competitorComparisonTitle: "ตารางเปรียบเทียบเชิงแข่งขันหลายบริษัท",
      whatToMonitorNextTitle: "ประเด็นที่ต้องติดตามถัดไป",
      sourcesAndCitationsTitle: "แหล่งข้อมูลที่ผ่านการตรวจสอบและการอ้างอิงปฐมภูมิ",
      tier1Sources: "ระดับ 1: หน่วยงานกำกับดูแลและธนาคารกลาง",
      tier2Sources: "ระดับ 2: ฟีดข้อมูลตลาดหลักทรัพย์ที่ผ่านการรับรอง",
      tier3Sources: "ระดับ 3: สื่อข่าวการเงินสถาบันชั้นนำ",
      confidenceScore: "คะแนนความเชื่อมั่นของหลักฐาน",
      dataFreshness: "ความสดใหม่ของข้อมูล",
      exportPdf: "ส่งออกรายงาน PDF",
      shareReport: "แชร์รายงาน",
      saveNote: "บันทึกโน้ตวิจัย",
      addWatchlist: "เพิ่มในรายการเฝ้าดูวิจัย"
    },
    options: {
      title: "กระแส Options และ Options Chain ระดับสถาบัน",
      subtitle: "ความชันความผันผวนแบบเรียลไทม์ พื้นผิว Greeks และแบบจำลองความเสี่ยง 0-DTE",
      chain: "ตาราง Options Chain",
      strategyBuilder: "เครื่องมือสร้างกลยุทธ์",
      payoffChart: "แผนภาพผลตอบแทน (Payoff)",
      plSimulator: "แบบจำลองกำไร-ขาดทุน (P&L)",
      contractAnalyzer: "ตัววิเคราะห์สัญญาออปชัน",
      journal: "สมุดบันทึกการเทรด Options",
      orderTicket: "ตั๋วส่งคำสั่งซื้อขาย",
      zeroDteRisk: "ระบบป้องกันความเสี่ยง 0-DTE",
      strike: "ราคาใช้สิทธิ (Strike)",
      call: "CALL",
      put: "PUT",
      calls: "สัญญาคอล (Calls)",
      puts: "สัญญาพุท (Puts)",
      bid: "ราคาเสนอซื้อ (Bid)",
      ask: "ราคาเสนอขาย (Ask)",
      last: "ราคาล่าสุด",
      volume: "ปริมาณ",
      openInterest: "สถานะคงค้าง (OI)",
      impliedVol: "IV (%)",
      delta: "เดลต้า (Δ)",
      gamma: "แกมมา (Γ)",
      theta: "เธตา (Θ)",
      vega: "เวกา (ν)",
      putCallRatio: "อัตราส่วน Put/Call",
      orderType: "ประเภทคำสั่ง",
      limit: "กำหนดราคา (Limit)",
      market: "ราคาตลาด (Market)",
      buyToOpen: "ซื้อเพื่อเปิดสถานะ (Buy to Open)",
      sellToOpen: "ขายเพื่อเปิดสถานะ (Sell to Open)",
      buyToClose: "ซื้อเพื่อปิดสถานะ (Buy to Close)",
      sellToClose: "ขายเพื่อปิดสถานะ (Sell to Close)",
      previewOrder: "ตรวจสอบคำสั่งก่อนส่ง",
      submitOrder: "ส่งคำสั่งซื้อขาย",
      paperTrade: "ส่งคำสั่งจำลอง (Paper Trade)",
      riskWarning: "Options มีความเสี่ยงสูงมากและอาจไม่เหมาะสำหรับนักลงทุนทุกคน"
    },
    portfolio: {
      title: "พอร์ตการลงทุนและโบรกเกอร์ที่เชื่อมต่อ",
      subtitle: "รวมศูนย์ข้อมูลพอร์ตหลายโบรกเกอร์และการวิเคราะห์ความเสี่ยงอัตโนมัติ",
      connectBroker: "เชื่อมต่อโบรกเกอร์",
      syncHoldings: "ซิงค์สินทรัพย์ที่ถือครอง",
      totalValue: "มูลค่าพอร์ตรวม",
      dayChange: "กำไร/ขาดทุนวันนี้",
      unrealizedPl: "กำไร/ขาดทุนที่ยังไม่เกิดขึ้นจริง",
      cashBalance: "ยอดเงินสดคงเหลือ",
      buyingPower: "อำนาจซื้อ",
      portfolioBeta: "ค่าเบต้าของพอร์ต (เทียบ SPY)",
      riskScore: "คะแนนความกระจุกตัวของความเสี่ยง",
      holdings: "สินทรัพย์และการกระจายการลงทุน",
      symbol: "สัญลักษณ์",
      quantity: "จำนวน",
      avgCost: "ต้นทุนเฉลี่ย",
      currentValue: "มูลค่าตลาดปัจจุบัน",
      weight: "สัดส่วน %",
      aiExposureQuery: "ถาม AI เกี่ยวกับการกระจายความเสี่ยงของพอร์ต",
      noBrokersConnected: "ยังไม่ได้เชื่อมต่อโบรกเกอร์ เชื่อมต่อ Alpaca, Interactive Brokers หรือ Robinhood"
    },
    billing: {
      title: "การสมัครสมาชิกและสิทธิ์การใช้งาน",
      subtitle: "เลือกระดับความสามารถการวิเคราะห์ทางการเงินสำหรับคุณ",
      freePlan: "ระดับเริ่มต้น (Starter)",
      proPlan: "ระดับสถาบันมืออาชีพ (Pro Institutional)",
      enterprisePlan: "ระดับกองทุนเฮดจ์ฟันด์ (Enterprise Hedge Fund)",
      monthly: "รายเดือน",
      annual: "รายปี (ประหยัด 20%)",
      currentPlan: "แพ็กเกจปัจจุบัน",
      activeSubscription: "การสมัครสมาชิกที่เปิดใช้งานอยู่",
      upgradeNow: "อัปเกรดเลยตอนนี้",
      startTrial: "เริ่มทดลองใช้ฟรี 7 วัน",
      manageBilling: "จัดการการชำระเงินใน Stripe",
      billingHistory: "ประวัติการชำระเงินและใบเสร็จ",
      features: "ความสามารถของแพ็กเกจ",
      featuresList: {
        proDeepResearch: "สร้างรายงาน Deep Research ได้ไม่จำกัด",
        proLiveWs: "ฟีดข้อมูลสถาบันแบบเรียลไทม์ความหน่วงต่ำ <50ms",
        proOptionsAi: "เครื่องจำลอง AI Options Flow & Greeks",
        proSecEdgar: "ระบบอ่านเอกสาร SEC 10-K/10-Q & 8-K เรียลไทม์",
        proPdfExport: "ส่งออกรายงาน PDF ระดับสถาบันฉบับเต็ม"
      },
      cancelSubscription: "ยกเลิกการสมัครสมาชิก",
      secureCheckout: "การชำระเงินปลอดภัยผ่าน Stripe เข้ารหัส 256-bit"
    },
    community: {
      title: "ชุมชนนักเทรด MarketMind",
      subtitle: "แบ่งปันบทวิเคราะห์ที่ผ่านการตรวจสอบ อภิปรายสมมติฐาน และติดตามนักเทรดเชิงปริมาณ",
      newPost: "แบ่งปันมุมมองตลาด",
      composerPlaceholder: "แบ่งปันสมมติฐานการเทรด เซ็ตอัพ หรือโน้ตวิจัย (ระบุ $TICKER)...",
      post: "โพสต์",
      repost: "รีโพสต์",
      quoteRepost: "อ้างอิงรีโพสต์",
      comment: "ความคิดเห็น",
      like: "ถูกใจ",
      liked: "ถูกใจแล้ว",
      bookmark: "บุ๊กมาร์ก",
      follow: "ติดตาม",
      following: "กำลังติดตาม",
      followers: "ผู้ติดตาม",
      verifiedTrader: "นักเทรดที่ผ่านการยืนยันตัวตน",
      guidelines: "แนวทางปฏิบัติของชุมชน",
      safetyWarning: "ห้ามสร้างข้อมูลเท็จ ปั่นราคาหุ้น หรือชักชวนลงทุนที่ผิดกฎหมาย"
    },
    alerts: {
      title: "ระบบแจ้งเตือนข่าวกรองตลาด",
      subtitle: "ระบบดักจับการเบรกเอาต์, การตัดผ่านเส้น VWAP, ความผันผวนพุ่งสูง และข่าวสารสำคัญ",
      createAlert: "สร้างการแจ้งเตือนอัจฉริยะ",
      activeAlerts: "การแจ้งเตือนที่เปิดทำงาน",
      savedAlerts: "การแจ้งเตือนของรายการเฝ้าดู",
      alertType: "เงื่อนไขการเตือน",
      breakout: "ราคาเบรกเอาต์ทะลุแนวต้าน",
      breakdown: "ราคาหลุดลงต่ำกว่าแนวรับ",
      vwapCross: "ราคาตัดผ่านเส้น VWAP ของวัน",
      unusualVolume: "ปริมาณซื้อขายผิดปกติจากสถาบัน (>2 เท่า)",
      earningsTrigger: "ใกล้ถึงวันประกาศผลประกอบการ",
      severity: "ระดับความสำคัญ",
      info: "ข้อมูลทั่วไป",
      warning: "แจ้งเตือนระวัง",
      critical: "สำคัญเร่งด่วน",
      notifications: "ศูนย์การแจ้งเตือน",
      markAllRead: "ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว"
    },
    market: {
      multiAssetTitle: "ตลาดสินทรัพย์หลากหลายทั่วโลก",
      multiAssetSubtitle: "ไดเรกทอรีข้ามสินทรัพย์ระดับสถาบัน ราคาเรียลไทม์ และผู้นำรายกลุ่มอุตสาหกรรม",
      assetClasses: {
        all: "สินทรัพย์ทุกประเภท",
        equities: "หุ้นและตราสารทุน",
        crypto: "สินทรัพย์ดิจิทัลและคริปโต",
        forex: "อัตราแลกเปลี่ยนเงินตราต่างประเทศ (FX)",
        commodities: "สินค้าโภคภัณฑ์และโลหะมีค่า",
        indices: "ดัชนีและกองทุน ETF"
      },
      exchanges: {
        us: "ตลาดสหรัฐฯ (NYSE / NASDAQ)",
        eu: "ตลาดหลักทรัพย์ยุโรป (LSE, Euronext, XETRA)",
        asia: "ตลาดเอเชีย (TSE, HKEX, SET, SGX)",
        crypto: "สินทรัพย์ดิจิทัลทั่วโลก 24/7"
      },
      statusLabels: {
        open: "ตลาดเปิดทำการ",
        closed: "ตลาดปิดทำการ",
        preMarket: "ช่วงก่อนเปิดตลาด (Pre-Market)",
        afterHours: "ช่วงหลังปิดตลาด (After Hours)",
        realTime: "ข้อมูลเรียลไทม์ที่ตรวจสอบแล้ว",
        delayed: "ข้อมูลดีเลย์ 15 นาที",
        endOfDay: "ราคาปิดสิ้นวัน",
        unavailable: "ฟีดข้อมูลออฟไลน์"
      },
      searchTape: "เทปราคาตลาดสด (LIVE TAPE)",
      scanner: "เครื่องสแกนสินทรัพย์ทั่วโลก"
    },
    news: {
      title: "ข่าวสารทางการเงินและข่าวกรองมหภาค",
      subtitle: "คัดกรองเฉพาะแหล่งข่าวที่ผ่านการรับรอง การให้คะแนนความรู้สึกตลาด และเหตุการณ์ด่วน",
      breaking: "ข่าวด่วนสำคัญ (BREAKING)",
      aiBrief: "รายงานสรุปข่าวเช้าและปิดตลาดโดย AI",
      economicCalendar: "ปฏิทินเศรษฐกิจและการประชุม FOMC",
      earningsCalendar: "ปฏิทินผลประกอบการ",
      whyMoving: "ทำไมสินทรัพย์นี้ถึงเคลื่อนไหว?",
      sentiment: "ความรู้สึกของตลาด",
      bullishSentiment: "กระแสเชิงบวก",
      bearishSentiment: "แรงกดดันเชิงลบ",
      neutralSentiment: "บริบทเป็นกลาง",
      filterSources: "แหล่งข่าวที่ตรวจสอบแล้ว",
      savedArticles: "ข่าวที่บันทึกไว้"
    },
    settings: {
      title: "การตั้งค่าบัญชีและหน้าจอเทอร์มินัล",
      subtitle: "จัดการโปรไฟล์ กลยุทธ์ ภาษา และการแปลภาษาทั่วทั้งระบบ",
      tabs: {
        profile: "โปรไฟล์และกลยุทธ์",
        global: "ภาษาและภูมิภาค",
        notifications: "การแจ้งเตือนและการเตือน",
        api: "คีย์ API และฟีดข้อมูล",
        security: "ความปลอดภัยและการยืนยันตัวตน 2FA"
      },
      globalPreferences: "การตั้งค่าสากลและภาษา (GLOBAL LOCALIZATION)",
      language: "ภาษาของอินเทอร์เฟซ",
      languageHelp: "เลือกภาษาที่คุณต้องการแสดงผลในหน้าจอระบบทั้งหมด",
      region: "ภูมิภาคหลัก",
      regionHelp: "ปรับแต่งปฏิทิน กฎระเบียบท้องถิ่น และดัชนีอ้างอิงเริ่มต้น",
      timezone: "เขตเวลาการแสดงผล",
      timezoneHelp: "เลือกเขตเวลาท้องถิ่นของคุณควบคู่กับเวลา Eastern Time (ET)",
      currency: "สกุลเงินที่แสดงผล",
      currencyHelp: "แสดงราคาในสกุลเงินตลาดดั้งเดิม พร้อมทางเลือกในการแปลงค่า",
      primaryMarket: "ตลาดหลักที่โฟกัส",
      primaryMarketHelp: "ดัชนีมาตรฐานเมื่อเริ่มต้นเปิดระบบแดชบอร์ด",
      aiResponseLanguage: "ภาษาที่ AI ใช้ตอบ",
      aiResponseLanguageHelp: "โมเดล Gemini จะให้บทวิเคราะห์และเหตุผลในภาษานี้",
      dateFormat: "รูปแบบวันที่",
      numberFormat: "รูปแบบตัวเลข",
      savePreferences: "บันทึกการตั้งค่าสากล",
      resetDefaults: "คืนค่าเริ่มต้น"
    },
    auth: {
      titleSignIn: "เข้าสู่ระบบ MarketMind",
      titleSignUp: "สร้างบัญชีใหม่ของคุณ",
      guestNotice: "คุณกำลังใช้งานในโหมดผู้เยี่ยมชม เข้าสู่ระบบเพื่อซิงค์รายการเฝ้าดู โบรกเกอร์ และการแจ้งเตือนข้ามอุปกรณ์",
      email: "อีเมล",
      password: "รหัสผ่าน",
      confirmPassword: "ยืนยันรหัสผ่าน",
      fullName: "ชื่อ-นามสกุล",
      forgotPassword: "ลืมรหัสผ่าน?",
      rememberMe: "จดจำฉันไว้ในระบบ",
      orContinueWith: "หรือดำเนินการต่อด้วย",
      continueAsGuest: "ดำเนินการต่อในฐานะผู้เยี่ยมชม",
      alreadyHaveAccount: "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ",
      dontHaveAccount: "ยังไม่มีบัญชี? สมัครสมาชิก",
      termsAgree: "การดำเนินการต่อถือว่าคุณยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวของ MarketMind",
      errorInvalidCredentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      errorUserNotFound: "ไม่พบบัญชีผู้ใช้นี้",
      errorEmailInUse: "อีเมลนี้ถูกใช้งานไปแล้ว",
      errorWeakPassword: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
    },
    errors: {
      authRequired: "จำเป็นต้องเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้",
      unauthorized: "คำขอไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
      forbidden: "การเข้าถึงถูกจำกัด จำเป็นต้องอัปเกรดแพ็กเกจ",
      rateLimited: "คำขอเกินขีดจำกัด กรุณารอสักครู่แล้วลองใหม่",
      dataUnavailable: "ฟีดข้อมูลตลาดไม่พร้อมใช้งานชั่วคราวสำหรับสัญลักษณ์นี้",
      researchFailed: "การประมวลผลงานวิจัยเชิงลึกล้มเหลว กรุณาตรวจสอบสัญลักษณ์แล้วลองใหม่",
      networkError: "การเชื่อมต่อเครือข่ายขาดหาย กำลังเชื่อมต่อระบบใหม่อีกครั้ง...",
      invalidRequest: "พารามิเตอร์ของคำขอไม่ถูกต้อง",
      paymentRequired: "จำเป็นต้องมีการสมัครสมาชิก Pro",
      notFound: "ไม่พบทรัพยากรหรือสัญลักษณ์ที่ร้องขอ",
      internalError: "เกิดข้อผิดพลาดไม่คาดคิดที่เซิร์ฟเวอร์",
      sessionExpired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
      genericError: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"
    },
    disclaimer: {
      title: "การเปิดเผยข้อมูลความเสี่ยงและกฎระเบียบ",
      text: "MarketMind ให้บริการแบบจำลองความน่าจะเป็นตามอัลกอริทึมและการแสดงผลข้อมูลตลาดเพื่อวัตถุประสงค์ทางการศึกษาและการวิเคราะห์เท่านั้น การซื้อขายมีความเสี่ยงสูงที่จะสูญเสียเงินลงทุนและอาจไม่เหมาะกับนักลงทุนทุกคน",
      aiNotice: "คำอธิบายตลาดโดย AI ถูกสร้างขึ้นจากตัวชี้วัดเชิงปริมาณที่มีโครงสร้างและไม่ถือเป็นคำแนะนำทางการเงิน",
      secNotice: "เอกสารรายงานของ SEC นำมาจากฐานข้อมูลสาธารณะ EDGAR โดยตรง"
    },
    onboarding: {
      welcome: "ยินดีต้อนรับสู่ MarketMind AI",
      subtitle: "ระบบข่าวกรองทางการเงินระดับสถาบันและเครื่องมือการตัดสินใจหลายมิติยุคใหม่",
      fastOnboardingTitle: "ปรับแต่งประสบการณ์เทอร์มินัลของคุณ",
      tradingStyle: "สไตล์การเทรดหลักของคุณ",
      experienceLevel: "ระดับประสบการณ์ในตลาด",
      primaryAsset: "ประเภทสินทรัพย์หลักที่คุณโฟกัส",
      getStarted: "เปิดใช้งาน MarketMind Terminal",
      tour: {
        step1Title: "ศูนย์การตัดสินใจ",
        step1Desc: "ประมวลผลการเคลื่อนไหวของราคา, ปริมาณ, VWAP และความน่าจะเป็นเชิงปริมาณแบบเรียลไทม์",
        step2Title: "กราฟสถาบันระดับ Pro",
        step2Desc: "กราฟแท่งเทียนแบบอินเทอร์แอคทีฟพร้อมระดับ Pivot สถาบัน แถบ VWAP และตัวชี้วัดอัตโนมัติ",
        step3Title: "งานวิจัยเชิงลึก (Deep Research)",
        step3Desc: "งานวิจัยปัจจัยพื้นฐานสถาบันฉบับเต็มโดยอิงจากเอกสาร SEC และข้อมูลเศรษฐกิจมหภาคที่ตรวจสอบแล้ว",
        step4Title: "นักวิเคราะห์ AI ประจำตลาด",
        step4Desc: "ถามคำถามตลาดที่ซับซ้อนในทุกภาษาและรับคำตอบเชิงปริมาณที่มีหลักฐานยืนยันจาก Gemini"
      }
    },
    export: {
      title: "รายงานวิจัยสถาบันและเอกสาร PDF",
      subtitle: "สร้างรายงาน PDF ระดับสถาบันและบทสรุปตลาดในภาษาที่คุณเลือก",
      downloadPdf: "ดาวน์โหลดรายงาน PDF",
      generateBrief: "สร้างรายงานสรุปตลาดช่วงเช้า",
      eodBrief: "สร้างรายงานสรุปตลาดปิดสิ้นวัน",
      deepResearchMemo: "เอกสารรายงานวิจัยเชิงลึกฉบับสมบูรณ์",
      confidentiality: "เอกสารลับเฉพาะทางธุรกิจ — สำหรับการใช้งานระดับมืออาชีพเท่านั้น",
      generatedAt: "สร้างเมื่อวันที่",
      preparedBy: "ฝ่ายวิจัยเชิงปริมาณ MarketMind AI",
      legalNotice: "ผลการดำเนินงานในอดีตไม่ได้เป็นเครื่องรับประกันผลลัพธ์ในอนาคต โมเดลของ MarketMind มีไว้สำหรับการวิเคราะห์ข้อมูลเท่านั้น"
    },
    support: {
      contactTitle: "ติดต่อฝ่ายสนับสนุนและบริการลูกค้า",
      helpCenterTitle: "ศูนย์ช่วยเหลือและเอกสารคู่มือ",
      reportIssueTitle: "รายงานปัญหาข้อมูลหรือความผิดปกติของตลาด",
      submitTicket: "ส่งตั๋วแจ้งปัญหา",
      feedback: "ส่งความคิดเห็นเกี่ยวกับผลิตภัณฑ์",
      systemStatus: "สถานะความพร้อมของระบบและข้อมูลสด"
    }
  }
};

// Generate deep merged dictionary generator for other languages
function generateLocalizedDict(locale) {
  // If we already have explicit custom translation for locale, merge it over English
  if (translations[locale]) {
    return deepMerge(JSON.parse(JSON.stringify(en)), translations[locale]);
  }
  
  // Clone English as structural foundation and customize high-impact labels for specific languages
  const localized = JSON.parse(JSON.stringify(en));
  
  if (locale === 'es') {
    localized.common.search = "Buscar símbolo, ETF o empresa...";
    localized.common.live = "EN VIVO";
    localized.common.delayed = "RETRASADO";
    localized.common.save = "Guardar cambios";
    localized.common.cancel = "Cancelar";
    localized.common.close = "Cerrar";
    localized.nav.overview = "Centro de Decisiones";
    localized.nav.research = "Investigación Profunda";
    localized.nav.multiAsset = "Mercados Multi-Activos";
    localized.nav.portfolio = "Cartera Conectada";
    localized.nav.chart = "Gráfico Pro";
    localized.dashboard.marketDecisionCenter = "CENTRO DE DECISIONES DE MERCADO";
    localized.dashboard.bullish = "ALCISTA (BULLISH)";
    localized.dashboard.bearish = "BAJISTA (BEARISH)";
    localized.dashboard.neutral = "NEUTRAL";
    localized.dashboard.whyMovingTitle = "¿POR QUÉ SE MUEVE?";
    localized.research.workspaceTitle = "INVESTIGACIÓN PROFUNDA INSTITUCIONAL";
    localized.research.executiveSummary = "Resumen Ejecutivo";
    localized.research.bullThesis = "Tesis Alcista Institucional";
    localized.research.bearThesis = "Tesis Bajista Institucional";
    localized.billing.title = "Suscripción y Autorizaciones";
    localized.settings.title = "Configuración de Cuenta y Terminal";
    localized.settings.language = "Idioma de Interfaz";
    localized.settings.aiResponseLanguage = "Idioma de Respuesta de IA";
  } else if (locale === 'zh-CN') {
    localized.common.search = "搜索代码、ETF 或公司...";
    localized.common.live = "实时";
    localized.common.delayed = "延迟";
    localized.common.save = "保存更改";
    localized.common.cancel = "取消";
    localized.common.close = "关闭";
    localized.nav.overview = "决策中心";
    localized.nav.research = "深度投研";
    localized.nav.multiAsset = "多资产市场";
    localized.nav.portfolio = "关联投资组合";
    localized.nav.chart = "专业图表";
    localized.dashboard.marketDecisionCenter = "市场决策中心";
    localized.dashboard.bullish = "看多 (BULLISH)";
    localized.dashboard.bearish = "看空 (BEARISH)";
    localized.dashboard.neutral = "中性 (NEUTRAL)";
    localized.dashboard.whyMovingTitle = "异动原因分析";
    localized.research.workspaceTitle = "机构级深度研究";
    localized.research.executiveSummary = "执行摘要";
    localized.research.bullThesis = "机构看多逻辑";
    localized.research.bearThesis = "机构看空逻辑";
    localized.billing.title = "订阅与权限";
    localized.settings.title = "账户与终端设置";
    localized.settings.language = "界面语言";
    localized.settings.aiResponseLanguage = "AI 回复语言";
  } else if (locale === 'zh-TW') {
    localized.common.search = "搜尋代碼、ETF 或公司...";
    localized.common.live = "即時";
    localized.common.delayed = "延遲";
    localized.common.save = "儲存變更";
    localized.common.cancel = "取消";
    localized.common.close = "關閉";
    localized.nav.overview = "決策中心";
    localized.nav.research = "深度投研";
    localized.nav.multiAsset = "多資產市場";
    localized.nav.portfolio = "關聯投資組合";
    localized.nav.chart = "專業圖表";
    localized.dashboard.marketDecisionCenter = "市場決策中心";
    localized.dashboard.bullish = "看多 (BULLISH)";
    localized.dashboard.bearish = "看空 (BEARISH)";
    localized.dashboard.neutral = "中性 (NEUTRAL)";
    localized.dashboard.whyMovingTitle = "異動原因分析";
    localized.research.workspaceTitle = "機構級深度研究";
    localized.research.executiveSummary = "執行摘要";
    localized.research.bullThesis = "機構看多邏輯";
    localized.research.bearThesis = "機構看空邏輯";
    localized.billing.title = "訂閱與權限";
    localized.settings.title = "帳戶與終端設定";
    localized.settings.language = "介面語言";
    localized.settings.aiResponseLanguage = "AI 回覆語言";
  } else if (locale === 'ja') {
    localized.common.search = "銘柄コード、ETF、企業を検索...";
    localized.common.live = "リアルタイム";
    localized.common.delayed = "ディレイ";
    localized.common.save = "変更を保存";
    localized.common.cancel = "キャンセル";
    localized.common.close = "閉じる";
    localized.nav.overview = "意思決定センター";
    localized.nav.research = "ディープリサーチ";
    localized.nav.multiAsset = "マルチアセット市場";
    localized.nav.portfolio = "連携ポートフォリオ";
    localized.nav.chart = "プロチャート";
    localized.dashboard.marketDecisionCenter = "市場意思決定センター";
    localized.dashboard.bullish = "強気 (BULLISH)";
    localized.dashboard.bearish = "弱気 (BEARISH)";
    localized.dashboard.neutral = "中立 (NEUTRAL)";
    localized.dashboard.whyMovingTitle = "価格変動の理由分析";
    localized.research.workspaceTitle = "機関投資家向けディープリサーチ";
    localized.research.executiveSummary = "エグゼクティブサマリー";
    localized.research.bullThesis = "機関投資家向け強気テーゼ";
    localized.research.bearThesis = "機関投資家向け弱気テーゼ";
    localized.billing.title = "サブスクリプションと権限";
    localized.settings.title = "アカウント＆ターミナル設定";
    localized.settings.language = "表示言語";
    localized.settings.aiResponseLanguage = "AI 応答言語";
  } else if (locale === 'ko') {
    localized.common.search = "종목 코드, ETF 또는 기업 검색...";
    localized.common.live = "실시간";
    localized.common.delayed = "지연";
    localized.common.save = "변경사항 저장";
    localized.common.cancel = "취소";
    localized.common.close = "닫기";
    localized.nav.overview = "의사결정 센터";
    localized.nav.research = "딥 리서치";
    localized.nav.multiAsset = "멀티 에셋 시장";
    localized.nav.portfolio = "연결된 포트폴리오";
    localized.nav.chart = "프로 차트";
    localized.dashboard.marketDecisionCenter = "시장 의사결정 센터";
    localized.dashboard.bullish = "상승 강세 (BULLISH)";
    localized.dashboard.bearish = "하락 약세 (BEARISH)";
    localized.dashboard.neutral = "중립 (NEUTRAL)";
    localized.dashboard.whyMovingTitle = "주가 변동 요인 분석";
    localized.research.workspaceTitle = "기관급 딥 리서치 워크스페이스";
    localized.research.executiveSummary = "핵심 요약 (Executive Summary)";
    localized.research.bullThesis = "기관 강세 논리 (Bull Thesis)";
    localized.research.bearThesis = "기관 약세 논리 (Bear Thesis)";
    localized.billing.title = "구독 및 권한 관리";
    localized.settings.title = "계정 및 터미널 설정";
    localized.settings.language = "인터페이스 언어";
    localized.settings.aiResponseLanguage = "AI 응답 언어";
  } else if (locale === 'fr') {
    localized.common.search = "Rechercher un symbole, un ETF ou une entreprise...";
    localized.common.live = "EN DIRECT";
    localized.common.delayed = "DIFFÉRÉ";
    localized.common.save = "Enregistrer les modifications";
    localized.common.cancel = "Annuler";
    localized.common.close = "Fermer";
    localized.nav.overview = "Centre de Décision";
    localized.nav.research = "Recherche Approfondie";
    localized.nav.multiAsset = "Marchés Multi-Actifs";
    localized.nav.portfolio = "Portefeuille Connecté";
    localized.nav.chart = "Graphique Pro";
    localized.dashboard.marketDecisionCenter = "CENTRE DE DÉCISION DU MARCHÉ";
    localized.dashboard.bullish = "HAUSSIER (BULLISH)";
    localized.dashboard.bearish = "BAISSIER (BEARISH)";
    localized.dashboard.neutral = "NEUTRE";
    localized.dashboard.whyMovingTitle = "POURQUOI LE TITRE BOUGE-T-IL ?";
    localized.research.workspaceTitle = "RECHERCHE APPROFONDIE INSTITUTIONNELLE";
    localized.billing.title = "Abonnement & Droits";
    localized.settings.title = "Paramètres du Compte et du Terminal";
    localized.settings.language = "Langue de l'interface";
    localized.settings.aiResponseLanguage = "Langue de réponse IA";
  } else if (locale === 'de') {
    localized.common.search = "Symbol, ETF oder Unternehmen suchen...";
    localized.common.live = "LIVE";
    localized.common.delayed = "VERZÖGERT";
    localized.common.save = "Änderungen speichern";
    localized.common.cancel = "Abbrechen";
    localized.common.close = "Schließen";
    localized.nav.overview = "Entscheidungszentrum";
    localized.nav.research = "Deep Research";
    localized.nav.multiAsset = "Multi-Asset-Märkte";
    localized.nav.portfolio = "Verbundenes Portfolio";
    localized.nav.chart = "Profi-Chart";
    localized.dashboard.marketDecisionCenter = "MARKT-ENTSCHEIDUNGSZENTRUM";
    localized.dashboard.bullish = "BULLISCH";
    localized.dashboard.bearish = "BÄRISCH";
    localized.dashboard.neutral = "NEUTRAL";
    localized.dashboard.whyMovingTitle = "WARUM BEWEGT SICH DER KURS?";
    localized.research.workspaceTitle = "INSTITUTIONELLE TIEFENANALYSE";
    localized.billing.title = "Abonnement & Berechtigungen";
    localized.settings.title = "Konto- & Terminal-Einstellungen";
    localized.settings.language = "Oberflächensprache";
    localized.settings.aiResponseLanguage = "KI-Antwortsprache";
  } else if (locale === 'pt') {
    localized.common.search = "Buscar símbolo, ETF ou empresa...";
    localized.common.live = "AO VIVO";
    localized.common.delayed = "ATRASADO";
    localized.common.save = "Salvar alterações";
    localized.common.cancel = "Cancelar";
    localized.common.close = "Fechar";
    localized.nav.overview = "Centro de Decisão";
    localized.nav.research = "Pesquisa Aprofundada";
    localized.nav.multiAsset = "Mercados Multi-Ativos";
    localized.nav.portfolio = "Portfólio Conectado";
    localized.nav.chart = "Gráfico Pro";
    localized.dashboard.marketDecisionCenter = "CENTRO DE DECISÃO DE MERCADO";
    localized.dashboard.bullish = "OTIMISTA (BULLISH)";
    localized.dashboard.bearish = "PESSIMISTA (BEARISH)";
    localized.dashboard.neutral = "NEUTRO";
    localized.dashboard.whyMovingTitle = "POR QUE ESTÁ SE MOVIMENTANDO?";
    localized.research.workspaceTitle = "PESQUISA INSTITUCIONAL APROFUNDADA";
    localized.billing.title = "Assinatura e Permissões";
    localized.settings.title = "Configurações de Conta e Terminal";
    localized.settings.language = "Idioma da Interface";
    localized.settings.aiResponseLanguage = "Idioma de Resposta da IA";
  } else if (locale === 'vi') {
    localized.common.search = "Tìm mã cổ phiếu, ETF hoặc công ty...";
    localized.common.live = "TRỰC TIẾP";
    localized.common.delayed = "BỊ TRỄ";
    localized.common.save = "Lưu thay đổi";
    localized.common.cancel = "Hủy";
    localized.common.close = "Đóng";
    localized.nav.overview = "Trung tâm Quyết định";
    localized.nav.research = "Nghiên cứu Chuyên sâu";
    localized.nav.multiAsset = "Thị trường Đa Tài sản";
    localized.nav.portfolio = "Danh mục Đã kết nối";
    localized.nav.chart = "Biểu đồ Chuyên nghiệp";
    localized.dashboard.marketDecisionCenter = "TRUNG TÂM QUYẾT ĐỊNH THỊ TRƯỜNG";
    localized.dashboard.bullish = "TĂNG GIÁ (BULLISH)";
    localized.dashboard.bearish = "GIẢM GIÁ (BEARISH)";
    localized.dashboard.neutral = "TRUNG LẬP (NEUTRAL)";
    localized.dashboard.whyMovingTitle = "TẠI SAO GIÁ LẠI BIẾN ĐỘNG?";
    localized.research.workspaceTitle = "NGHIÊN CỨU TỔ CHỨC CHUYÊN SÂU";
    localized.billing.title = "Gói đăng ký & Quyền hạn";
    localized.settings.title = "Cài đặt Tài khoản & Terminal";
    localized.settings.language = "Ngôn ngữ Giao diện";
    localized.settings.aiResponseLanguage = "Ngôn ngữ Phản hồi AI";
  } else if (locale === 'hi') {
    localized.common.search = "प्रतीक, ईटीएफ या कंपनी खोजें...";
    localized.common.live = "लाइव";
    localized.common.delayed = "विलंबित";
    localized.common.save = "परिवर्तन सहेजें";
    localized.common.cancel = "रद्द करें";
    localized.common.close = "बंद करें";
    localized.nav.overview = "निर्णय केंद्र";
    localized.nav.research = "गहन शोध (Deep Research)";
    localized.nav.multiAsset = "मल्टी-एसेट मार्केट";
    localized.nav.portfolio = "कनेक्टेड पोर्टफोलियो";
    localized.nav.chart = "प्रो चार्ट";
    localized.dashboard.marketDecisionCenter = "मार्केट निर्णय केंद्र";
    localized.dashboard.bullish = "तेजी (BULLISH)";
    localized.dashboard.bearish = "मंदी (BEARISH)";
    localized.dashboard.neutral = "तटस्थ (NEUTRAL)";
    localized.dashboard.whyMovingTitle = "यह क्यों बढ़/घट रहा है?";
    localized.research.workspaceTitle = "संस्थागत गहन शोध कार्यक्षेत्र";
    localized.research.executiveSummary = "कार्यकारी सारांश";
    localized.research.bullThesis = "संस्थागत तेजी तर्क";
    localized.research.bearThesis = "संस्थागत मंदी तर्क";
    localized.billing.title = "सदस्यता और अधिकार";
    localized.settings.title = "खाता और टर्मिनल सेटिंग्स";
    localized.settings.language = "इंटरफ़ेस भाषा";
    localized.settings.aiResponseLanguage = "AI प्रतिक्रिया भाषा";
  } else if (locale === 'ar') {
    localized.common.search = "ابحث عن الرمز أو الصندوق أو الشركة...";
    localized.common.live = "مباشر";
    localized.common.delayed = "متأخر";
    localized.common.save = "حفظ التغييرات";
    localized.common.cancel = "إلغاء";
    localized.common.close = "إغلاق";
    localized.nav.overview = "مركز القرارات";
    localized.nav.research = "الأبحاث المعمقة";
    localized.nav.multiAsset = "الأسواق متعددة الأصول";
    localized.nav.portfolio = "المحفظة المتصلة";
    localized.nav.chart = "الرسم البياني المتقدم";
    localized.dashboard.marketDecisionCenter = "مركز قرارات السوق";
    localized.dashboard.bullish = "صعودي (BULLISH)";
    localized.dashboard.bearish = "هبوطي (BEARISH)";
    localized.dashboard.neutral = "محايد (NEUTRAL)";
    localized.dashboard.whyMovingTitle = "لماذا يتحرك السعر؟";
    localized.research.workspaceTitle = "منصة الأبحاث المؤسسية المعمقة";
    localized.research.executiveSummary = "الملخص التنفيذي";
    localized.research.bullThesis = "فرضية الصعود المؤسسية";
    localized.research.bearThesis = "فرضية الهبوط المؤسسية";
    localized.billing.title = "الاشتراكات والصلاحيات";
    localized.settings.title = "إعدادات الحساب والمنصة";
    localized.settings.language = "لغة الواجهة";
    localized.settings.aiResponseLanguage = "لغة استجابة الذكاء الاصطناعي";
  } else if (locale === 'it') {
    localized.common.search = "Cerca simbolo, ETF o azienda...";
    localized.common.live = "IN TEMPO REALE";
    localized.common.delayed = "RITARDATO";
    localized.common.save = "Salva modifiche";
    localized.common.cancel = "Annulla";
    localized.common.close = "Chiudi";
    localized.nav.overview = "Centro Decisionale";
    localized.nav.research = "Ricerca Approfondita";
    localized.nav.multiAsset = "Mercati Multi-Asset";
    localized.nav.portfolio = "Portafoglio Connesso";
    localized.nav.chart = "Grafico Pro";
    localized.dashboard.marketDecisionCenter = "CENTRO DECISIONALE DI MERCATO";
    localized.dashboard.bullish = "RIALZISTA (BULLISH)";
    localized.dashboard.bearish = "RIBASSISTA (BEARISH)";
    localized.dashboard.neutral = "NEUTRALE";
    localized.dashboard.whyMovingTitle = "PERCHÉ SI STA MUOVENDO?";
    localized.research.workspaceTitle = "RICERCA ISTITUZIONALE APPROFONDITA";
    localized.billing.title = "Abbonamento e Autorizzazioni";
    localized.settings.title = "Impostazioni Account e Terminale";
    localized.settings.language = "Lingua dell'Interfaccia";
    localized.settings.aiResponseLanguage = "Lingua di Risposta dell'IA";
  }

  return localized;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

// Write en.json
const enPath = path.join(__dirname, '../src/i18n/locales/en.json');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Saved en.json');

// Write all other locale files
locales.forEach(loc => {
  const dict = generateLocalizedDict(loc);
  const filePath = path.join(__dirname, `../src/i18n/locales/${loc}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dict, null, 2));
  console.log(`Saved ${loc}.json`);
});

console.log('All locale files generated successfully!');
