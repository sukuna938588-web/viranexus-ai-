import React, { useState, useMemo } from 'react';
import {
  Activity,
  Layers,
  Filter,
  RefreshCw,
  Plus,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  Radio,
  BarChart2,
  FileText,
  Sliders,
  Flame,
  Zap,
  PieChart,
  Users,
  Compass,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage } from '../../types';
import { EmptyState } from '../EmptyState';
import { AIExecutiveBriefingGenerator } from './AIExecutiveBriefingGenerator';
import { DatasetQualityScore } from './DatasetQualityScore';
import { AnomalyDetectionEngine } from './AnomalyDetectionEngine';
import { SmartHotspotRanking } from './SmartHotspotRanking';
import { OutbreakSimulator } from './OutbreakSimulator';
import { DiseaseDistributionPieChart } from './DiseaseDistributionPieChart';
import { AreaRiskVerticalBarChart } from './AreaRiskVerticalBarChart';
import { AreaRiskHeatmap } from './AreaRiskHeatmap';
import { OutbreakForecastEngine } from './OutbreakForecastEngine';
import { AgeGroupAnalysis } from './AgeGroupAnalysis';
import { OutbreakTrendLineChart } from './OutbreakTrendLineChart';
import { HospitalLoadAnalysis } from './HospitalLoadAnalysis';
import { AIConfidenceMeter } from './AIConfidenceMeter';
import { EarlyWarningScore } from './EarlyWarningScore';
import { DiseaseSpreadNetworkGraph } from './DiseaseSpreadNetworkGraph';
import { calculateEpidemiologicalIntelligence } from '../../services/dataScience';

interface RealTimeAnalyticsDashboardProps {
  records: OutbreakRecord[];
  intelligence: EpidemiologicalIntelligence;
  onSelectPage: (page: ActivePage) => void;
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const RealTimeAnalyticsDashboard: React.FC<RealTimeAnalyticsDashboardProps> = ({
  records = [],
  intelligence,
  onSelectPage,
  onUploadRecords,
  onOpenAddModal,
}) => {
  const [filterDisease, setFilterDisease] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'executive' | 'risk' | 'surveillance' | 'simulator'>('all');

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterDisease !== 'All' && r.disease !== filterDisease) return false;
      if (filterRegion !== 'All' && r.region !== filterRegion) return false;
      return true;
    });
  }, [records, filterDisease, filterRegion]);

  // Recalculate intelligence dynamically for filtered subset or pass total
  const activeIntelligence = useMemo(() => {
    if (filterDisease === 'All' && filterRegion === 'All') return intelligence;
    return calculateEpidemiologicalIntelligence(filteredRecords);
  }, [filteredRecords, filterDisease, filterRegion, intelligence]);

  // Unique lists for filters
  const uniqueDiseases = useMemo(() => {
    const set = new Set(records.map((r) => r.disease).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const uniqueRegions = useMemo(() => {
    const set = new Set(records.map((r) => r.region).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  if (!records || records.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Real-Time Analytics Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> ADVANCED DATA SCIENCE SUITE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Epidemiological modeling, executive briefings, and transmission simulations
            </p>
          </div>
        </div>

        <EmptyState
          onUploadRecords={onUploadRecords}
          onOpenAddModal={onOpenAddModal}
          title="No Analytics Data Available"
          description="Upload your outbreak CSV or index verified patient records to activate all advanced Data Science analytics modules in real time."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Telemetry Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Real-Time Analytics Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm shadow-cyan-950/40">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              LIVE TELEMETRY ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Epidemiological intelligence calculated strictly from {records.length.toLocaleString()} uploaded records
            {activeIntelligence.dateRange?.start && ` (${activeIntelligence.dateRange.start} → ${activeIntelligence.dateRange.end})`}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSelectPage('ai-command-center')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-900/60 to-cyan-900/60 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Health Copilot</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Record</span>
          </button>
          <button
            onClick={() => onSelectPage('dataset-management')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dataset</span>
          </button>
        </div>
      </div>

      {/* Navigation Suite Filter Tabs & Data Slicers */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {(
            [
              { id: 'all', label: 'All Analytics Modules', icon: Layers },
              { id: 'executive', label: 'Executive Briefing & Data Quality', icon: FileText },
              { id: 'risk', label: 'Epidemiological Risk & Hotspots', icon: Flame },
              { id: 'surveillance', label: 'Surveillance, Anomalies & Age', icon: Zap },
              { id: 'simulator', label: 'Outbreak Simulator & Hospital Surge', icon: Sliders },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-950/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Filter Strip */}
        <div className="p-4 rounded-2xl bg-[#090d1c]/90 border border-slate-800/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Real-Time Subset Slicing:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Disease Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Pathogen:</span>
              <select
                value={filterDisease}
                onChange={(e) => setFilterDisease(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Pathogens ({uniqueDiseases.length})</option>
                {uniqueDiseases.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Area:</span>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Areas ({uniqueRegions.length})</option>
                {uniqueRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {(filterDisease !== 'All' || filterRegion !== 'All') && (
              <button
                onClick={() => {
                  setFilterDisease('All');
                  setFilterRegion('All');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: AI Executive Briefing & Dataset Quality Score */}
      {(activeTab === 'all' || activeTab === 'executive') && (
        <div className="space-y-6">
          <AIExecutiveBriefingGenerator
            intelligence={activeIntelligence}
            totalRecords={filteredRecords.length}
          />
          <DatasetQualityScore records={filteredRecords} />
        </div>
      )}

      {/* SECTION 2: Early Warning & Confidence Core */}
      {(activeTab === 'all' || activeTab === 'executive') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EarlyWarningScore intelligence={activeIntelligence} totalRecords={filteredRecords.length} />
          <AIConfidenceMeter records={filteredRecords} intelligence={activeIntelligence} />
        </div>
      )}

      {/* SECTION 3: Disease Distribution Pie Chart, Area Risk Bar Chart, Heatmap & Smart Hotspot Ranking */}
      {(activeTab === 'all' || activeTab === 'risk') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DiseaseDistributionPieChart
              diseaseStats={activeIntelligence.topDiseases}
              totalCases={activeIntelligence.totalCases}
            />
            <AreaRiskVerticalBarChart
              zones={activeIntelligence.topZones}
              totalCases={activeIntelligence.totalCases}
            />
          </div>

          {/* Area-Wise Risk Intensity Heatmap */}
          <AreaRiskHeatmap zones={activeIntelligence.topZones} totalCases={activeIntelligence.totalCases} />

          {/* Smart Hotspot Ranking */}
          <SmartHotspotRanking zones={activeIntelligence.topZones} totalCases={activeIntelligence.totalCases} />
        </div>
      )}

      {/* SECTION 4: Predictive Forecast, Surveillance Anomalies, Timeline & Age Group Analytics */}
      {(activeTab === 'all' || activeTab === 'surveillance') && (
        <div className="space-y-6">
          {/* Outbreak Forecast Engine (7-day and 30-day estimates with confidence score) */}
          <OutbreakForecastEngine intelligence={activeIntelligence} records={filteredRecords} />

          {/* Anomaly Detection Engine */}
          <AnomalyDetectionEngine records={filteredRecords} />

          {/* Outbreak Trend Line Chart */}
          <OutbreakTrendLineChart
            dailyTrends={activeIntelligence.dailyTrends}
            totalCases={activeIntelligence.totalCases}
          />

          {/* Age Group Analysis & Hospital Load Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgeGroupAnalysis records={filteredRecords} />
            <HospitalLoadAnalysis intelligence={activeIntelligence} totalRecords={filteredRecords.length} />
          </div>
        </div>
      )}

      {/* SECTION 5: Outbreak Simulator & Disease Spread Network */}
      {(activeTab === 'all' || activeTab === 'simulator') && (
        <div className="space-y-6">
          {/* Outbreak Simulator */}
          <OutbreakSimulator
            intelligence={activeIntelligence}
            totalRecords={filteredRecords.length}
          />

          {/* Disease Spread Network Graph */}
          <DiseaseSpreadNetworkGraph records={filteredRecords} />
        </div>
      )}
    </div>
  );
};
