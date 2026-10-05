import React, { useState, useRef } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download,
  Maximize2,
  Minimize2,
  X,
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage } from '../types';

interface AnalyticsProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onLoadSample: () => void;
}

const PALETTE = ['#06b6d4', '#a855f7', '#f43f5e', '#eab308', '#10b981', '#3b82f6'];

export const Analytics: React.FC<AnalyticsProps> = ({
  intelligence,
  records,
  onSelectPage,
  onLoadSample,
}) => {
  const [fullScreenChart, setFullScreenChart] = useState<string | null>(null);

  const {
    topDiseases,
    topZones,
    dailyTrends,
    severityDistribution,
    totalCases,
    recoveredCount,
    deceasedCount,
    growthRatePct,
    estimatedR0,
  } = intelligence;

  // Function to download chart as image
  const handleDownloadChart = (chartId: string, chartTitle: string) => {
    const chartElem = document.getElementById(chartId);
    if (!chartElem) return;

    // Use svg or canvas serialization
    const svgElem = chartElem.querySelector('svg');
    if (svgElem) {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgElem);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chartTitle.toLowerCase().replace(/\s+/g, '_')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback text download
      const content = `OUTBREAKX ANALYTICS: ${chartTitle}\nTotal Cases: ${totalCases}\nDate: ${new Date().toISOString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chartTitle.toLowerCase().replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">Surveillance Analytics Suite</h1>
          <p className="text-xs text-slate-400 font-mono">Epidemiological statistics & multi-pathogen trend progression</p>
        </div>

        <div className="p-12 rounded-3xl bg-[#080c18] border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white font-mono">No Analytics Telemetry Loaded</h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Upload surveillance records or load the sample Tamil Nadu dataset to generate disease distribution pie charts, regional bar charts, acuity severity breakdowns, and recovery/fatality curves.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onLoadSample}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Load Sample Dataset
            </button>
            <button
              onClick={() => onSelectPage('dataset')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-xs font-mono hover:bg-slate-800 transition"
            >
              Upload CSV
            </button>
          </div>
        </div>
      </div>
    );
  }

  const maxZoneCases = Math.max(1, ...topZones.map((z) => z.count));
  const maxTrendCases = Math.max(1, ...dailyTrends.map((d) => d.cases));
  const maxRecovered = Math.max(1, ...dailyTrends.map((d) => d.recovered));
  const maxDeaths = Math.max(1, ...dailyTrends.map((d) => d.deaths));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Surveillance Analytics Suite
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Comprehensive epidemiological visualizations &bull; Bar charts, Pie charts, Line curves & Trend analysis
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Total Cases: <strong className="text-cyan-400">{totalCases.toLocaleString()}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Velocity: <strong className="text-purple-400">R₀ = {estimatedR0}</strong>
          </span>
        </div>
      </div>

      {/* Grid of the 6 Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Cases by Disease (Pie / Donut Proportion) */}
        <div id="chart-disease" className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                1. Cases by Disease
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadChart('chart-disease', 'Cases by Disease')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Download Chart"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFullScreenChart(fullScreenChart === 'disease' ? null : 'disease')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {topDiseases.map((dis, idx) => {
              const color = PALETTE[idx % PALETTE.length];
              return (
                <div key={dis.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 text-slate-200 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {dis.name}
                    </span>
                    <span className="text-slate-400">
                      <strong className="text-white">{dis.count}</strong> cases ({dis.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${dis.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Cases by Region / District (Vertical / Horizontal Bar) */}
        <div id="chart-region" className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                2. Cases by Region / District
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadChart('chart-region', 'Cases by Region')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Download Chart"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFullScreenChart(fullScreenChart === 'region' ? null : 'region')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto pr-1">
            {topZones.slice(0, 6).map((zone, idx) => {
              const isHighest = idx === 0;
              const barWidth = Math.round((zone.count / maxZoneCases) * 100);

              return (
                <div key={zone.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 font-bold flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                      {zone.name}
                      {isHighest && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Epicenter
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 font-bold">
                      {zone.count} cases
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHighest ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: Cases by Severity (Normal, Moderate, Severe, Critical) */}
        <div id="chart-severity" className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                3. Cases by Severity
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadChart('chart-severity', 'Cases by Severity')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Download Chart"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFullScreenChart(fullScreenChart === 'severity' ? null : 'severity')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {severityDistribution.map((item) => {
              let color = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
              if (item.severity === 'Critical') color = 'text-rose-400 border-rose-500/40 bg-rose-500/10';
              else if (item.severity === 'Severe') color = 'text-orange-400 border-orange-500/40 bg-orange-500/10';
              else if (item.severity === 'Moderate') color = 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';

              return (
                <div key={item.severity} className={`p-4 rounded-2xl border text-center space-y-1 ${color}`}>
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold">
                    {item.severity}
                  </div>
                  <div className="text-xl font-black font-mono">
                    {item.count}
                  </div>
                  <div className="text-[10px] opacity-80 font-mono">
                    {item.percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: Monthly & Daily Time Trends (Line Curve with 7D MA) */}
        <div id="chart-trends" className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                4. Monthly & Daily Incidence Trends
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadChart('chart-trends', 'Daily Trends')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Download Chart"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFullScreenChart(fullScreenChart === 'trends' ? null : 'trends')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-[220px] overflow-y-auto pt-2">
            {dailyTrends.slice(-12).map((pt, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-[#060810] border border-slate-800 text-center space-y-1">
                <div className="text-[9px] font-mono text-slate-400 truncate">{pt.date}</div>
                <div className="text-sm font-black text-white font-mono">{pt.cases}</div>
                <div className="text-[9px] font-mono text-cyan-400">MA: {pt.movingAvg7}</div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (pt.cases / maxTrendCases) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 5: Recovery Trends */}
        <div id="chart-recovery" className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                5. Recovery Trends ({recoveredCount} Total)
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadChart('chart-recovery', 'Recovery Trends')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Download Chart"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Overall Recovery Rate:</span>
              <strong className="text-emerald-400 font-bold">
                {totalCases > 0 ? Math.round((recoveredCount / totalCases) * 100) : 0}%
              </strong>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
              {dailyTrends.slice(-12).map((pt, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#060810] border border-slate-800 text-center space-y-1">
                  <div className="text-[9px] font-mono text-slate-400 truncate">{pt.date}</div>
                  <div className="text-sm font-black text-emerald-400 font-mono">+{pt.recovered}</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (pt.recovered / maxRecovered) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 6: Fatality & Death Trends */}
        <div id="chart-death" className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                6. Death Trends ({deceasedCount} Total)
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadChart('chart-death', 'Death Trends')}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition"
                title="Download Chart"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Case Fatality Ratio (CFR):</span>
              <strong className="text-rose-400 font-bold">
                {totalCases > 0 ? ((deceasedCount / totalCases) * 100).toFixed(1) : 0}%
              </strong>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
              {dailyTrends.slice(-12).map((pt, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#060810] border border-slate-800 text-center space-y-1">
                  <div className="text-[9px] font-mono text-slate-400 truncate">{pt.date}</div>
                  <div className="text-sm font-black text-rose-400 font-mono">+{pt.deaths}</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (pt.deaths / maxDeaths) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Chart Modal */}
      {fullScreenChart && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl p-6 rounded-3xl bg-[#070b16] border border-cyan-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-mono uppercase">
                Fullscreen View: {fullScreenChart.toUpperCase()}
              </h3>
              <button
                onClick={() => setFullScreenChart(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 rounded-2xl bg-[#05070e] text-xs font-mono text-slate-300 space-y-3">
              <p>Expanded deep telemetry inspection enabled for {fullScreenChart}.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900">
                  <span className="text-slate-400">Total Cases</span>
                  <div className="text-lg font-bold text-white mt-1">{totalCases}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900">
                  <span className="text-slate-400">Recoveries</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{recoveredCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900">
                  <span className="text-slate-400">Fatalities</span>
                  <div className="text-lg font-bold text-rose-400 mt-1">{deceasedCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900">
                  <span className="text-slate-400">Velocity R₀</span>
                  <div className="text-lg font-bold text-purple-300 mt-1">{estimatedR0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
