import React, { useState } from 'react';
import {
  MapPin,
  ShieldAlert,
  Search,
  Layers,
  Globe,
  Activity,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ZoneStat, ActivePage } from '../types';
import { TAMIL_NADU_DISTRICTS } from '../services/dataScience';
import { Globe3D } from '../components/Globe3D';

interface DiseaseMapProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onLoadSample: () => void;
  onOpenAddModal: () => void;
}

export const DiseaseMap: React.FC<DiseaseMapProps> = ({
  intelligence,
  records,
  onSelectPage,
  onLoadSample,
  onOpenAddModal,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'globe'>('map');
  const [selectedZoneName, setSelectedZoneName] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { topZones, totalCases } = intelligence;

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">Disease Map & Regional Surveillance</h1>
          <p className="text-xs text-slate-400 font-mono">Spatial risk stratification across Tamil Nadu districts</p>
        </div>

        <div className="p-12 rounded-3xl bg-[#080c18] border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <MapPin className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white font-mono">No Regional Data Loaded</h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Upload a surveillance CSV or load the Tamil Nadu sample dataset to visualize district risk levels and disease concentrations on the interactive map.
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

  // Filter zones
  const filteredZones = topZones.filter((z) => {
    if (filterRisk !== 'All' && z.riskCategory !== filterRisk) return false;
    if (searchQuery.trim() && !z.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedZone = topZones.find((z) => z.name === selectedZoneName) || filteredZones[0] || topZones[0];

  // Specific records for the selected zone
  const zoneRecords = records.filter((r) => r.region === selectedZone?.name || r.district === selectedZone?.name);
  const zoneDeaths = zoneRecords.reduce((sum, r) => sum + (r.deaths || 0), 0);
  const zoneRecovered = zoneRecords.reduce((sum, r) => sum + (r.recovered || 0), 0);

  // Prediction summary for this district
  const districtPrediction = selectedZone
    ? selectedZone.riskCategory === 'Critical'
      ? `Case transmission is accelerating (+${selectedZone.weeklyGrowth}% weekly). Secondary spread anticipated across adjacent transit corridors within 1-2 weeks.`
      : selectedZone.riskCategory === 'High'
      ? `Active localized clustering detected. Estimated 14-day contagion risk remains elevated with reproductive rate R₀ > 1.2.`
      : selectedZone.riskCategory === 'Medium'
      ? `Steady transmission baseline. Moderate vector monitoring advised to prevent localized amplification.`
      : `Low transmission velocity. Sporadic cases within standard containment variance.`
    : 'Select a district to view prediction summary.';

  return (
    <div className="space-y-6 pb-16">
      {/* Header with View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Disease Map & District Risk Surveillance
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tamil Nadu districts &bull; Futuristic spatial risk stratification & predictive cluster detection
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono transition ${
              viewMode === 'map'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tamil Nadu Map
          </button>
          <button
            onClick={() => setViewMode('globe')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono transition ${
              viewMode === 'globe'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            3D Globe View
          </button>
        </div>
      </div>

      {/* Risk Color Legend Banner (Green = Low, Yellow = Medium, Orange = High, Red = Critical) */}
      <div className="p-4 rounded-2xl bg-[#080c18] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
          Surveillance Risk Matrix:
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            Green = Low Risk
          </span>
          <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
            Yellow = Medium Risk
          </span>
          <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
            Orange = High Risk
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shadow-sm shadow-rose-500/50" />
            Red = Critical Risk
          </span>
        </div>
      </div>

      {/* Viewport: 3D Globe OR Interactive Futuristic Tamil Nadu Map */}
      {viewMode === 'globe' ? (
        <Globe3D
          totalRecords={totalCases}
          r0={intelligence.estimatedR0}
          topDisease={intelligence.topDiseases[0]?.name || 'Dengue'}
          topLocation={selectedZone?.name || topZones[0]?.name || 'Chennai'}
          locations={topZones.map((z) => ({
            name: z.name,
            cases: z.count,
            disease: z.activeDiseases[0] || 'Infection',
            severity: z.riskCategory,
          }))}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive District Cards & Spatial Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#080c18] border border-slate-800">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Tamil Nadu district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono">
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterRisk(cat)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      filterRisk === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* District Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredZones.map((zone) => {
                const isSelected = selectedZone?.name === zone.name;

                let borderBg = 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60';
                let dotColor = 'bg-emerald-400';
                let textColor = 'text-emerald-400';

                if (zone.riskCategory === 'Critical') {
                  borderBg = 'border-rose-500/40 bg-rose-500/10 hover:border-rose-500/80';
                  dotColor = 'bg-rose-500 animate-ping';
                  textColor = 'text-rose-400';
                } else if (zone.riskCategory === 'High') {
                  borderBg = 'border-orange-500/35 bg-orange-500/10 hover:border-orange-500/70';
                  dotColor = 'bg-orange-400';
                  textColor = 'text-orange-400';
                } else if (zone.riskCategory === 'Medium') {
                  borderBg = 'border-yellow-500/35 bg-yellow-500/10 hover:border-yellow-500/70';
                  dotColor = 'bg-yellow-400';
                  textColor = 'text-yellow-400';
                }

                return (
                  <div
                    key={zone.name}
                    onClick={() => setSelectedZoneName(zone.name)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${borderBg} ${
                      isSelected ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.01]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <h4 className="text-sm font-bold text-white font-mono">
                          {zone.name}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase ${textColor}`}>
                        {zone.riskCategory} Risk
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>{zone.count} Cases</span>
                      <span className="text-slate-400">Risk Score: {zone.riskScore}/100</span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mt-1.5 truncate">
                      Active: {zone.activeDiseases.join(', ') || 'Surveillance cluster'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected District Telemetry & Prediction Summary (5 cols) */}
          <div className="lg:col-span-5">
            {selectedZone ? (
              <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-5 sticky top-24 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      District Telemetry Card
                    </span>
                    <h3 className="text-xl font-black text-white font-mono flex items-center gap-2 mt-0.5">
                      📍 {selectedZone.name}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                      selectedZone.riskCategory === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : selectedZone.riskCategory === 'High'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : selectedZone.riskCategory === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {selectedZone.riskCategory} Risk
                  </span>
                </div>

                {/* 4 Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#05070f] border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Total Cases</span>
                    <div className="text-lg font-bold text-white mt-1">
                      {selectedZone.count}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#05070f] border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Weekly Velocity</span>
                    <div className={`text-lg font-bold mt-1 ${selectedZone.weeklyGrowth >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedZone.weeklyGrowth >= 0 ? '+' : ''}{selectedZone.weeklyGrowth}%
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#05070f] border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Recovered</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      {zoneRecovered}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#05070f] border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Fatalities</span>
                    <div className="text-lg font-bold text-slate-300 mt-1">
                      {zoneDeaths}
                    </div>
                  </div>
                </div>

                {/* Active Diseases */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Active Diseases in {selectedZone.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedZone.activeDiseases.map((dis, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium"
                      >
                        🦠 {dis}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Prediction Summary for District */}
                <div className="p-4 rounded-2xl bg-[#05070f] border border-cyan-500/30 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Prediction Summary
                  </div>
                  <p className="text-xs text-slate-200 font-mono leading-relaxed">
                    {districtPrediction}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
