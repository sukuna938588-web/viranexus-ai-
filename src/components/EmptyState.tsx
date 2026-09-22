import React, { useRef } from 'react';
import { Database, Upload, Plus, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { parseCSVFile, downloadEmptyTemplate } from '../services/csvService';
import { OutbreakRecord } from '../types';

interface EmptyStateProps {
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUploadRecords,
  onOpenAddModal,
  title = 'No Dataset Loaded Yet',
  description = 'Upload CSV Dataset or Add Your First Record to start live health analysis.',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { records, errors } = await parseCSVFile(file);
    if (records.length > 0) {
      onUploadRecords(records, 'replace');
    } else {
      alert(`CSV Upload Failed: ${errors.join('; ')}`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-cyan-500/20 bg-gradient-to-b from-[#0e1220]/70 via-[#0a0d16]/80 to-[#06080d]/90 p-8 sm:p-12 text-center backdrop-blur-xl shadow-2xl my-4">
      {/* Subtle background glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-950/60 via-slate-900 to-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-950/40">
          <ShieldAlert className="h-10 w-10 text-cyan-400" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide uppercase bg-slate-900 text-cyan-300 border border-cyan-500/30">
            <Database className="w-3 h-3 text-cyan-400" />
            AI Analysis Will Appear Here
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {title}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto font-medium">
            {description}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all duration-300 active:scale-95"
          >
            <Upload className="w-4 h-4 text-slate-950" />
            <span>Upload CSV Dataset</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/40 hover:border-purple-400 text-purple-200 font-bold text-sm shadow-lg shadow-purple-950/30 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Add Your First Record</span>
          </button>
        </div>

        {/* Secondary option: Template download */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs">
          <button
            onClick={downloadEmptyTemplate}
            className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span>Download CSV Template with Valid Columns</span>
          </button>
        </div>
      </div>
    </div>
  );
};
