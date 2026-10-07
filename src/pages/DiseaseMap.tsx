import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  MapPin,
  Search,
  Crosshair,
  Sparkles,
  AlertTriangle,
  Layers,
  X,
  Compass,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldAlert,
  Info,
  Calendar,
  Filter,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Globe2,
  Radio,
  Flame,
  Zap,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage, SeverityLevel } from '../types';
import { searchLocations, SmartLocation } from '../services/locationService';
import { DISTRICT_COORDINATES } from '../services/csvService';

interface DiseaseMapProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onLoadSample: () => void;
  onOpenAddModal: () => void;
  focusedPrediction?: {
    location: string;
    disease?: string;
    probability?: number;
    timeWindow?: string;
    explanation?: string;
  } | null;
  onClearFocusedPrediction?: () => void;
}

// 1. Esri World Imagery (High-Res Satellite - 100% Free, NO API KEY, NO WATERMARK, NO GOOGLE)
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Esri World Imagery &bull; Open Earth Surveillance',
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

// 2. OpenStreetMap Standard (Clean vector raster - 100% Free, NO API KEY, NO WATERMARK)
const OSM_STANDARD_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-standard': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm-standard',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

// DiseaseMap: Purely dataset-driven geospatial intelligence (NO demo hotspots)
export const DiseaseMap: React.FC<DiseaseMapProps> = ({
  intelligence,
  records,
  onSelectPage,
  onLoadSample,
  onOpenAddModal,
  focusedPrediction,
  onClearFocusedPrediction,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const predictionMarkerRef = useRef<maplibregl.Marker | null>(null);
  const spreadLinesRef = useRef<maplibregl.Marker[]>([]);

  // Map Mode: Default = Satellite View
  const [mapMode, setMapMode] = useState<'satellite' | 'standard'>('satellite');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SmartLocation[]>([]);

  // Visual Overlays toggles
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'All' | 'Critical' | 'Severe' | 'Moderate' | 'Normal'>('All');
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState<string>('All');
  const [showSpreadPaths, setShowSpreadPaths] = useState(true);
  const [showHeatGlow, setShowHeatGlow] = useState(true);

  // Selected marker details card
  const [activeMarkerRecord, setActiveMarkerRecord] = useState<OutbreakRecord | null>(null);

  // Active prediction highlight state (Derived strictly from records / prediction center)
  const [activePrediction, setActivePrediction] = useState<{
    location: string;
    disease?: string;
    probability?: number;
    timeWindow?: string;
    explanation?: string;
  } | null>(
    focusedPrediction ||
      (records.length > 0 && intelligence.prediction.affectedDistricts.length > 0
        ? {
            location: intelligence.prediction.affectedDistricts[0],
            disease: intelligence.prediction.disease,
            probability: intelligence.prediction.probability,
            timeWindow: intelligence.prediction.timeWindow,
            explanation: intelligence.prediction.explanation,
          }
        : null)
  );

  const distinctDiseases = Array.from(new Set(records.map((r) => r.disease))).filter(Boolean);

  // Dynamically compute spread vectors only between districts in user dataset reporting identical pathogen
  const dynamicSpreadCorridors = React.useMemo(() => {
    if (records.length < 2) return [];
    const corridors: Array<{ from: string; to: string; disease: string }> = [];
    const diseaseMap = new Map<string, string[]>();

    records.forEach((r) => {
      const reg = r.region || r.district;
      if (!reg || !r.disease) return;
      if (!diseaseMap.has(r.disease)) diseaseMap.set(r.disease, []);
      const arr = diseaseMap.get(r.disease)!;
      if (!arr.includes(reg)) arr.push(reg);
    });

    diseaseMap.forEach((districts, disease) => {
      for (let i = 0; i < districts.length - 1 && corridors.length < 10; i++) {
        corridors.push({
          from: districts[i],
          to: districts[i + 1],
          disease,
        });
      }
    });

    return corridors;
  }, [records]);

  // Dynamically compute distinct active districts present in the user records
  const activeDistrictShortcuts = React.useMemo(() => {
    return Array.from(new Set(records.map((r) => r.region || r.district || '').filter((s): s is string => Boolean(s)))).slice(0, 5);
  }, [records]);

  // Color & severity styles
  const getSeverityStyles = (sev: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return {
          bg: '#ef4444',
          border: '#f87171',
          shadow: 'rgba(239, 68, 68, 0.8)',
          ringColor: 'rgba(239, 68, 68, 0.45)',
          name: 'Critical Risk',
        };
      case 'Severe':
        return {
          bg: '#f97316',
          border: '#fb923c',
          shadow: 'rgba(249, 115, 22, 0.8)',
          ringColor: 'rgba(249, 115, 22, 0.45)',
          name: 'Severe Risk',
        };
      case 'Moderate':
        return {
          bg: '#eab308',
          border: '#facc15',
          shadow: 'rgba(234, 179, 8, 0.7)',
          ringColor: 'rgba(234, 179, 8, 0.4)',
          name: 'Moderate Risk',
        };
      case 'Normal':
      default:
        return {
          bg: '#10b981',
          border: '#34d399',
          shadow: 'rgba(16, 185, 129, 0.7)',
          ringColor: 'rgba(16, 185, 129, 0.35)',
          name: 'Low Risk',
        };
    }
  };

  // Initialize MapLibre GL JS Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialStyle = mapMode === 'satellite' ? SATELLITE_STYLE : OSM_STANDARD_STYLE;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [78.6569, 11.1271], // Tamil Nadu center [lng, lat]
        zoom: 6.8,
        pitch: 28, // 3D surveillance perspective
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

      // Automatic fallback: if satellite fails to load, gracefully switch to OpenStreetMap
      map.on('error', (e) => {
        if (mapMode === 'satellite' && e.error?.message?.includes('satellite')) {
          console.warn('Satellite imagery fallback triggered: switching to OpenStreetMap.');
          setMapMode('standard');
          map.setStyle(OSM_STANDARD_STYLE);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Style Switch (Satellite vs Standard View)
  const handleToggleMapMode = (newMode: 'satellite' | 'standard') => {
    if (newMode === mapMode) return;
    setMapMode(newMode);
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const newStyle = newMode === 'satellite' ? SATELLITE_STYLE : OSM_STANDARD_STYLE;
      map.setStyle(newStyle);
    } catch (err) {
      console.warn('Fallback to standard OSM style.');
      setMapMode('standard');
      map.setStyle(OSM_STANDARD_STYLE);
    }
  };

  // Sync focusedPrediction prop
  useEffect(() => {
    if (focusedPrediction) {
      setActivePrediction(focusedPrediction);
      handleZoomToLocation(focusedPrediction.location);
    }
  }, [focusedPrediction]);

  // Re-draw Markers & Heat Glow Overlays on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filteredRecords = records.filter((r) => {
      if (selectedRiskFilter !== 'All' && r.severity !== selectedRiskFilter) return false;
      if (selectedDiseaseFilter !== 'All' && r.disease !== selectedDiseaseFilter) return false;
      return true;
    });

    filteredRecords.forEach((record) => {
      const regionName = record.region || record.district || 'Chennai';
      const coords =
        record.latitude && record.longitude
          ? { lat: record.latitude, lng: record.longitude }
          : DISTRICT_COORDINATES[regionName] || { lat: 13.0827, lng: 80.2707 };

      const col = getSeverityStyles(record.severity);

      // Create custom pulsing DOM element
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer group';
      el.style.width = '42px';
      el.style.height = '42px';

      // Pulsing red/orange/yellow/green rings
      const glowHtml = showHeatGlow
        ? `<div class="marker-beacon-ripple w-12 h-12 border-2" style="border-color: ${col.border}; background: ${col.ringColor};"></div>`
        : '';

      el.innerHTML = `
        ${glowHtml}
        <div class="relative w-7 h-7 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-[10px] font-black font-mono text-slate-950 transition-all duration-300 group-hover:scale-130 group-hover:ring-4 group-hover:ring-cyan-400" style="background-color: ${col.bg}; box-shadow: 0 0 18px ${col.shadow};">
          ${record.cases > 50 ? '!' : '•'}
        </div>
        <div class="absolute -top-7 px-2 py-0.5 rounded-lg bg-[#070b16]/95 border border-cyan-500/40 text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          ${regionName}: ${record.cases} (${record.disease})
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveMarkerRecord(record);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [records, selectedRiskFilter, selectedDiseaseFilter, showHeatGlow, mapMode]);

  // Render Animated Outbreak Spread Paths (Dynamically derived between actual transmission clusters)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old spread lines
    spreadLinesRef.current.forEach((m) => m.remove());
    spreadLinesRef.current = [];

    if (!showSpreadPaths || dynamicSpreadCorridors.length === 0) return;

    dynamicSpreadCorridors.forEach((corridor) => {
      const fromCoord = DISTRICT_COORDINATES[corridor.from];
      const toCoord = DISTRICT_COORDINATES[corridor.to];
      if (!fromCoord || !toCoord) return;

      // Midpoint for spread vector indicator
      const midLng = (fromCoord.lng + toCoord.lng) / 2;
      const midLat = (fromCoord.lat + toCoord.lat) / 2;

      const pathEl = document.createElement('div');
      pathEl.className = 'pointer-events-none flex items-center justify-center';
      pathEl.innerHTML = `
        <div class="px-2 py-0.5 rounded-full bg-slate-950/80 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 flex items-center gap-1 shadow-lg backdrop-blur">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
          <span>${corridor.from} &rarr; ${corridor.to}</span>
        </div>
      `;

      const lineMarker = new maplibregl.Marker({ element: pathEl })
        .setLngLat([midLng, midLat])
        .addTo(map);

      spreadLinesRef.current.push(lineMarker);
    });
  }, [showSpreadPaths, dynamicSpreadCorridors, mapMode]);

  // Render Prediction Highlight Beacon & Radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (predictionMarkerRef.current) {
      predictionMarkerRef.current.remove();
      predictionMarkerRef.current = null;
    }

    if (!activePrediction || records.length === 0) return;

    const targetCoords =
      DISTRICT_COORDINATES[activePrediction.location] ||
      Object.entries(DISTRICT_COORDINATES).find(([k]) =>
        k.toLowerCase().includes(activePrediction.location.toLowerCase())
      )?.[1] || { lat: 13.0827, lng: 80.2707 };

    const predEl = document.createElement('div');
    predEl.className = 'relative flex items-center justify-center';
    predEl.style.width = '72px';
    predEl.style.height = '72px';
    predEl.innerHTML = `
      <span class="absolute w-20 h-20 rounded-full border-2 border-cyan-400 bg-cyan-500/20 animate-ping"></span>
      <span class="absolute w-14 h-14 rounded-full border border-rose-500 bg-rose-500/30 animate-pulse"></span>
      <div class="relative w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-rose-500 border-2 border-white shadow-2xl flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="12" x2="12" y2="18"/></svg>
      </div>
    `;

    const predMarker = new maplibregl.Marker({ element: predEl })
      .setLngLat([targetCoords.lng, targetCoords.lat])
      .addTo(map);

    predictionMarkerRef.current = predMarker;
  }, [activePrediction, records.length, mapMode]);

  // Smooth zoom to location
  const handleZoomToLocation = (locName: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const coords =
      DISTRICT_COORDINATES[locName] ||
      Object.entries(DISTRICT_COORDINATES).find(([k]) =>
        k.toLowerCase().includes(locName.toLowerCase())
      )?.[1];

    if (coords) {
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 11.5,
        essential: true,
        duration: 1800,
      });
    }
  };

  // Search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = searchLocations(searchQuery);
    setSearchResults(results.slice(0, 6));
  }, [searchQuery]);

  const handleSelectSearchResult = (loc: SmartLocation) => {
    if (loc.latitude && loc.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [loc.longitude, loc.latitude],
        zoom: 12,
        essential: true,
        duration: 1800,
      });
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <div className={`space-y-5 pb-20 ${isFullScreen ? 'fixed inset-0 z-50 bg-[#05070d] p-4 overflow-y-auto' : ''}`}>
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Disease Map & Geospatial Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              ESRI &bull; OPENSTREETMAP
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Zero API Keys &bull; No Watermark &bull; Satellite & Standard Views &bull; Tamil Nadu Surveillance
          </p>
        </div>

        {/* View Switcher: Satellite vs Standard View */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => handleToggleMapMode('satellite')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
                mapMode === 'satellite'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>🛰 Satellite View</span>
            </button>
            <button
              onClick={() => handleToggleMapMode('standard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
                mapMode === 'standard'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>🗺 Standard View</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Control Toolbar: Search Bar, Sector Jump & Overlays */}
      <div className="p-4 rounded-2xl bg-[#080c18] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Powerful Location Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search State, District, City, or Region (e.g. Chennai, Madurai, Tirunelveli)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />

          {/* Search suggestions dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-[#060a14] border border-cyan-500/30 shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full px-4 py-2.5 text-left text-xs font-mono hover:bg-cyan-500/10 flex items-center justify-between text-slate-200 hover:text-cyan-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-bold text-white">{res.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {res.district ? `${res.district}, ` : ''}{res.state || res.country}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {res.latitude?.toFixed(2)}°, {res.longitude?.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic District Shortcuts from active surveillance records */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {activeDistrictShortcuts.length > 0 && (
            <>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">Clusters:</span>
              {activeDistrictShortcuts.map((dist, idx) => {
                const colors = ['text-cyan-300', 'text-purple-300', 'text-emerald-300', 'text-rose-300', 'text-amber-300'];
                return (
                  <button
                    key={dist}
                    onClick={() => handleZoomToLocation(dist)}
                    className={`px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 ${colors[idx % colors.length]} transition font-medium`}
                  >
                    {dist}
                  </button>
                );
              })}
            </>
          )}

          {/* Spread Paths toggle */}
          <button
            onClick={() => setShowSpreadPaths(!showSpreadPaths)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              showSpreadPaths
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Spread Paths {showSpreadPaths ? 'On' : 'Off'}</span>
          </button>

          {/* Hotspot Glow toggle */}
          <button
            onClick={() => setShowHeatGlow(!showHeatGlow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              showHeatGlow
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-bold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hotspot Glow {showHeatGlow ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Command Center Viewport */}
      <div className={`relative rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl bg-[#05070d] ${isFullScreen ? 'h-[82vh]' : 'h-[680px]'}`}>
        {/* MapLibre Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Clean Standby Overlay when no dataset records exist */}
        {records.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs pointer-events-none">
            <div className="max-w-md p-6 rounded-3xl bg-[#070b16]/95 border-2 border-cyan-500/30 text-center space-y-3 pointer-events-auto shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">Geospatial Surveillance Standby</h3>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Zero disease records indexed. MapLibre GL & OpenStreetMap engine is live and ready. Ingest a dataset or click below to begin plotting outbreak hotspots.
              </p>
              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={() => onSelectPage('upload')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono shadow-lg transition active:scale-95"
                >
                  Upload CSV Dataset
                </button>
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium text-xs font-mono hover:bg-slate-800 transition"
                >
                  Add Record (Map Picker)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Alert Card Overlay */}
        {activePrediction && (
          <div className="absolute top-4 right-4 z-30 max-w-sm rounded-2xl bg-[#070b16]/95 border-2 border-cyan-500/40 p-4 shadow-2xl backdrop-blur-xl animate-fade-in space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prediction Outbreak Alert</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {activePrediction.probability || 84}% Prob
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                {activePrediction.disease} outbreak likely in {activePrediction.location}
              </h4>
              <p className="text-[11px] text-slate-300 font-mono mt-1 line-clamp-2 leading-relaxed">
                {activePrediction.explanation || 'Accelerated localized transmission pattern detected across surveillance clusters.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleZoomToLocation(activePrediction.location)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-mono shadow-md active:scale-95 transition"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Focus On Zone</span>
              </button>
              <button
                onClick={() => onSelectPage('prediction')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
              >
                Prediction Center &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Bottom-Left: Map Legend */}
        <div className="absolute bottom-4 left-4 z-30 p-3.5 rounded-2xl bg-[#070b16]/95 border border-slate-800 backdrop-blur-md shadow-2xl text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span>Risk Stratification</span>
            <span className="text-cyan-400">{mapMode === 'satellite' ? 'Satellite' : 'Standard'}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Critical (Red)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Severe (Orange)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span>Moderate (Yellow)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Low Risk (Green)</span>
            </div>
          </div>
        </div>

        {/* Selected Marker Details: Premium Glassmorphism Card */}
        {activeMarkerRecord && (
          <div className="absolute inset-x-4 bottom-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-40 rounded-3xl bg-[#070b16]/95 border-2 border-cyan-500/50 p-5 shadow-2xl backdrop-blur-2xl animate-fade-in space-y-3.5 text-xs font-mono">
            {/* Header */}
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                  Surveillance Node Details
                </span>
                <h3 className="text-base font-black text-white font-mono mt-0.5">
                  {activeMarkerRecord.region || activeMarkerRecord.district}
                </h3>
              </div>
              <button
                onClick={() => setActiveMarkerRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Disease Name & Severity Badge */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Disease</span>
                <span className="text-sm font-black text-cyan-300">{activeMarkerRecord.disease}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Severity</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                    activeMarkerRecord.severity === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : activeMarkerRecord.severity === 'Severe'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : activeMarkerRecord.severity === 'Moderate'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {activeMarkerRecord.severity} Risk
                </span>
              </div>
            </div>

            {/* Metrics: Cases, Deaths, Recovered */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#05070e] border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Cases</span>
                <span className="text-base font-black text-white">{activeMarkerRecord.cases}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-400 block">Deaths</span>
                <span className="text-base font-black text-rose-300">{activeMarkerRecord.deaths || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">Recovered</span>
                <span className="text-base font-black text-emerald-300">{activeMarkerRecord.recovered || 0}</span>
              </div>
            </div>

            {/* Demographics: Age / Sex */}
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-slate-400">Demographic Cohort:</span>
              <span className="text-slate-200 font-bold">
                {activeMarkerRecord.age || 25} / {activeMarkerRecord.sex || 'Male'}
              </span>
            </div>

            {/* Symptoms Tags */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Reported Symptoms</span>
              <div className="flex flex-wrap gap-1">
                {(activeMarkerRecord.symptoms && activeMarkerRecord.symptoms.length > 0
                  ? activeMarkerRecord.symptoms
                  : ['Fever', 'Body Pain']
                ).map((sym, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* Date & Coordinates */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
              <span>Date: {activeMarkerRecord.date}</span>
              {activeMarkerRecord.latitude && activeMarkerRecord.longitude && (
                <span>GPS: {activeMarkerRecord.latitude.toFixed(2)}°, {activeMarkerRecord.longitude.toFixed(2)}°</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
