import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { SpatialExtent } from '../types';
import { NOAA_PRESET_REGIONS } from '../data/missions';
import {
  Compass,
  Maximize2,
  Move,
  Pencil,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  Plus,
  Minus,
  Navigation
} from 'lucide-react';

interface InteractiveOceanMapProps {
  extent: SpatialExtent;
  onChangeExtent: (extent: SpatialExtent) => void;
  missionTitle?: string;
  instruments?: string[];
  diveTrackPolygon?: [number, number][];
}

export const InteractiveOceanMap: React.FC<InteractiveOceanMapProps> = ({
  extent,
  onChangeExtent,
  missionTitle,
  diveTrackPolygon,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const rectangleLayerRef = useRef<L.Rectangle | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const cornerMarkersRef = useRef<{
    nw?: L.Marker;
    ne?: L.Marker;
    se?: L.Marker;
    sw?: L.Marker;
    center?: L.Marker;
  }>({});

  const [basemap, setBasemap] = useState<'voyager' | 'ocean' | 'dark'>('voyager');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<L.LatLng | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Drag corner handles or click map to adjust bounding box');

  // Keep a ref of latest extent to avoid stale closures in event handlers
  const extentRef = useRef<SpatialExtent>(extent);
  useEffect(() => {
    extentRef.current = extent;
  }, [extent]);

  // Validate bounds
  const isValidBounds =
    extent.west >= -180 &&
    extent.east <= 180 &&
    extent.south >= -90 &&
    extent.north <= 90 &&
    extent.west <= extent.east &&
    extent.south <= extent.north;

  // Approximate area in square kilometers
  const calculateAreaKm2 = () => {
    const latDist = Math.abs(extent.north - extent.south) * 111;
    const avgLatRad = (((extent.north + extent.south) / 2) * Math.PI) / 180;
    const lngDist = Math.abs(extent.east - extent.west) * 111 * Math.cos(avgLatRad);
    return Math.round(latDist * lngDist);
  };

  // Helper to create glowing handle div icons
  const createHandleIcon = (cursorClass: string, label: string, color = 'bg-cyan-400') => {
    return L.divIcon({
      className: 'manta-map-handle-wrapper',
      html: `
        <div class="group relative flex items-center justify-center">
          <div class="w-4 h-4 rounded-full ${color} border-2 border-[#060b14] shadow-md shadow-cyan-400/60 cursor-${cursorClass} hover:scale-135 transition-transform flex items-center justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-[#060b14]"></span>
          </div>
          <div class="absolute -bottom-5 px-1 py-0.2 bg-[#080e1a]/90 text-[9px] font-mono text-cyan-300 rounded border border-cyan-500/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            ${label}
          </div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const centerLat = (extent.south + extent.north) / 2 || 35;
    const centerLng = (extent.west + extent.east) / 2 || -65;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 4,
      minZoom: 1,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // Default high-contrast ocean tile layer
    const voyagerTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // Zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Mouse move tracker
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
      });
    });

    map.on('mouseout', () => {
      setCursorCoords(null);
    });

    // Map click handling
    map.on('click', (e: L.LeafletMouseEvent) => {
      // If drawing mode is on, manage 2-point box definition
      if ((window as any).__MANTA_DRAWING_MODE) {
        const start = (window as any).__MANTA_DRAW_START;
        if (!start) {
          (window as any).__MANTA_DRAW_START = e.latlng;
          setStatusMessage('Point 1 set. Click second corner to complete bounding box.');
        } else {
          const lat1 = start.lat;
          const lng1 = start.lng;
          const lat2 = e.latlng.lat;
          const lng2 = e.latlng.lng;

          const south = Math.min(lat1, lat2);
          const north = Math.max(lat1, lat2);
          const west = Math.min(lng1, lng2);
          const east = Math.max(lng1, lng2);

          (window as any).__MANTA_DRAW_START = null;
          (window as any).__MANTA_DRAWING_MODE = false;
          setIsDrawingMode(false);
          setStatusMessage('New bounding box defined!');

          onChangeExtent({
            ...extentRef.current,
            south: parseFloat(south.toFixed(4)),
            north: parseFloat(north.toFixed(4)),
            west: parseFloat(west.toFixed(4)),
            east: parseFloat(east.toFixed(4)),
            placeName: `Survey Sector (${north.toFixed(2)}°N, ${west.toFixed(2)}°W)`,
          });
        }
        return;
      }

      // Default click: Shift bounding box center to clicked point
      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;
      const cur = extentRef.current;
      const latSpan = Math.abs(cur.north - cur.south) || 4;
      const lngSpan = Math.abs(cur.east - cur.west) || 6;

      const newSouth = parseFloat((clickLat - latSpan / 2).toFixed(4));
      const newNorth = parseFloat((clickLat + latSpan / 2).toFixed(4));
      const newWest = parseFloat((clickLng - lngSpan / 2).toFixed(4));
      const newEast = parseFloat((clickLng + lngSpan / 2).toFixed(4));

      onChangeExtent({
        ...cur,
        south: Math.max(-90, newSouth),
        north: Math.min(90, newNorth),
        west: Math.max(-180, newWest),
        east: Math.min(180, newEast),
        placeName: `Ocean coordinates: ${clickLat.toFixed(2)}°N, ${clickLng.toFixed(2)}°W`,
      });
      setStatusMessage(`Repositioned center to ${clickLat.toFixed(2)}°, ${clickLng.toFixed(2)}°`);
    });

    mapInstanceRef.current = map;

    // Handle container resize (e.g. pane collapse/expand)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update basemap tile layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO &copy; NOAA NCEI';

    if (basemap === 'ocean') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org';
    } else if (basemap === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CARTO &copy; OpenStreetMap';
    }

    L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 18,
      attribution,
    }).addTo(map);

    // Re-add rectangle & markers so they stay on top
    if (rectangleLayerRef.current) rectangleLayerRef.current.bringToFront();
    if (polygonLayerRef.current) polygonLayerRef.current.bringToFront();
  }, [basemap]);

  // Synchronize bounding box rectangle and drag markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isValidBounds) return;

    const bounds = L.latLngBounds(
      [extent.south, extent.west],
      [extent.north, extent.east]
    );

    // 1. Update or create Rectangle
    if (rectangleLayerRef.current) {
      rectangleLayerRef.current.setBounds(bounds);
    } else {
      rectangleLayerRef.current = L.rectangle(bounds, {
        color: '#00e5ff',
        weight: 2,
        fillColor: '#00bcd4',
        fillOpacity: 0.18,
        dashArray: '5, 5',
      }).addTo(map);
    }

    // 2. Update or create Interactive Corner Markers
    const nwLatLng: [number, number] = [extent.north, extent.west];
    const neLatLng: [number, number] = [extent.north, extent.east];
    const seLatLng: [number, number] = [extent.south, extent.east];
    const swLatLng: [number, number] = [extent.south, extent.west];
    const centerLatLng: [number, number] = [
      (extent.north + extent.south) / 2,
      (extent.east + extent.west) / 2,
    ];

    const markers = cornerMarkersRef.current;

    // Helper to update / bind marker drag
    const updateOrCreateMarker = (
      key: 'nw' | 'ne' | 'se' | 'sw' | 'center',
      latLng: [number, number],
      cursorClass: string,
      label: string,
      color: string,
      onDragHandler: (newPos: L.LatLng) => void
    ) => {
      if (markers[key]) {
        markers[key]?.setLatLng(latLng);
      } else {
        const marker = L.marker(latLng, {
          draggable: true,
          icon: createHandleIcon(cursorClass, label, color),
          zIndexOffset: 1000,
        }).addTo(map);

        marker.on('drag', (e: L.LeafletEvent) => {
          const m = e.target as L.Marker;
          onDragHandler(m.getLatLng());
        });

        marker.on('dragend', () => {
          setStatusMessage('Bounding box updated via map drag.');
        });

        markers[key] = marker;
      }
    };

    // North-West Drag
    updateOrCreateMarker('nw', nwLatLng, 'nwse-resize', 'NW Bound', 'bg-cyan-400', (pos) => {
      const cur = extentRef.current;
      onChangeExtent({
        ...cur,
        north: parseFloat(Math.min(90, Math.max(cur.south + 0.05, pos.lat)).toFixed(4)),
        west: parseFloat(Math.max(-180, Math.min(cur.east - 0.05, pos.lng)).toFixed(4)),
      });
    });

    // North-East Drag
    updateOrCreateMarker('ne', neLatLng, 'nesw-resize', 'NE Bound', 'bg-cyan-400', (pos) => {
      const cur = extentRef.current;
      onChangeExtent({
        ...cur,
        north: parseFloat(Math.min(90, Math.max(cur.south + 0.05, pos.lat)).toFixed(4)),
        east: parseFloat(Math.min(180, Math.max(cur.west + 0.05, pos.lng)).toFixed(4)),
      });
    });

    // South-East Drag
    updateOrCreateMarker('se', seLatLng, 'nwse-resize', 'SE Bound', 'bg-cyan-400', (pos) => {
      const cur = extentRef.current;
      onChangeExtent({
        ...cur,
        south: parseFloat(Math.max(-90, Math.min(cur.north - 0.05, pos.lat)).toFixed(4)),
        east: parseFloat(Math.min(180, Math.max(cur.west + 0.05, pos.lng)).toFixed(4)),
      });
    });

    // South-West Drag
    updateOrCreateMarker('sw', swLatLng, 'nesw-resize', 'SW Bound', 'bg-cyan-400', (pos) => {
      const cur = extentRef.current;
      onChangeExtent({
        ...cur,
        south: parseFloat(Math.max(-90, Math.min(cur.north - 0.05, pos.lat)).toFixed(4)),
        west: parseFloat(Math.max(-180, Math.min(cur.east - 0.05, pos.lng)).toFixed(4)),
      });
    });

    // Center Drag (Move entire bounding box)
    updateOrCreateMarker('center', centerLatLng, 'move', 'Box Center', 'bg-emerald-400', (pos) => {
      const cur = extentRef.current;
      const latHalf = Math.abs(cur.north - cur.south) / 2;
      const lngHalf = Math.abs(cur.east - cur.west) / 2;

      onChangeExtent({
        ...cur,
        north: parseFloat(Math.min(90, pos.lat + latHalf).toFixed(4)),
        south: parseFloat(Math.max(-90, pos.lat - latHalf).toFixed(4)),
        east: parseFloat(Math.min(180, pos.lng + lngHalf).toFixed(4)),
        west: parseFloat(Math.max(-180, pos.lng - lngHalf).toFixed(4)),
      });
    });

    // 3. Optional Dive Trajectory / Polygon Layer
    const activePolygon = diveTrackPolygon || extent.polygon;
    if (activePolygon && activePolygon.length > 2) {
      if (polygonLayerRef.current) {
        polygonLayerRef.current.setLatLngs(activePolygon);
      } else {
        polygonLayerRef.current = L.polygon(activePolygon, {
          color: '#38bdf8',
          weight: 2,
          fillColor: '#0284c7',
          fillOpacity: 0.22,
        }).addTo(map);
      }
    } else if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }
  }, [extent.west, extent.south, extent.east, extent.north, extent.polygon, diveTrackPolygon, isValidBounds]);

  // Recenter / Fit View
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !isValidBounds) return;
    const bounds = L.latLngBounds(
      [extent.south, extent.west],
      [extent.north, extent.east]
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8, animate: true });
    setStatusMessage('Map view centered on bounding box.');
  };

  // Toggle Draw Mode
  const toggleDrawMode = () => {
    const nextState = !isDrawingMode;
    setIsDrawingMode(nextState);
    (window as any).__MANTA_DRAWING_MODE = nextState;
    (window as any).__MANTA_DRAW_START = null;

    if (nextState) {
      setStatusMessage('Draw Mode Active: Click map to place first corner of bounding box.');
    } else {
      setStatusMessage('Draw mode cancelled.');
    }
  };

  // Nudge coordinate helpers (+/- step)
  const nudgeCoordinate = (coord: 'west' | 'south' | 'east' | 'north', delta: number) => {
    const updated = { ...extent };
    if (coord === 'west') updated.west = parseFloat(Math.max(-180, Math.min(extent.east - 0.05, extent.west + delta)).toFixed(4));
    if (coord === 'south') updated.south = parseFloat(Math.max(-90, Math.min(extent.north - 0.05, extent.south + delta)).toFixed(4));
    if (coord === 'east') updated.east = parseFloat(Math.min(180, Math.max(extent.west + 0.05, extent.east + delta)).toFixed(4));
    if (coord === 'north') updated.north = parseFloat(Math.min(90, Math.max(extent.south + 0.05, extent.north + delta)).toFixed(4));
    onChangeExtent(updated);
  };

  return (
    <div
      id="spatial-extent-leaflet-map-card"
      className="bg-[#0b1320] border border-cyan-500/25 rounded-xl overflow-hidden flex flex-col shadow-xl"
    >
      {/* Map Card Header matching NOAA CEDIT and UxS Specification */}
      <div className="px-4 py-2.5 bg-[#0e192c]/95 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200 font-mono">
                Spatial Extent &amp; Geographic Coordinates
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-mono">
                ISO 19115-2 EX_GeographicBoundingBox
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              WGS84 Geodetic Datum • Real-time Leaflet Sync
            </p>
          </div>
        </div>

        {/* Map Control Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Selector */}
          <select
            id="map-region-preset-select"
            value={
              NOAA_PRESET_REGIONS.find(
                (p) =>
                  Math.abs(p.extent.west - extent.west) < 0.2 &&
                  Math.abs(p.extent.north - extent.north) < 0.2
              )?.name || ''
            }
            onChange={(e) => {
              const selected = NOAA_PRESET_REGIONS.find((p) => p.name === e.target.value);
              if (selected) {
                onChangeExtent({
                  ...extent,
                  west: selected.extent.west,
                  south: selected.extent.south,
                  east: selected.extent.east,
                  north: selected.extent.north,
                  placeName: selected.name,
                  polygon: (selected.extent as any).polygon,
                });
                setStatusMessage(`Loaded NOAA preset: ${selected.name}`);
              }
            }}
            className="bg-[#12223a] text-xs text-cyan-200 border border-cyan-500/30 rounded-lg px-2.5 py-1 outline-none font-mono focus:border-cyan-400 cursor-pointer"
          >
            <option value="" disabled>
              Select NOAA Region Preset...
            </option>
            {NOAA_PRESET_REGIONS.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>

          {/* Basemap Toggle */}
          <div className="flex items-center bg-[#101e33] border border-cyan-500/30 rounded-lg p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setBasemap('voyager')}
              className={`px-2 py-0.5 rounded transition-colors ${
                basemap === 'voyager' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => setBasemap('ocean')}
              className={`px-2 py-0.5 rounded transition-colors ${
                basemap === 'ocean' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              Ocean
            </button>
            <button
              onClick={() => setBasemap('dark')}
              className={`px-2 py-0.5 rounded transition-colors ${
                basemap === 'dark' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              Dark
            </button>
          </div>

          {/* Draw Box Tool Toggle */}
          <button
            id="draw-bounding-box-btn"
            onClick={toggleDrawMode}
            title={isDrawingMode ? 'Cancel drawing mode' : 'Click two corners on map to draw new box'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              isDrawingMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold animate-pulse'
                : 'bg-[#101e33] text-cyan-300 border-cyan-500/30 hover:bg-[#162b49]'
            }`}
          >
            <Pencil className="w-3 h-3" />
            <span>{isDrawingMode ? 'Drawing...' : 'Draw Box'}</span>
          </button>

          {/* Recenter Map Button */}
          <button
            id="recenter-leaflet-map-btn"
            onClick={handleRecenter}
            title="Recenter view on bounding box"
            className="p-1.5 text-cyan-300 hover:text-cyan-100 bg-[#101e33] hover:bg-[#162b49] border border-cyan-500/30 rounded-lg transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Viewport Area */}
      <div className="relative h-72 sm:h-80 w-full bg-[#080d16] select-none">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Live Legend / Drag Instructions Overlay */}
        <div className="absolute top-2 left-2 z-[400] flex flex-col gap-1 pointer-events-none">
          <div className="bg-[#0b1320]/90 backdrop-blur-md border border-cyan-500/30 px-2.5 py-1 rounded-lg text-[10px] text-cyan-200 font-mono shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* HUD Coordinate Inspector & Validity Badge */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Coordinates HUD */}
          <div className="bg-[#080f1d]/90 backdrop-blur-sm border border-cyan-500/30 px-3 py-1 rounded-lg text-[11px] text-slate-300 font-mono shadow-md flex items-center gap-2 pointer-events-auto">
            <span className="text-cyan-400 font-semibold">Extent:</span>
            <span>[{extent.west.toFixed(2)}°W, {extent.south.toFixed(2)}°S] to [{extent.east.toFixed(2)}°E, {extent.north.toFixed(2)}°N]</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">~{calculateAreaKm2().toLocaleString()} km²</span>
          </div>

          {/* Mouse Coordinates Pill */}
          {cursorCoords && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#080f1d]/90 backdrop-blur-sm border border-cyan-500/30 px-2.5 py-1 rounded-lg text-[10px] text-cyan-300 font-mono shadow pointer-events-auto">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>Cursor: {cursorCoords.lat > 0 ? `${cursorCoords.lat}°N` : `${Math.abs(cursorCoords.lat)}°S`}, {cursorCoords.lng > 0 ? `${cursorCoords.lng}°E` : `${Math.abs(cursorCoords.lng)}°W`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Coordinate Verification and Fine-Tuning Grid */}
      <div className="p-3 bg-[#0c1524] border-t border-cyan-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isValidBounds ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Coordinates valid according to ISO 19115-2
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" /> Invalid bounding box (West must be &lt; East and South &lt; North)
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Directly adjust via inputs, nudge buttons (±0.1°), or drag on map
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* West Longitude */}
          <div className="bg-[#101b2e] border border-cyan-500/30 rounded-lg p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">West Longitude</span>
              <span className="text-[9px] font-mono text-cyan-400">gmd:westBoundLongitude</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                id="extent-west-input"
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={extent.west}
                onChange={(e) =>
                  onChangeExtent({
                    ...extent,
                    west: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#080e1a] border border-cyan-500/30 rounded px-2 py-1 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => nudgeCoordinate('west', -0.1)}
                title="Subtract 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => nudgeCoordinate('west', 0.1)}
                title="Add 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* South Latitude */}
          <div className="bg-[#101b2e] border border-cyan-500/30 rounded-lg p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">South Latitude</span>
              <span className="text-[9px] font-mono text-cyan-400">gmd:southBoundLatitude</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                id="extent-south-input"
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={extent.south}
                onChange={(e) =>
                  onChangeExtent({
                    ...extent,
                    south: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#080e1a] border border-cyan-500/30 rounded px-2 py-1 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => nudgeCoordinate('south', -0.1)}
                title="Subtract 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => nudgeCoordinate('south', 0.1)}
                title="Add 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* East Longitude */}
          <div className="bg-[#101b2e] border border-cyan-500/30 rounded-lg p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">East Longitude</span>
              <span className="text-[9px] font-mono text-cyan-400">gmd:eastBoundLongitude</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                id="extent-east-input"
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={extent.east}
                onChange={(e) =>
                  onChangeExtent({
                    ...extent,
                    east: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#080e1a] border border-cyan-500/30 rounded px-2 py-1 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => nudgeCoordinate('east', -0.1)}
                title="Subtract 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => nudgeCoordinate('east', 0.1)}
                title="Add 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* North Latitude */}
          <div className="bg-[#101b2e] border border-cyan-500/30 rounded-lg p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">North Latitude</span>
              <span className="text-[9px] font-mono text-cyan-400">gmd:northBoundLatitude</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                id="extent-north-input"
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={extent.north}
                onChange={(e) =>
                  onChangeExtent({
                    ...extent,
                    north: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#080e1a] border border-cyan-500/30 rounded px-2 py-1 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => nudgeCoordinate('north', -0.1)}
                title="Subtract 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => nudgeCoordinate('north', 0.1)}
                title="Add 0.1°"
                className="px-1.5 py-1 bg-[#142644] hover:bg-[#1a345c] text-cyan-300 rounded text-xs transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
