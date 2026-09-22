import React from 'react';
import {
  Building2,
  Activity,
  HeartPulse,
  Boxes,
  Users,
  Wind,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord } from '../types';
import { EmptyState } from '../components/EmptyState';
import { TrendChart } from '../components/TrendChart';

interface HospitalIntelligenceProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const HospitalIntelligence: React.FC<HospitalIntelligenceProps> = ({
  intelligence,
  records,
  onUploadRecords,
  onOpenAddModal,
}) => {
  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Hospital Intelligence</h1>
          <p className="text-xs text-slate-400 font-mono">Capacity modeling, ICU surge forecasting & medical supply planning</p>
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

  const surge = intelligence.hospitalSurge;

  const peakBeds = surge.length > 0 ? Math.max(...surge.map((s) => s.generalBedsRequired), 0) : 0;
  const peakICU = surge.length > 0 ? Math.max(...surge.map((s) => s.icuBedsRequired), 0) : 0;
  const peakVentilators = surge.length > 0 ? Math.max(...surge.map((s) => s.ventilatorsRequired), 0) : 0;
  const maxStaffMultiplier = surge.length > 0 ? Math.max(...surge.map((s) => s.staffSurgeFactor), 1) : 1;

  const bedCapacityStrain = peakBeds > 120 ? 'Critical' : peakBeds > 60 ? 'Elevated' : 'Nominal';
  const icuCapacityStrain = peakICU > 25 ? 'Critical' : peakICU > 12 ? 'Elevated' : 'Nominal';

  // Surge forecast points for chart
  const surgePoints = surge.map((d) => ({
    label: d.date,
    primary: d.generalBedsRequired,
    secondary: d.icuBedsRequired,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Hospital Capacity Intelligence</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            HEALTHCARE RESILIENCE
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Predictive hospital surge modeling calibrated against regional clinical acuity
        </p>
      </div>

      {/* KPI Cards: Beds, ICU, Ventilators, Staff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#0e1224] border border-cyan-500/30 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>INPATIENT BEDS PEAK</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{peakBeds}</div>
          <div className="text-[11px] text-cyan-400 font-mono">
            {bedCapacityStrain} Capacity Load
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#1a0e1c] border border-purple-500/30 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>ICU PEAK CAPACITY</span>
            <HeartPulse className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300 font-mono">{peakICU}</div>
          <div className="text-[11px] text-purple-400 font-mono">
            {icuCapacityStrain} Strain Index
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0d161a] border border-blue-500/30 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>VENTILATORS REQUIRED</span>
            <Wind className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-300 font-mono">{peakVentilators}</div>
          <div className="text-[11px] text-slate-400 font-mono">Dedicated invasive units</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#14120c] border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>STAFFING MULTIPLIER</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300 font-mono">{maxStaffMultiplier}x</div>
          <div className="text-[11px] text-amber-400 font-mono">Clinical shift escalation</div>
        </div>
      </div>

      {/* Hospital Surge Forecast Chart */}
      <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Hospital Admission Trajectory (Forward Surge Projection)
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Inpatient General Ward Beds vs. Intensive Care Unit (ICU) Admissions
            </p>
          </div>
        </div>

        <TrendChart
          data={surgePoints}
          primaryLabel="Inpatient Beds"
          secondaryLabel="ICU Beds"
          primaryColor="#06b6d4"
          secondaryColor="#a855f7"
          height={260}
        />
      </div>

      {/* Medical Supply & Logistics Planning Grid */}
      <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Logistics & Prophylactic Stockpile Planning
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Recommended inventory levels for a 30-day continuous transmission wave
            </p>
          </div>
          <Boxes className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px]">PPE SETS (MASKS, GOWNS, SHIELDS)</span>
            <span className="text-2xl font-bold text-white">
              {(Math.max(10, peakBeds) * 45).toLocaleString()} Units
            </span>
            <p className="text-[11px] text-slate-500 pt-1">
              Based on 3 shifts / patient / day turnover standard
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px]">OXYGEN MANIFOLD CAPACITY</span>
            <span className="text-2xl font-bold text-cyan-300">
              {(Math.max(10, peakBeds) * 12).toLocaleString()} L/min
            </span>
            <p className="text-[11px] text-slate-500 pt-1">
              High-flow nasal cannula & ventilator reserve
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px]">RAPID PCR / ANTIGEN LOTS</span>
            <span className="text-2xl font-bold text-purple-300">
              {(records.length * 6).toLocaleString()} Assays
            </span>
            <p className="text-[11px] text-slate-500 pt-1">
              Required for index case tracing and healthcare staff screening
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
