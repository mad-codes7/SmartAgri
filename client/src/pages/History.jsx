import { useState, useEffect } from 'react';
import api from '../api';
import { useLang } from '../context/LanguageContext';

export default function History() {
    const { t } = useLang();
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            api.get('/history/'),
            api.get('/history/stats'),
        ]).then(([h, s]) => {
            if (h.status === 'fulfilled') setItems(h.value.data.items || []);
            if (s.status === 'fulfilled') setStats(s.value.data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>📋 {t.recommendation_history}</h1>
                <p>{t.history_desc}</p>
            </div>

            {stats && (
                <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="widget"><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.total}</div><div className="widget-value">{stats.total_recommendations}</div></div>
                    <div className="widget"><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.top_crop}</div><div className="widget-value" style={{ fontSize: '1.3rem' }}>{stats.most_recommended_crop}</div></div>
                    <div className="widget"><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.avg_profit}</div><div className="widget-value" style={{ color: 'var(--green-600)', fontSize: '1.3rem' }}>₹{stats.avg_profit_estimate?.toLocaleString()}</div></div>
                </div>
            )}

            {loading ? <div className="loading-overlay"><div className="spinner" /></div> : items.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h3>{t.no_recommendations}</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{t.no_recommendations_desc}</p>
                </div>
            ) : (
                <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h4>🌱 {item.top_crop}</h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {item.season} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--green-600)' }}>{item.profit_estimate}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.est_profit}</div>
                                </div>
                                <span className={`badge badge-${item.risk_level?.includes('Low') ? 'low' : item.risk_level?.includes('High') ? 'high' : 'medium'}`}>
                                    {item.risk_level}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
