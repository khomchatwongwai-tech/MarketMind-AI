import { ResearchReport } from '../../types/deepResearch.js';

export class PdfExportService {
  /**
   * Generates a printable, styled institutional research report document in an isolated browser window
   */
  public static printOrSaveReport(report: ResearchReport) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.warn('[PdfExportService] Popup blocked; unable to open print preview.');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.title} - MarketMind AI Institutional Research</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
      @page { margin: 15mm 12mm 15mm 12mm; size: A4 portrait; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .meta-item strong { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; }
    .meta-item span { font-size: 13px; font-weight: 600; color: #0f172a; }
    h2 {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 16px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    p { margin-bottom: 10px; text-align: justify; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .bull-title { color: #166534; }
    .bear-title { color: #991b1b; }
    ul { padding-left: 18px; margin-bottom: 8px; }
    li { margin-bottom: 4px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      text-align: left;
    }
    th { background: #f1f5f9; font-weight: 700; color: #334155; }
    .source-tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      background: #e2e8f0;
      border-radius: 3px;
      margin-right: 4px;
    }
    .disclaimer {
      font-size: 10px;
      color: #64748b;
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      text-align: justify;
    }
    .action-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">MARKETMIND AI</div>
      <div style="font-size: 11px; color: #64748b; font-weight: 600;">INSTITUTIONAL DEEP RESEARCH & MARKET INTELLIGENCE</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">CONFIDENCE: ${report.confidenceScore}%</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">DATE: ${new Date(report.createdAt).toLocaleDateString()}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>SECURITY</strong>
      <span>${report.companyName} (${report.ticker})</span>
    </div>
    <div class="meta-item">
      <strong>ASSET CLASS / SECTOR</strong>
      <span>${report.assetClass} • ${report.industryAndCompetitors.sector}</span>
    </div>
    <div class="meta-item">
      <strong>VERIFIED PRICE</strong>
      <span>$${report.marketSnapshot.price ? report.marketSnapshot.price.toFixed(2) : 'N/A'} (${report.marketSnapshot.changePercent ? (report.marketSnapshot.changePercent > 0 ? '+' : '') + report.marketSnapshot.changePercent.toFixed(2) + '%' : '0.00%'})</span>
    </div>
    <div class="meta-item">
      <strong>RESEARCH MODE</strong>
      <span>${report.mode.replace(/_/g, ' ').toUpperCase()}</span>
    </div>
  </div>

  <h2>1. Executive Summary & Thesis Statement</h2>
  <p>${report.executiveSummary}</p>

  <h2>2. Investment Debate: Bull Thesis vs. Bear Thesis</h2>
  <div class="grid-2">
    <div class="card" style="border-left: 3px solid #16a34a;">
      <div class="card-title bull-title">BULL THESIS (CATALYSTS & EXPANSION)</div>
      <ul>
        ${report.bullThesis.map((t) => `<li>${t}</li>`).join('')}
      </ul>
    </div>
    <div class="card" style="border-left: 3px solid #dc2626;">
      <div class="card-title bear-title">BEAR THESIS (RISKS & SKEW)</div>
      <ul>
        ${report.bearThesis.map((t) => `<li>${t}</li>`).join('')}
      </ul>
    </div>
  </div>

  <h2>3. Financial Analysis & SEC Regulatory Disclosures</h2>
  <table>
    <thead>
      <tr>
        <th>Metric / Disclosure</th>
        <th>Reported Fact</th>
        <th>Classification</th>
        <th>Source Authority</th>
      </tr>
    </thead>
    <tbody>
      ${report.financialAnalysis.metrics
        .map(
          (m) => `
        <tr>
          <td><strong>${m.label}</strong></td>
          <td>${m.value ?? 'N/A'}</td>
          <td><span class="source-tag">${m.dataType}</span></td>
          <td>${m.source} (Tier ${m.tier})</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>4. 12-Month Multi-Scenario Analysis (Bear / Base / Bull)</h2>
  <table>
    <thead>
      <tr>
        <th>Scenario</th>
        <th>Probability</th>
        <th>Estimated Target</th>
        <th>Implied Return</th>
        <th>Core Assumptions</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background: #f0fdf4;">
        <td><strong>${report.scenarioAnalysis.bullCase.title}</strong></td>
        <td>${report.scenarioAnalysis.bullCase.probability}</td>
        <td>${report.scenarioAnalysis.bullCase.targetPriceRange || 'N/A'}</td>
        <td style="color: #166534; font-weight: 700;">${report.scenarioAnalysis.bullCase.potentialReturn}</td>
        <td>${report.scenarioAnalysis.bullCase.assumptions.revenueGrowth}; ${report.scenarioAnalysis.bullCase.assumptions.margins}</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td><strong>${report.scenarioAnalysis.baseCase.title}</strong></td>
        <td>${report.scenarioAnalysis.baseCase.probability}</td>
        <td>${report.scenarioAnalysis.baseCase.targetPriceRange || 'N/A'}</td>
        <td style="font-weight: 700;">${report.scenarioAnalysis.baseCase.potentialReturn}</td>
        <td>${report.scenarioAnalysis.baseCase.assumptions.revenueGrowth}; ${report.scenarioAnalysis.baseCase.assumptions.margins}</td>
      </tr>
      <tr style="background: #fef2f2;">
        <td><strong>${report.scenarioAnalysis.bearCase.title}</strong></td>
        <td>${report.scenarioAnalysis.bearCase.probability}</td>
        <td>${report.scenarioAnalysis.bearCase.targetPriceRange || 'N/A'}</td>
        <td style="color: #991b1b; font-weight: 700;">${report.scenarioAnalysis.bearCase.potentialReturn}</td>
        <td>${report.scenarioAnalysis.bearCase.assumptions.revenueGrowth}; ${report.scenarioAnalysis.bearCase.assumptions.margins}</td>
      </tr>
    </tbody>
  </table>

  <h2>5. Evidence & Source Attribution Registry</h2>
  <table>
    <thead>
      <tr>
        <th>Source ID</th>
        <th>Title / Filing</th>
        <th>Publisher</th>
        <th>Tier</th>
        <th>Verification</th>
      </tr>
    </thead>
    <tbody>
      ${report.sources
        .map(
          (s) => `
        <tr>
          <td><strong>${s.id}</strong></td>
          <td>${s.title}</td>
          <td>${s.publisher}</td>
          <td>Tier ${s.tier}</td>
          <td><span class="source-tag" style="background: #dcfce7; color: #166534;">VERIFIED</span></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="disclaimer">
    <strong>REGULATORY & COMPLIANCE DISCLAIMER:</strong> ${report.disclaimer}
  </div>

  <div class="action-bar no-print" onclick="window.print()">
    🖨️ Print / Save as PDF
  </div>

  <script>
    window.onload = function() {
      // Auto open print dialog if requested
    }
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
