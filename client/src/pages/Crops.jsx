import { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import api from '../api';

export default function Crops() {
    const { t } = useLang();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/crops/').then(res => {
            setCrops(res.data.items || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>🌾 {t.crops_library || 'Crop Library'}</h1>
                <p>{t.crops_desc || 'Information about various crops'}</p>
            </div>

            <div className="grid-3 stagger">
                {crops.map(crop => (
                    <div key={crop.id} className="card crop-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.15rem' }}>{crop.name}</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    {crop.hindi_name}
                                </div>
                            </div>
                            <span className="badge badge-mid">{(crop.seasons || []).join(', ')}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div className="crop-stat">
                                <div className="crop-stat-label">⏱️ Duration</div>
                                <div className="crop-stat-value">{crop.growth_days} days</div>
                            </div>
                            <div className="crop-stat">
                                <div className="crop-stat-label">🌱 Soil</div>
                                <div className="crop-stat-value">{(crop.soil_types || []).length} types</div>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.85rem', background: '#f8fafc', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569' }}>IDEAL SOIL</div>
                            {(crop.soil_types || []).join(', ')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
