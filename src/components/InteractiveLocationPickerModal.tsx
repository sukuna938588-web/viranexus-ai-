import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Search, MapPin, X, Check, Crosshair, Sparkles } from 'lucide-react';
import { searchLocations, SmartLocation } from '../services/locationService';
import { DISTRICT_COORDINATES } from '../services/csvService';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: { region: string; latitude: number; longitude: number }) => void;
  initialLat?: number;
  initialLng?: number;
  initialRegion?: string;
}

const SATELLITE_PICKER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'satellite-tiles': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Esri World Imagery',
    },
  },
  layers: [
    {
      id: 'satellite-tiles-layer',
      type: 'raster',
      source: 'satellite-tiles',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const InteractiveLocationPickerModal: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = 13.0827, // Chennai default
  initialLng = 80.2707,
  initialRegion = 'Chennai',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng);
  const [currentRegion, setCurrentRegion] = useState<string>(initialRegion);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SmartLocation[]>([]);

  // Identify nearest region name based on coordinates
  const findNearestRegion = (lat: number, lng: number): string => {
    let nearestName = 'Chennai';
    let minDistance = Infinity;

    Object.entries(DISTRICT_COORDINATES).forEach(([name, coords]) => {
      const dLat = coords.lat - lat;
      const dLng = coords.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestName = name;
      }
    });

    return nearestName;
  };

  // Initialize MapLibre Map
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: SATELLITE_PICKER_STYLE,
          center: [initialLng, initialLat],
          zoom: 11,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

        // Create pulsing draggable marker element
        const pinEl = document.createElement('div');
        pinEl.className = 'relative flex items-center justify-center cursor-grab active:cursor-grabbing';
        pinEl.style.width = '36px';
        pinEl.style.height = '36px';
        pinEl.innerHTML = `
          <span class="absolute w-10 h-10 rounded-full bg-cyan-400/30 animate-ping"></span>
          <span class="absolute w-7 h-7 rounded-full bg-cyan-500/50 blur-[2px]"></span>
          <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-white shadow-2xl flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `;

        const marker = new maplibregl.Marker({
          element: pinEl,
          draggable: true,
        })
          .setLngLat([initialLng, initialLat])
          .addTo(map);

        // Click on map to place/move marker
        map.on('click', (e: maplibregl.MapMouseEvent) => {
          const { lng, lat } = e.lngLat;
          marker.setLngLat([lng, lat]);
          setCurrentLat(Number(lat.toFixed(4)));
          setCurrentLng(Number(lng.toFixed(4)));
          const nearest = findNearestRegion(lat, lng);
          setCurrentRegion(nearest);
        });

        // Drag marker
        marker.on('dragend', () => {
          const pos = marker.getLngLat();
          setCurrentLat(Number(pos.lat.toFixed(4)));
          setCurrentLng(Number(pos.lng.toFixed(4)));
          const nearest = findNearestRegion(pos.lat, pos.lng);
          setCurrentRegion(nearest);
        });

        markerRef.current = marker;
        mapInstanceRef.current = map;
      }
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = searchLocations(searchQuery);
    setSearchResults(results.slice(0, 6));
  }, [searchQuery]);

  const handleSelectSearchResult = (loc: SmartLocation) => {
    if (loc.latitude && loc.longitude && mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo({
        center: [loc.longitude, loc.latitude],
        zoom: 12.5,
        essential: true,
        duration: 1500,
      });
      markerRef.current.setLngLat([loc.longitude, loc.latitude]);
      setCurrentLat(Number(loc.latitude.toFixed(4)));
      setCurrentLng(Number(loc.longitude.toFixed(4)));
      setCurrentRegion(loc.district || loc.city || loc.name);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleConfirm = () => {
    onSelectLocation({
      region: currentRegion,
      latitude: currentLat,
      longitude: currentLng,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-6 overflow-hidden animate-fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[800px] rounded-3xl bg-[#070b16] border border-cyan-500/40 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Control Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#050811]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h3 className="text-base font-black text-white font-mono tracking-wide flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Choose Location on Map (MapLibre GL &bull; OpenStreetMap)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Click anywhere or drag marker &bull; Coordinates and region are auto-captured
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Auto-Suggestions Overlay */}
        <div className="p-3 sm:px-5 bg-[#080d1a] border-b border-slate-800 shrink-0 relative z-20">
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search State, District, City, or Region (e.g. Chennai, Madurai, Coimbatore)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 sm:left-5 sm:right-5 top-full mt-1 rounded-2xl bg-[#060a14] border border-cyan-500/30 shadow-2xl overflow-hidden z-30 divide-y divide-slate-800/60">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full px-4 py-2.5 text-left text-xs font-mono hover:bg-cyan-500/10 flex items-center justify-between text-slate-200 hover:text-cyan-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">{res.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {res.district ? `${res.district}, ` : ''}{res.state || res.country}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 font-mono">
                    {res.latitude?.toFixed(2)}°, {res.longitude?.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container Viewport */}
        <div className="flex-1 relative min-h-0 w-full bg-[#050811]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Telemetry Reticle Card */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex flex-col gap-2">
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#070b16]/95 border border-cyan-500/40 backdrop-blur-md shadow-xl text-xs font-mono space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Target Telemetry</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Lat: <strong className="text-white">{currentLat}°</strong> &bull; Lng: <strong className="text-white">{currentLng}°</strong>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold">
                Captured Zone: {currentRegion}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#050811] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Target Locked: <strong className="text-white">{currentRegion}</strong> ({currentLat}, {currentLng})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-mono transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-mono shadow-lg shadow-cyan-500/25 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
