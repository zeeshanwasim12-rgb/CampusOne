import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Search,
  X,
  Building2,
  DoorClosed,
  Layers,
  Info,
  Navigation,
  Compass,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  ChevronDown,
  ChevronUp,
  Globe2,
  LayoutGrid,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { LOCATION_TYPES, locationTypeStyles } from '../utils/constants';

// ─── Marker colour config per location type ────────────────────────────
const pinConfig = {
  department: { color: '#2563eb', bg: 'bg-brand-600', emoji: '🏛️' },
  cabin: { color: '#9333ea', bg: 'bg-purple-600', emoji: '🚪' },
  classroom: { color: '#d97706', bg: 'bg-amber-500', emoji: '📚' },
  lab: { color: '#059669', bg: 'bg-emerald-600', emoji: '🔬' },
  library: { color: '#4f46e5', bg: 'bg-indigo-600', emoji: '📖' },
  cafeteria: { color: '#ea580c', bg: 'bg-orange-500', emoji: '☕' },
  office: { color: '#475569', bg: 'bg-slate-600', emoji: '🏢' },
  facility: { color: '#0d9488', bg: 'bg-teal-600', emoji: '⚙️' },
};

const typeLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// ─── Custom Leaflet divIcon factory ────────────────────────────────────
function createCustomIcon(type, isSelected = false) {
  const cfg = pinConfig[type] || pinConfig.facility;
  const size = isSelected ? 40 : 32;
  const borderWidth = isSelected ? 3 : 2;
  return L.divIcon({
    className: 'campus-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        background: ${cfg.color};
        border: ${borderWidth}px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25)${isSelected ? ', 0 0 0 4px ' + cfg.color + '40' : ''};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: ${isSelected ? '16px' : '13px'};
          line-height: 1;
        ">${cfg.emoji}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// ─── MIT-ADT / Loni Kalbhor area default centre ────────────────────────
const DEFAULT_CENTER = [18.4763, 73.9300];
const DEFAULT_ZOOM = 16;

// ─── Map view helper: fly to a location ────────────────────────────────
function FlyToLocation({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location?.geo?.lat != null && location?.geo?.lng != null) {
      map.flyTo([location.geo.lat, location.geo.lng], 18, { duration: 0.8 });
    }
  }, [location, map]);
  return null;
}

// ─── Tile layer options ────────────────────────────────────────────────
const TILE_LAYERS = {
  streets: {
    label: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
  topo: {
    label: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function CampusMap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('focus');

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState(null);
  const [mapView, setMapView] = useState('map'); // 'map' | 'schematic'
  const [tileLayer, setTileLayer] = useState('streets');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ ...(debouncedSearch && { search: debouncedSearch }), ...(type && { type }) }),
    [debouncedSearch, type]
  );
  const { data: locations, loading, error, refetch } = useApi('/campus', { params });

  // When arriving with ?focus=<id>, select that pin once data loads.
  const focusedOnce = useRef(false);
  useEffect(() => {
    if (focusId && locations?.length && !focusedOnce.current) {
      const found = locations.find((l) => String(l._id) === String(focusId));
      if (found) {
        setSelected(found);
        focusedOnce.current = true;
      }
    }
  }, [focusId, locations]);

  const clearFocus = () => {
    setSelected(null);
    if (focusId) setSearchParams({}, { replace: true });
  };

  const locationCount = locations?.length || 0;
  const geoLocations = (locations || []).filter((l) => l.geo?.lat != null && l.geo?.lng != null);

  return (
    <div className="campus-map-page">
      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Compass size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Virtual Campus Map</h1>
              <p className="mt-0.5 text-sm text-brand-100">
                Explore departments, labs, cabins and facilities across MIT School of Computing.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <MapPin size={12} /> {locationCount} locations
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <Globe2 size={12} /> OpenStreetMap
            </span>
          </div>
        </div>
      </div>

      {/* ── Search + filter controls ────────────────────────────────── */}
      <div className="mb-4 space-y-3">
        <div className="card overflow-hidden border-slate-200/80 shadow-card">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 pr-10"
                placeholder="Search locations, buildings or rooms…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View toggles */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={() => setMapView('map')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    mapView === 'map'
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Globe2 size={13} /> Map
                </button>
                <button
                  onClick={() => setMapView('schematic')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    mapView === 'schematic'
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid size={13} /> Schematic
                </button>
              </div>

              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  filtersOpen || type
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={13} />
                Filters
                {type && (
                  <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">1</span>
                )}
              </button>
            </div>
          </div>

          {/* Expandable filter chips */}
          {filtersOpen && (
            <div className="animate-slide-up border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Location type
              </p>
              <div className="flex flex-wrap gap-1.5">
                <TypeChip active={!type} onClick={() => setType('')}>
                  All
                </TypeChip>
                {LOCATION_TYPES.map((t) => (
                  <TypeChip key={t} active={type === t} onClick={() => setType(type === t ? '' : t)}>
                    <span className={`inline-block h-2 w-2 rounded-full ${pinConfig[t]?.bg || 'bg-slate-500'}`} />
                    {typeLabel(t)}
                  </TypeChip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner label="Loading campus map…" />
        </div>
      ) : error ? (
        <EmptyState
          icon={MapPin}
          title="Couldn't load the map"
          message={error}
          action={
            <button className="btn-secondary" onClick={refetch}>
              Retry
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* ── Map area ──────────────────────────────────────────── */}
          <div className="min-w-0">
            {mapView === 'map' ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-card">
                {/* Tile layer switcher */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {geoLocations.length} of {locationCount} locations with GPS coordinates
                  </span>
                  <div className="flex gap-1">
                    {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                      <button
                        key={key}
                        onClick={() => setTileLayer(key)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                          tileLayer === key
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>

                <LeafletMap
                  locations={geoLocations}
                  allLocations={locations || []}
                  selected={selected}
                  onSelect={setSelected}
                  tileLayer={tileLayer}
                />
              </div>
            ) : (
              <SchematicMap locations={locations || []} selected={selected} onSelect={setSelected} />
            )}

            <Legend />
          </div>

          {/* ── Detail sidebar ────────────────────────────────────── */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            {selected ? (
              <LocationDetail location={selected} onClose={clearFocus} />
            ) : (
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-br from-slate-50 to-brand-50/30 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                    <Info size={26} />
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Click any pin on the map to see building, floor, room and department details.
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    {locationCount} locations mapped.
                  </p>
                </div>
                {/* Quick stats */}
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100">
                  {LOCATION_TYPES.slice(0, 4).map((t) => {
                    const count = (locations || []).filter((l) => l.type === t).length;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setType(t);
                          setFiltersOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-left text-xs transition hover:bg-slate-50"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${pinConfig[t]?.bg}`} />
                        <span className="font-medium text-slate-600">{typeLabel(t)}</span>
                        <span className="ml-auto font-bold text-slate-800">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location list below sidebar */}
            <div className="mt-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-card transition hover:shadow-card-hover"
              >
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-brand-600" />
                  All Locations ({locationCount})
                </span>
                {sidebarCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              {!sidebarCollapsed && (
                <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200/80 bg-white shadow-card">
                  {(locations || []).length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">No locations match your filters.</p>
                  ) : (
                    (locations || []).map((l) => (
                      <button
                        key={l._id}
                        onClick={() => setSelected(l)}
                        className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left transition last:border-0 hover:bg-brand-50/50 ${
                          selected && String(selected._id) === String(l._id)
                            ? 'bg-brand-50 ring-1 ring-brand-200'
                            : ''
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${pinConfig[l.type]?.bg || 'bg-slate-500'}`}>
                          <MapPin size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">{l.name}</p>
                          <p className="truncate text-[11px] text-slate-400">
                            {[l.building, l.floor && `Floor ${l.floor}`, l.roomNumber].filter(Boolean).join(' · ') || typeLabel(l.type)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LEAFLET MAP (OpenStreetMap)
// ═══════════════════════════════════════════════════════════════════════
function LeafletMap({ locations, allLocations, selected, onSelect, tileLayer }) {
  const mapRef = useRef(null);
  const tile = TILE_LAYERS[tileLayer] || TILE_LAYERS.streets;

  // Determine map center from locations or default
  const center = useMemo(() => {
    if (locations.length === 0) return DEFAULT_CENTER;
    const avgLat = locations.reduce((s, l) => s + l.geo.lat, 0) / locations.length;
    const avgLng = locations.reduce((s, l) => s + l.geo.lng, 0) / locations.length;
    return [avgLat, avgLng];
  }, [locations]);

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="campus-leaflet-map"
      style={{ height: '520px', width: '100%' }}
      ref={mapRef}
      zoomControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />

      {selected && <FlyToLocation location={selected} />}

      {locations.map((l) => {
        const isSel = selected && String(selected._id) === String(l._id);
        return (
          <Marker
            key={l._id}
            position={[l.geo.lat, l.geo.lng]}
            icon={createCustomIcon(l.type, isSel)}
            eventHandlers={{ click: () => onSelect(l) }}
          >
            <Popup className="campus-popup" maxWidth={260}>
              <div className="text-center">
                <span
                  className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    locationTypeStyles[l.type] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {typeLabel(l.type)}
                </span>
                <p className="text-sm font-bold text-slate-800">{l.name}</p>
                {l.building && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {l.building}
                    {l.floor ? `, Floor ${l.floor}` : ''}
                    {l.roomNumber ? `, Room ${l.roomNumber}` : ''}
                  </p>
                )}
                {l.description && (
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{l.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SCHEMATIC MAP (original pin-on-grid view, preserved)
// ═══════════════════════════════════════════════════════════════════════
function SchematicMap({ locations, selected, onSelect }) {
  const withCoords = locations.filter(
    (l) => l.coords && typeof l.coords.x === 'number' && typeof l.coords.y === 'number'
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-card"
      style={{ aspectRatio: '4 / 3' }}
    >
      {/* Decorative campus backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(0deg, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        {/* central quad */}
        <div className="absolute left-1/2 top-1/2 h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-emerald-50/80 shadow-inner" />
        {/* pathways */}
        <div className="absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 bg-white/60" />
        <div className="absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 bg-white/60" />
        {/* diagonal accents */}
        <div className="absolute left-0 top-0 h-full w-full opacity-30"
          style={{
            backgroundImage: 'linear-gradient(135deg, transparent 45%, rgba(148,163,184,0.05) 45%, rgba(148,163,184,0.05) 55%, transparent 55%)',
          }}
        />
      </div>

      {withCoords.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-400">
          No mapped locations match your filters.
        </div>
      ) : (
        withCoords.map((l) => {
          const isSel = selected && String(selected._id) === String(l._id);
          const cfg = pinConfig[l.type] || pinConfig.facility;
          return (
            <button
              key={l._id}
              onClick={() => onSelect(l)}
              title={l.name}
              className="group absolute -translate-x-1/2 -translate-y-full focus:outline-none"
              style={{ left: `${l.coords.x}%`, top: `${l.coords.y}%` }}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white transition-all duration-200 ${cfg.bg} ${
                  isSel ? 'scale-130 ring-brand-300 ring-3' : 'group-hover:scale-115'
                }`}
                style={isSel ? { boxShadow: `0 0 0 4px ${cfg.color}30, 0 4px 12px rgba(0,0,0,0.2)` } : {}}
              >
                <MapPin size={15} />
              </span>
              <span
                className={`pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 ${
                  isSel ? 'opacity-100' : ''
                }`}
              >
                {l.name}
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LEGEND
// ═══════════════════════════════════════════════════════════════════════
function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-white/80 px-4 py-2.5 text-xs text-slate-500 backdrop-blur-sm">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Legend</span>
      {LOCATION_TYPES.map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-full shadow-sm ${pinConfig[t]?.bg}`} />
          <span className="font-medium">{typeLabel(t)}</span>
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LOCATION DETAIL CARD
// ═══════════════════════════════════════════════════════════════════════
function LocationDetail({ location: l, onClose }) {
  const cfg = pinConfig[l.type] || pinConfig.facility;
  const meta = [
    l.building && ['Building', l.building],
    l.floor && ['Floor', l.floor],
    l.roomNumber && ['Room', l.roomNumber],
    l.department?.name && ['Department', l.department.name],
  ].filter(Boolean);

  return (
    <div className="card overflow-hidden animate-slide-up">
      {/* Coloured header strip */}
      <div
        className="px-5 pb-4 pt-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
              {typeLabel(l.type)}
            </span>
            <h3 className="mt-2 text-lg font-bold leading-snug">{l.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/15 p-1.5 transition hover:bg-white/25"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-5">
        {l.description && (
          <p className="mb-4 text-sm leading-relaxed text-slate-600">{l.description}</p>
        )}

        {meta.length > 0 && (
          <dl className="mb-4 space-y-2.5">
            {meta.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <dt className="flex items-center gap-2 text-slate-400">
                  <Building2 size={13} />
                  {label}
                </dt>
                <dd className="font-semibold text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {l.faculty && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-brand-800">
              <DoorClosed size={15} /> {l.faculty.name}
            </p>
            {l.faculty.designation && (
              <p className="mt-0.5 text-sm text-brand-600">{l.faculty.designation}</p>
            )}
            {l.faculty.cabinNumber && (
              <p className="text-sm text-brand-600">Cabin {l.faculty.cabinNumber}</p>
            )}
            {l.faculty.availability && (
              <p className="mt-1.5 rounded-md bg-white/60 px-2 py-1 text-xs text-brand-500">
                {l.faculty.availability}
              </p>
            )}
          </div>
        )}

        {l.amenities?.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Layers size={12} /> Amenities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {l.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {l.geo?.lat != null && l.geo?.lng != null && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${l.geo.lat},${l.geo.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            <Navigation size={16} /> Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TYPE CHIP
// ═══════════════════════════════════════════════════════════════════════
function TypeChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
