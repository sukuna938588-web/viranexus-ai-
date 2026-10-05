import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  Share2,
  Table,
  Activity,
  Layers,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage } from '../types';
import { exportRecordsToCSV } from '../services/csvService';

interface ExportCenterProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onLoadSample: () => void;
}

export const ExportCenter: React.FC<ExportCenterProps> = ({
  intelligence,
  records,
  onSelectPage,
  onLoadSample,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // 1. Export Dataset CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;
    exportRecordsToCSV(records, `outbreakx_dataset_${Date.now()}.csv`);
    showSuccess('Exported dataset to CSV file.');
  };

  // 2. Export Dataset Excel / JSON
  const handleExportExcel = () => {
    if (records.length === 0) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const a = document.createElement('a');
    a.href = jsonStr;
    a.download = `outbreakx_surveillance_data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showSuccess('Exported dataset records to structured JSON.');
  };

  // 3. Export Analytics Report PDF (Printable View)
  const handleExportAnalyticsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>OUTBREAKX - Epidemiological Analytics Report</title>
  <style>
    body { font-family: monospace, sans-serif; padding: 30px; color: #111; }
    h1 { font-size: 22px; color: #0891b2; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #555; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 24px; }
    .card { border: 1px solid #ccc; padding: 12px; border-radius: 8px; }
    .val { font-size: 18px; font-weight: bold; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f0fdf4; }
  </style>
</head>
<body>
  <h1>OUTBREAKX &bull; Epidemiological Surveillance Report</h1>
  <div class="subtitle">Generated on ${new Date().toLocaleString()} &bull; Verified Telemetry Records: ${records.length}</div>
  <div class="grid">
    <div class="card"><div>Total Cases</div><div class="val">${intelligence.totalCases}</div></div>
    <div class="card"><div>Health Score</div><div class="val">${intelligence.communityHealthScore}/100</div></div>
    <div class="card"><div>Reproduction Speed</div><div class="val">R₀ = ${intelligence.estimatedR0}</div></div>
    <div class="card"><div>Active Alerts</div><div class="val">${intelligence.activeAlertsCount}</div></div>
  </div>
  <h3>Monitored Districts & Risk Levels</h3>
  <table>
    <tr><th>District</th><th>Cases</th><th>Active Pathogens</th><th>Risk Score</th><th>Category</th></tr>
    ${intelligence.topZones.map((z) => `<tr><td>${z.name}</td><td>${z.count}</td><td>${z.activeDiseases.join(', ')}</td><td>${z.riskScore}/100</td><td>${z.riskCategory}</td></tr>`).join('')}
  </table>
  <br/>
  <p style="font-size:11px;color:#777;">OUTBREAKX Intelligence Platform &bull; Predicting Outbreaks Before They Spread</p>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    showSuccess('Opened printable Analytics Report for PDF export.');
  };

  // 4. Export Prediction Report PDF
  const handleExportPredictionPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const { prediction } = intelligence;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>OUTBREAKX - Outbreak Prediction Intelligence Brief</title>
  <style>
    body { font-family: monospace, sans-serif; padding: 30px; color: #111; line-height: 1.5; }
    h1 { font-size: 22px; color: #7c3aed; margin-bottom: 4px; }
    .tag { display: inline-block; padding: 4px 8px; background: #ede9fe; color: #6d28d9; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .box { border: 2px solid #7c3aed; padding: 20px; border-radius: 12px; margin: 20px 0; background: #faf5ff; }
  </style>
</head>
<body>
  <span class="tag">AI EARLY WARNING BRIEF</span>
  <h1>OUTBREAKX &bull; Predictive Outbreak Trajectory</h1>
  <div style="font-size:12px;color:#666;margin-bottom:20px;">Issued on ${new Date().toLocaleDateString()}</div>
  <div class="box">
    <h2>Most Likely Next Outbreak: ${prediction.disease}</h2>
    <p><strong>Outbreak Probability:</strong> ${prediction.probability}%</p>
    <p><strong>Expected Contagion Window:</strong> ${prediction.timeWindow}</p>
    <p><strong>Affected Districts:</strong> ${prediction.affectedDistricts.join(', ')}</p>
    <p><strong>Projected Surge:</strong> ~${prediction.projectedCases} cases</p>
    <hr style="border:none;border-top:1px solid #ddd;margin:15px 0;"/>
    <p><strong>AI Pattern Explanation:</strong><br/>${prediction.explanation}</p>
  </div>
  <p style="font-size:11px;color:#777;">OUTBREAKX Intelligence Platform &bull; Predicting Outbreaks Before They Spread</p>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    showSuccess('Opened printable Prediction Report for PDF export.');
  };

  // 5. Export Summary Report
  const handleExportSummaryReport = () => {
    const text = `OUTBREAKX EXECUTIVE SURVEILLANCE SUMMARY
Date: ${new Date().toLocaleDateString()}
Platform: OUTBREAKX - Predicting Outbreaks Before They Spread

KEY SURVEILLANCE INDICATORS:
- Total Cases: ${intelligence.totalCases}
- Community Health Score: ${intelligence.communityHealthScore}/100
- Transmission Velocity: R₀ = ${intelligence.estimatedR0} (${intelligence.growthRatePct >= 0 ? '+' : ''}${intelligence.growthRatePct}% weekly)
- Primary Epicenter: ${intelligence.topZones[0]?.name || 'N/A'}
- Dominant Pathogen: ${intelligence.topDiseases[0]?.name || 'N/A'}

PREDICTION SUMMARY:
- Next Likely Outbreak: ${intelligence.prediction.disease} (${intelligence.prediction.probability}% probability)
- Anticipated Time Window: ${intelligence.prediction.timeWindow}
- High Risk Regions: ${intelligence.prediction.affectedDistricts.join(', ')}

ACTIVE ALERTS (${intelligence.activeAlertsCount}):
${intelligence.liveAlerts.map((a, i) => `${i + 1}. [${a.level.toUpperCase()}] ${a.title} (${a.metric})`).join('\n')}

Generated by OUTBREAKX AI Surveillance Platform`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `outbreakx_executive_summary_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Downloaded Executive Summary Report.');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Export & Archival Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Download raw surveillance records, Excel datasets, printable analytics reports, and prediction intelligence briefs
          </p>
        </div>

        {downloadSuccess && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>

      {/* Grid of the 5 Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Export 1: Dataset CSV */}
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">1. Export Dataset CSV</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Download entire verified dataset including Date, Region, Disease, Age Group, Severity, Symptoms, and Cases.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Export 2: Dataset Excel / JSON */}
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 hover:border-purple-500/40 transition-all space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Table className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">2. Export Dataset Excel / JSON</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Export structured dataset records ready for import into hospital database systems or spreadsheet software.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={records.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-500/50 text-purple-300 font-mono text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON / Excel Data</span>
          </button>
        </div>

        {/* Export 3: Analytics Report PDF */}
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">3. Export Analytics Report PDF</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Generates a comprehensive printable epidemiological report with district tables and risk stratification metrics.
            </p>
          </div>
          <button
            onClick={handleExportAnalyticsPDF}
            disabled={records.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print / Save PDF Report</span>
          </button>
        </div>

        {/* Export 4: Prediction Report PDF */}
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">4. Export Prediction Report PDF</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Official intelligence brief detailing predicted next outbreak, probability %, contagion timeline, and affected districts.
            </p>
          </div>
          <button
            onClick={handleExportPredictionPDF}
            disabled={records.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Prediction Brief</span>
          </button>
        </div>

        {/* Export 5: Summary Report */}
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 hover:border-amber-500/40 transition-all space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono">5. Export Summary Report</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
              Text-formatted executive surveillance bulletin including top metrics, active alerts, and transmission speeds.
            </p>
          </div>
          <button
            onClick={handleExportSummaryReport}
            disabled={records.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-amber-300 font-mono text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Summary Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
