import React from 'react';
import { Building2, Bed, AlertTriangle, Activity, HeartPulse, CheckCircle2 } from 'lucide-react';
import { HospitalSurgePoint, EpidemiologicalIntelligence } from '../../types';

interface HospitalLoadAnalysisProps {
  intelligence: EpidemiologicalIntelligence;
  totalRecords: number;
}

export const HospitalLoadAnalysis: React.FC<HospitalLoadAnalysisProps> = ({
  intelligence,
  totalRecords = 0,
}) => {
  if (totalRecords === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
          <Building2 className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Hospital Load Analysis</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No clinical dataset found. Ingest patient records to estimate inpatient and ICU resource consumption.
        </p>
      </div>
    );
  }

  const surge = intelligence?.hospitalSurge || [];
  const currentHospitalized = Math.round((intelligence?.totalCases || 0) * (intelligence?.hospitalizedRatio || 0));
  const currentICU = Math.round((intelligence?.totalCases || 0) * (intelligence?.icuRatio || 0));

  // Peak projection across upcoming 7 days
  const peakBeds = surge.length > 0 ? Math.max(...surge.map((s) => s.generalBedsRequired || 0)) : currentHospitalized;
  const peakICU = surge.length > 0 ? Math.max(...surge.map((s) => s.icuBedsRequired || 0)) : currentICU;
  const peakVents = surge.length > 0 ? Math.max(...surge.map((s) => s.ventilatorsRequired || 0)) : Math.ceil(currentICU * 0.7);

  // Calculate Capacity Pressure Index (0-100)
  const hospRatio = intelligence?.hospitalizedRatio || 0;
  const icuRatio = intelligence?.icuRatio || 0;
  const r0 = intelligence?.estimatedR0 || 0;
  const capacityPressure = Math.min(
    100,
    Math.round(
      (hospRatio * 50 + icuRatio * 40 + (r0 > 1.2 ? 20 : 5))
    )
  );

  const getPressureStatus = (score: number) => {
    if (score >= 70) return { label: 'CRITICAL SURGE', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
    if (score >= 40) return { label: 'ELEVATED STRAIN', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'MANAGEABLE LOAD', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  };

  const status = getPressureStatus(capacityPressure);

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Building2 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Hospital Load Analysis</h3>
            <p className="text-[11px] text-slate-400 font-mono">Bed consumption & acute respiratory surge capacity</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border self-start sm:self-auto ${status.bg} ${status.color}`}>
          {status.label} ({capacityPressure}/100)
        </span>
      </div>

      {/* 3 Metric Dial Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Metric 1: General Beds */}
        <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 text-left">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Inpatient Beds</span>
            <Bed className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {currentHospitalized.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 mt-1">
            Peak Need: ~{peakBeds} beds
          </div>
        </div>

        {/* Metric 2: ICU Units */}
        <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 text-left">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>ICU Acuity Units</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 font-mono">
            {currentICU.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-rose-300 mt-1">
            Peak Need: ~{peakICU} units
          </div>
        </div>

        {/* Metric 3: Ventilators */}
        <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 text-left">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Ventilators Est.</span>
            <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">
            {Math.ceil(currentICU * 0.75)}
          </div>
          <div className="text-[10px] font-mono text-purple-400 mt-1">
            Peak Need: ~{peakVents} units
          </div>
        </div>
      </div>

      {/* 7-Day Surge Projection Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>7-DAY BED DEMAND TRAJECTORY</span>
          <span className="text-[10px] text-cyan-400">Simulation Model</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {surge.map((s, idx) => {
            const isPeak = s.generalBedsRequired === peakBeds;
            return (
              <div
                key={s.day}
                className={`p-2 rounded-xl border text-center transition flex flex-col justify-between ${
                  isPeak
                    ? 'bg-rose-950/30 border-rose-500/50 shadow-md shadow-rose-950/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400">{s.day}</div>
                <div className={`text-xs font-black font-mono my-1 ${isPeak ? 'text-rose-400' : 'text-white'}`}>
                  {s.generalBedsRequired}
                </div>
                <div className="text-[9px] font-mono text-purple-300">
                  ICU: {s.icuBedsRequired}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
