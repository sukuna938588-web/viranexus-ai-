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
  Edit2,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
  Calendar,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { OutbreakRecord, SeverityLevel, GenderType, ActivePage } from '../types';
import { parseCSVFile, downloadEmptyTemplate, exportRecordsToCSV } from '../services/csvService';

interface DatasetManagementProps {
  records: OutbreakRecord[];
  onAddRecord: (record: Omit<OutbreakRecord, 'id'>) => void;
  onUpdateRecord: (id: string, updated: Partial<OutbreakRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onClearAll: () => void;
  onOpenAddModal: () => void;
  onLoadSample: () => void;
  onSelectPage: (page: ActivePage) => void;
}

const COMMON_SYMPTOMS = ['Fever', 'Headache', 'Cough', 'Vomiting', 'Body Pain'];

export const DatasetManagement: React.FC<DatasetManagementProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onUploadRecords,
  onClearAll,
  onOpenAddModal,
  onLoadSample,
  onSelectPage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter States (Disease, Region / Zone, Severity, Date Range)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisease, setFilterDisease] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Sorting state (Date, Region / Zone, Disease, Cases, Severity)
  const [sortField, setSortField] = useState<'date' | 'cases' | 'region' | 'disease' | 'severity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection & Bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<OutbreakRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

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
    showNotification(`Successfully indexed ${parsedRecords.length} surveillance dataset records.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  // Distinct lists for dropdown filters
  const diseaseList = Array.from(new Set(records.map((r) => r.disease))).filter(Boolean);
  const regionList = Array.from(new Set(records.map((r) => r.region || r.district))).filter(Boolean);

  // Filtered & Sorted Records
  const processedRecords = records
    .filter((r) => {
      const reg = r.region || r.district || '';
      if (filterDisease !== 'All' && r.disease !== filterDisease) return false;
      if (filterRegion !== 'All' && reg !== filterRegion) return false;
      if (filterSeverity !== 'All' && r.severity !== filterSeverity) return false;
      if (filterStartDate && r.date < filterStartDate) return false;
      if (filterEndDate && r.date > filterEndDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDisease = r.disease.toLowerCase().includes(q);
        const matchesRegion = reg.toLowerCase().includes(q);
        const matchesSymptoms = (r.symptoms || []).some((s) => s.toLowerCase().includes(q));
        const matchesDate = r.date.includes(q);
        const matchesAge = String(r.age || '').includes(q);
        const matchesSex = (r.sex || '').toLowerCase().includes(q);
        if (!matchesDisease && !matchesRegion && !matchesSymptoms && !matchesDate && !matchesAge && !matchesSex) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortField === 'date') result = a.date.localeCompare(b.date);
      else if (sortField === 'cases') result = a.cases - b.cases;
      else if (sortField === 'region') result = (a.region || '').localeCompare(b.region || '');
      else if (sortField === 'disease') result = a.disease.localeCompare(b.disease);
      else if (sortField === 'severity') {
        const order: Record<SeverityLevel, number> = { Normal: 1, Moderate: 2, Severe: 3, Critical: 4 };
        result = (order[a.severity] || 0) - (order[b.severity] || 0);
      }
      return sortOrder === 'asc' ? result : -result;
    });

  const totalPages = Math.ceil(processedRecords.length / pageSize) || 1;
  const paginatedRecords = processedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Bulk Actions
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedRecords.map((r) => r.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => onDeleteRecord(id));
    const count = selectedIds.length;
    setSelectedIds([]);
    showNotification(`Deleted ${count} selected records.`);
  };

  const handleResetDataset = () => {
    onLoadSample();
    setSelectedIds([]);
    showNotification('Dataset reset to verified reference surveillance dataset.');
  };

  // Toggle sorting
  const handleSort = (field: 'date' | 'cases' | 'region' | 'disease' | 'severity') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    onUpdateRecord(editingRecord.id, editingRecord);
    setEditingRecord(null);
    showNotification(`Updated record for ${editingRecord.disease} (${editingRecord.region}).`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDisease('All');
    setFilterRegion('All');
    setFilterSeverity('All');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterDisease !== 'All' ||
    filterRegion !== 'All' ||
    filterSeverity !== 'All' ||
    filterStartDate !== '' ||
    filterEndDate !== '';

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Dataset Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              CORE ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Foundation of OutbreakX predictions, alerts, risk maps, and AI Copilot &bull; {records.length} records active
          </p>
        </div>

        {/* Global Dataset Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-500/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Record Entry</span>
          </button>
          <button
            onClick={() => exportRecordsToCSV(records)}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-cyan-300 disabled:opacity-40 transition"
            title="Export CSV matching the 10-column OutbreakX schema"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={downloadEmptyTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-xs font-mono text-slate-200 transition"
            title="Download blank 10-column CSV template"
          >
            <span>CSV Template</span>
          </button>
          <button
            onClick={handleResetDataset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono text-emerald-300 transition"
            title="Reset dataset to verified reference surveillance dataset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Dataset Reset</span>
          </button>
          {records.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-mono transition"
              title="Clear all records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* CSV Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-7 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-2.5 ${
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

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Upload className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-white font-mono">
            Drag & Drop CSV File or Click to Upload
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Standard Columns: Date, Region / Zone, Disease, Age / Sex, Severity, Symptoms, Cases, Deaths, Recovered
          </p>
        </div>

        {uploadError && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Search & Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Disease, Region, Symptoms..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
        </div>

        {/* 4 Dedicated Filters: Disease, Region / Zone, Severity, Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          {/* 1. Disease Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Disease
            </label>
            <select
              value={filterDisease}
              onChange={(e) => {
                setFilterDisease(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
            >
              <option value="All">All Diseases</option>
              {diseaseList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Region / Zone Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Region / Zone
            </label>
            <select
              value={filterRegion}
              onChange={(e) => {
                setFilterRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
            >
              <option value="All">All Regions</option>
              {regionList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Severity Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Severity
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
            >
              <option value="All">All Severities</option>
              <option value="Normal">Normal</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* 4. Date Range: Start Date */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40 text-xs"
            />
          </div>

          {/* Date Range: End Date */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Dataset Table Section */}
      <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-white">{processedRecords.length}</strong> matching records (Total: {records.length})
            </span>
            {selectedIds.length > 0 && (
              <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {/* Bulk Delete & Page Size */}
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bulk Delete ({selectedIds.length})</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dataset Table containing EXACTLY the 10 specified columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                {/* Select Checkbox for bulk delete */}
                <th className="py-3 px-2 w-8">
                  <button onClick={handleSelectAllOnPage} className="p-1 hover:text-white" title="Select All on Page">
                    {paginatedRecords.length > 0 &&
                    paginatedRecords.every((r) => selectedIds.includes(r.id)) ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                {/* 1. Date */}
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>1. Date</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                {/* 2. Region / Zone */}
                <th
                  onClick={() => handleSort('region')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>2. Region / Zone</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                {/* 3. Disease */}
                <th
                  onClick={() => handleSort('disease')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>3. Disease</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                {/* 4. Age */}
                <th className="py-3 px-3">
                  <span>4. Age</span>
                </th>
                {/* 5. Sex */}
                <th className="py-3 px-3">
                  <span>5. Sex</span>
                </th>
                {/* 6. Severity */}
                <th
                  onClick={() => handleSort('severity')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>6. Severity</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                {/* 7. Symptoms */}
                <th className="py-3 px-3">
                  <span>7. Symptoms</span>
                </th>
                {/* 8. Cases */}
                <th
                  onClick={() => handleSort('cases')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>8. Cases</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                {/* 9. Deaths */}
                <th className="py-3 px-3">
                  <span>9. Deaths</span>
                </th>
                {/* 10. Recovered */}
                <th className="py-3 px-3">
                  <span>10. Recovered</span>
                </th>
                {/* Actions */}
                <th className="py-3 px-3 text-right">
                  <span>Actions (Edit / Delete)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No surveillance records found matching current query or filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isSelected = selectedIds.includes(r.id);

                  // Severity color tags strictly matching: Normal, Moderate, Severe, Critical
                  let sevBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  if (r.severity === 'Critical') sevBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  else if (r.severity === 'Severe') sevBadge = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                  else if (r.severity === 'Moderate') sevBadge = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';

                  // Calculated age display
                  const displayAge = r.age || (r.ageGroup ? (parseInt(r.ageGroup.replace(/\D/g, ''), 10) || 28) : 28);
                  const displaySex = r.sex || 'Male';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-900/50 transition ${
                        isSelected ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-2">
                        <button
                           onClick={() => handleToggleRowSelect(r.id)}
                          className="p-1 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* 1. Date */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{r.date}</td>

                      {/* 2. Region / Zone */}
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {r.region || r.district || 'Metropolitan'}
                      </td>

                      {/* 3. Disease */}
                      <td className="py-3 px-3 text-cyan-300 font-medium whitespace-nowrap">{r.disease}</td>

                      {/* 4. Age */}
                      <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                        {displayAge}
                      </td>

                      {/* 5. Sex */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-semibold ${displaySex === 'Female' ? 'text-pink-300' : displaySex === 'Male' ? 'text-cyan-300' : 'text-purple-300'}`}>
                          {displaySex}
                        </span>
                      </td>

                      {/* 6. Severity */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${sevBadge}`}>
                          {r.severity}
                        </span>
                      </td>

                      {/* 7. Symptoms */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(r.symptoms && r.symptoms.length > 0 ? r.symptoms : ['Fever', 'Body Pain']).map((sym, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                            >
                              {sym}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 8. Cases */}
                      <td className="py-3 px-3 font-bold text-white">{r.cases}</td>

                      {/* 9. Deaths */}
                      <td className="py-3 px-3 text-rose-400 font-semibold">{r.deaths || 0}</td>

                      {/* 10. Recovered */}
                      <td className="py-3 px-3 text-emerald-400 font-semibold">{r.recovered || 0}</td>

                      {/* Actions (Edit & Delete) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingRecord(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
            <span>
              Page {currentPage} of {totalPages} &bull; ({processedRecords.length} records)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Record Modal (Only standard fields: Date, Region / Zone, Disease, Age / Sex, Severity, Symptoms, Cases, Deaths, Recovered) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#080c18] border border-cyan-500/40 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Edit Surveillance Record
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-mono">
              {/* Row 1: Date & Region / Zone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">1. Date</label>
                  <input
                    type="date"
                    value={editingRecord.date}
                    onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">2. Region / Zone</label>
                  <input
                    type="text"
                    value={editingRecord.region}
                    onChange={(e) => setEditingRecord({ ...editingRecord, region: e.target.value, district: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Disease & Severity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">3. Disease</label>
                  <input
                    type="text"
                    value={editingRecord.disease}
                    onChange={(e) => setEditingRecord({ ...editingRecord, disease: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">5. Severity</label>
                  <select
                    value={editingRecord.severity}
                    onChange={(e) => setEditingRecord({ ...editingRecord, severity: e.target.value as SeverityLevel })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Age & Sex (Age / Sex) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">4a. Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editingRecord.age || 25}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 25;
                      let grp = 'Adult (20-59)';
                      if (val <= 12) grp = 'Child (0-12)';
                      else if (val <= 19) grp = 'Teen (13-19)';
                      else if (val >= 60) grp = 'Senior (60+)';
                      setEditingRecord({ ...editingRecord, age: val, ageGroup: grp });
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">4b. Sex</label>
                  <select
                    value={editingRecord.sex || 'Male'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, sex: e.target.value as GenderType })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Symptoms with Quick Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">6. Symptoms (Multiple supported)</label>
                  <span className="text-[10px] text-slate-500">Click to toggle quick symptom</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_SYMPTOMS.map((sym) => {
                    const active = (editingRecord.symptoms || []).includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => {
                          const current = editingRecord.symptoms || [];
                          const updated = active ? current.filter((s) => s !== sym) : [...current, sym];
                          setEditingRecord({ ...editingRecord, symptoms: updated });
                        }}
                        className={`px-2 py-0.5 rounded-lg border text-[11px] transition ${
                          active
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{sym}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Fever, Headache, Body Pain"
                  value={(editingRecord.symptoms || []).join(', ')}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      symptoms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                />
              </div>

              {/* Row 5: Cases, Deaths, Recovered */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">7. Cases</label>
                  <input
                    type="number"
                    min="1"
                    value={editingRecord.cases}
                    onChange={(e) => setEditingRecord({ ...editingRecord, cases: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">8. Deaths</label>
                  <input
                    type="number"
                    min="0"
                    value={editingRecord.deaths || 0}
                    onChange={(e) => setEditingRecord({ ...editingRecord, deaths: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">9. Recovered</label>
                  <input
                    type="number"
                    min="0"
                    value={editingRecord.recovered || 0}
                    onChange={(e) => setEditingRecord({ ...editingRecord, recovered: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/40"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 active:scale-95 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
