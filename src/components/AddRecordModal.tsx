import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { OutbreakRecord, SeverityLevel, GenderType } from '../types';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OutbreakRecord, 'id'>) => void;
  initialData?: OutbreakRecord | null;
}

const COMMON_DISEASES = [
  'Dengue',
  'Influenza A',
  'Typhoid',
  'Chikungunya',
  'Cholera',
  'Malaria',
];

const COMMON_REGIONS = [
  'Chennai',
  'Chengalpattu',
  'Coimbatore',
  'Madurai',
  'Salem',
  'Tiruchirappalli',
  'Kanchipuram',
  'Tirunelveli',
  'Vellore',
];

const COMMON_SYMPTOMS = ['Fever', 'Headache', 'Cough', 'Vomiting', 'Body Pain'];

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [region, setRegion] = useState('Chennai');
  const [disease, setDisease] = useState('Dengue');
  const [age, setAge] = useState<number>(25);
  const [sex, setSex] = useState<GenderType>('Male');
  const [severity, setSeverity] = useState<SeverityLevel>('Moderate');
  const [symptoms, setSymptoms] = useState<string[]>(['Fever', 'Body Pain']);
  const [symptomInput, setSymptomInput] = useState('Fever, Body Pain');
  const [cases, setCases] = useState<number>(1);
  const [deaths, setDeaths] = useState<number>(0);
  const [recovered, setRecovered] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setRegion(initialData.region || initialData.district || 'Chennai');
      setDisease(initialData.disease || 'Dengue');
      setAge(initialData.age || 25);
      setSex(initialData.sex || 'Male');
      setSeverity(initialData.severity || 'Moderate');
      const syms = initialData.symptoms && initialData.symptoms.length > 0 ? initialData.symptoms : ['Fever', 'Body Pain'];
      setSymptoms(syms);
      setSymptomInput(syms.join(', '));
      setCases(initialData.cases || 1);
      setDeaths(initialData.deaths || 0);
      setRecovered(initialData.recovered || 0);
    } else if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setRegion('Chennai');
      setDisease('Dengue');
      setAge(25);
      setSex('Male');
      setSeverity('Moderate');
      setSymptoms(['Fever', 'Body Pain']);
      setSymptomInput('Fever, Body Pain');
      setCases(1);
      setDeaths(0);
      setRecovered(0);
      setError(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleSymptom = (sym: string) => {
    const updated = symptoms.includes(sym)
      ? symptoms.filter((s) => s !== sym)
      : [...symptoms, sym];
    setSymptoms(updated);
    setSymptomInput(updated.join(', '));
  };

  const handleSymptomInputChange = (val: string) => {
    setSymptomInput(val);
    const parsed = val.split(',').map((s) => s.trim()).filter(Boolean);
    setSymptoms(parsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!region.trim()) {
      setError('Please provide a Region / Zone.');
      return;
    }
    if (!disease.trim()) {
      setError('Please provide a Disease name.');
      return;
    }
    if (cases <= 0) {
      setError('Cases must be at least 1.');
      return;
    }

    let ageGroup = 'Adult (20-59)';
    if (age <= 12) ageGroup = 'Child (0-12)';
    else if (age <= 19) ageGroup = 'Teen (13-19)';
    else if (age >= 60) ageGroup = 'Senior (60+)';

    const finalSymptoms = symptoms.length > 0 ? symptoms : ['Fever', 'Body Pain'];

    onSave({
      date,
      region: region.trim(),
      district: region.trim(),
      disease: disease.trim(),
      age,
      ageGroup,
      sex,
      severity,
      symptoms: finalSymptoms,
      cases: Number(cases) || 1,
      deaths: Number(deaths) || 0,
      recovered: Number(recovered) || 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#090d1a] border border-cyan-500/30 p-6 sm:p-7 shadow-2xl text-slate-100 my-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-lg font-black text-white font-mono tracking-wide">
                {initialData ? 'Edit Surveillance Record' : 'Manual Dataset Record Entry'}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Standard 10-Column OutbreakX Schema: Date, Region / Zone, Disease, Age / Sex, Severity, Symptoms, Cases, Deaths, Recovered
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-mono">
          {/* Row 1: Date & Region / Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">1. Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">2. Region / Zone</label>
              <input
                type="text"
                list="region-presets"
                placeholder="e.g. Chennai, Madurai"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
                required
              />
              <datalist id="region-presets">
                {COMMON_REGIONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 2: Disease & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">3. Disease</label>
              <input
                type="text"
                list="disease-presets"
                placeholder="e.g. Dengue, Influenza A"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
                required
              />
              <datalist id="disease-presets">
                {COMMON_DISEASES.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">5. Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="Normal">Normal</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Row 3: Age & Sex (Age / Sex) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[#060914] border border-slate-800/80">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold">4a. Age (Years)</label>
                <span className="text-[10px] text-cyan-400">Example: 25, 42, 12</span>
              </div>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(Number(e.target.value) || 25)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">4b. Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as GenderType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Formatted as: <strong className="text-cyan-300">{age} / {sex}</strong>
              </span>
            </div>
          </div>

          {/* Row 4: Symptoms with Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-bold">6. Symptoms (Multiple supported)</label>
              <span className="text-[10px] text-slate-500">Click to toggle common symptom</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_SYMPTOMS.map((sym) => {
                const active = symptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] transition font-medium ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
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
              value={symptomInput}
              onChange={(e) => handleSymptomInputChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Row 5: Cases, Deaths, Recovered */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">7. Cases</label>
              <input
                type="number"
                min="1"
                value={cases}
                onChange={(e) => setCases(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">8. Deaths</label>
              <input
                type="number"
                min="0"
                value={deaths}
                onChange={(e) => setDeaths(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">9. Recovered</label>
              <input
                type="number"
                min="0"
                value={recovered}
                onChange={(e) => setRecovered(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-mono transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-mono shadow-lg shadow-cyan-500/25 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{initialData ? 'Update Record' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
