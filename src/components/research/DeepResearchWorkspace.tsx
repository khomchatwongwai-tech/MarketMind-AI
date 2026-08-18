import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  ShieldCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Layers,
  Scale,
  Calendar,
  DollarSign,
  Download,
  Share2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  PieChart,
  Eye,
  Plus,
  BookOpen,
  Info,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Briefcase,
  Sliders,
  Bookmark,
  Trash2,
} from 'lucide-react';
import {
  ResearchJob,
  ResearchReport,
  ResearchMode,
  ResearchSource,
  CompanyComparisonRow,
  PortfolioExposureResearch,
  ResearchNote,
} from '../../types/deepResearch';
import { ResearchStore } from '../../services/deepResearch/researchStore';
import { PdfExportService } from '../../services/deepResearch/pdfExportService';
import { NormalizedInstrument } from '../../types/instrument';
import { MASTER_INSTRUMENTS } from '../../services/marketProviders/InstrumentDirectoryService';
import { UserProfile } from '../../types/user';
import { useI18n } from '../../i18n/I18nContext';

interface DeepResearchWorkspaceProps {
  currentUser?: UserProfile | null;
  initialTicker?: string;
  onOpenTickerChart?: (ticker: string) => void;
}

export const DeepResearchWorkspace: React.FC<DeepResearchWorkspaceProps> = ({
  currentUser,
  initialTicker = 'NVDA',
  onOpenTickerChart,
}) => {
  const { t, language, aiLanguage, formatCurrency, formatNumber, formatDate } = useI18n();
  const [queryPrompt, setQueryPrompt] = useState<string>(`Comprehensive research on ${initialTicker}`);
  const [selectedMode, setSelectedMode] = useState<ResearchMode>('deep_research');
  const [activeReport, setActiveReport] = useState<ResearchReport | null>(() => {
    const list = ResearchStore.listReports(currentUser?.id || 'user_default');
    return list[0] || null;
  });
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [workspaceTab, setWorkspaceTab] = useState<'report' | 'compare' | 'sec' | 'macro' | 'portfolio' | 'archive'>('report');

  // Source drawer modal
  const [selectedSource, setSelectedSource] = useState<ResearchSource | null>(null);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState<boolean>(false);

  // Comparison State
  const [compareSymbols, setCompareSymbols] = useState<string[]>(['NVDA', 'AMD', 'AVGO']);
  const [comparisonData, setComparisonData] = useState<CompanyComparisonRow[]>([]);
  const [isLoadingCompare, setIsLoadingCompare] = useState<boolean>(false);

  // Macro State
  const [macroData, setMacroData] = useState<{ indicators: any[]; scenarios: any; sources: any[] } | null>(null);

  // Portfolio State
  const [portfolioResearch, setPortfolioResearch] = useState<PortfolioExposureResearch | null>(null);

  // Notes
  const [notes, setNotes] = useState<ResearchNote[]>(() => ResearchStore.listNotes(currentUser?.id || 'user_default'));
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Past Reports list
  const [reportList, setReportList] = useState<ResearchReport[]>(() =>
    ResearchStore.listReports(currentUser?.id || 'user_default')
  );

  // Quick preset mode pills
  const MODES: { id: ResearchMode; label: string; icon: React.ElementType }[] = [
    { id: 'deep_research', label: 'Institutional Deep Dive', icon: Sparkles },
    { id: 'bull_vs_bear', label: 'Bull vs. Bear Debate', icon: Scale },
    { id: 'company_comparison', label: 'Multi-Asset Compare', icon: Layers },
    { id: 'sec_filing_research', label: 'SEC 10-K/10-Q Forensics', icon: FileText },
    { id: 'macro_research', label: 'Macro & Fed Sensitivity', icon: Calendar },
    { id: 'portfolio_research', label: 'Portfolio Risk Guardian', icon: Briefcase },
    { id: 'earnings_research', label: 'Earnings Catalyst', icon: Activity },
    { id: 'investment_memo', label: 'Investment Memo', icon: BookOpen },
  ];

  // Fetch macro data on mount
  useEffect(() => {
    fetch('/api/research/macro', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => setMacroData(data))
      .catch(() => {});
  }, []);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle running research job
  const handleExecuteResearch = async (customPrompt?: string, customMode?: ResearchMode) => {
    const promptToRun = customPrompt || queryPrompt;
    const modeToRun = customMode || selectedMode;
    if (!promptToRun.trim()) return;

    setIsExecuting(true);
    setErrorMessage(null);
    setProgressPercent(15);
    setActiveStage('Resolving Security & Ingesting SEC EDGAR Filings (Tier 1)...');

    try {
      // Stage progress simulation for rich visual feedback
      const timer1 = setTimeout(() => {
        setProgressPercent(45);
        setActiveStage('Ingesting Real-Time Order Flow & Macro Yield Curve Data (Tier 1/2)...');
      }, 700);

      const timer2 = setTimeout(() => {
        setProgressPercent(75);
        setActiveStage('Extracting Fact Claims, Resolving Conflicts & AI Grounding...');
      }, 1400);

      const res = await fetch('/api/research/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToRun,
          mode: modeToRun,
          userId: currentUser?.id || 'user_default',
          language: aiLanguage || language || 'en',
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to execute deep research dossier. Please check subscription tier.');
        return;
      }

      if (data.report) {
        setActiveReport(data.report);
        setReportList(ResearchStore.listReports(currentUser?.id || 'user_default'));
        setWorkspaceTab('report');
      }
      setProgressPercent(100);
      setActiveStage('Research Dossier Verified & Finalized.');
    } catch (err: any) {
      console.error('Failed to execute research job:', err);
      setErrorMessage(err?.message || 'Network error while generating deep research report.');
    } finally {
      setTimeout(() => {
        setIsExecuting(false);
      }, 500);
    }
  };

  // Handle Multi-Company Compare
  const handleRunCompare = async () => {
    setIsLoadingCompare(true);
    try {
      const res = await fetch('/api/research/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: compareSymbols }),
      });
      const data = await res.json();
      if (data.comparisonRows) {
        setComparisonData(data.comparisonRows);
      }
    } catch (err) {
      console.error('Failed to run compare:', err);
    } finally {
      setIsLoadingCompare(false);
    }
  };

  // Handle Portfolio Research
  const handleRunPortfolioResearch = async () => {
    try {
      const res = await fetch('/api/research/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setPortfolioResearch(data);
    } catch (err) {
      console.error('Failed to run portfolio research:', err);
    }
  };

  // Handle "What Changed?" Re-Evaluation
  const handleUpdateReport = async () => {
    if (!activeReport) return;
    setIsExecuting(true);
    setActiveStage('Re-evaluating Price Deltas, New SEC Filings & Macro Shifts...');
    try {
      const res = await fetch(`/api/research/reports/${activeReport.id}/update`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.report) {
        setActiveReport(data.report);
        setReportList(ResearchStore.listReports(currentUser?.id || 'user_default'));
      }
    } catch (err) {
      console.error('Failed to update report:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Save Note
  const handleSaveNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !activeReport) return;
    const note: ResearchNote = {
      id: `note_${Date.now()}`,
      userId: currentUser?.id || 'user_default',
      reportId: activeReport.id,
      ticker: activeReport.ticker,
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ResearchStore.saveNote(note);
    setNotes(ResearchStore.listNotes(currentUser?.id || 'user_default'));
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  return (
    <div id="deep-research-workspace" className="flex flex-col gap-4 w-full max-w-7xl mx-auto pb-16">
      {/* Top Hero Command & Search Panel */}
      <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[var(--text-primary)]">
                  MarketMind Institutional Deep Research
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wide">
                  TIER 1-4 EVIDENCE VERIFIED
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Autonomous financial forensics, SEC EDGAR 10-K/10-Q ingestion, macroeconomic models, and multi-scenario synthesis.
              </p>
            </div>
          </div>

          {activeReport && (
            <div className="flex items-center gap-2">
              <button
                id="btn-update-report"
                onClick={handleUpdateReport}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-primary)] text-xs font-semibold bg-[var(--background-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-background)] transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                <span>What Changed?</span>
              </button>

              <button
                id="btn-export-pdf"
                onClick={() => PdfExportService.printOrSaveReport(activeReport)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dossier (PDF)</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="input-research-query"
              type="text"
              value={queryPrompt}
              onChange={(e) => setQueryPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteResearch();
              }}
              placeholder="Ask anything: 'Analyze NVDA gross margins and Blackwell ramp', 'Compare NVDA vs AMD vs AVGO', 'AAPL SEC 10-Q risk factors'..."
              className="w-full bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg pl-9 pr-24 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                id="btn-run-deep-research"
                onClick={() => handleExecuteResearch()}
                disabled={isExecuting}
                className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isExecuting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>{isExecuting ? 'Synthesizing...' : 'Execute Research'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400/70 hover:text-rose-400 text-xs font-semibold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mode Selectors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`btn-mode-${mode.id}`}
                onClick={() => {
                  setSelectedMode(mode.id);
                  if (mode.id === 'company_comparison') {
                    setWorkspaceTab('compare');
                    handleRunCompare();
                  } else if (mode.id === 'macro_research') {
                    setWorkspaceTab('macro');
                  } else if (mode.id === 'portfolio_research') {
                    setWorkspaceTab('portfolio');
                    handleRunPortfolioResearch();
                  } else {
                    setWorkspaceTab('report');
                    handleExecuteResearch(undefined, mode.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                    : 'bg-[var(--background-primary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar when Executing */}
        {isExecuting && (
          <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-500 mb-1.5">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{activeStage}</span>
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-[var(--border-primary)] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-primary)] pb-2 text-xs font-semibold">
        <button
          onClick={() => setWorkspaceTab('report')}
          className={`px-3 py-1.5 rounded-lg transition ${
            workspaceTab === 'report'
              ? 'bg-[var(--background-secondary)] text-blue-500 border border-[var(--border-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Research Report & Scenarios
        </button>

        <button
          onClick={() => {
            setWorkspaceTab('compare');
            if (comparisonData.length === 0) handleRunCompare();
          }}
          className={`px-3 py-1.5 rounded-lg transition ${
            workspaceTab === 'compare'
              ? 'bg-[var(--background-secondary)] text-blue-500 border border-[var(--border-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Multi-Asset Comparison Arena
        </button>

        <button
          onClick={() => setWorkspaceTab('sec')}
          className={`px-3 py-1.5 rounded-lg transition ${
            workspaceTab === 'sec'
              ? 'bg-[var(--background-secondary)] text-blue-500 border border-[var(--border-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          SEC EDGAR 10-K/10-Q Explorer
        </button>

        <button
          onClick={() => setWorkspaceTab('macro')}
          className={`px-3 py-1.5 rounded-lg transition ${
            workspaceTab === 'macro'
              ? 'bg-[var(--background-secondary)] text-blue-500 border border-[var(--border-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Macroeconomic & Fed Rates
        </button>

        <button
          onClick={() => {
            setWorkspaceTab('portfolio');
            if (!portfolioResearch) handleRunPortfolioResearch();
          }}
          className={`px-3 py-1.5 rounded-lg transition ${
            workspaceTab === 'portfolio'
              ? 'bg-[var(--background-secondary)] text-blue-500 border border-[var(--border-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Portfolio Risk Guardian
        </button>

        <button
          onClick={() => setWorkspaceTab('archive')}
          className={`px-3 py-1.5 rounded-lg transition ${
            workspaceTab === 'archive'
              ? 'bg-[var(--background-secondary)] text-blue-500 border border-[var(--border-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Research Archive & Notes ({reportList.length})
        </button>
      </div>

      {/* Main Sub-Views */}

      {/* VIEW 1: ACTIVE RESEARCH REPORT */}
      {workspaceTab === 'report' && activeReport && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main 3-Column Report Body */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Header Metadata Card */}
            <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[var(--text-primary)]">{activeReport.companyName}</span>
                    <span className="text-sm font-semibold px-2 py-0.5 rounded bg-[var(--background-primary)] border border-[var(--border-primary)] text-[var(--text-primary)]">
                      {activeReport.ticker}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                      CONFIDENCE: {activeReport.confidenceScore}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{activeReport.researchQuestion}</p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-[var(--text-primary)]">
                    ${activeReport.marketSnapshot.price ? activeReport.marketSnapshot.price.toFixed(2) : 'N/A'}
                  </div>
                  <div
                    className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                      (activeReport.marketSnapshot.changePercent || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {(activeReport.marketSnapshot.changePercent || 0) >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {(activeReport.marketSnapshot.changePercent || 0) >= 0 ? '+' : ''}
                      {(activeReport.marketSnapshot.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* What Changed Banner if present */}
              {activeReport.whatChanged && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-500 mb-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>WHAT CHANGED SINCE LAST RESEARCH (Delta: {activeReport.whatChanged.priceDelta})</span>
                  </div>
                  <ul className="list-disc pl-4 text-[var(--text-primary)] space-y-1">
                    {activeReport.whatChanged.thesisShifts.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Executive Summary */}
            <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Executive Summary & Thesis</span>
              </h2>
              <p className="text-xs leading-relaxed text-[var(--text-primary)]">{activeReport.executiveSummary}</p>
            </div>

            {/* Bull Thesis vs Bear Thesis Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--background-secondary)] border border-emerald-500/30 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Bull Thesis & Growth Drivers</h3>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-primary)]">
                  {activeReport.bullThesis.map((thesis, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">•</span>
                      <span>{thesis}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--background-secondary)] border border-rose-500/30 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wide">Bear Thesis & Core Risks</h3>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-primary)]">
                  {activeReport.bearThesis.map((thesis, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold mt-0.5">•</span>
                      <span>{thesis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 12-Month Multi-Scenario Analysis Matrix */}
            <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-500" />
                  <span>12-Month Multi-Scenario Analysis</span>
                </h2>
                <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                  TAGGED AS: ESTIMATED SCENARIOS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Bull Case */}
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-500 mb-1">
                      <span>{activeReport.scenarioAnalysis.bullCase.title}</span>
                      <span>{activeReport.scenarioAnalysis.bullCase.probability}</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {activeReport.scenarioAnalysis.bullCase.targetPriceRange || 'N/A'}
                    </div>
                    <div className="text-xs font-semibold text-emerald-500 mb-2">
                      Potential: {activeReport.scenarioAnalysis.bullCase.potentialReturn}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mb-2">
                      {activeReport.scenarioAnalysis.bullCase.assumptions.revenueGrowth}
                    </p>
                  </div>
                  <div className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                    Multiple: {activeReport.scenarioAnalysis.bullCase.assumptions.terminalValuation}
                  </div>
                </div>

                {/* Base Case */}
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-blue-500 mb-1">
                      <span>{activeReport.scenarioAnalysis.baseCase.title}</span>
                      <span>{activeReport.scenarioAnalysis.baseCase.probability}</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {activeReport.scenarioAnalysis.baseCase.targetPriceRange || 'N/A'}
                    </div>
                    <div className="text-xs font-semibold text-blue-500 mb-2">
                      Potential: {activeReport.scenarioAnalysis.baseCase.potentialReturn}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mb-2">
                      {activeReport.scenarioAnalysis.baseCase.assumptions.revenueGrowth}
                    </p>
                  </div>
                  <div className="text-[10px] font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-500">
                    Multiple: {activeReport.scenarioAnalysis.baseCase.assumptions.terminalValuation}
                  </div>
                </div>

                {/* Bear Case */}
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-rose-500 mb-1">
                      <span>{activeReport.scenarioAnalysis.bearCase.title}</span>
                      <span>{activeReport.scenarioAnalysis.bearCase.probability}</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {activeReport.scenarioAnalysis.bearCase.targetPriceRange || 'N/A'}
                    </div>
                    <div className="text-xs font-semibold text-rose-500 mb-2">
                      Potential: {activeReport.scenarioAnalysis.bearCase.potentialReturn}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mb-2">
                      {activeReport.scenarioAnalysis.bearCase.assumptions.revenueGrowth}
                    </p>
                  </div>
                  <div className="text-[10px] font-semibold px-2 py-1 rounded bg-rose-500/10 text-rose-500">
                    Multiple: {activeReport.scenarioAnalysis.bearCase.assumptions.terminalValuation}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Analysis & SEC Disclosures Table */}
            <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Verified Financial Facts & SEC EDGAR Filings</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] text-[var(--text-muted)]">
                      <th className="py-2 pr-4 font-semibold">Financial Metric / Disclosure</th>
                      <th className="py-2 px-4 font-semibold">Value</th>
                      <th className="py-2 px-4 font-semibold">Classification</th>
                      <th className="py-2 pl-4 font-semibold">Source Authority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    {activeReport.financialAnalysis.metrics.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--hover-background)] transition">
                        <td className="py-2 pr-4 font-medium text-[var(--text-primary)]">{row.label}</td>
                        <td className="py-2 px-4 font-bold text-[var(--text-primary)]">{row.value ?? 'N/A'}</td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.dataType === 'VERIFIED'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {row.dataType}
                          </span>
                        </td>
                        <td className="py-2 pl-4 text-[var(--text-muted)]">
                          {row.source} (Tier {row.tier})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Thesis Invalidation & Monitoring Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wide mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Thesis Invalidation Criteria</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--text-primary)]">
                  {activeReport.thesisInvalidation.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-wide mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>What to Monitor Next</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--text-primary)]">
                  {activeReport.whatToMonitorNext.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right 1-Column Sources, Claims & Notes Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Sources Attribution Card */}
            <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Evidence Sources ({activeReport.sources.length})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {activeReport.sources.map((src) => (
                  <div
                    key={src.id}
                    onClick={() => {
                      setSelectedSource(src);
                      setIsSourceDrawerOpen(true);
                    }}
                    className="p-2 rounded-lg bg-[var(--background-primary)] border border-[var(--border-primary)] hover:border-blue-500 cursor-pointer transition flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)] truncate max-w-[160px]">{src.publisher}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          src.tier === 1
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : src.tier === 2
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        TIER {src.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{src.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Research Notes Card */}
            <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                <span>Analyst Notes</span>
              </h3>

              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note headline..."
                  className="w-full bg-[var(--background-primary)] border border-[var(--border-primary)] rounded p-1.5 text-xs text-[var(--text-primary)]"
                />
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter observation..."
                  rows={2}
                  className="w-full bg-[var(--background-primary)] border border-[var(--border-primary)] rounded p-1.5 text-xs text-[var(--text-primary)] resize-none"
                />
                <button
                  onClick={handleSaveNote}
                  className="w-full py-1 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Save Note
                </button>
              </div>

              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="p-2 rounded bg-[var(--background-primary)] border border-[var(--border-primary)] text-xs">
                    <div className="font-bold text-[var(--text-primary)]">{n.title}</div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-ASSET COMPARISON ARENA */}
      {workspaceTab === 'compare' && (
        <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Multi-Asset Comparison Arena</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Side-by-side fundamental, valuation, and technical analysis across peer securities.
              </p>
            </div>

            <button
              onClick={handleRunCompare}
              disabled={isLoadingCompare}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingCompare ? 'animate-spin' : ''}`} />
              <span>Refresh Matrix</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-primary)] text-[var(--text-muted)]">
                  <th className="py-2 pr-3 font-semibold">Security</th>
                  <th className="py-2 px-3 font-semibold">Price (1D)</th>
                  <th className="py-2 px-3 font-semibold">Market Cap</th>
                  <th className="py-2 px-3 font-semibold">Revenue YoY</th>
                  <th className="py-2 px-3 font-semibold">Gross Margin</th>
                  <th className="py-2 px-3 font-semibold">Forward P/E</th>
                  <th className="py-2 px-3 font-semibold">FCF Yield</th>
                  <th className="py-2 px-3 font-semibold">Tech Bias</th>
                  <th className="py-2 px-3 font-semibold">Consensus</th>
                  <th className="py-2 pl-3 font-semibold">Core Advantage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {comparisonData.map((row) => (
                  <tr key={row.ticker} className="hover:bg-[var(--hover-background)] transition">
                    <td className="py-2.5 pr-3 font-bold text-[var(--text-primary)]">
                      <div>{row.name}</div>
                      <span className="text-[10px] text-[var(--text-muted)]">{row.ticker}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">
                      <div>{row.price}</div>
                      <span className="text-[10px] text-emerald-500 font-semibold">{row.change1D}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium">{row.marketCap}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-500">{row.revenueYoY}</td>
                    <td className="py-2.5 px-3 font-medium">{row.grossMargin}</td>
                    <td className="py-2.5 px-3 font-bold">{row.peRatio}</td>
                    <td className="py-2.5 px-3 font-medium">{row.fcfYield}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                        {row.technicalBias}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">{row.analystConsensus}</td>
                    <td className="py-2.5 pl-3 text-[11px] text-[var(--text-muted)] max-w-xs">{row.primaryAdvantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: SEC EDGAR FILINGS EXPLORER */}
      {workspaceTab === 'sec' && (
        <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Official SEC EDGAR Regulatory Disclosures (Tier 1 Authority)</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Direct access to Form 10-K, 10-Q, and 8-K filings filed with the U.S. Securities and Exchange Commission.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {activeReport?.secFilingAnalysis.filings.map((filing, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--background-primary)] border border-[var(--border-primary)] text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      SEC Form {filing.filingType}
                    </span>
                    <span className="text-[var(--text-primary)] font-semibold">{filing.description}</span>
                  </div>
                  <a
                    href={filing.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:underline text-[11px]"
                  >
                    <span>View on SEC.gov</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-[11px] text-[var(--text-muted)] mb-2">
                  Filing Date: {filing.filingDate} • Period Ending: {filing.periodEnding} • Accession: {filing.accessionNumber}
                </div>

                <div className="bg-[var(--background-secondary)] p-2 rounded border border-[var(--border-primary)] mb-2">
                  <div className="font-bold text-[var(--text-primary)] mb-1">Key Disclosed Changes & Highlights:</div>
                  <ul className="list-disc pl-4 space-y-1 text-[var(--text-muted)]">
                    {filing.keyChanges.map((change, cIdx) => (
                      <li key={cIdx}>{change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: MACROECONOMIC & FED RATES */}
      {workspaceTab === 'macro' && macroData && (
        <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Federal Reserve & Macroeconomic Indicators (Tier 1 Authority)</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Official data from the Federal Reserve Board, Bureau of Labor Statistics (BLS), and U.S. Treasury.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {macroData.indicators.map((ind, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--background-primary)] border border-[var(--border-primary)] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[var(--text-muted)]">{ind.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500">TIER 1</span>
                </div>
                <div className="text-base font-bold text-[var(--text-primary)] mb-1">{ind.currentValue}</div>
                <p className="text-[11px] text-[var(--text-muted)]">{ind.impactAssessment}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs">
            <div className="font-bold text-blue-500 mb-1">CPI SCENARIO SENSITIVITY MATRIX</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="p-2 rounded bg-[var(--background-primary)] border border-[var(--border-primary)]">
                <div className="font-bold text-emerald-500">Cool CPI (20% Prob)</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">10Y Yields drop -12 bps; +1.8% to Tech hardware & cloud multiples.</div>
              </div>
              <div className="p-2 rounded bg-[var(--background-primary)] border border-[var(--border-primary)]">
                <div className="font-bold text-blue-500">Consensus CPI (60% Prob)</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">Steady glidepath; confirms 25 bps rate cut recalibration.</div>
              </div>
              <div className="p-2 rounded bg-[var(--background-primary)] border border-[var(--border-primary)]">
                <div className="font-bold text-rose-500">Hot CPI (20% Prob)</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">10Y Yields surge +15 bps; multiple compression in duration assets.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: PORTFOLIO RISK GUARDIAN */}
      {workspaceTab === 'portfolio' && (
        <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span>Portfolio Risk Guardian & Macro Exposure</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Quantitative risk forensics, sector concentration, and beta sensitivity modeling.
              </p>
            </div>

            <button
              onClick={handleRunPortfolioResearch}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              Recalculate Risk
            </button>
          </div>

          {portfolioResearch && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[var(--background-primary)] border border-[var(--border-primary)] text-xs">
                <div className="text-[var(--text-muted)] font-semibold">Portfolio Beta</div>
                <div className="text-xl font-bold text-blue-500 my-1">{portfolioResearch.portfolioBeta}</div>
                <p className="text-[11px] text-[var(--text-muted)]">High sensitivity to broad market movements & interest rates.</p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--background-primary)] border border-[var(--border-primary)] text-xs">
                <div className="text-[var(--text-muted)] font-semibold">Concentration Score</div>
                <div className="text-xl font-bold text-amber-500 my-1">{portfolioResearch.concentrationScore}/100</div>
                <p className="text-[11px] text-[var(--text-muted)]">Over 60% of total capital allocated to AI hardware & software.</p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--background-primary)] border border-[var(--border-primary)] text-xs">
                <div className="text-[var(--text-muted)] font-semibold">Holdings Count</div>
                <div className="text-xl font-bold text-emerald-500 my-1">{portfolioResearch.holdingsCount} Positions</div>
                <p className="text-[11px] text-[var(--text-muted)]">Total Portfolio Value: ${portfolioResearch.totalValue.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 6: RESEARCH ARCHIVE & HISTORY */}
      {workspaceTab === 'archive' && (
        <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Saved Research Reports Archive</h2>
          <div className="space-y-2">
            {reportList.map((rep) => (
              <div
                key={rep.id}
                onClick={() => {
                  setActiveReport(rep);
                  setWorkspaceTab('report');
                }}
                className="p-3 rounded-lg bg-[var(--background-primary)] border border-[var(--border-primary)] hover:border-blue-500 cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <span>{rep.title}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px]">
                      {rep.confidenceScore}% Confidence
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{rep.researchQuestion}</p>
                </div>
                <div className="text-right text-[11px] text-[var(--text-muted)]">
                  {new Date(rep.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Detail Drawer / Modal */}
      {isSourceDrawerOpen && selectedSource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-xl max-w-lg w-full p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Verified Evidence Source</h3>
              </div>
              <button
                onClick={() => setIsSourceDrawerOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-[var(--background-primary)] border border-[var(--border-primary)]">
                <div className="font-semibold text-[var(--text-muted)]">Publisher / Authority</div>
                <div className="font-bold text-[var(--text-primary)] text-sm">{selectedSource.publisher}</div>
              </div>

              <div className="p-2 rounded bg-[var(--background-primary)] border border-[var(--border-primary)]">
                <div className="font-semibold text-[var(--text-muted)]">Document Title / Disclosure</div>
                <div className="text-[var(--text-primary)]">{selectedSource.title}</div>
              </div>

              <div className="p-2 rounded bg-[var(--background-primary)] border border-[var(--border-primary)]">
                <div className="font-semibold text-[var(--text-muted)]">Excerpt / Disclosure Fact</div>
                <div className="text-[var(--text-primary)] italic">"{selectedSource.excerpt || 'Verified regulatory record'}"</div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2">
                <span>Tier {selectedSource.tier} • {selectedSource.source_type}</span>
                <a
                  href={selectedSource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1"
                >
                  <span>Open Primary Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
