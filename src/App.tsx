import React, { useState } from 'react';
import { ActivePage, OutbreakRecord } from './types';
import { useOutbreakData } from './hooks/useOutbreakData';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ParticleBackground } from './components/ParticleBackground';
import { AddRecordModal } from './components/AddRecordModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { DiseaseIntelligence } from './pages/DiseaseIntelligence';
import { OutbreakHeatmap } from './pages/OutbreakHeatmap';
import { ForecastCenter } from './pages/ForecastCenter';
import { PopulationAnalytics } from './pages/PopulationAnalytics';
import { HospitalIntelligence } from './pages/HospitalIntelligence';
import { AICommandCenter } from './pages/AICommandCenter';
import { DatasetManagement } from './pages/DatasetManagement';
import { HealthThreatRadar } from './components/HealthThreatRadar';
import { LiveAlertCenter } from './components/LiveAlertCenter';
import { RealTimeAnalyticsDashboard } from './components/analytics/RealTimeAnalyticsDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<ActivePage>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OutbreakRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    records,
    intelligence,
    totalIntelligence,
    addRecord,
    updateRecord,
    deleteRecord,
    uploadRecords,
    clearAllRecords,
  } = useOutbreakData();

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (record: OutbreakRecord) => {
    setEditingRecord(record);
    setIsAddModalOpen(true);
  };

  const handleSaveRecord = (recordData: Omit<OutbreakRecord, 'id'>) => {
    if (editingRecord) {
      updateRecord(editingRecord.id, recordData);
      showToast(`Updated record: ${recordData.disease} (${recordData.region})`);
    } else {
      addRecord(recordData);
      showToast(`Indexed new case: ${recordData.disease} (${recordData.region})`);
    }
  };

  const handleUploadRecords = (newRecords: OutbreakRecord[], mode: 'append' | 'replace') => {
    uploadRecords(newRecords, mode);
    showToast(`Indexed ${newRecords.length} outbreak cases successfully.`);
  };

  const handleClearAll = () => {
    clearAllRecords();
    showToast('Surveillance dataset cleared. Restored empty state.');
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
        healthScore={totalIntelligence.communityHealthScore}
        activeAlerts={totalIntelligence.activeAlertsCount}
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
          activeAlerts={totalIntelligence.activeAlertsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 lg:pl-72 transition-all">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'landing' && (
              <LandingPage
                onSelectPage={setCurrentPage}
                intelligence={totalIntelligence}
                totalRecords={records.length}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'dashboard' && (
              <ExecutiveDashboard
                intelligence={totalIntelligence}
                totalRecords={records.length}
                onSelectPage={setCurrentPage}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'analytics-dashboard' && (
              <RealTimeAnalyticsDashboard
                records={records}
                intelligence={totalIntelligence}
                onSelectPage={setCurrentPage}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'disease-intelligence' && (
              <DiseaseIntelligence
                intelligence={totalIntelligence}
                records={records}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'outbreak-heatmap' && (
              <OutbreakHeatmap
                intelligence={totalIntelligence}
                records={records}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'forecast-center' && (
              <ForecastCenter
                intelligence={totalIntelligence}
                records={records}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'population-analytics' && (
              <PopulationAnalytics
                intelligence={totalIntelligence}
                records={records}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'hospital-intelligence' && (
              <HospitalIntelligence
                intelligence={totalIntelligence}
                records={records}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'ai-command-center' && (
              <AICommandCenter
                intelligence={totalIntelligence}
                records={records}
                onUploadRecords={handleUploadRecords}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'alert-center' && (
              <LiveAlertCenter
                intelligence={totalIntelligence}
                totalRecords={records.length}
                onSelectPage={setCurrentPage}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {currentPage === 'threat-radar' && (
              <HealthThreatRadar
                intelligence={totalIntelligence}
                records={records}
                onOpenAddModal={handleOpenAddModal}
                onSelectPage={setCurrentPage}
              />
            )}

            {currentPage === 'dataset-management' && (
              <DatasetManagement
                records={records}
                onAddRecord={addRecord}
                onUpdateRecord={updateRecord}
                onDeleteRecord={(id) => {
                  deleteRecord(id);
                  showToast('Record removed.');
                }}
                onUploadRecords={handleUploadRecords}
                onClearAllRecords={handleClearAll}
                onOpenAddModal={handleOpenAddModal}
                onOpenEditModal={handleOpenEditModal}
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
