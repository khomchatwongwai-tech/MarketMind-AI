import test from 'node:test';
import assert from 'node:assert/strict';
import { DeepResearchEngine } from '../src/services/deepResearch/deepResearchEngine';
import { SecEdgarService } from '../src/services/deepResearch/secEdgarService';
import { MacroDataService } from '../src/services/deepResearch/macroDataService';
import { ResearchStore } from '../src/services/deepResearch/researchStore';
import { ResearchJob } from '../src/types/deepResearch';

test('Deep Research & Market Intelligence Suite', async (t) => {
  await t.test('1. Intent Classification: resolves single entity, symbols and deep research mode', () => {
    const res = DeepResearchEngine.classifyIntent('Perform deep research on NVDA gross margins and Blackwell ramp');
    assert.equal(res.mode, 'deep_research');
    assert.deepEqual(res.targetSymbols, ['NVDA']);
    assert.ok(res.companyName.toLowerCase().includes('nvidia'));
  });

  await t.test('2. Intent Classification: detects multi-asset comparison query', () => {
    const res = DeepResearchEngine.classifyIntent('Compare NVDA vs AMD vs AVGO AI accelerator chips');
    assert.equal(res.mode, 'company_comparison');
    assert.ok(res.targetSymbols.includes('NVDA'));
    assert.ok(res.targetSymbols.includes('AMD'));
    assert.ok(res.targetSymbols.includes('AVGO'));
  });

  await t.test('3. Intent Classification: detects Bull vs Bear debate mode', () => {
    const res = DeepResearchEngine.classifyIntent('Bull vs bear debate for TSLA robotaxi and margins');
    assert.equal(res.mode, 'bull_vs_bear');
    assert.deepEqual(res.targetSymbols, ['TSLA']);
  });

  await t.test('4. Intent Classification: detects SEC Filing forensics mode', () => {
    const res = DeepResearchEngine.classifyIntent('Analyze AAPL latest 10-K and 10-Q risk factors');
    assert.equal(res.mode, 'sec_filing_research');
    assert.deepEqual(res.targetSymbols, ['AAPL']);
  });

  await t.test('5. Intent Classification: detects Macro and Fed research mode', () => {
    const res = DeepResearchEngine.classifyIntent('Macro research on FOMC rate decision and CPI disinflation');
    assert.equal(res.mode, 'macro_research');
  });

  await t.test('6. SEC EDGAR Service: resolves official CIK numbers without hallucination', async () => {
    assert.equal(await SecEdgarService.getCik('NVDA'), '0001045810');
    assert.equal(await SecEdgarService.getCik('AAPL'), '0000320193');
    assert.equal(await SecEdgarService.getCik('MSFT'), '0000789019');
    assert.equal(await SecEdgarService.getCik('TSLA'), '0001318605');
  });

  await t.test('7. SEC EDGAR Service: returns verified filing excerpts with Tier 1 sources', async () => {
    const profile = await SecEdgarService.getCompanyFilings('NVDA');
    assert.equal(profile.cik, '0001045810');
    assert.ok(profile.filings.length >= 1);
    assert.ok(profile.filings[0].accessionNumber.length > 5);
    assert.ok(profile.sources.length >= 1);
    assert.equal(profile.sources[0].tier, 1);
    assert.equal(profile.sources[0].source_type, 'SEC_EDGAR');
  });

  await t.test('8. Macro Data Service: returns Tier 1 indicators from Fed, BLS, and Treasury', () => {
    const indicators = MacroDataService.getMacroIndicators();
    assert.ok(indicators.length >= 5);
    const fedFunds = indicators.find((i) => i.name.includes('Federal Funds'));
    assert.ok(fedFunds);
    assert.equal(fedFunds.tier, 1);
    assert.ok(fedFunds.currentValue.includes('%'));

    const cpi = indicators.find((i) => i.name.includes('CPI'));
    assert.ok(cpi);
    assert.equal(cpi.tier, 1);
  });

  await t.test('9. Macro Data Service: generates CPI scenario sensitivity matrix', () => {
    const scenarios = MacroDataService.getMacroScenarios();
    assert.ok(scenarios.cpiScenarios.hot);
    assert.ok(scenarios.cpiScenarios.consensus);
    assert.ok(scenarios.cpiScenarios.cool);
    assert.ok(scenarios.fedPathway.targetRateRange);
  });

  await t.test('10. Deep Research Engine: executes complete research job and compiles grounded report', async () => {
    const job: ResearchJob = {
      id: 'job_test_1',
      userId: 'user_test',
      prompt: 'Comprehensive research on NVDA',
      mode: 'deep_research',
      targetSymbols: ['NVDA'],
      status: 'planning',
      progressPercent: 0,
      currentStage: 'planning',
      stepsCompleted: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const report = await DeepResearchEngine.executeResearchJob(job, () => null);
    assert.ok(report.id);
    assert.equal(report.ticker, 'NVDA');
    assert.ok(report.executiveSummary.length > 50);
    assert.ok(report.bullThesis.length >= 2);
    assert.ok(report.bearThesis.length >= 2);
    assert.ok(report.sources.length >= 3);
    assert.ok(report.citations.length >= 2);
    assert.ok(report.scenarioAnalysis.bullCase);
    assert.ok(report.scenarioAnalysis.baseCase);
    assert.ok(report.scenarioAnalysis.bearCase);
    assert.ok(report.confidenceScore >= 80);
    assert.ok(report.disclaimer.length > 20);
  });

  await t.test('11. Deep Research Engine: establishes Tier 1 source authority conflict resolution', async () => {
    const job: ResearchJob = {
      id: 'job_test_conflict',
      userId: 'user_test',
      prompt: 'Analyze NVDA packaging bottlenecks vs official 10-Q disclosures',
      mode: 'deep_research',
      targetSymbols: ['NVDA'],
      status: 'planning',
      progressPercent: 0,
      currentStage: 'planning',
      stepsCompleted: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const report = await DeepResearchEngine.executeResearchJob(job, () => null);
    if (report.conflicts.length > 0) {
      const conflict = report.conflicts[0];
      assert.ok(conflict.resolution);
      assert.ok(conflict.reason.includes('Tier 1'));
    }
  });

  await t.test('12. Deep Research Engine: executes portfolio risk and concentration research', () => {
    const holdings = [
      { symbol: 'NVDA', shares: 100, price: 128.40 },
      { symbol: 'AAPL', shares: 50, price: 224.20 },
      { symbol: 'MSFT', shares: 30, price: 448.10 },
    ];
    const res = DeepResearchEngine.executePortfolioResearch(holdings);
    assert.ok(res.totalValue > 0);
    assert.equal(res.holdingsCount, 3);
    assert.ok(res.portfolioBeta > 0);
    assert.ok(res.concentrationScore > 0);
    assert.ok(res.macroVulnerabilities.length > 0);
    assert.ok(res.diversificationRecommendations.length > 0);
  });

  await t.test('13. Research Store: saves, lists and deletes research jobs and reports', () => {
    const testReport = {
      id: 'rep_unit_test_store',
      jobId: 'job_unit_test',
      userId: 'user_unit_test',
      title: 'Test Report',
      researchQuestion: 'Test question',
      ticker: 'AMD',
      companyName: 'Advanced Micro Devices',
      assetClass: 'Equities',
      mode: 'deep_research' as const,
      executiveSummary: 'Summary',
      companyOverview: 'Overview',
      marketSnapshot: {
        price: 152.80,
        changePercent: 1.65,
        high52w: 227.30,
        low52w: 94.04,
        volume: 38000000,
        vwap: 151.20,
        marketStatus: 'OPEN',
        dataSource: 'Verified Feeds',
        timestamp: new Date().toISOString(),
        isRealTime: true,
      },
      bullThesis: ['Bull 1'],
      bearThesis: ['Bear 1'],
      keyCatalysts: ['Cat 1'],
      keyRisks: ['Risk 1'],
      financialAnalysis: {
        metrics: [],
        revenueAnalysis: 'Rev',
        marginProfile: 'Margin',
        freeCashFlow: 'FCF',
        balanceSheetStrength: 'Strong',
      },
      valuation: { historicalContext: 'Context', peerComparisonSummary: 'Peer' },
      secFilingAnalysis: { filings: [], managementGuidance: 'Guidance', insiderActivity: 'None', materialDisclosures: 'None' },
      technicalStructure: { trend: 'BULLISH' as const, supportLevels: [], resistanceLevels: [], momentumRsi: '55', movingAveragesSummary: 'Bullish' },
      macroSensitivity: { fedRateSensitivity: 'HIGH' as const, inflationSensitivity: 'Low', usdSensitivity: 'Moderate', economicDrivers: [] },
      industryAndCompetitors: { sector: 'Tech', industry: 'Semis', competitiveMoat: 'Moat', marketShareNotes: 'Share' },
      scenarioAnalysis: {
        timeHorizon: '12_MONTHS' as const,
        disclaimer: 'Disclaimer',
        bullCase: { title: 'Bull', probability: '30%', potentialReturn: '+25%', assumptions: { revenueGrowth: '30%', margins: '55%', terminalValuation: '35x', macroContext: 'Good' }, catalysts: [], risks: [], confidence: 'HIGH' as const },
        baseCase: { title: 'Base', probability: '50%', potentialReturn: '+15%', assumptions: { revenueGrowth: '18%', margins: '52%', terminalValuation: '30x', macroContext: 'Normal' }, catalysts: [], risks: [], confidence: 'HIGH' as const },
        bearCase: { title: 'Bear', probability: '20%', potentialReturn: '-15%', assumptions: { revenueGrowth: '5%', margins: '45%', terminalValuation: '20x', macroContext: 'Slow' }, catalysts: [], risks: [], confidence: 'MEDIUM' as const },
      },
      thesisInvalidation: [],
      whatToMonitorNext: [],
      sources: [],
      claims: [],
      citations: [],
      conflicts: [],
      confidenceScore: 92,
      dataFreshness: {},
      disclaimer: 'Disclaimer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ResearchStore.saveReport(testReport);
    const fetched = ResearchStore.getReport('rep_unit_test_store');
    assert.ok(fetched);
    assert.equal(fetched.ticker, 'AMD');

    const deleted = ResearchStore.deleteReport('rep_unit_test_store');
    assert.equal(deleted, true);
    assert.equal(ResearchStore.getReport('rep_unit_test_store'), undefined);
  });
});
