import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Table,
} from 'lucide-react';
import { OutbreakRecord, ActivePage } from '../types';
import { parseCSVFile, downloadEmptyTemplate } from '../services/csvService';

interface DatasetUploadProps {
  records: OutbreakRecord[];
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onClearAll: () => void;
  onDeleteRecord: (id: string) => void;
  onOpenAddModal: () => void;
  onLoadSample: () => void;
  onSelectPage: (page: ActivePage) => void;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({
  records,
  onUploadRecords,
  onClearAll,
  onDeleteRecord,
  onOpenAddModal,
  onLoadSample,
  onSelectPage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Please select a valid .csv file.');
      return;
    }
    setUploadError(null);
    const { records: parsedRecords, errors } = await parseCSVFile(file);

    if (errors.length > 0 && parsedRecords.length === 0) {
      setUploadError(`Upload failed: ${errors.join(', ')}`);
      return;
    }

    onUploadRecords(parsedRecords, 'replace');
    setSuccessMsg(`Successfully indexed ${parsedRecords.length} outbreak surveillance records.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  // Filtered records for table
  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const loc = (r.district || r.region || '').toLowerCase();
    const dis = (r.disease || '').toLowerCase();
    const dat = r.date || '';
    return loc.includes(q) || dis.includes(q) || dat.includes(q);
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Dataset Upload & Ingestion
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            CSV dataset ingestion &bull; Standardized disease surveillance schema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadEmptyTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download CSV Template</span>
          </button>
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-500/20 active:scale-95 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>
        </div>
      </div>

      {/* Supported Dataset Structure Banner */}
      <div className="p-4 rounded-2xl bg-[#080c18] border border-slate-800 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
          <Table className="w-3.5 h-3.5" />
          Supported Dataset Structure:
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {['Date', 'District', 'Disease', 'Cases', 'Deaths', 'Recovered', 'Population'].map((col) => (
            <span
              key={col}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold"
            >
              {col}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 font-mono">
          Only standard surveillance columns are required. Flexible column matching automatically parses your CSV.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-800 bg-[#080c18] hover:border-cyan-500/40 hover:bg-[#090e1f]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileProcess(file);
          }}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
          <Upload className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-white font-mono">
            Click to upload or drag & drop CSV file
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Accepts UTF-8 encoded .csv files with standard surveillance rows
          </p>
        </div>

        {uploadError && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Dataset Preview Section */}
      <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Dataset Preview ({records.length} Records)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search district / disease..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium hover:bg-cyan-500/20 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Add Record</span>
            </button>

            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-medium hover:bg-rose-500/20 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Paginated Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Disease</th>
                <th className="py-2.5 px-3">Cases</th>
                <th className="py-2.5 px-3">Deaths</th>
                <th className="py-2.5 px-3">Recovered</th>
                <th className="py-2.5 px-3">Population</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs font-mono">
                    No surveillance records found in this dataset.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-2.5 px-3 text-slate-300">{r.date}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{r.district || r.region || 'Metropolitan'}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-medium">{r.disease}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-200">{r.cases}</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.deaths || 0}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{r.recovered || 0}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {r.population ? r.population.toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
