import { useState, useEffect, useMemo, useCallback } from 'react';
import { OutbreakRecord, EpidemiologicalIntelligence } from '../types';
import { calculateEpidemiologicalIntelligence } from '../services/dataScience';

// Storage key with clean slate: NEVER load any previous default or demo datasets
const STORAGE_KEY = 'viranexus_outbreak_records_clean_v2';

export function useOutbreakData() {
  // STRICT NO DEFAULT DATA POLICY: Starts at strictly 0 records on initial launch
  const [records, setRecords] = useState<OutbreakRecord[]>(() => {
    try {
      // Clean up legacy test storage keys if present
      localStorage.removeItem('viranexus_outbreak_records_v1');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load stored records:', e);
    }
    return [];
  });

  const [filterDisease, setFilterDisease] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [records]);

  // Filtered records for targeted exploration
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterDisease !== 'All' && r.disease !== filterDisease) return false;
      if (filterRegion !== 'All' && r.region !== filterRegion) return false;
      if (filterSeverity !== 'All' && r.severity !== filterSeverity) return false;
      return true;
    });
  }, [records, filterDisease, filterRegion, filterSeverity]);

  // Memoized comprehensive epidemiological intelligence
  const intelligence: EpidemiologicalIntelligence = useMemo(() => {
    return calculateEpidemiologicalIntelligence(filteredRecords);
  }, [filteredRecords]);

  // Overall intelligence (unfiltered) for executive metrics
  const totalIntelligence: EpidemiologicalIntelligence = useMemo(() => {
    return calculateEpidemiologicalIntelligence(records);
  }, [records]);

  // Add Record
  const addRecord = useCallback((newRecordData: Omit<OutbreakRecord, 'id'>) => {
    const newRecord: OutbreakRecord = {
      ...newRecordData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setRecords((prev) => [newRecord, ...prev]);
  }, []);

  // Update Record
  const updateRecord = useCallback((id: string, updatedFields: Partial<OutbreakRecord>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
    );
  }, []);

  // Delete Record
  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Bulk Upload (Append or Replace)
  const uploadRecords = useCallback(
    (newRecords: OutbreakRecord[], mode: 'append' | 'replace' = 'replace') => {
      setIsLoading(true);
      setTimeout(() => {
        if (mode === 'replace') {
          setRecords(newRecords);
        } else {
          setRecords((prev) => [...newRecords, ...prev]);
        }
        setIsLoading(false);
      }, 300);
    },
    []
  );

  // Clear All Records (Restores empty state)
  const clearAllRecords = useCallback(() => {
    setRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('viranexus_chat_history');
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Unique lists for filters
  const uniqueDiseases = useMemo(() => {
    const set = new Set(records.map((r) => r.disease).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const uniqueRegions = useMemo(() => {
    const set = new Set(records.map((r) => r.region).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  return {
    records,
    filteredRecords,
    intelligence,
    totalIntelligence,
    filterDisease,
    filterRegion,
    filterSeverity,
    setFilterDisease,
    setFilterRegion,
    setFilterSeverity,
    uniqueDiseases,
    uniqueRegions,
    isLoading,
    addRecord,
    updateRecord,
    deleteRecord,
    uploadRecords,
    clearAllRecords,
  };
}
