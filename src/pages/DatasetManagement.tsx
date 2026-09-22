import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { OutbreakRecord, SeverityLevel } from '../types';
import { parseCSVFile, exportRecordsToCSV, downloadEmptyTemplate } from '../services/csvService';

interface DatasetManagementProps {
  records: OutbreakRecord[];
  onAddRecord: (record: Omit<OutbreakRecord, 'id'>) => void;
  onUpdateRecord: (id: string, updated: Partial<OutbreakRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onClearAllRecords: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (record: OutbreakRecord) => void;
}

export const DatasetManagement: React.FC<DatasetManagementProps> = ({
  records,
  onDeleteRecord,
  onUploadRecords,
  onClearAllRecords,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered records
  const filteredRecords = records.filter((r) => {
    if (filterSeverity !== 'All' && r.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRegion = r.region.toLowerCase().includes(q);
      const matchDisease = r.disease.toLowerCase().includes(q);
      const matchSymptoms = r.symptoms.some((s) => s.toLowerCase().includes(q));
      if (!matchRegion && !matchDisease && !matchSymptoms) return false;
    }
    return true;
  });

  const handleFileUpload = async (file: File, mode: 'append' | 'replace' = 'replace') => {
    setUploadStatus('Parsing surveillance CSV...');
    const { records: parsedRecords, errors } = await parseCSVFile(file);

    if (parsedRecords.length > 0) {
      onUploadRecords(parsedRecords, mode);
      setUploadStatus(`Successfully indexed ${parsedRecords.length} surveillance records.`);
      setTimeout(() => setUploadStatus(null), 4000);
    } else {
      setUploadStatus(`Failed to parse CSV: ${errors.join('; ')}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file, 'replace');
    } else {
      alert('Please upload a valid .csv file.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Dataset Management</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              CSV SURVEILLANCE INGEST
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Zero hardcoded data policy. All analytical outputs derive strictly from indexed cases.
          </p>
        </div>

        {/* Global Dataset Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Case</span>
          </button>

          {records.length > 0 && (
            <>
              <button
                onClick={() => exportRecordsToCSV(records)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all indexed records and restore the initial empty state?')) {
                    onClearAllRecords();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Dataset</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload & Drag Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative p-8 rounded-3xl border-2 border-dashed transition-all duration-300 text-center ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-slate-800 bg-[#090d18]/70 hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'replace');
          }}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Upload className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Drag & Drop Outbreak Surveillance CSV File
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports standard epidemiological columns (date, region, disease, age, gender, severity, hospitalized, icu, symptoms)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-white transition"
            >
              Browse Local Files (.csv)
            </button>

            <button
              onClick={downloadEmptyTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Blank Template</span>
            </button>
          </div>

          {uploadStatus && (
            <div className="mt-3 p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{uploadStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar for Table */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#090d18]/70 border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by pathogen, zone, symptom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Severities</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[#080b15]/90 border border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white font-mono">
              Surveillance Records ({filteredRecords.length.toLocaleString()})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Anonymized clinical case entries
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">
            {records.length === 0
              ? 'No Dataset Loaded — Upload CSV or Add Records to Start Analysis'
              : 'No records match the current filter criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Region / Zone</th>
                  <th className="py-3 px-4 font-semibold">Pathogen</th>
                  <th className="py-3 px-4 font-semibold">Age / Sex</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Hospital / ICU</th>
                  <th className="py-3 px-4 font-semibold">Outcome</th>
                  <th className="py-3 px-4 font-semibold">Symptoms</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredRecords.slice(0, 100).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 text-slate-300">{r.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <span>{r.city || r.region}</span>
                        {r.city && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono">
                            Smart Loc
                          </span>
                        )}
                      </div>
                      {(r.state || (r.city && r.region !== r.city)) && (
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                          {[r.state, r.region !== r.city ? r.region : null].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-semibold">{r.disease}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.age} yrs • {r.gender}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.severity === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : r.severity === 'Severe'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : r.severity === 'Moderate'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {r.hospitalized ? 'Hosp' : 'No'} {r.icu ? '• ICU' : ''}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          r.outcome === 'Active'
                            ? 'text-cyan-400'
                            : r.outcome === 'Recovered'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {r.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-[180px] truncate" title={r.symptoms.join(', ')}>
                      {r.symptoms.join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenEditModal(r)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRecords.length > 100 && (
              <div className="p-3 text-center text-xs text-slate-500 font-mono border-t border-slate-800">
                Showing first 100 of {filteredRecords.length} records. Export full CSV for complete review.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
