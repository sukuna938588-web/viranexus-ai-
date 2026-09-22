import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Activity,
  MapPin,
  Calendar,
  Navigation,
  CloudSun,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Crosshair,
  Globe,
} from 'lucide-react';
import { OutbreakRecord, SeverityLevel, GenderType } from '../types';
import {
  resolveSmartLocation,
  searchLocations,
  detectUserCurrentLocationWithDetails,
  SmartLocation,
  GeolocationDetectionResult,
} from '../services/locationService';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OutbreakRecord, 'id'>) => void;
  initialData?: OutbreakRecord | null;
}

const COMMON_DISEASES = [
  'Dengue',
  'Malaria',
  'Influenza (Flu)',
  'COVID-19',
  'Cholera',
  'Typhoid',
  'Respiratory RSV',
  'Zika',
];

const AGE_GROUPS = [
  { label: 'Child (0–12)', range: '0-12', defaultAge: 8 },
  { label: 'Teen (13–19)', range: '13-19', defaultAge: 16 },
  { label: 'Adult (20–59)', range: '20-59', defaultAge: 35 },
  { label: 'Senior (60+)', range: '60+', defaultAge: 68 },
];

const WEATHER_OPTIONS = [
  { label: 'Sunny / Hot', icon: '☀️' },
  { label: 'Rainy / Monsoon', icon: '🌧️' },
  { label: 'Humid', icon: '💧' },
  { label: 'Cold / Winter', icon: '❄️' },
  { label: 'Stormy', icon: '⛈️' },
];

const POPULAR_HUBS = [
  { name: 'Madurai', state: 'Tamil Nadu' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'London', state: 'England' },
  { name: 'San Francisco', state: 'California' },
];

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  // Step navigation (1: Disease & Cases -> 2: Date & Location -> 3: Patient & Weather)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields - Step 1
  const [disease, setDisease] = useState(initialData?.disease || '');
  const [customDisease, setCustomDisease] = useState('');
  const [cases, setCases] = useState<number>(initialData?.cases || 1);

  // Form Fields - Step 2 (Date & Smart Location)
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  );
  const [city, setCity] = useState(initialData?.city || initialData?.region || '');
  const [state, setState] = useState(initialData?.state || '');
  const [region, setRegion] = useState(initialData?.region || '');
  const [district, setDistrict] = useState(initialData?.district || '');

  // Smart Location & Geolocation state
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsMetadata, setGpsMetadata] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    source?: string;
  } | null>(null);
  const [gpsFeedback, setGpsFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [locationSuggestions, setLocationSuggestions] = useState<SmartLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Patient & Environment Fields - Step 3
  const [ageGroup, setAgeGroup] = useState<string>(
    initialData?.ageGroup || 'Adult (20–59)'
  );
  const [gender, setGender] = useState<GenderType>(initialData?.gender || 'Male');
  const [weather, setWeather] = useState<string>(
    initialData?.weather || 'Sunny / Hot'
  );
  const [severity, setSeverity] = useState<SeverityLevel>(
    initialData?.severity || 'Moderate'
  );

  const [error, setError] = useState('');
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize state when initialData or modal open status changes
  useEffect(() => {
    if (initialData) {
      setDisease(initialData.disease || '');
      setCustomDisease('');
      setCases(initialData.cases || 1);
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setCity(initialData.city || initialData.region || '');
      setState(initialData.state || '');
      setRegion(initialData.region || '');
      setDistrict(initialData.district || '');
      setAgeGroup(initialData.ageGroup || 'Adult (20–59)');
      setGender(initialData.gender || 'Male');
      setWeather(initialData.weather || 'Sunny / Hot');
      setSeverity(initialData.severity || 'Moderate');
      setGpsMetadata(null);
      setGpsFeedback(null);
    } else if (isOpen) {
      // Default initial states for fresh record
      setDisease('');
      setCustomDisease('');
      setCases(1);
      setDate(new Date().toISOString().split('T')[0]);
      setCity('');
      setState('');
      setRegion('');
      setDistrict('');
      setGpsMetadata(null);
      setGpsFeedback(null);
    }
    setCurrentStep(1);
    setError('');
  }, [initialData, isOpen]);

  // Click outside to close location suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  /**
   * Smart Location Auto-Fill via Geolocation API and OpenStreetMap Nominatim
   */
  const handleAutoDetectLocation = async () => {
    setIsDetectingGPS(true);
    setError('');
    setGpsFeedback({
      type: 'info',
      message: 'Fetching coordinates from device Geolocation API...',
    });

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setIsDetectingGPS(false);
      setGpsFeedback({
        type: 'error',
        message: 'Geolocation is not supported by your browser environment.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsMetadata({
          latitude,
          longitude,
          accuracy: accuracy ? Math.round(accuracy) : undefined,
          source: 'GPS Geolocation API',
        });

        setGpsFeedback({
          type: 'info',
          message: 'Resolving coordinates via OpenStreetMap Nominatim...',
        });

        try {
          const result: GeolocationDetectionResult = await detectUserCurrentLocationWithDetails();

          if (result.success && result.location) {
            const loc = result.location;
            setCity(loc.city);
            setState(loc.state);
            setRegion(loc.region);
            setDistrict(loc.district);
            setGpsFeedback({
              type: 'success',
              message: `Location Detected: ${loc.city}, ${loc.state} (${loc.region})`,
            });
          } else {
            setGpsFeedback({
              type: 'error',
              message:
                result.error ||
                'Could not reverse-geocode coordinates. You can enter your location manually below.',
            });
            if (result.location) {
              setCity(result.location.city);
              setState(result.location.state);
              setRegion(result.location.region);
              setDistrict(result.location.district);
            }
          }
        } catch {
          setGpsFeedback({
            type: 'error',
            message: 'Reverse geocoding request failed. Please check network connection.',
          });
        } finally {
          setIsDetectingGPS(false);
        }
      },
      (geoError) => {
        setIsDetectingGPS(false);
        let msg = 'Could not access device location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please enable browser location permissions or type below.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          msg = 'Location unavailable from device sensors. You can enter manually below.';
        } else if (geoError.code === geoError.TIMEOUT) {
          msg = 'Geolocation request timed out. Please try again or enter manually below.';
        }
        setGpsFeedback({
          type: 'error',
          message: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  /**
   * City input handler with live auto-inference of State & Region
   */
  const handleCityChange = (newVal: string) => {
    setCity(newVal);
    setError('');

    if (newVal.trim()) {
      const suggestions = searchLocations(newVal);
      setLocationSuggestions(suggestions);
      setShowSuggestions(true);

      // Auto-infer state, region, and district dynamically as the user types
      const resolved = resolveSmartLocation(newVal);
      if (resolved.state && resolved.state !== 'Local State' && !state) {
        setState(resolved.state);
      }
      if (resolved.region && resolved.region !== 'Central Sector' && !region) {
        setRegion(resolved.region);
      }
      if (resolved.district && resolved.district !== 'Unassigned District' && !district) {
        setDistrict(resolved.district);
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  /**
   * Applying suggestion from autocomplete
   */
  const handleSelectSuggestion = (loc: SmartLocation) => {
    setCity(loc.city);
    setState(loc.state);
    setRegion(loc.region);
    setDistrict(loc.district);
    setShowSuggestions(false);
    setGpsFeedback({
      type: 'success',
      message: `Auto-filled: ${loc.city}, ${loc.state} • ${loc.region}`,
    });
  };

  /**
   * Quick Preset Selection
   */
  const handleSelectPreset = (name: string) => {
    const resolved = resolveSmartLocation(name);
    setCity(resolved.city);
    setState(resolved.state);
    setRegion(resolved.region);
    setDistrict(resolved.district);
    setGpsFeedback({
      type: 'success',
      message: `Selected hub: ${resolved.city}, ${resolved.state}`,
    });
    setError('');
  };

  const validateStep1 = () => {
    const finalDisease = customDisease.trim() || disease.trim();
    if (!finalDisease) {
      setError('Please select or type a disease name.');
      return false;
    }
    if (cases < 1) {
      setError('Number of cases must be at least 1.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!city.trim() && !region.trim()) {
      setError('Please auto-detect via Smart Location (GPS) or enter your City/Region.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDisease = customDisease.trim() || disease.trim();
    if (!finalDisease) {
      setError('Please specify the disease name.');
      setCurrentStep(1);
      return;
    }
    if (!city.trim() && !region.trim()) {
      setError('Please specify the City or Region.');
      setCurrentStep(2);
      return;
    }

    const selectedCohort = AGE_GROUPS.find((g) => g.label === ageGroup);
    const approxAge = selectedCohort ? selectedCohort.defaultAge : 30;

    const finalCity = city.trim();
    const finalState = state.trim();
    const finalRegion = region.trim() || (finalCity ? `${finalCity} Surveillance Region` : 'Central Sector');
    const finalDistrict = district.trim() || (finalCity ? `${finalCity} District` : '');

    onSave({
      date,
      city: finalCity,
      region: finalRegion,
      district: finalDistrict,
      state: finalState,
      disease: finalDisease,
      cases: Number(cases) || 1,
      age: approxAge,
      ageGroup,
      gender,
      severity,
      weather,
      hospitalized: severity === 'Severe' || severity === 'Critical',
      icu: severity === 'Critical',
      outcome: 'Active',
      symptoms: ['Fever', 'Fatigue'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0b0e1a] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl text-slate-100 my-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {initialData ? 'Edit Health Record' : 'Add Outbreak Record'}
            </h3>
            <p className="text-xs text-slate-400">
              Epidemiological surveillance reporting with GPS Smart Location auto-fill
            </p>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between gap-2 mb-6 p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-mono transition ${
              currentStep === 1
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-cyan-500/30 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Disease & Cases</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-mono transition ${
              currentStep === 2
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-cyan-500/30 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Smart Location</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-mono transition ${
              currentStep === 3
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-cyan-500/30 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Patient & Weather</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: DISEASE & NUMBER OF CASES */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Disease Name
                </label>
                {/* Common Disease Quick Select Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_DISEASES.map((dis) => (
                    <button
                      key={dis}
                      type="button"
                      onClick={() => {
                        setDisease(dis);
                        setCustomDisease('');
                        setError('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        disease === dis && !customDisease
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {dis}
                    </button>
                  ))}
                </div>

                {/* Custom Disease Input */}
                <input
                  type="text"
                  placeholder="Or type custom disease (e.g., Nipah Virus, Monkeypox)..."
                  value={customDisease}
                  onChange={(e) => {
                    setCustomDisease(e.target.value);
                    if (e.target.value) setDisease(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Number of Cases */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Number of Cases
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCases((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white text-lg font-bold hover:bg-slate-800 transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cases}
                    onChange={(e) => setCases(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCases((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-white text-lg font-bold hover:bg-slate-800 transition"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400 font-mono">
                    {cases === 1 ? 'Single patient record' : `Batch entry of ${cases} patient cases`}
                  </span>
                </div>
              </div>

              {/* Quick Location Detection shortcut banner in Step 1 */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-semibold text-slate-300">
                      {city ? `Location: ${city}, ${state}` : 'Location: Not detected yet'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {region ? `Region: ${region}` : 'Auto-fill city, state & region with GPS'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    handleAutoDetectLocation();
                  }}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-medium transition active:scale-95"
                >
                  <Navigation className="w-3 h-3 text-cyan-400 fill-cyan-400/30" />
                  <span>Detect Location</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & SMART LOCATION FEATURE (GEOLOCATION API AUTO-FILL) */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* Incident Date Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Incident Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* SMART LOCATION GPS ACTION CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-purple-950/30 border border-cyan-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Crosshair className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <span>Smart Location Engine</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                          OpenStreetMap Nominatim
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Auto-fill your current City, State, and Region using device coordinates
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary Detect Location Button */}
                <button
                  type="button"
                  id="detect-location-btn"
                  onClick={handleAutoDetectLocation}
                  disabled={isDetectingGPS}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-bold font-mono transition shadow-lg shadow-cyan-500/25 active:scale-[0.99]"
                >
                  {isDetectingGPS ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Detecting Coordinates & Resolving Address via OpenStreetMap...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 fill-slate-950" />
                      <span className="text-sm">Detect Location</span>
                      <span className="text-[10px] font-normal text-slate-900 bg-cyan-300/70 px-2 py-0.5 rounded-full">
                        GPS & Reverse Geocoding
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-950" />
                    </>
                  )}
                </button>

                {/* GPS Status & Feedback Banner */}
                {gpsFeedback && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                      gpsFeedback.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : gpsFeedback.type === 'error'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 animate-pulse'
                    }`}
                  >
                    {gpsFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                    {gpsFeedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                    {gpsFeedback.type === 'info' && <Loader2 className="w-4 h-4 shrink-0 text-cyan-400 animate-spin" />}
                    <span className="truncate">{gpsFeedback.message}</span>
                  </div>
                )}

                {/* GPS Accuracy & Coordinates Pill */}
                {gpsMetadata?.latitude && gpsMetadata?.longitude && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      GPS: {gpsMetadata.latitude.toFixed(4)}°N, {gpsMetadata.longitude.toFixed(4)}°E
                    </span>
                    {gpsMetadata.accuracy !== undefined && (
                      <span className="text-cyan-300 font-semibold">
                        Accuracy: ±{gpsMetadata.accuracy}m
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* AUTO-FILLED / EDITABLE LOCATION FIELDS */}
              <div className="space-y-3 pt-1">
                {/* Field 1: City with Autocomplete */}
                <div ref={searchContainerRef} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>City / Municipality</span>
                      {city && (
                        <span className="text-[10px] text-cyan-400 font-normal font-mono lowercase">
                          (auto-filled)
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={isDetectingGPS}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono transition active:scale-95"
                      title="Use device GPS & OpenStreetMap Nominatim to auto-fill"
                    >
                      {isDetectingGPS ? (
                        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                      ) : (
                        <Navigation className="w-3 h-3 fill-cyan-400/40 text-cyan-400" />
                      )}
                      <span>Detect Location</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Type or auto-detect city (e.g., Madurai, Chennai, London)..."
                      value={city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      onFocus={() => {
                        if (locationSuggestions.length > 0) setShowSuggestions(true);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Autocomplete Suggestions Dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl overflow-hidden">
                      <div className="p-2 bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Suggested Municipalities & Regions</span>
                      </div>
                      {locationSuggestions.map((loc) => (
                        <div
                          key={`${loc.name}-${loc.state}`}
                          onClick={() => handleSelectSuggestion(loc)}
                          className="p-3 hover:bg-cyan-500/10 cursor-pointer border-b border-slate-800/50 last:border-0 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-sm font-semibold text-white">{loc.city}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            {loc.state} • {loc.region}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Hub Presets */}
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5">
                    Quick Preset Hubs:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_HUBS.map((hub) => (
                      <button
                        key={hub.name}
                        type="button"
                        onClick={() => handleSelectPreset(hub.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                          city.toLowerCase() === hub.name.toLowerCase()
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {hub.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fields 2 & 3: State and Region (Auto-Filled & Editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* State */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>State / Province</span>
                      {state && (
                        <span className="text-[10px] text-cyan-400 font-mono lowercase font-normal">
                          auto-filled
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Tamil Nadu"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-cyan-200 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Surveillance Region</span>
                      {region && (
                        <span className="text-[10px] text-purple-400 font-mono lowercase font-normal">
                          auto-filled
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., South Tamil Nadu"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-purple-200 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Optional District field */}
                {district && (
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      District / County
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: AGE GROUP, GENDER, WEATHER & SEVERITY */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Age Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  Age Group
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AGE_GROUPS.map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setAgeGroup(g.label)}
                      className={`p-2.5 rounded-xl text-xs font-medium transition text-center ${
                        ageGroup === g.label
                          ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Male', 'Female', 'Other'] as GenderType[]).map((gen) => (
                    <button
                      key={gen}
                      type="button"
                      onClick={() => setGender(gen)}
                      className={`py-2 rounded-xl text-xs font-medium transition text-center ${
                        gender === gen
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {gen}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  Weather Condition
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEATHER_OPTIONS.map((w) => (
                    <button
                      key={w.label}
                      type="button"
                      onClick={() => setWeather(w.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        weather === w.label
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{w.icon}</span>
                      <span>{w.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Condition Severity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Mild', 'Moderate', 'Severe', 'Critical'] as SeverityLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`py-2 rounded-xl text-xs font-medium transition text-center ${
                        severity === lvl
                          ? lvl === 'Critical'
                            ? 'bg-rose-500 text-white font-bold'
                            : lvl === 'Severe'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono transition"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition shadow-lg shadow-cyan-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold font-mono transition shadow-xl shadow-cyan-500/30"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Record ({cases} {cases === 1 ? 'case' : 'cases'})</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
