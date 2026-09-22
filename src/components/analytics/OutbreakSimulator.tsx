import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Shield,
  Activity,
  AlertTriangle,
  TrendingDown,
  Building2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord } from '../../types';

interface OutbreakSimulatorProps {
  intelligence: EpidemiologicalIntelligence;
  totalRecords: number;
}

export const OutbreakSimulator: React.FC<OutbreakSimulatorProps> = ({ intelligence, totalRecords = 0 }) => {
  // Simulator configuration states
  const [intervention, setIntervention] = useState<'none' | 'masking' | 'tracing' | 'lockdown'>('tracing');
  const [vaccineCoverage, setVaccineCoverage] = useState<number>(30); // 0% - 90%
  const [horizonDays, setHorizonDays] = useState<number>(30); // 14, 30, 60 days
  const [hospitalCapacity, setHospitalCapacity] = useState<number>(Math.max(20, Math.round(totalRecords * 0.8)));

  const simulation = useMemo(() => {
    if (totalRecords === 0) return null;

    const baseI0 = Math.max(1, intelligence.activeCases || Math.round(totalRecords * 0.7));
    const baseR0 = Math.max(1.05, intelligence.estimatedR0 || 1.6);
    const gamma = 1 / 10; // 10 days recovery period (gamma parameter)

    // Intervention reduction factors
    const interventionReductions = {
      none: 0,
      masking: 0.25,
      tracing: 0.5,
      lockdown: 0.75,
    };

    const reduction = interventionReductions[intervention];
    const effectiveR0Baseline = baseR0;
    const effectiveR0Intervention = Math.max(
      0.4,
      baseR0 * (1 - reduction) * (1 - (vaccineCoverage / 100) * 0.85)
    );

    const baselineCurve: Array<{ day: number; cases: number }> = [];
    const simulatedCurve: Array<{ day: number; cases: number }> = [];

    let currentBaseI = baseI0;
    let currentSimI = baseI0;

    let totalBaseCases = 0;
    let totalSimCases = 0;
    let peakBase = baseI0;
    let peakSim = baseI0;
    let peakDayBase = 1;
    let peakDaySim = 1;

    for (let day = 1; day <= horizonDays; day++) {
      // Differential increment simulation
      const baseDailyGrowth = currentBaseI * (effectiveR0Baseline * gamma - gamma);
      const simDailyGrowth = currentSimI * (effectiveR0Intervention * gamma - gamma);

      // Dampening saturation
      const saturationFactorBase = Math.max(0.05, 1 - totalBaseCases / (baseI0 * 120));
      const saturationFactorSim = Math.max(0.05, 1 - totalSimCases / (baseI0 * 120));

      currentBaseI = Math.max(1, Math.round(currentBaseI + baseDailyGrowth * saturationFactorBase));
      currentSimI = Math.max(1, Math.round(currentSimI + simDailyGrowth * saturationFactorSim));

      totalBaseCases += currentBaseI;
      totalSimCases += currentSimI;

      if (currentBaseI > peakBase) {
        peakBase = currentBaseI;
        peakDayBase = day;
      }
      if (currentSimI > peakSim) {
        peakSim = currentSimI;
        peakDaySim = day;
      }

      baselineCurve.push({ day, cases: currentBaseI });
      simulatedCurve.push({ day, cases: currentSimI });
    }

    const casesAverted = Math.max(0, totalBaseCases - totalSimCases);
    const peakReductionPct = Math.round(((peakBase - peakSim) / Math.max(1, peakBase)) * 100);
    const hospitalOverrunPrevented = peakBase > hospitalCapacity && peakSim <= hospitalCapacity;
    const daysBought = Math.max(0, peakDaySim - peakDayBase);

    return {
      baseR0,
      effectiveR0Intervention: Number(effectiveR0Intervention.toFixed(2)),
      baselineCurve,
      simulatedCurve,
      peakBase,
      peakSim,
      peakDayBase,
      peakDaySim,
      casesAverted,
      peakReductionPct,
      hospitalOverrunPrevented,
      daysBought,
    };
  }, [totalRecords, intelligence, intervention, vaccineCoverage, horizonDays, hospitalCapacity]);

  if (totalRecords === 0 || !simulation) {
    return (
      <div className="p-8 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
          <Sliders className="w-7 h-7 opacity-60" />
        </div>
        <h3 className="text-base font-bold text-white font-mono">Outbreak Simulator</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          No outbreak records detected. Ingest patient cases to calibrate interactive epidemiological transmission simulations, non-pharmaceutical interventions, and hospital surge thresholds.
        </p>
      </div>
    );
  }

  // SVG Chart Geometry
  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(
    hospitalCapacity * 1.15,
    simulation.peakBase * 1.1,
    ...simulation.baselineCurve.map((c) => c.cases),
    ...simulation.simulatedCurve.map((c) => c.cases)
  );

  const getX = (day: number) => paddingX + ((day - 1) / (horizonDays - 1)) * (width - paddingX * 2);
  const getY = (cases: number) => height - paddingY - (cases / maxVal) * (height - paddingY * 2);

  const generatePath = (data: Array<{ day: number; cases: number }>) => {
    return data.reduce((acc, pt, idx) => {
      const x = getX(pt.day);
      const y = getY(pt.cases);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const generateArea = (data: Array<{ day: number; cases: number }>, linePath: string) => {
    const lastX = getX(data[data.length - 1].day);
    const firstX = getX(data[0].day);
    const bottomY = height - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const basePath = generatePath(simulation.baselineCurve);
  const baseArea = generateArea(simulation.baselineCurve, basePath);
  const simPath = generatePath(simulation.simulatedCurve);
  const simArea = generateArea(simulation.simulatedCurve, simPath);
  const hospitalY = getY(hospitalCapacity);

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#090e24]/95 via-[#060a1a]/95 to-[#050712]/95 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Outbreak Simulator
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                SEIR DYNAMICS
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Calibrated from user data (Baseline R₀ = {simulation.baseR0} → Simulated R₀ = {simulation.effectiveR0Intervention})
            </p>
          </div>
        </div>

        {/* 3 Outcome Badge Cards */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
            Averted: <strong>~{simulation.casesAverted.toLocaleString()} cases</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-300 font-mono text-xs">
            Peak Reduced: <strong>{simulation.peakReductionPct}%</strong>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
              simulation.hospitalOverrunPrevented
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            {simulation.hospitalOverrunPrevented ? '✓ Hospital Overrun Prevented' : 'Capacity Monitored'}
          </div>
        </div>
      </div>

      {/* Simulator Control Sliders Strip */}
      <div className="p-4 rounded-2xl bg-[#060814]/90 border border-slate-800 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Intervention Mode */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1.5">Public Health Protocol</label>
          <select
            value={intervention}
            onChange={(e) => setIntervention(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="none">Uncontrolled Baseline (0%)</option>
            <option value="masking">Masking & Sanitation (-25%)</option>
            <option value="tracing">Contact Tracing & Triage (-50%)</option>
            <option value="lockdown">Strict Movement Restriction (-75%)</option>
          </select>
        </div>

        {/* Vaccine Coverage */}
        <div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span>Immunization Level</span>
            <span className="text-cyan-400 font-bold">{vaccineCoverage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={vaccineCoverage}
            onChange={(e) => setVaccineCoverage(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Horizon Days */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1.5">Simulation Horizon</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {[14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setHorizonDays(d)}
                className={`py-0.5 rounded-lg font-semibold transition ${
                  horizonDays === d ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Hospital Surge Limit */}
        <div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span>Hospital Bed Cap</span>
            <span className="text-amber-400 font-bold">{hospitalCapacity} beds</span>
          </div>
          <input
            type="range"
            min="10"
            max={Math.max(100, Math.round(totalRecords * 2.5))}
            step="5"
            value={hospitalCapacity}
            onChange={(e) => setHospitalCapacity(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>
      </div>

      {/* SVG Dual Trajectory Comparison Stage */}
      <div className="relative border border-slate-800/80 rounded-2xl bg-[#04060d] p-2 overflow-hidden select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="simRedArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="simCyanArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(148, 163, 184, 0.08)"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Hospital Bed Threshold Line */}
          {hospitalY >= paddingY && hospitalY <= height - paddingY && (
            <g>
              <line
                x1={paddingX}
                y1={hospitalY}
                x2={width - paddingX}
                y2={hospitalY}
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />
              <text
                x={width - paddingX - 4}
                y={hospitalY - 5}
                textAnchor="end"
                className="fill-amber-400 font-mono text-[9px] font-bold"
              >
                HOSPITAL BED CAP ({hospitalCapacity})
              </text>
            </g>
          )}

          {/* Baseline Curve (Unchecked) */}
          <path d={baseArea} fill="url(#simRedArea)" />
          <path
            d={basePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.2"
            strokeDasharray="5 3"
            className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
          />

          {/* Simulated Intervention Curve */}
          <path d={simArea} fill="url(#simCyanArea)" />
          <path
            d={simPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          />
        </svg>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 px-2 pb-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 border-dashed" />
              <span className="text-rose-300">Unchecked Baseline (Peak: {simulation.peakBase} on Day {simulation.peakDayBase})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-cyan-400 rounded-full" />
              <span className="text-cyan-300 font-bold">Simulated Curve (Peak: {simulation.peakSim} on Day {simulation.peakDaySim})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-0.5 bg-amber-400" />
            <span>Healthcare Capacity Ceiling</span>
          </div>
        </div>
      </div>
    </div>
  );
};
