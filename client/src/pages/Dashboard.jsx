import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useLang();
    const [stats, setStats] = useState(null);
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        Promise.allSettled([
            api.get('/history/stats'),
            api.get('/weather/current', { params: { state: user?.state || 'Maharashtra' } }),
        ]).then(([s, w]) => {
            if (s.status === 'fulfilled') setStats(s.value.data);
            if (w.status === 'fulfilled') setWeather(w.value.data);
        });
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? t.good_morning : hour < 17 ? t.good_afternoon : t.good_evening;

    const QUICK_ACTIONS = [
        { icon: '🌱', label: t.get_crop_advice, path: '/recommend', color: '#22c55e', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' },
        { icon: '📈', label: t.market_prices, path: '/market', color: '#3b82f6', bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)' },
        { icon: '🌤️', label: t.weather_update, path: '/weather', color: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
        { icon: '🏛️', label: t.govt_schemes, path: '/schemes', color: '#8b5cf6', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
    ];

    const AI_TOOLS = [
        { icon: '🔬', label: t.nav_disease || 'Disease Detection', path: '/disease', desc: t.disease_detection_desc || 'Scan crop leaves for disease' },
        { icon: '🗺️', label: t.nav_map || 'Farm Map', path: '/map', desc: t.farm_map_desc || 'Explore crop zones & mandis' },
    ];

    return (
        <div className="animate-fade-in">
            {/* Hero Card */}
            <div className="welcome-card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ position: 'relative' }}>{greeting}, {user?.name || 'Farmer'} 👋</h2>
                <p>{t.dashboard_subtitle}</p>
                <Link to="/recommend" className="btn" style={{
                    background: 'rgba(255,255,255,0.15)', color: 'white',
                    backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
                    position: 'relative',
                }}>
                    🌱 {t.get_crop_recommendation}
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid-4 stagger" style={{ marginBottom: '1.5rem' }}>
                {QUICK_ACTIONS.map(a => (
                    <Link key={a.path} to={a.path} className="card" style={{
                        textDecoration: 'none', textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <div style={{
                            width: 52, height: 52, borderRadius: 14, background: a.bg,
                            margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '1.5rem',
                            border: `1px solid ${a.color}15`,
                        }}>{a.icon}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.label}</div>
                    </Link>
                ))}
            </div>

            {/* Stats + Weather */}
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                    <div className="widget-header">
                        <span className="widget-title">📊 {t.your_farm_stats}</span>
                    </div>
                    <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="widget">
                            <div className="widget-value">{stats?.total_recommendations || 0}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.recommendations}</div>
                        </div>
                        <div className="widget">
                            <div className="widget-value" style={{ fontSize: '1.3rem' }}>{stats?.most_recommended_crop || '—'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.top_crop}</div>
                        </div>
                        <div className="widget" style={{ gridColumn: '1 / -1' }}>
                            <div className="widget-value" style={{ color: 'var(--green-600)' }}>₹{stats?.avg_profit_estimate?.toLocaleString() || '0'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.avg_profit}</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="widget-header">
                        <span className="widget-title">🌤️ {t.current_weather}</span>
                        <span className="badge badge-info">{user?.state || 'India'}</span>
                    </div>
                    {weather ? (
                        <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.35rem' }}>
                                {weather.icon === 'sunny' ? '☀️' : weather.icon === 'partly-cloudy' ? '⛅' : '☁️'}
                            </div>
                            <div className="widget-value">{weather.temperature}°C</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>{weather.description}</div>
                            <div className="grid-2" style={{ gap: '0.5rem', textAlign: 'left' }}>
                                <div className="crop-stat"><div className="crop-stat-label">💧 {t.humidity}</div><div className="crop-stat-value">{weather.humidity}%</div></div>
                                <div className="crop-stat"><div className="crop-stat-label">🌧️ {t.rainfall}</div><div className="crop-stat-value">{weather.rainfall} mm</div></div>
                                <div className="crop-stat"><div className="crop-stat-label">💨 {t.wind_speed}</div><div className="crop-stat-value">{weather.wind_speed} km/h</div></div>
                            </div>
                        </div>
                    ) : <div className="loading-overlay" style={{ padding: '2rem' }}><div className="spinner" /></div>}
                </div>
            </div>

            {/* AI Tools row */}
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                {AI_TOOLS.map(tool => (
                    <Link key={tool.path} to={tool.path} className="card" style={{
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem',
                        background: 'linear-gradient(135deg, rgba(22,163,74,0.03), rgba(34,197,94,0.06))',
                        border: '1px solid rgba(22,163,74,0.1)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, var(--green-500), var(--green-600))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                        }}>{tool.icon}</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                                {tool.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {tool.desc}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', color: 'var(--green-400)', fontSize: '1.2rem' }}>→</div>
                    </Link>
                ))}
            </div>

            <div className="alert-banner alert-success">
                💡 <span><strong>Tip:</strong> {t.tip_text}</span>
            </div>
        </div>
    );
}
