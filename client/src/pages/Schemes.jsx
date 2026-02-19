import { useState, useEffect } from 'react';
import api from '../api';
import { useLang } from '../context/LanguageContext';

export default function Schemes() {
    const { t } = useLang();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/schemes/').then(r => { setSchemes(r.data.items || []); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>🏛️ {t.government_schemes}</h1>
                <p>{t.schemes_desc}</p>
            </div>
            {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
                <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {schemes.map(s => (
                        <div key={s.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <h3>{s.name}</h3>
                                {s.max_land_size && <span className="badge badge-info">≤ {s.max_land_size} ha</span>}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{s.description}</p>
                            <div className="grid-2" style={{ gap: '0.75rem' }}>
                                {s.eligibility && (
                                    <div className="crop-stat"><div className="crop-stat-label">✅ {t.eligibility}</div><div className="crop-stat-value" style={{ fontSize: '0.8rem' }}>{s.eligibility}</div></div>
                                )}
                                {s.benefits && (
                                    <div className="crop-stat"><div className="crop-stat-label">💰 {t.benefits}</div><div className="crop-stat-value" style={{ fontSize: '0.8rem' }}>{s.benefits}</div></div>
                                )}
                            </div>
                            {s.apply_url && (
                                <a href={s.apply_url} target="_blank" rel="noopener" className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                                    {t.apply_now} →
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
