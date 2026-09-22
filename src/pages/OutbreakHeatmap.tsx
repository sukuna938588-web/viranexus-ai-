import React, { useState } from 'react';
import {
  MapPin,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  Search,
  Activity,
  Layers,
} from 'lucide-react';
import { EpidemiologicalIntelligence, ZoneStat, OutbreakRecord } from '../types';
import { EmptyState } from '../components/EmptyState';

interface OutbreakHeatmapProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const OutbreakHeatmap: React.FC<OutbreakHeatmapProps> = ({
  intelligence,
  records,
  onUploadRecords,
  onOpenAddModal,
}) => {
  const [selectedZone, setSelectedZone] = useState<ZoneStat | null>(null);
  const [filterCategory, setFilterCategory] = useState<'All' | 'High' | 'Medium' | 'Safe'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Outbreak Heatmap</h1>
          <p className="text-xs text-slate-400 font-mono">Spatial risk stratification & transmission epicenters</p>
        </div>
        <EmptyState
          onUploadRecords={onUploadRecords}
          onOpenAddModal={onOpenAddModal}
          title="No Dataset Loaded"
          description="Upload CSV or Add Records to Start Analysis"
        />
      </div>
    );
  }

  const zones = intelligence.topZones;
  const filteredZones = zones.filter((z) => {
    if (filterCategory !== 'All' && z.riskCategory !== filterCategory) return false;
    if (searchQuery.trim() && !z.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const highCount = zones.filter((z) => z.riskCategory === 'High').length;
  const medCount = zones.filter((z) => z.riskCategory === 'Medium').length;
  const safeCount = zones.filter((z) => z.riskCategory === 'Safe').length;

  const currentZone = selectedZone || filteredZones[0] || zones[0];

  // Specific records for current selected zone
  const zoneRecords = records.filter((r) => r.region === currentZone?.name);
  const zoneHospitalized = zoneRecords.filter((r) => r.hospitalized).length;
  const zoneICU = zoneRecords.filter((r) => r.icu).length;

  // Pathogens in this zone
  const pathCounts: Record<string, number> = {};
  zoneRecords.forEach((r) => {
    pathCounts[r.disease] = (pathCounts[r.disease] || 0) + 1;
  });
  const topPathogensInZone = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Outbreak Heatmap & Risk Zones</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              SPATIAL CLUSTERING
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Regional biosurveillance across {zones.length} sectors with automated density thresholds
          </p>
        </div>

        {/* Triage summary pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold">
            {highCount} High Risk
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
            {medCount} Medium Risk
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
            {safeCount} Safe
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#090d18]/70 border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search sectors, districts, zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'High', 'Medium', 'Safe'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Zone Cards & Zone Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Sector Risk Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredZones.map((z) => {
            const isSelected = currentZone?.name === z.name;
            return (
              <div
                key={z.name}
                onClick={() => setSelectedZone(z)}
                className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#121026] to-[#07090e] border-cyan-500/60 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                    : 'bg-[#090d18]/70 border-slate-800 hover:border-slate-700 hover:bg-[#0c1120]'
                }`}
              >
                {/* Visual Risk Indicator Glow */}
                <div
                  className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
                    z.riskCategory === 'High'
                      ? 'bg-rose-500/15'
                      : z.riskCategory === 'Medium'
                      ? 'bg-amber-500/10'
                      : 'bg-emerald-500/10'
                  }`}
                />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${
                        z.riskCategory === 'High'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : z.riskCategory === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {z.name}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      z.riskCategory === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : z.riskCategory === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {z.riskCategory} Risk
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs mt-4">
                  <div className="flex justify-between text-slate-400">
                    <span>Incident Cases:</span>
                    <span className="text-white font-bold">{z.count}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1 text-[11px]">
                      <span>Risk Composite:</span>
                      <span className="text-cyan-300 font-bold">{z.riskScore} / 100</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full ${
                          z.riskCategory === 'High'
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                            : z.riskCategory === 'Medium'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${z.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Selected Zone Inspection Drawer */}
        {currentZone && (
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0c1020] to-[#07090e] border border-cyan-500/30 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                  Zone Telemetry
                </span>
                <h3 className="text-lg font-bold text-white">{currentZone.name}</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                  currentZone.riskCategory === 'High'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : currentZone.riskCategory === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {currentZone.riskCategory} Alert
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">TOTAL CASES</span>
                <span className="text-xl font-bold text-white">{currentZone.count}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RISK INDEX</span>
                <span className="text-xl font-bold text-cyan-300">{currentZone.riskScore}/100</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">INPATIENTS</span>
                <span className="text-xl font-bold text-purple-300">{zoneHospitalized}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ICU DEMAND</span>
                <span className="text-xl font-bold text-rose-400">{zoneICU}</span>
              </div>
            </div>

            {/* Pathogens in this zone */}
            <div>
              <h4 className="text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
                Primary Pathogen Vectors
              </h4>
              <div className="space-y-2">
                {topPathogensInZone.map(([name, count]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs"
                  >
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">{name}</span>
                    <span className="font-mono text-cyan-300 font-bold">{count} cases</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Containment Posture */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2 text-xs">
              <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Containment Recommendations</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {currentZone.riskCategory === 'High'
                  ? 'Deploy mobile PCR testing vans, surge clinical staff to regional triage nodes, and trigger community masking protocols.'
                  : currentZone.riskCategory === 'Medium'
                  ? 'Activate targeted sentinel wastewater surveillance and reinforce outpatient clinics with therapeutics.'
                  : 'Maintain standard surveillance cadence with bi-weekly viral sequencing.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
