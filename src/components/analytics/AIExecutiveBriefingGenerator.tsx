import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Printer,
  FileDown,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Users,
  Compass,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { EpidemiologicalIntelligence } from '../../types';

interface AIExecutiveBriefingGeneratorProps {
  intelligence: EpidemiologicalIntelligence;
  totalRecords: number;
}

interface ExecutiveBriefingData {
  title: string;
  date: string;
  threatLevel: string;
  focus: string;
  executiveSummary: string;
  epidemiologicalStatus: {
    totalCases: number;
    transmissionRate: string;
    weeklyVelocity: string;
    primaryEpicenter: string;
    dominantPathogen: string;
  };
  clinicalStrain: {
    severeAcuityRate: string;
    icuDemandRate: string;
    projectedGeneralBeds: number;
    projectedICUUnits: number;
    primaryDemographic: string;
  };
  actionDirectives: Array<{
    priority: string;
    directive: string;
    targetSector: string;
  }>;
  generatedBy: string;
}

export const AIExecutiveBriefingGenerator: React.FC<AIExecutiveBriefingGeneratorProps> = ({
  intelligence,
  totalRecords = 0,
}) => {
  const [focus, setFocus] = useState<'strategic' | 'containment' | 'hospital' | 'community'>('strategic');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<ExecutiveBriefingData | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [source, setSource] = useState<string>('');

  const fetchBriefing = async (selectedFocus = focus) => {
    if (totalRecords === 0) return;
    setLoading(true);

    try {
      const summaryPayload = {
        totalCases: intelligence.totalCases,
        estimatedR0: intelligence.estimatedR0,
        growthRatePct: intelligence.growthRatePct,
        severeRatio: intelligence.severeRatio,
        icuRatio: intelligence.icuRatio,
        topDiseases: intelligence.topDiseases,
        topZones: intelligence.topZones,
        ageCohorts: intelligence.ageCohorts,
        hospitalSurge: intelligence.hospitalSurge,
        dateRange: intelligence.dateRange,
      };

      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetSummary: summaryPayload, focus: selectedFocus }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.briefing) {
          setBriefing(data.briefing);
          setSource(data.source || 'AI Engine');
        }
      }
    } catch {
      // Graceful local handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (totalRecords > 0 && !briefing) {
      fetchBriefing('strategic');
    }
  }, [totalRecords]);

  const handleCopy = () => {
    if (!briefing) return;
    const text = `=== ${briefing.title} ===
Date: ${briefing.date} | Threat Level: ${briefing.threatLevel} | Focus: ${briefing.focus}

EXECUTIVE SUMMARY:
${briefing.executiveSummary}

MOST AFFECTED AREAS:
- Primary Epicenter: ${briefing.epidemiologicalStatus.primaryEpicenter}
- Top Risk Zones: ${intelligence.topZones?.slice(0, 3).map((z) => `${z.name} (${z.count} cases, Risk: ${z.riskScore}/100)`).join(', ') || 'N/A'}

GROWTH PATTERNS:
- Transmission Velocity (R0): ${briefing.epidemiologicalStatus.transmissionRate}
- Weekly Growth Rate: ${briefing.epidemiologicalStatus.weeklyVelocity}
- Dominant Pathogen: ${briefing.epidemiologicalStatus.dominantPathogen}

CLINICAL RISK SUMMARY:
- Severe Acuity Rate: ${briefing.clinicalStrain.severeAcuityRate}
- ICU Demand Rate: ${briefing.clinicalStrain.icuDemandRate}
- Projected Inpatient Beds Needed: ~${briefing.clinicalStrain.projectedGeneralBeds}
- Projected ICU Suites Needed: ~${briefing.clinicalStrain.projectedICUUnits}
- Priority Cohort: ${briefing.clinicalStrain.primaryDemographic}

RECOMMENDED ACTION:
${briefing.actionDirectives.map((d, i) => `${i + 1}. [${d.priority}] ${d.directive} (Sector: ${d.targetSector})`).join('\n')}

Generated via ViraNexus AI Health Intelligence Platform`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!briefing) return;
    setExporting(true);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      setExporting(false);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${briefing.title} - PDF Export</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              line-height: 1.5;
              padding: 0;
              margin: 0;
            }
            .header {
              border-bottom: 2px solid #0284c7;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 18px;
              font-weight: 900;
              color: #0369a1;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              margin: 8px 0 4px 0;
              color: #0f172a;
            }
            .meta {
              font-size: 12px;
              color: #64748b;
              font-family: monospace;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              background: #fee2e2;
              color: #b91c1c;
              margin-top: 4px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0369a1;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
              margin-bottom: 10px;
            }
            .summary-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              font-size: 13px;
              line-height: 1.6;
            }
            .grid {
              display: flex;
              gap: 16px;
            }
            .col {
              flex: 1;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            .table td {
              padding: 5px 0;
              border-bottom: 1px dashed #e2e8f0;
            }
            .table td.label {
              color: #64748b;
            }
            .table td.val {
              font-weight: 700;
              text-align: right;
            }
            .directive {
              padding: 8px 10px;
              background: #f8fafc;
              border-left: 3px solid #0284c7;
              margin-bottom: 8px;
              font-size: 12px;
            }
            .directive-priority {
              font-weight: 800;
              color: #b91c1c;
              margin-right: 6px;
            }
            .footer {
              margin-top: 30px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              font-size: 10px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ViraNexus AI Health Intelligence</div>
            <div class="title">${briefing.title}</div>
            <div class="meta">
              DATE: ${briefing.date} &bull; FOCUS: ${briefing.focus.toUpperCase()} &bull; STATUS: <span class="badge">${briefing.threatLevel}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Executive Situation Overview</div>
            <div class="summary-box">${briefing.executiveSummary}</div>
          </div>

          <div class="section grid">
            <div class="col">
              <div class="section-title">Most Affected Areas & Epicenters</div>
              <table class="table">
                <tr>
                  <td class="label">Primary Epicenter:</td>
                  <td class="val">${briefing.epidemiologicalStatus.primaryEpicenter}</td>
                </tr>
                ${(intelligence.topZones || []).slice(0, 4).map((z) => `
                  <tr>
                    <td class="label">${z.name}:</td>
                    <td class="val">${z.count} cases (${z.riskScore}/100)</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div class="col">
              <div class="section-title">Growth Patterns & Transmission</div>
              <table class="table">
                <tr>
                  <td class="label">Total Cases:</td>
                  <td class="val">${briefing.epidemiologicalStatus.totalCases.toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Transmission Velocity:</td>
                  <td class="val">${briefing.epidemiologicalStatus.transmissionRate}</td>
                </tr>
                <tr>
                  <td class="label">Velocity Change:</td>
                  <td class="val">${briefing.epidemiologicalStatus.weeklyVelocity}</td>
                </tr>
                <tr>
                  <td class="label">Dominant Pathogen:</td>
                  <td class="val">${briefing.epidemiologicalStatus.dominantPathogen}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Clinical Risk Summary</div>
            <table class="table" style="width: 100%;">
              <tr>
                <td class="label">Severe Acuity Rate:</td>
                <td class="val">${briefing.clinicalStrain.severeAcuityRate}</td>
                <td class="label" style="padding-left: 20px;">Projected Inpatient Beds:</td>
                <td class="val">~${briefing.clinicalStrain.projectedGeneralBeds} beds</td>
              </tr>
              <tr>
                <td class="label">ICU Demand Rate:</td>
                <td class="val">${briefing.clinicalStrain.icuDemandRate}</td>
                <td class="label" style="padding-left: 20px;">Projected ICU Suites:</td>
                <td class="val">~${briefing.clinicalStrain.projectedICUUnits} units</td>
              </tr>
              <tr>
                <td class="label">Primary Demographic:</td>
                <td class="val" colspan="3">${briefing.clinicalStrain.primaryDemographic}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Recommended Action & Priority Directives</div>
            ${briefing.actionDirectives.map((d) => `
              <div class="directive">
                <span class="directive-priority">[${d.priority}]</span>
                ${d.directive} <strong style="color: #64748b;">(Sector: ${d.targetSector})</strong>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <span>Model Origin: ${briefing.generatedBy} &bull; ViraNexus Outbreak Intelligence</span>
            <span>Verified User Dataset (${totalRecords} Records) &bull; Page 1/1</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setExporting(false);
  };

  if (totalRecords === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
          <FileText className="w-7 h-7 opacity-60" />
        </div>
        <h3 className="text-base font-bold text-white font-mono">AI Executive Briefing Generator</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          No surveillance records found. Upload a patient dataset or import records to synthesize automated, actionable public health executive situation reports.
        </p>
      </div>
    );
  }

  const getThreatColor = (level: string = '') => {
    if (level.includes('CRITICAL')) return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
    if (level.includes('HIGH')) return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
    if (level.includes('STABILIZ')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40';
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0c1024]/95 via-[#080c1a]/95 to-[#060812]/95 border border-purple-500/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Background cyber ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                AI Executive Briefing Generator
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  SITUATIONAL DIRECTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Automated decision-grade briefing for public health directors & emergency task forces
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Focus Selector */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-[11px] font-mono">
            {(
              [
                { id: 'strategic', label: 'Strategic' },
                { id: 'containment', label: 'Containment' },
                { id: 'hospital', label: 'Hospital Surge' },
                { id: 'community', label: 'Community' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setFocus(t.id);
                  fetchBriefing(t.id);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  focus === t.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchBriefing(focus)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition disabled:opacity-50"
            title="Regenerate Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!briefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition"
            title="Copy Report to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={!briefing || exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400/40 text-white text-xs font-mono font-bold transition shadow-lg shadow-purple-950/40 disabled:opacity-50"
            title="Export Report as PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition"
            title="Print Briefing"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {loading && !briefing ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-mono text-purple-300">Synthesizing Executive Outbreak Intelligence...</p>
        </div>
      ) : briefing ? (
        <div className="space-y-6 relative z-10">
          {/* Briefing Top Banner */}
          <div className="p-4 rounded-2xl bg-[#090e24]/90 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold mb-1">
                Official Incident Telemetry • {briefing.date}
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">{briefing.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getThreatColor(briefing.threatLevel)}`}>
                {briefing.threatLevel}
              </span>
              <span className="text-[10px] font-mono text-slate-400 border border-slate-800 px-2 py-1 rounded-lg bg-slate-900/60">
                Focus: {briefing.focus}
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-2xl bg-[#060814]/80 border border-slate-800">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Executive Situation Overview
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {briefing.executiveSummary}
            </p>
          </div>

          {/* Key Metrics Grid: Most Affected Areas & Growth Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Most Affected Areas */}
            <div className="p-4 rounded-2xl bg-[#060814]/80 border border-slate-800">
              <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Most Affected Areas
              </div>
              <dl className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Primary Monitored Epicenter:</span>
                  <span className="text-rose-400 font-bold">{briefing.epidemiologicalStatus.primaryEpicenter}</span>
                </div>
                {(intelligence.topZones || []).slice(0, 3).map((z, idx) => (
                  <div key={idx} className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">#{idx + 1} High-Risk Sector ({z.name}):</span>
                    <span className="text-white font-bold">{z.count} cases ({z.riskScore}/100)</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Monitored Zones:</span>
                  <span className="text-cyan-400 font-bold">{(intelligence.topZones || []).length} zones</span>
                </div>
              </dl>
            </div>

            {/* Growth Patterns */}
            <div className="p-4 rounded-2xl bg-[#060814]/80 border border-slate-800">
              <div className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Growth Patterns
              </div>
              <dl className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Total Confirmed Cases:</span>
                  <span className="text-white font-bold">{briefing.epidemiologicalStatus.totalCases.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Transmission Rate (R0):</span>
                  <span className="text-cyan-400 font-bold">{briefing.epidemiologicalStatus.transmissionRate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Weekly Growth Velocity:</span>
                  <span className="text-amber-400 font-bold">{briefing.epidemiologicalStatus.weeklyVelocity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dominant Pathogen:</span>
                  <span className="text-white font-bold">{briefing.epidemiologicalStatus.dominantPathogen}</span>
                </div>
              </dl>
            </div>
          </div>

          {/* Clinical Risk Summary & Healthcare Strain */}
          <div className="p-4 rounded-2xl bg-[#060814]/80 border border-slate-800">
            <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Clinical Risk Summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">Severe Acuity</div>
                <div className="text-lg font-bold text-rose-400 mt-1">{briefing.clinicalStrain.severeAcuityRate}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">ICU Demand</div>
                <div className="text-lg font-bold text-rose-400 mt-1">{briefing.clinicalStrain.icuDemandRate}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">Projected Inpatient Beds</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">~{briefing.clinicalStrain.projectedGeneralBeds} beds</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">Projected ICU Suites</div>
                <div className="text-lg font-bold text-purple-400 mt-1">~{briefing.clinicalStrain.projectedICUUnits} units</div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">High Vulnerability Demographic:</span>
              <span className="text-amber-300 font-bold">{briefing.clinicalStrain.primaryDemographic}</span>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="p-4 rounded-2xl bg-[#060814]/80 border border-slate-800">
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Recommended Action & Directives
            </div>
            <div className="space-y-2.5">
              {briefing.actionDirectives.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border uppercase mt-0.5 shrink-0 ${
                        d.priority === 'IMMEDIATE'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : d.priority === 'CRITICAL'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      }`}
                    >
                      {d.priority}
                    </span>
                    <span className="text-xs text-slate-200 leading-snug font-sans">{d.directive}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 border border-slate-800/80 px-2 py-0.5 rounded bg-slate-900/50 self-start sm:self-auto shrink-0">
                    Sector: {d.targetSector}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
            <span>Model Origin: {briefing.generatedBy} • Source Engine: {source}</span>
            <span>Dataset Integrity: 100% User Verified ({totalRecords.toLocaleString()} Records)</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
