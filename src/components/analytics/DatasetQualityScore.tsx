import React, { useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Database,
  BarChart,
  Calendar,
  MapPin,
  HeartPulse,
} from 'lucide-react';
import { OutbreakRecord } from '../../types';

interface DatasetQualityScoreProps {
  records: OutbreakRecord[];
}

export const DatasetQualityScore: React.FC<DatasetQualityScoreProps> = ({ records = [] }) => {
  const audit = useMemo(() => {
    if (!records || records.length === 0) return null;
    const N = records.length;

    // 1. Missing Values Calculation
    let missingValuesCount = 0;
    const totalFieldsEvaluated = N * 7; // date, region, disease, age, severity, outcome, symptoms

    // 2. Duplicate Records Calculation
    const signatureSet = new Set<string>();
    let duplicateRecordsCount = 0;

    // 3. Invalid Locations Calculation
    let invalidLocationsCount = 0;

    // 4. Incomplete Entries (records missing 1 or more core clinical fields)
    let incompleteEntriesCount = 0;

    records.forEach((r) => {
      let recordMissing = 0;

      // Date check
      if (!r.date || isNaN(Date.parse(r.date))) {
        missingValuesCount++;
        recordMissing++;
      }

      // Region check
      const trimmedLoc = (r.region || '').trim().toLowerCase();
      if (!trimmedLoc || ['unknown', 'n/a', 'na', 'none', '?', 'null', 'undefined', '-'].includes(trimmedLoc) || trimmedLoc.length < 2) {
        invalidLocationsCount++;
        missingValuesCount++;
        recordMissing++;
      }

      // Disease check
      if (!r.disease || r.disease.trim().length < 2) {
        missingValuesCount++;
        recordMissing++;
      }

      // Age check
      if (typeof r.age !== 'number' || isNaN(r.age) || r.age < 0 || r.age > 125) {
        missingValuesCount++;
        recordMissing++;
      }

      // Severity check
      if (!r.severity || !['Mild', 'Moderate', 'Severe', 'Critical'].includes(r.severity)) {
        missingValuesCount++;
        recordMissing++;
      }

      // Outcome check
      if (!r.outcome || !['Active', 'Recovered', 'Deceased', 'Under Observation'].includes(r.outcome)) {
        missingValuesCount++;
        recordMissing++;
      }

      // Symptoms check
      if (!Array.isArray(r.symptoms) || r.symptoms.length === 0) {
        missingValuesCount++;
        recordMissing++;
      }

      if (recordMissing > 0) {
        incompleteEntriesCount++;
      }

      // Check duplicates (Date + Region + Disease + Age + Gender)
      const sig = `${r.date || ''}_${(r.region || '').toLowerCase()}_${(r.disease || '').toLowerCase()}_${r.age}_${r.gender || ''}`;
      if (signatureSet.has(sig)) {
        duplicateRecordsCount++;
      } else {
        signatureSet.add(sig);
      }
    });

    // Penalties calculation
    const missingRatio = missingValuesCount / Math.max(1, totalFieldsEvaluated);
    const duplicateRatio = duplicateRecordsCount / Math.max(1, N);
    const invalidLocRatio = invalidLocationsCount / Math.max(1, N);
    const incompleteRatio = incompleteEntriesCount / Math.max(1, N);

    // Composite Quality Score (0 - 100%)
    const rawScore = 100 - (missingRatio * 40 + duplicateRatio * 20 + invalidLocRatio * 20 + incompleteRatio * 20) * 100;
    const qualityScore = Math.max(15, Math.min(100, Math.round(rawScore)));

    // Exact Rating Tiers: Excellent, Good, Average, Poor
    let ratingTier: 'Excellent' | 'Good' | 'Average' | 'Poor' = 'Good';
    let ratingColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    let ratingDescription = 'Verified surveillance records with high operational fidelity';

    if (qualityScore >= 85) {
      ratingTier = 'Excellent';
      ratingColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      ratingDescription = 'Gold standard epidemiological telemetry with complete fields and low redundancy';
    } else if (qualityScore >= 70) {
      ratingTier = 'Good';
      ratingColor = 'text-teal-400 border-teal-500/30 bg-teal-500/10';
      ratingDescription = 'High-confidence clinical dataset meeting predictive modeling requirements';
    } else if (qualityScore >= 50) {
      ratingTier = 'Average';
      ratingColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      ratingDescription = 'Partially complete dataset; missing fields or duplicates may slightly affect forecasts';
    } else {
      ratingTier = 'Poor';
      ratingColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      ratingDescription = 'Sparse or incomplete entries detected; data cleaning recommended';
    }

    const recommendations: string[] = [];
    if (missingValuesCount > 0) {
      recommendations.push(`Standardize clinical forms to populate missing records (${missingValuesCount} blank cells detected).`);
    }
    if (duplicateRecordsCount > 0) {
      recommendations.push(`Deduplicate patient registries to eliminate overlapping case entries (${duplicateRecordsCount} redundant records).`);
    }
    if (invalidLocationsCount > 0) {
      recommendations.push(`Enforce standardized geographic naming conventions for accurate geospatial clustering.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Clinical records exhibit exceptional data integrity and are certified for AI predictive modeling.');
      recommendations.push('Maintain current automated validation protocols for ongoing incident reporting.');
    }

    return {
      qualityScore,
      ratingTier,
      ratingColor,
      ratingDescription,
      missingValuesCount,
      missingValuesPct: Math.round((missingValuesCount / totalFieldsEvaluated) * 100),
      duplicateRecordsCount,
      duplicateRecordsPct: Math.round((duplicateRecordsCount / N) * 100),
      invalidLocationsCount,
      invalidLocationsPct: Math.round((invalidLocationsCount / N) * 100),
      incompleteEntriesCount,
      incompleteEntriesPct: Math.round((incompleteEntriesCount / N) * 100),
      totalRecords: N,
      recommendations,
    };
  }, [records]);

  if (!records || records.length === 0 || !audit) {
    return (
      <div className="p-8 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
          <Database className="w-7 h-7 opacity-60" />
        </div>
        <h3 className="text-base font-bold text-white font-mono">Dataset Quality Score</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          No records loaded. Ingest verified patient surveillance records to calculate multi-vector data health, completeness, and epidemiological fidelity.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f20]/90 to-[#060814]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Dataset Quality Score</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Algorithmic verification across {records.length.toLocaleString()} user-provided records
            </p>
          </div>
        </div>

        <div className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border self-start sm:self-auto ${audit.ratingColor}`}>
          Tier: {audit.ratingTier} • {audit.qualityScore}%
        </div>
      </div>

      {/* Main Score & Dimensional Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-6">
        {/* Large Score Dial Card */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#070a16] border border-slate-800/90 flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - audit.qualityScore / 100)}`}
                strokeLinecap="round"
                className="text-cyan-400 transition-all duration-1000"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white font-mono">{audit.qualityScore}%</span>
              <span className="text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-wider">Quality Score</span>
            </div>
          </div>
          <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              audit.ratingTier === 'Excellent' ? 'bg-emerald-400' :
              audit.ratingTier === 'Good' ? 'bg-teal-400' :
              audit.ratingTier === 'Average' ? 'bg-amber-400' : 'bg-rose-400'
            }`} />
            Rating: {audit.ratingTier}
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-1 max-w-[220px]">
            {audit.ratingDescription}
          </p>
        </div>

        {/* 4 Required Verification Dimensions */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Missing Values */}
          <div className="p-3.5 rounded-xl bg-[#090d1c] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Missing Values
              </span>
              <span className={`font-bold font-mono ${audit.missingValuesCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {audit.missingValuesCount} ({audit.missingValuesPct}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${audit.missingValuesCount === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${Math.max(4, 100 - audit.missingValuesPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1.5">
              {audit.missingValuesCount === 0 ? 'Zero missing values detected' : 'Incomplete date, region, disease, or symptoms'}
            </div>
          </div>

          {/* Duplicate Records */}
          <div className="p-3.5 rounded-xl bg-[#090d1c] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Duplicate Records
              </span>
              <span className={`font-bold font-mono ${audit.duplicateRecordsCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {audit.duplicateRecordsCount} ({audit.duplicateRecordsPct}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${audit.duplicateRecordsCount === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${Math.max(4, 100 - audit.duplicateRecordsPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1.5">
              {audit.duplicateRecordsCount === 0 ? 'No duplicate case fingerprints' : 'Identical patient timestamps and location'}
            </div>
          </div>

          {/* Invalid Locations */}
          <div className="p-3.5 rounded-xl bg-[#090d1c] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Invalid Locations
              </span>
              <span className={`font-bold font-mono ${audit.invalidLocationsCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {audit.invalidLocationsCount} ({audit.invalidLocationsPct}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${audit.invalidLocationsCount === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${Math.max(4, 100 - audit.invalidLocationsPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1.5">
              {audit.invalidLocationsCount === 0 ? 'All regional sectors verified' : 'Ambiguous, blank, or placeholder locations'}
            </div>
          </div>

          {/* Incomplete Entries */}
          <div className="p-3.5 rounded-xl bg-[#090d1c] border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                Incomplete Entries
              </span>
              <span className={`font-bold font-mono ${audit.incompleteEntriesCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {audit.incompleteEntriesCount} ({audit.incompleteEntriesPct}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${audit.incompleteEntriesCount === 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${Math.max(4, 100 - audit.incompleteEntriesPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1.5">
              {audit.incompleteEntriesCount === 0 ? '100% complete clinical intake' : 'Entries missing vital clinical fields'}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Banner */}
      <div className="p-4 rounded-2xl bg-[#070a16] border border-slate-800">
        <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Data Hygiene Directives for Higher AI Precision
        </div>
        <ul className="space-y-1.5">
          {audit.recommendations.map((rec, i) => (
            <li key={i} className="text-xs text-slate-300 flex items-start gap-2 font-mono">
              <span className="text-cyan-400 font-bold shrink-0">›</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
