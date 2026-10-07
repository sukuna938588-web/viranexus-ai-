import Papa from 'papaparse';
import { OutbreakRecord, SeverityLevel, GenderType } from '../types';

export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Chengalpattu: { lat: 12.6819, lng: 79.9888 },
  Kanchipuram: { lat: 12.8342, lng: 79.7036 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Salem: { lat: 11.6643, lng: 78.1460 },
  Tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  Trichy: { lat: 10.7905, lng: 78.7047 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Thanjavur: { lat: 10.7870, lng: 79.1378 },
  Erode: { lat: 11.3410, lng: 77.7172 },
  Tiruppur: { lat: 11.1085, lng: 77.3411 },
  Dindigul: { lat: 10.3673, lng: 77.9803 },
  Cuddalore: { lat: 11.7480, lng: 79.7714 },
  Kanyakumari: { lat: 8.0883, lng: 77.5385 },
  Nagapattinam: { lat: 10.7672, lng: 79.8449 },
  Villupuram: { lat: 11.9401, lng: 79.4861 },
  Dharmapuri: { lat: 12.1211, lng: 78.1582 },
  Krishnagiri: { lat: 12.5186, lng: 78.2137 },
  Namakkal: { lat: 11.2189, lng: 78.1674 },
  Karur: { lat: 10.9601, lng: 78.0766 },
  Pudukkottai: { lat: 10.3797, lng: 78.8208 },
  Sivaganga: { lat: 9.8433, lng: 78.4809 },
  Virudhunagar: { lat: 9.5680, lng: 77.9624 },
  Ramanathapuram: { lat: 9.3639, lng: 78.8395 },
  Theni: { lat: 10.0104, lng: 77.4768 },
  Thoothukudi: { lat: 8.7642, lng: 78.1348 },
  Nilgiris: { lat: 11.4102, lng: 76.6950 },
  Ooty: { lat: 11.4102, lng: 76.6950 },
  Tiruvannamalai: { lat: 12.2253, lng: 79.0747 },
  Ranipet: { lat: 12.9272, lng: 79.3330 },
  Tirupattur: { lat: 12.4958, lng: 78.5678 },
  Tenkasi: { lat: 8.9594, lng: 77.3152 },
  Kallakurichi: { lat: 11.7383, lng: 78.9639 },
  Mayiladuthurai: { lat: 11.1075, lng: 79.6523 },
  Ariyalur: { lat: 11.1401, lng: 79.0786 },
  Perambalur: { lat: 11.2342, lng: 78.8820 },
  Tiruvarur: { lat: 10.7725, lng: 79.6365 },
};

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

            const date = findKey(['date', 'incident_date', 'timestamp', 'reported_date']) ||
              new Date().toISOString().split('T')[0];

            const region = findKey(['region / zone', 'region', 'zone', 'district', 'location', 'city', 'area']) ||
              'Chennai';

            const disease = findKey(['disease', 'pathogen', 'infection', 'diagnosis', 'condition']) ||
              'Dengue';

            // Coordinates if provided or fallback to dictionary
            let latitude: number | undefined = undefined;
            let longitude: number | undefined = undefined;
            const rawLat = parseFloat(findKey(['latitude', 'lat', 'gps_latitude']));
            const rawLng = parseFloat(findKey(['longitude', 'lng', 'lon', 'long', 'gps_longitude']));
            if (!isNaN(rawLat) && !isNaN(rawLng)) {
              latitude = rawLat;
              longitude = rawLng;
            } else {
              const matchedCoord = DISTRICT_COORDINATES[region] || 
                Object.entries(DISTRICT_COORDINATES).find(([k]) => k.toLowerCase() === region.toLowerCase())?.[1];
              if (matchedCoord) {
                latitude = matchedCoord.lat;
                longitude = matchedCoord.lng;
              }
            }

            // Age & Sex / Combined "Age / Sex" (e.g. "25 / Male")
            let age = 28;
            let sex: GenderType = 'Male';
            const rawAgeSex = findKey(['age / sex', 'age/sex', 'age_sex', 'demographics']);
            if (rawAgeSex) {
              const parts = rawAgeSex.split(/[/,]/).map((p) => p.trim());
              if (parts.length >= 1) {
                const parsedAge = parseInt(parts[0], 10);
                if (!isNaN(parsedAge)) age = parsedAge;
              }
              if (parts.length >= 2) {
                const s = parts[1].toLowerCase();
                if (s.startsWith('f')) sex = 'Female';
                else if (s.startsWith('o')) sex = 'Other';
                else sex = 'Male';
              }
            } else {
              const rawAge = parseInt(findKey(['age', 'years']), 10);
              if (!isNaN(rawAge)) age = rawAge;
              const rawSex = findKey(['sex', 'gender']).toLowerCase();
              if (rawSex.startsWith('f')) sex = 'Female';
              else if (rawSex.startsWith('o')) sex = 'Other';
            }

            let ageGroup = 'Adult (20-59)';
            if (age <= 12) ageGroup = 'Child (0-12)';
            else if (age <= 19) ageGroup = 'Teen (13-19)';
            else if (age >= 60) ageGroup = 'Senior (60+)';

            // Severity: Normal, Moderate, Severe, Critical
            const rawSeverity = findKey(['severity', 'severity_level', 'triage', 'acuity']).toLowerCase();
            let severity: SeverityLevel = 'Moderate';
            if (rawSeverity.includes('crit')) severity = 'Critical';
            else if (rawSeverity.includes('sev')) severity = 'Severe';
            else if (rawSeverity.includes('norm') || rawSeverity.includes('mild')) severity = 'Normal';
            else severity = 'Moderate';

            // Symptoms (e.g. Fever, Headache, Cough, Vomiting, Body Pain)
            const rawSymptoms = findKey(['symptoms', 'clinical_signs', 'signs']);
            const symptoms = rawSymptoms
              ? rawSymptoms.split(/[,;|/]/).map((s) => s.trim()).filter(Boolean)
              : ['Fever', 'Body Pain'];

            // Numbers: Cases, Deaths, Recovered
            const rawCases = findKey(['cases', 'case_count', 'confirmed', 'count']);
            const parsedCases = parseInt(rawCases, 10);
            const cases = isNaN(parsedCases) || parsedCases <= 0 ? 1 : parsedCases;

            const rawDeaths = findKey(['deaths', 'fatalities', 'deceased']);
            const deaths = rawDeaths ? parseInt(rawDeaths, 10) || 0 : 0;

            const rawRecovered = findKey(['recovered', 'discharged', 'cured']);
            const recovered = rawRecovered ? parseInt(rawRecovered, 10) || 0 : 0;

            records.push({
              id: `rec-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
              date,
              region,
              district: region,
              latitude,
              longitude,
              disease,
              age,
              ageGroup,
              sex,
              severity,
              symptoms,
              cases,
              deaths,
              recovered,
            });
          } catch (err: any) {
            errors.push(`Row ${index + 1}: ${err?.message || 'Invalid row syntax'}`);
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

export function exportRecordsToCSV(records: OutbreakRecord[], filename = 'outbreakx_surveillance_export.csv'): void {
  const headers = ['Date', 'Region / Zone', 'Disease', 'Age', 'Sex', 'Severity', 'Symptoms', 'Cases', 'Deaths', 'Recovered', 'Latitude', 'Longitude'];
  const rows = records.map((r) => [
    r.date,
    `"${r.region || r.district || 'Metropolitan'}"`,
    `"${r.disease}"`,
    r.age || (r.ageGroup ? (parseInt(r.ageGroup.replace(/\D/g, ''), 10) || 28) : 28),
    r.sex || 'Male',
    r.severity,
    `"${(r.symptoms || []).join(', ')}"`,
    r.cases,
    r.deaths || 0,
    r.recovered || 0,
    r.latitude || '',
    r.longitude || '',
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadEmptyTemplate(): void {
  const headers = 'Date,Region / Zone,Disease,Age,Sex,Severity,Symptoms,Cases,Deaths,Recovered,Latitude,Longitude\n';
  const sampleRows = [
    '2026-09-25,Chennai,Dengue,25,Male,Severe,"Fever, Headache, Body Pain",68,2,42,13.0827,80.2707',
    '2026-09-26,Chengalpattu,Dengue,42,Female,Moderate,"Fever, Headache",34,0,20,12.6819,79.9888',
    '2026-09-27,Madurai,Influenza A,65,Male,Critical,"Cough, Fever, Body Pain",41,1,26,9.9252,78.1198',
    '2026-09-28,Coimbatore,Typhoid,12,Male,Normal,"Fever, Vomiting, Body Pain",25,0,16,11.0168,76.9558',
    '2026-09-29,Salem,Chikungunya,38,Female,Moderate,"Body Pain, Fever, Headache",19,0,12,11.6643,78.1460',
  ].join('\n');

  const csvContent = headers + sampleRows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'outbreakx_surveillance_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getTamilNaduSampleDataset(): OutbreakRecord[] {
  const samples = [
    { date: '2026-09-18', region: 'Chennai', disease: 'Dengue', age: 25, ageGroup: 'Adult (20-59)', sex: 'Male' as GenderType, severity: 'Severe' as SeverityLevel, symptoms: ['Fever', 'Body Pain', 'Headache'], cases: 38, deaths: 1, recovered: 24, lat: 13.0827, lng: 80.2707 },
    { date: '2026-09-19', region: 'Chennai', disease: 'Dengue', age: 12, ageGroup: 'Child (0-12)', sex: 'Female' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Fever', 'Vomiting'], cases: 46, deaths: 0, recovered: 30, lat: 13.0450, lng: 80.2400 },
    { date: '2026-09-20', region: 'Chengalpattu', disease: 'Dengue', age: 16, ageGroup: 'Teen (13-19)', sex: 'Male' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Fever', 'Headache'], cases: 28, deaths: 0, recovered: 18, lat: 12.6819, lng: 79.9888 },
    { date: '2026-09-21', region: 'Kanchipuram', disease: 'Dengue', age: 42, ageGroup: 'Adult (20-59)', sex: 'Female' as GenderType, severity: 'Normal' as SeverityLevel, symptoms: ['Fever', 'Body Pain'], cases: 22, deaths: 0, recovered: 14, lat: 12.8342, lng: 79.7036 },
    { date: '2026-09-21', region: 'Chennai', disease: 'Dengue', age: 68, ageGroup: 'Senior (60+)', sex: 'Male' as GenderType, severity: 'Critical' as SeverityLevel, symptoms: ['Fever', 'Body Pain', 'Vomiting'], cases: 54, deaths: 1, recovered: 32, lat: 13.0900, lng: 80.2100 },
    { date: '2026-09-22', region: 'Madurai', disease: 'Influenza A', age: 35, ageGroup: 'Adult (20-59)', sex: 'Female' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Cough', 'Fever', 'Body Pain'], cases: 32, deaths: 0, recovered: 22, lat: 9.9252, lng: 78.1198 },
    { date: '2026-09-23', region: 'Coimbatore', disease: 'Typhoid', age: 29, ageGroup: 'Adult (20-59)', sex: 'Male' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Fever', 'Vomiting', 'Body Pain'], cases: 25, deaths: 0, recovered: 16, lat: 11.0168, lng: 76.9558 },
    { date: '2026-09-23', region: 'Salem', disease: 'Chikungunya', age: 38, ageGroup: 'Adult (20-59)', sex: 'Female' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Body Pain', 'Fever'], cases: 19, deaths: 0, recovered: 12, lat: 11.6643, lng: 78.1460 },
    { date: '2026-09-24', region: 'Tiruchirappalli', disease: 'Dengue', age: 10, ageGroup: 'Child (0-12)', sex: 'Male' as GenderType, severity: 'Severe' as SeverityLevel, symptoms: ['Fever', 'Headache', 'Vomiting'], cases: 27, deaths: 1, recovered: 18, lat: 10.7905, lng: 78.7047 },
    { date: '2026-09-25', region: 'Chennai', disease: 'Dengue', age: 42, ageGroup: 'Adult (20-59)', sex: 'Female' as GenderType, severity: 'Critical' as SeverityLevel, symptoms: ['Fever', 'Body Pain', 'Headache'], cases: 68, deaths: 2, recovered: 42, lat: 13.0200, lng: 80.2000 },
    { date: '2026-09-25', region: 'Chengalpattu', disease: 'Dengue', age: 18, ageGroup: 'Teen (13-19)', sex: 'Male' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Fever', 'Body Pain'], cases: 34, deaths: 0, recovered: 20, lat: 12.7000, lng: 80.0100 },
    { date: '2026-09-26', region: 'Madurai', disease: 'Influenza A', age: 65, ageGroup: 'Senior (60+)', sex: 'Male' as GenderType, severity: 'Severe' as SeverityLevel, symptoms: ['Cough', 'Fever', 'Body Pain'], cases: 41, deaths: 0, recovered: 26, lat: 9.9400, lng: 78.1400 },
    { date: '2026-09-27', region: 'Vellore', disease: 'Influenza A', age: 31, ageGroup: 'Adult (20-59)', sex: 'Female' as GenderType, severity: 'Normal' as SeverityLevel, symptoms: ['Cough', 'Fever'], cases: 23, deaths: 0, recovered: 15, lat: 12.9165, lng: 79.1325 },
    { date: '2026-09-28', region: 'Tirunelveli', disease: 'Dengue', age: 27, ageGroup: 'Adult (20-59)', sex: 'Male' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Fever', 'Headache'], cases: 20, deaths: 0, recovered: 13, lat: 8.7139, lng: 77.7567 },
    { date: '2026-09-29', region: 'Chennai', disease: 'Dengue', age: 25, ageGroup: 'Adult (20-59)', sex: 'Male' as GenderType, severity: 'Severe' as SeverityLevel, symptoms: ['Fever', 'Body Pain', 'Headache'], cases: 75, deaths: 1, recovered: 48, lat: 13.0600, lng: 80.2500 },
    { date: '2026-09-30', region: 'Coimbatore', disease: 'Typhoid', age: 14, ageGroup: 'Teen (13-19)', sex: 'Female' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Fever', 'Vomiting'], cases: 29, deaths: 0, recovered: 19, lat: 11.0300, lng: 76.9800 },
    { date: '2026-10-01', region: 'Kanchipuram', disease: 'Dengue', age: 8, ageGroup: 'Child (0-12)', sex: 'Male' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Fever', 'Vomiting'], cases: 31, deaths: 0, recovered: 21, lat: 12.8500, lng: 79.7200 },
    { date: '2026-10-02', region: 'Madurai', disease: 'Influenza A', age: 72, ageGroup: 'Senior (60+)', sex: 'Female' as GenderType, severity: 'Critical' as SeverityLevel, symptoms: ['Cough', 'Fever', 'Body Pain'], cases: 48, deaths: 1, recovered: 29, lat: 9.9100, lng: 78.1000 },
    { date: '2026-10-03', region: 'Salem', disease: 'Chikungunya', age: 45, ageGroup: 'Adult (20-59)', sex: 'Male' as GenderType, severity: 'Moderate' as SeverityLevel, symptoms: ['Body Pain', 'Fever'], cases: 24, deaths: 0, recovered: 16, lat: 11.6800, lng: 78.1600 },
    { date: '2026-10-04', region: 'Chennai', disease: 'Dengue', age: 33, ageGroup: 'Adult (20-59)', sex: 'Female' as GenderType, severity: 'Critical' as SeverityLevel, symptoms: ['Fever', 'Body Pain', 'Headache'], cases: 88, deaths: 2, recovered: 55, lat: 13.0750, lng: 80.2200 },
  ];

  return samples.map((s, idx) => ({
    id: `tn-sample-${idx}-${Date.now()}`,
    date: s.date,
    region: s.region,
    district: s.region,
    latitude: s.lat,
    longitude: s.lng,
    disease: s.disease,
    age: s.age,
    ageGroup: s.ageGroup,
    sex: s.sex,
    severity: s.severity,
    symptoms: s.symptoms,
    cases: s.cases,
    deaths: s.deaths,
    recovered: s.recovered,
  }));
}
