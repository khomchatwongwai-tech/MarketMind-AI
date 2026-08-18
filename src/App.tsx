import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { MarketTape } from './components/MarketTape';
import { Navigation, ActiveTab } from './components/Navigation';
import { DashboardOverview } from './components/DashboardOverview';
import { DeepResearchWorkspace } from './components/research/DeepResearchWorkspace';
import { TechnicalEngineView } from './components/TechnicalEngineView';
import { SupportResistanceView } from './components/SupportResistanceView';
import { BreadthIntermarketView } from './components/BreadthIntermarketView';
import { SectorHeatmapView } from './components/SectorHeatmapView';
import { OptionsAnalyticsView } from './components/OptionsAnalyticsView';
import { OptionsTraderView } from './components/optionsTrader/OptionsTraderView';
import { EconomicFedView } from './components/EconomicFedView';
import { NewsAnalyzerView } from './components/NewsAnalyzerView';
import { NewsIntelligenceDashboard } from './components/news/NewsIntelligenceDashboard';
import { MultiAssetMarketsView } from './components/markets/MultiAssetMarketsView';
import { UniversalSearchModal } from './components/markets/UniversalSearchModal';
import { MultiAssetAiAnalysisModal } from './components/markets/MultiAssetAiAnalysisModal';
import { AskMarketMindChat } from './components/AskMarketMindChat';
import { TradeSimulatorView } from './components/TradeSimulatorView';
import { PredictionsBacktestView } from './components/PredictionsBacktestView';
import { AlertsManagerView } from './components/AlertsManagerView';
import { ReportModal } from './components/ReportModal';

// Newly Added Enterprise & Institutional Feature Views
import { WatchlistsView } from './components/WatchlistsView';
import { SavedAlertsManagerView } from './components/SavedAlertsManagerView';
import { PredictionHistoryView } from './components/PredictionHistoryView';
import { ExportReportsView } from './components/ExportReportsView';
import { HelpCenterView } from './components/HelpCenterView';
import { StatusPageView } from './components/StatusPageView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ConnectedAccountsView } from './components/ConnectedAccountsView';
import { CommunityView } from './components/community/CommunityView';

// Modals
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsOfServiceModal } from './components/TermsOfServiceModal';
import { ContactSupportModal } from './components/ContactSupportModal';
import { FastOnboardingModal } from './components/FastOnboardingModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { MarketBriefsModal } from './components/MarketBriefsModal';
import { ReportDataIssueModal } from './components/ReportDataIssueModal';
import { AppConfig } from './config/environment';
import { SmartAlertEngine } from './services/smartAlertEngine';
import { AnalyticsService } from './services/analyticsService';

import {
  getComprehensiveMarketData,
  simulateTick,
  fetchLiveMarketQuote,
  mergeLiveQuoteIntoComprehensiveData,
  ComprehensiveMarketData,
} from './services/marketDataService';
import { TickerSymbol, MarketAlert, LiveMarketDataSource } from './types/market';
import { NormalizedInstrument } from './types/instrument';
import { MobileNavigationBar } from './components/mobile/MobileNavigationBar';
import { DeepLinkManager } from './services/mobile/deepLinking';
import { InstrumentDirectoryService, MASTER_INSTRUMENTS } from './services/marketProviders/InstrumentDirectoryService';
import { UserProfile } from './types/user';
import { UserService } from './services/userService';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FirestoreService } from './services/firestoreService';
import { ShieldCheck, HelpCircle, Activity, FileText, Lock, MessageSquare } from 'lucide-react';

export default function App() {
  const [selectedTicker, setSelectedTicker] = useState<TickerSymbol>('SPY');
  const [marketData, setMarketData] = useState<ComprehensiveMarketData>(() =>
    getComprehensiveMarketData('SPY')
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<LiveMarketDataSource>('Yahoo Finance (Real-Time)');
  const [tickSpeed, setTickSpeed] = useState<number>(3000);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [reportModalType, setReportModalType] = useState<'morning' | 'eod' | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');

  // User State & Modals
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => UserService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState<boolean>(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState<boolean>(false);
  const [isTermsOfServiceOpen, setIsTermsOfServiceOpen] = useState<boolean>(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState<boolean>(false);
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState<boolean>(false);
  const [isFastOnboardingOpen, setIsFastOnboardingOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isMarketBriefsOpen, setIsMarketBriefsOpen] = useState<boolean>(false);
  const [marketBriefType, setMarketBriefType] = useState<'morning' | 'eod'>('morning');
  const [isReportIssueOpen, setIsReportIssueOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedInstrument, setSelectedInstrument] = useState<NormalizedInstrument>(MASTER_INSTRUMENTS[0]);
  const [aiAnalysisInstrument, setAiAnalysisInstrument] = useState<NormalizedInstrument | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([
    'inst_stock_nvda_nasdaq',
    'inst_stock_aapl_nasdaq',
    'inst_stock_msft_nasdaq',
    'inst_stock_tsla_nasdaq',
    'inst_crypto_btc_usd',
    'inst_forex_eur_usd',
  ]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for Universal Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsUniversalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Deep Link Listener for Universal Links and Custom App Links (e.g. marketmind://stock/NVDA)
  useEffect(() => {
    const unregister = DeepLinkManager.onRoute((route) => {
      if (route.type === 'STOCK' && route.symbol) {
        const found =
          InstrumentDirectoryService.getBySymbol(route.symbol) ||
          InstrumentDirectoryService.getById(route.symbol);
        if (found) {
          setSelectedInstrument(found);
          setSelectedTicker(found.displaySymbol as TickerSymbol || found.symbol as TickerSymbol);
          setActiveTab('overview');
        }
      } else if (route.type === 'WATCHLIST') {
        setActiveTab('watchlists');
      } else if (route.type === 'NEWS') {
        setActiveTab('news');
      }
    });
    return unregister;
  }, []);

  const handleToggleWatchlist = (id: string) => {
    setWatchlistIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Auto trigger onboarding tour for first-time visitors
  useEffect(() => {
    if (!UserService.hasCompletedOnboarding()) {
      const timer = setTimeout(() => {
        setIsOnboardingTourOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Firebase Auth State Listener & Firestore Synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userEmail = fbUser.email ?? '';
        try {
          const profile = await FirestoreService.getUserProfile(fbUser.uid);
          if (profile) {
            setCurrentUser(profile);
            UserService.saveUser(profile);
          } else {
            const newProfile: UserProfile = {
              ...currentUser,
              id: fbUser.uid,
              email: userEmail,
              name: fbUser.displayName || (userEmail ? userEmail.split('@')[0] : 'Trader'),
              avatarUrl: fbUser.photoURL || currentUser.avatarUrl,
              emailVerified: fbUser.emailVerified,
              role: 'user',
              plan: 'free',
              planTier: 'FREE',
              isGuest: false,
            };
            setCurrentUser(newProfile);
            UserService.saveUser(newProfile);
            await FirestoreService.syncUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('Firestore profile sync error on auth change:', err);
        }
      } else {
        const user = UserService.getUser();
        if (!user.isGuest) {
          user.isGuest = true;
          user.email = '';
          user.role = 'user';
          user.plan = 'free';
          UserService.saveUser(user);
          setCurrentUser(user);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUserChange = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  const [alerts, setAlerts] = useState<MarketAlert[]>([]);

  // Fetch real-time live market movement from Yahoo Finance / Google Finance
  const syncLiveMarket = useCallback(async (ticker: TickerSymbol, source: LiveMarketDataSource) => {
    try {
      setIsLoadingLive(true);
      const liveResult = await fetchLiveMarketQuote(ticker, source);
      if (liveResult && liveResult.price) {
        setMarketData((prev) => mergeLiveQuoteIntoComprehensiveData(prev, liveResult));
        setIsLive(true);
      }
    } catch (e) {
      console.warn('Live sync error:', e);
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  // Load new ticker data when selection changes
  const handleSelectTicker = (ticker: TickerSymbol) => {
    setSelectedTicker(ticker);
    const newData = getComprehensiveMarketData(ticker);
    setMarketData(newData);
    // Fetch live quote immediately for new ticker
    syncLiveMarket(ticker, dataSource);
  };

  // Initial load sync
  useEffect(() => {
    syncLiveMarket(selectedTicker, dataSource);
  }, [selectedTicker, dataSource, syncLiveMarket]);

  // Manual refresh / recalculate
  const handleManualRefresh = () => {
    syncLiveMarket(selectedTicker, dataSource);
  };

  // Real-time live movement polling & tick engine
  useEffect(() => {
    if (!isLive) return;

    let tickCount = 0;
    const interval = setInterval(async () => {
      tickCount++;
      // Every 3 ticks, fetch fresh quote from Yahoo / Google
      if (tickCount % 3 === 0) {
        const liveResult = await fetchLiveMarketQuote(selectedTicker, dataSource);
        if (liveResult && liveResult.price) {
          setMarketData((prev) => mergeLiveQuoteIntoComprehensiveData(prev, liveResult));
          return;
        }
      }

      // Fast tick movement interpolation between live queries
      setMarketData((prev) => {
        if (!AppConfig.allowSimulatedMarketData) {
          return prev;
        }
        const next = simulateTick(prev);
        const smartAlert = SmartAlertEngine.evaluateQuoteAlerts(
          next.quote,
          undefined,
          next.supportResistance.s1,
          next.supportResistance.r1
        );
        if (smartAlert) {
          setAlerts((prevAlerts) => [
            {
              id: smartAlert.id,
              timestamp: new Date(smartAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: smartAlert.triggerType === 'R1_BREAKOUT' || smartAlert.triggerType === 'VWAP_CROSS' ? 'BREAKOUT' : 'SWING',
              title: `${smartAlert.symbol} ${smartAlert.triggerType.replace(/_/g, ' ')}`,
              message: smartAlert.message,
              severity: smartAlert.severity === 'CRITICAL' || smartAlert.severity === 'HIGH' ? 'WARNING' : 'INFO',
              read: false,
            },
            ...prevAlerts.slice(0, 15),
          ]);
        }
        return next;
      });
    }, tickSpeed);

    return () => clearInterval(interval);
  }, [isLive, selectedTicker, dataSource, tickSpeed]);

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleNavigateTab = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleAskQuestionFromDashboard = (q: string) => {
    setChatInitialPrompt(q);
    setActiveTab('chat');
  };

  const unreadAlertCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-[#0f1013] text-[#e2e8f0] flex flex-col p-2 md:p-3 max-w-[1600px] mx-auto select-none pb-20 md:pb-3">
      {/* Real-time Ticker Tape Bar */}
      <MarketTape
        selectedTicker={selectedTicker}
        onSelectTicker={handleSelectTicker}
        isLive={isLive}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Top Application Header */}
      <Header
        quote={marketData.quote}
        probabilities={marketData.probabilities}
        selectedTicker={selectedTicker}
        onSelectTicker={handleSelectTicker}
        isLive={isLive}
        onToggleLive={() => setIsLive(!isLive)}
        onManualRefresh={handleManualRefresh}
        unreadAlertCount={unreadAlertCount}
        onOpenReport={(type) => {
          setMarketBriefType(type);
          setIsMarketBriefsOpen(true);
        }}
        onOpenAlerts={() => setIsNotificationCenterOpen(true)}
        onOpenChat={() => setActiveTab('chat')}
        onOpenUniversalSearch={() => setIsUniversalSearchOpen(true)}
        onOpenReportIssue={() => setIsReportIssueOpen(true)}
        dataSource={dataSource}
        onChangeDataSource={setDataSource}
        tickSpeed={tickSpeed}
        onChangeTickSpeed={setTickSpeed}
        isLoadingLive={isLoadingLive}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenTour={() => setIsOnboardingTourOpen(true)}
        activeTab={activeTab}
        onNavigateTab={handleNavigateTab}
      />

      {/* High-Density Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        setupQuality={marketData.probabilities.setupQuality}
        breadthStatus={marketData.breadth.breadthStatus}
        currentUser={currentUser}
        isMenuOpen={isMobileMenuOpen}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onCloseMenu={() => setIsMobileMenuOpen(false)}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        unreadAlertCount={unreadAlertCount}
      />

      {/* Main Content Area Routing */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'overview' && (
          <DashboardOverview
            data={marketData}
            probabilities={marketData.probabilities}
            onNavigateTab={handleNavigateTab}
            onAskQuestion={handleAskQuestionFromDashboard}
            onSelectTicker={handleSelectTicker}
          />
        )}

        {activeTab === 'research' && (
          <DeepResearchWorkspace
            currentUser={currentUser}
            initialTicker={selectedTicker}
            onOpenTickerChart={(sym) => {
              handleSelectTicker(sym as TickerSymbol);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'multi_asset_markets' && (
          <MultiAssetMarketsView
            selectedInstrument={selectedInstrument}
            onSelectInstrument={(inst) => {
              setSelectedInstrument(inst);
              if (inst.symbol) {
                handleSelectTicker(inst.symbol as TickerSymbol);
              }
            }}
            onOpenAiAnalysis={(inst) => setAiAnalysisInstrument(inst)}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'connected_portfolio' && (
          <ConnectedAccountsView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
            onSelectTicker={(ticker) => {
              handleSelectTicker(ticker as TickerSymbol);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'technicals' && <TechnicalEngineView data={marketData} />}

        {activeTab === 'support_resistance' && <SupportResistanceView data={marketData} />}

        {activeTab === 'breadth_intermarket' && <BreadthIntermarketView data={marketData} />}

        {activeTab === 'sectors' && <SectorHeatmapView data={marketData} />}

        {activeTab === 'options' && <OptionsTraderView />}

        {activeTab === 'economic_fed' && <EconomicFedView data={marketData} />}

        {activeTab === 'news' && (
          <NewsIntelligenceDashboard
            data={marketData}
            onSelectTicker={(ticker) => {
              handleSelectTicker(ticker as TickerSymbol);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'community' && (
          <CommunityView
            currentUser={currentUser}
            onSelectTicker={(ticker) => {
              handleSelectTicker(ticker as TickerSymbol);
              setActiveTab('overview');
            }}
          />
        )}

        {activeTab === 'chat' && (
          <AskMarketMindChat data={marketData} initialQuestion={chatInitialPrompt} />
        )}

        {activeTab === 'watchlists' && (
          <WatchlistsView
            onSelectTicker={handleSelectTicker}
            currentTicker={selectedTicker}
          />
        )}

        {activeTab === 'saved_alerts' && (
          <SavedAlertsManagerView
            currentTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
          />
        )}

        {activeTab === 'prediction_history' && (
          <PredictionHistoryView onSelectTicker={handleSelectTicker} />
        )}

        {activeTab === 'export_reports' && (
          <ExportReportsView
            data={marketData}
            probabilities={marketData.probabilities}
          />
        )}

        {activeTab === 'simulator' && <TradeSimulatorView data={marketData} />}

        {activeTab === 'backtest' && <PredictionsBacktestView data={marketData} />}

        {activeTab === 'alerts_ml' && (
          <AlertsManagerView
            data={marketData}
            alerts={alerts}
            onDismissAlert={handleDismissAlert}
          />
        )}

        {activeTab === 'help_center' && (
          <HelpCenterView
            onOpenContact={() => setIsContactSupportOpen(true)}
            onOpenTour={() => setIsOnboardingTourOpen(true)}
          />
        )}

        {activeTab === 'status_page' && <StatusPageView />}

        {activeTab === 'admin' && <AdminDashboardView currentUser={currentUser} />}
      </main>

      {/* Footer / Risk Disclaimer & Telemetry Bar */}
      <footer className="mt-3 py-2.5 px-3 bg-[#15171a] border border-[#2d3139] rounded-lg text-[10px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded font-bold font-mono text-[9px] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE MARKET FEED
          </span>
          <span>
            Connected to <strong>{dataSource}</strong>. Probabilities calculated dynamically with Bayesian quantitative models.
          </span>
        </div>

        {/* Footer Legal & Utility Links */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setIsPrivacyPolicyOpen(true)}
            className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
          >
            <Lock className="w-3 h-3 text-[#818cf8]" />
            <span>Privacy Policy</span>
          </button>

          <span className="text-slate-600">&bull;</span>

          <button
            onClick={() => setIsTermsOfServiceOpen(true)}
            className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span>Terms of Service</span>
          </button>

          <span className="text-slate-600">&bull;</span>

          <button
            onClick={() => setIsContactSupportOpen(true)}
            className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
          >
            <MessageSquare className="w-3 h-3 text-emerald-400" />
            <span>Contact Support</span>
          </button>

          <span className="text-slate-600">&bull;</span>

          <button
            onClick={() => setActiveTab('status_page')}
            className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px]"
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Status Page (99.9%)</span>
          </button>
        </div>
      </footer>

      {/* Intelligence Report Modal (From Quick Header Button) */}
      {reportModalType && (
        <ReportModal
          reportType={reportModalType}
          data={marketData}
          onClose={() => setReportModalType(null)}
        />
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserLoggedIn={handleUserChange}
      />

      {/* Subscription Pricing Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={currentUser}
        onPlanUpdated={handleUserChange}
      />

      {/* User Settings & API Keys Modal */}
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onUserSaved={handleUserChange}
        onOpenSubscription={() => {
          setIsSettingsModalOpen(false);
          setIsSubscriptionModalOpen(true);
        }}
      />

      {/* Interactive 6-Step Onboarding Walkthrough */}
      <OnboardingTourModal
        isOpen={isOnboardingTourOpen}
        onClose={() => setIsOnboardingTourOpen(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />

      {/* Terms of Service & Regulatory Modal */}
      <TermsOfServiceModal
        isOpen={isTermsOfServiceOpen}
        onClose={() => setIsTermsOfServiceOpen(false)}
      />

      {/* Contact & Support Desk Modal */}
      <ContactSupportModal
        isOpen={isContactSupportOpen}
        onClose={() => setIsContactSupportOpen(false)}
        currentUser={currentUser}
      />

      {/* Universal Multi-Asset Global Directory Search Modal */}
      <UniversalSearchModal
        isOpen={isUniversalSearchOpen}
        onClose={() => setIsUniversalSearchOpen(false)}
        onSelectInstrument={(inst) => {
          setSelectedInstrument(inst);
          if (inst.symbol) {
            handleSelectTicker(inst.symbol as TickerSymbol);
          }
          setIsUniversalSearchOpen(false);
        }}
      />

      {/* Multi-Asset AI Gemini Analysis & Synthesis Modal */}
      {aiAnalysisInstrument && (
        <MultiAssetAiAnalysisModal
          isOpen={!!aiAnalysisInstrument}
          onClose={() => setAiAnalysisInstrument(null)}
          instrument={aiAnalysisInstrument}
        />
      )}

      {/* Institutional Market Briefings Modal (Morning Brief / Closing Bell) */}
      {isMarketBriefsOpen && (
        <MarketBriefsModal
          isOpen={isMarketBriefsOpen}
          onClose={() => setIsMarketBriefsOpen(false)}
          briefType={marketBriefType}
          onSelectSymbol={(sym) => {
            handleSelectTicker(sym as TickerSymbol);
            setActiveTab('overview');
          }}
          onAskQuestion={handleAskQuestionFromDashboard}
        />
      )}

      {/* Verified Smart Notification Center */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onSelectSymbol={(sym) => {
          handleSelectTicker(sym as TickerSymbol);
          setActiveTab('overview');
        }}
      />

      {/* Fast User Onboarding & Personalization */}
      <FastOnboardingModal
        isOpen={isFastOnboardingOpen}
        onClose={() => setIsFastOnboardingOpen(false)}
        onComplete={(answers) => {
          AnalyticsService.track('onboarding_completed', { ...answers });
          setIsFastOnboardingOpen(false);
        }}
      />

      {/* Report Data Issue Quality Feedback Modal */}
      <ReportDataIssueModal
        isOpen={isReportIssueOpen}
        onClose={() => setIsReportIssueOpen(false)}
        activeSymbol={selectedTicker}
        dataSource={dataSource}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileNavigationBar
        activeTab={
          activeTab === 'overview'
            ? 'MARKETS'
            : activeTab === 'watchlists'
            ? 'WATCHLIST'
            : activeTab === 'news'
            ? 'NEWS'
            : activeTab === 'connected-accounts'
            ? 'PORTFOLIO'
            : 'MARKETS'
        }
        onSelectTab={(tab) => {
          if (tab === 'MARKETS') setActiveTab('overview');
          else if (tab === 'SEARCH') setIsUniversalSearchOpen(true);
          else if (tab === 'WATCHLIST') setActiveTab('watchlists');
          else if (tab === 'PORTFOLIO') setActiveTab('connected-accounts');
          else if (tab === 'NEWS') setActiveTab('news');
          else if (tab === 'AI_CHAT') setActiveTab('ask-ai');
        }}
        watchlistCount={watchlistIds.length}
      />
    </div>
  );
}
