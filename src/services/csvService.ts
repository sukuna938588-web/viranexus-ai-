import Papa from 'papaparse';
import { OutbreakRecord, SeverityLevel, OutcomeStatus, GenderType } from '../types';

export function parseCSVFile(file: File): Promise<{
  records: OutbreakRecord[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const errors: string[] = [];
        const records: OutbreakRecord[] = [];

        if (!rows || rows.length === 0) {
          errors.push('The uploaded CSV file contains no data rows.');
          resolve({ records, errors });
          return;
        }

        rows.forEach((row, index) => {
          try {
            // Find fields with flexible case-insensitive matching
            const findKey = (candidates: string[]) => {
              for (const c of candidates) {
                const found = Object.keys(row).find(
                  (k) => k.trim().toLowerCase() === c.toLowerCase()
                );
                if (found && row[found] !== undefined && row[found] !== '') {
                  return String(row[found]).trim();
                }
              }
              return '';
            };

            const date = findKey(['date', 'incident_date', 'timestamp', 'reported_date', 'record_date']) ||
              new Date().toISOString().split('T')[0];

            const city = findKey(['city', 'town', 'municipality']);
            const state = findKey(['state', 'province']);
            const district = findKey(['district', 'county']);
            const region = findKey(['region', 'zone', 'area', 'location', 'sector']) || city || 'Sector-1 Central';

            const disease = findKey(['disease', 'pathogen', 'diagnosis', 'infection', 'virus', 'condition']) ||
              'Respiratory Pathogen X';

            const rawAge = findKey(['age', 'patient_age', 'years']);
            const parsedAge = parseInt(rawAge, 10);
            const age = isNaN(parsedAge) ? 35 : Math.max(0, Math.min(120, parsedAge));

            const rawGender = findKey(['gender', 'sex']).toLowerCase();
            let gender: GenderType = 'Undisclosed';
            if (rawGender.startsWith('m')) gender = 'Male';
            else if (rawGender.startsWith('f')) gender = 'Female';
            else if (rawGender.startsWith('o')) gender = 'Other';

            const rawSeverity = findKey(['severity', 'triage', 'severity_level', 'acuity']).toLowerCase();
            let severity: SeverityLevel = 'Moderate';
            if (rawSeverity.includes('crit')) severity = 'Critical';
            else if (rawSeverity.includes('sev')) severity = 'Severe';
            else if (rawSeverity.includes('mil')) severity = 'Mild';

            const rawHosp = findKey(['hospitalized', 'hospital_admitted', 'admitted', 'inpatient']).toLowerCase();
            const hospitalized = rawHosp === 'true' || rawHosp === 'yes' || rawHosp === '1' || severity === 'Critical';

            const rawICU = findKey(['icu', 'icu_admitted', 'intensive_care']).toLowerCase();
            const icu = rawICU === 'true' || rawICU === 'yes' || rawICU === '1' || (hospitalized && severity === 'Critical');

            const rawOutcome = findKey(['outcome', 'status', 'patient_status']).toLowerCase();
            let outcome: OutcomeStatus = 'Active';
            if (rawOutcome.includes('recov')) outcome = 'Recovered';
            else if (rawOutcome.includes('dec') || rawOutcome.includes('die') || rawOutcome.includes('fatal')) outcome = 'Deceased';

            const rawSymptoms = findKey(['symptoms', 'signs', 'manifestations', 'clinical_signs']);
            const symptoms = rawSymptoms
              ? rawSymptoms
                  .split(/[;,|/]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : ['Fever', 'Fatigue'];

            const notes = findKey(['notes', 'comments', 'remarks']);

            records.push({
              id: `rec-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
              date,
              city: city || undefined,
              state: state || undefined,
              district: district || undefined,
              region,
              disease,
              age,
              gender,
              severity,
              hospitalized,
              icu,
              outcome,
              symptoms,
              notes,
            });
          } catch (err: any) {
            errors.push(`Row ${index + 2}: Failed to parse record (${err.message})`);
          }
        });

        resolve({ records, errors });
      },
      error: (err) => {
        resolve({ records: [], errors: [err.message] });
      },
    });
  });
}

export function exportRecordsToCSV(records: OutbreakRecord[]): void {
  const exportData = records.map((r) => ({
    date: r.date,
    city: r.city || '',
    state: r.state || '',
    region: r.region,
    district: r.district || '',
    disease: r.disease,
    age: r.age,
    gender: r.gender,
    severity: r.severity,
    hospitalized: r.hospitalized ? 'Yes' : 'No',
    icu: r.icu ? 'Yes' : 'No',
    outcome: r.outcome,
    symptoms: r.symptoms.join('; '),
    notes: r.notes || '',
  }));

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `viranexus_epidemiology_dataset_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadEmptyTemplate(): void {
  const template = `date,city,state,region,district,disease,age,gender,severity,hospitalized,icu,outcome,symptoms,notes
2026-09-15,Madurai,Tamil Nadu,South Tamil Nadu,Madurai,Dengue,42,Female,Severe,Yes,No,Active,High Fever; Retro-orbital Pain; Rash,Platelets monitored
2026-09-16,Chennai,Tamil Nadu,North Tamil Nadu,Chennai,Influenza (Flu),28,Male,Moderate,No,No,Recovered,Fever; Cough; Sore Throat,Rapid test positive
2026-09-17,Bengaluru,Karnataka,South India,Bengaluru Urban,COVID-19,67,Female,Critical,Yes,Yes,Active,Fever; Dyspnea; Hypoxia,Oxygen support required
`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `viranexus_dataset_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
