import React, { useState } from 'react';
import { ActivePage, OutbreakRecord } from './types';
import { useOutbreakData } from './hooks/useOutbreakData';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ParticleBackground } from './components/ParticleBackground';
import { AddRecordModal } from './components/AddRecordModal';

// The Core OUTBREAKX Modules
import { Overview } from './pages/Overview';
import { Dashboard } from './pages/Dashboard';
import { DiseaseMap } from './pages/DiseaseMap';
import { NetworkGraph } from './pages/NetworkGraph';
import { PredictionCenter } from './pages/PredictionCenter';
import { AlertCenter } from './pages/AlertCenter';
import { Analytics } from './pages/Analytics';
import { DatasetManagement } from './pages/DatasetManagement';
import { AICopilot } from './pages/AICopilot';
import { Settings } from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OutbreakRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [focusedPrediction, setFocusedPrediction] = useState<{
    location: string;
    disease?: string;
    probability?: number;
    timeWindow?: string;
    explanation?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    records,
    intelligence,
    addRecord,
    updateRecord,
    deleteRecord,
    uploadRecords,
    loadSampleDataset,
    clearAllRecords,
  } = useOutbreakData();

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsAddModalOpen(true);
  };

  const handleSaveRecord = (recordData: Omit<OutbreakRecord, 'id'>) => {
    if (editingRecord) {
      updateRecord(editingRecord.id, recordData);
      showToast(`Updated record: ${recordData.disease} (${recordData.district})`);
    } else {
      addRecord(recordData);
      showToast(`Indexed new case: ${recordData.disease} (${recordData.district})`);
    }
  };

  const handleUploadRecords = (newRecords: OutbreakRecord[], mode: 'append' | 'replace') => {
    uploadRecords(newRecords, mode);
    showToast(`Indexed ${newRecords.length} outbreak cases successfully.`);
  };

  const handleLoadSample = () => {
    loadSampleDataset();
    showToast('Loaded verified Tamil Nadu outbreak surveillance dataset.');
  };

  const handleClearAll = () => {
    clearAllRecords();
    showToast('Surveillance dataset cleared. Restored baseline empty state.');
  };

  return (
    <div className="relative min-h-screen bg-[#04060a] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Animated Particle Canvas */}
      <ParticleBackground />

      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        totalRecords={records.length}
        activeAlerts={intelligence.activeAlertsCount}
        highRiskZones={intelligence.highRiskZonesCount}
        onOpenAddModal={handleOpenAddModal}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Responsive Shell: Sidebar + Main Content */}
      <div className="flex">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          totalRecords={records.length}
          activeAlerts={intelligence.activeAlertsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 lg:pl-72 transition-all">
          <div className="max-w-7xl mx-auto">
            {/* 0. Landing / Overview Page (3D Globe + Hero Quote) */}
            {currentPage === 'overview' && (
              <Overview
                intelligence={intelligence}
                records={records}
                onSelectPage={setCurrentPage}
                onOpenAddModal={handleOpenAddModal}
                onLoadSample={handleLoadSample}
              />
            )}

            {/* 1. Dashboard */}
            {currentPage === 'dashboard' && (
              <Dashboard
                intelligence={intelligence}
                records={records}
                onSelectPage={setCurrentPage}
                onOpenAddModal={handleOpenAddModal}
                onLoadSample={handleLoadSample}
                onFocusPrediction={setFocusedPrediction}
              />
            )}

            {/* 2. Disease Map */}
            {currentPage === 'map' && (
              <DiseaseMap
                intelligence={intelligence}
                records={records}
                onSelectPage={setCurrentPage}
                onLoadSample={handleLoadSample}
                onOpenAddModal={handleOpenAddModal}
                focusedPrediction={focusedPrediction}
                onClearFocusedPrediction={() => setFocusedPrediction(null)}
              />
            )}

            {/* 3. Network Graph */}
            {currentPage === 'network' && (
              <NetworkGraph
                records={records}
                onSelectPage={setCurrentPage}
                onLoadSample={handleLoadSample}
              />
            )}

            {/* 4. Prediction Center */}
            {currentPage === 'prediction' && (
              <PredictionCenter
                intelligence={intelligence}
                records={records}
                onSelectPage={setCurrentPage}
                onLoadSample={handleLoadSample}
                onFocusPrediction={setFocusedPrediction}
              />
            )}

            {/* 5. Alert Center */}
            {currentPage === 'alerts' && (
              <AlertCenter
                intelligence={intelligence}
                totalRecords={records.length}
                onSelectPage={setCurrentPage}
                onLoadSample={handleLoadSample}
              />
            )}

            {/* 6. Analytics */}
            {currentPage === 'analytics' && (
              <Analytics
                intelligence={intelligence}
                records={records}
                onSelectPage={setCurrentPage}
                onLoadSample={handleLoadSample}
              />
            )}

            {/* 7. Dataset Management (Core OutbreakX Engine) */}
            {(currentPage === 'upload' || currentPage === 'dataset') && (
              <DatasetManagement
                records={records}
                onAddRecord={handleSaveRecord}
                onUpdateRecord={(id, updated) => {
                  updateRecord(id, updated);
                  showToast('Record updated successfully.');
                }}
                onDeleteRecord={(id) => {
                  deleteRecord(id);
                  showToast('Record deleted.');
                }}
                onUploadRecords={handleUploadRecords}
                onClearAll={handleClearAll}
                onOpenAddModal={handleOpenAddModal}
                onLoadSample={handleLoadSample}
                onSelectPage={setCurrentPage}
              />
            )}

            {/* 8. AI Copilot */}
            {currentPage === 'copilot' && (
              <AICopilot
                intelligence={intelligence}
                records={records}
                onSelectPage={setCurrentPage}
                onLoadSample={handleLoadSample}
              />
            )}

            {/* 9. Settings */}
            {currentPage === 'settings' && (
              <Settings
                records={records}
                onClearAll={handleClearAll}
                onLoadSample={handleLoadSample}
                onSelectPage={setCurrentPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Case Record Modal */}
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialData={editingRecord}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-xs font-mono text-cyan-200 shadow-2xl backdrop-blur-xl animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
