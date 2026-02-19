import { useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LanguageContext';

const FARM_ZONES = [
    { name: 'Punjab', crop: 'Wheat & Rice', lat: 30.9, lng: 75.85, color: '#22c55e' },
    { name: 'Maharashtra', crop: 'Sugarcane & Cotton', lat: 19.75, lng: 75.71, color: '#f59e0b' },
    { name: 'Uttar Pradesh', crop: 'Wheat & Sugarcane', lat: 26.85, lng: 80.91, color: '#3b82f6' },
    { name: 'Karnataka', crop: 'Ragi & Coffee', lat: 15.31, lng: 75.71, color: '#8b5cf6' },
    { name: 'Tamil Nadu', crop: 'Rice & Banana', lat: 11.13, lng: 78.66, color: '#ef4444' },
    { name: 'Madhya Pradesh', crop: 'Soybean & Wheat', lat: 23.47, lng: 77.95, color: '#06b6d4' },
    { name: 'Rajasthan', crop: 'Bajra & Mustard', lat: 27.02, lng: 74.22, color: '#d97706' },
    { name: 'Gujarat', crop: 'Cotton & Groundnut', lat: 22.26, lng: 71.19, color: '#ec4899' },
    { name: 'West Bengal', crop: 'Rice & Jute', lat: 22.99, lng: 87.75, color: '#14b8a6' },
    { name: 'Andhra Pradesh', crop: 'Rice & Chili', lat: 15.91, lng: 79.74, color: '#a855f7' },
    { name: 'Telangana', crop: 'Cotton & Rice', lat: 18.11, lng: 79.02, color: '#f97316' },
    { name: 'Kerala', crop: 'Coconut & Rubber', lat: 10.85, lng: 76.27, color: '#10b981' },
    { name: 'Haryana', crop: 'Wheat & Rice', lat: 29.06, lng: 76.09, color: '#6366f1' },
    { name: 'Bihar', crop: 'Rice & Maize', lat: 25.1, lng: 85.31, color: '#e11d48' },
    { name: 'Odisha', crop: 'Rice & Pulses', lat: 20.94, lng: 84.80, color: '#059669' },
];

const MANDIS = [
    { name: 'Azadpur Mandi', city: 'Delhi', lat: 28.71, lng: 77.18, vol: '₹8000 Cr/yr' },
    { name: 'Vashi Mandi', city: 'Mumbai', lat: 19.07, lng: 73.01, vol: '₹5000 Cr/yr' },
    { name: 'Koyambedu', city: 'Chennai', lat: 13.07, lng: 80.19, vol: '₹4000 Cr/yr' },
    { name: 'Gultekdi', city: 'Pune', lat: 18.50, lng: 73.88, vol: '₹3500 Cr/yr' },
    { name: 'Devnhalli', city: 'Bangalore', lat: 13.23, lng: 77.71, vol: '₹3000 Cr/yr' },
    { name: 'Bowenpally', city: 'Hyderabad', lat: 17.47, lng: 78.49, vol: '₹2800 Cr/yr' },
    { name: 'Patna Mandi', city: 'Patna', lat: 25.61, lng: 85.14, vol: '₹2000 Cr/yr' },
    { name: 'Siliguri Mandi', city: 'Siliguri', lat: 26.73, lng: 88.43, vol: '₹1500 Cr/yr' },
];

export default function FarmMap() {
    const { t } = useLang();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [layer, setLayer] = useState('all');

    useEffect(() => {
        if (!window.L || mapInstance.current) return;
        const map = window.L.map(mapRef.current, {
            center: [22.5, 79], zoom: 5, zoomControl: false,
            attributionControl: false,
        });
        window.L.control.zoom({ position: 'topright' }).addTo(map);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18,
        }).addTo(map);
        mapInstance.current = map;
        setLoaded(true);
        return () => { map.remove(); mapInstance.current = null; };
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !loaded) return;
        const map = mapInstance.current;
        map.eachLayer(l => { if (l instanceof window.L.Marker || l instanceof window.L.CircleMarker) map.removeLayer(l); });

        if (layer === 'zones' || layer === 'all') {
            FARM_ZONES.forEach(z => {
                const circle = window.L.circleMarker([z.lat, z.lng], {
                    radius: 16, fillColor: z.color, color: '#fff', weight: 2, fillOpacity: 0.75,
                }).addTo(map);
                circle.bindPopup(`
                    <div style="font-family:Inter,sans-serif;padding:4px 2px">
                        <div style="font-weight:700;font-size:0.95rem;margin-bottom:2px;color:#0f172a">${z.name}</div>
                        <div style="font-size:0.78rem;color:#64748b">${z.crop}</div>
                        <div style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;background:${z.color}14;color:${z.color};font-size:0.65rem;font-weight:600">
                            <span style="width:6px;height:6px;border-radius:50%;background:${z.color};display:inline-block"></span>
                            Active Zone
                        </div>
                    </div>
                `);
            });
        }

        if (layer === 'mandis' || layer === 'all') {
            MANDIS.forEach(m => {
                const marker = window.L.marker([m.lat, m.lng]).addTo(map);
                marker.bindPopup(`
                    <div style="font-family:Inter,sans-serif;padding:4px 2px">
                        <div style="font-weight:700;font-size:0.95rem;color:#0f172a">${m.name}</div>
                        <div style="font-size:0.78rem;color:#64748b;margin-bottom:4px">${m.city}</div>
                        <div style="font-weight:700;color:#16a34a;font-size:0.85rem">${m.vol}</div>
                    </div>
                `);
            });
        }

        // User marker
        const icon = window.L.divIcon({
            html: '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#0a3d1c,#16a34a);display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 4px 12px rgba(22,163,74,0.35),0 0 0 4px rgba(22,163,74,0.15)">🏠</div>',
            iconSize: [28, 28], iconAnchor: [14, 14],
            className: '',
        });
        window.L.marker([19.75, 75.71], { icon }).addTo(map).bindPopup(
            '<div style="font-family:Inter,sans-serif;padding:4px 2px"><div style="font-weight:700;font-size:0.95rem;color:#0f172a">📍 Your Farm</div><div style="font-size:0.78rem;color:#64748b">Maharashtra</div></div>'
        );
    }, [layer, loaded]);

    const LAYERS = [
        { key: 'zones', label: t.crop_zones || 'Crop Zones', icon: '🌿' },
        { key: 'mandis', label: t.mandis || 'Mandis', icon: '🏪' },
        { key: 'all', label: t.show_all || 'Show All', icon: '🔎' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1rem' }}>
                <h1>🗺️ {t.farm_map || 'Farm Intelligence Map'}</h1>
                <p>{t.farm_map_desc || 'Explore crop zones, nearest mandis, and agricultural regions across India'}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {LAYERS.map(l => (
                    <button key={l.key} onClick={() => setLayer(l.key)}
                        className={layer === l.key ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                        {l.icon} {l.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', height: 'calc(100vh - 220px)' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
                    <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-xl)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                    {/* Crop Zones Legend */}
                    <div className="card" style={{ padding: '1rem' }}>
                        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🌿 {t.crop_zones || 'Crop Zones'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {FARM_ZONES.slice(0, 8).map(z => (
                                <div key={z.name} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0',
                                    fontSize: '0.78rem',
                                }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: z.color, flexShrink: 0, boxShadow: `0 0 6px ${z.color}40` }} />
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 70 }}>{z.name}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{z.crop}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mandis Legend */}
                    <div className="card" style={{ padding: '1rem' }}>
                        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🏪 {t.major_mandis || 'Major Mandis'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {MANDIS.slice(0, 6).map(m => (
                                <div key={m.name} style={{
                                    padding: '0.45rem 0.65rem', background: '#fafcfb', borderRadius: 8,
                                    fontSize: '0.78rem', border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 2 }}>
                                        <span>{m.city}</span>
                                        <span style={{ fontWeight: 700, color: 'var(--green-600)' }}>{m.vol}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
