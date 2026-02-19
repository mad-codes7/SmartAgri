/**
 * SmartAgri AI - Crop Recommendation Page (i18n)
 */
import { useState } from 'react';
import api from '../api';
import { useLang } from '../context/LanguageContext';

const STATES = [
    'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan',
    'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Haryana',
    'Kerala', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Odisha'
];

export default function Recommend() {
    const { t } = useLang();
    const STEPS = [t.step_location, t.step_soil, t.step_weather, t.step_results];
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [form, setForm] = useState({
        state: '', district: '', land_size_acres: 2, irrigation_type: 'Rainfed',
        previous_crop: '', N: 60, P: 40, K: 40, ph: 6.5, soil_type: 'Loamy',
        temperature: 28, humidity: 70, rainfall: 150, season: 'Kharif'
    });

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
    const updateNum = (field) => (e) => setForm({ ...form, [field]: parseFloat(e.target.value) });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                state: form.state, district: form.district,
                land_size_acres: form.land_size_acres, irrigation_type: form.irrigation_type,
                previous_crop: form.previous_crop,
                soil: { N: form.N, P: form.P, K: form.K, ph: form.ph, soil_type: form.soil_type },
                weather: { temperature: form.temperature, humidity: form.humidity, rainfall: form.rainfall, season: form.season },
            };
            const res = await api.post('/recommend/', payload);
            setResults(res.data);
            setStep(3);
        } catch (err) {
            alert(err.response?.data?.detail || 'Recommendation failed');
        } finally { setLoading(false); }
    };

    const nextStep = () => {
        if (step === 2) handleSubmit();
        else setStep(step + 1);
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>🌱 {t.crop_advisory}</h1>
                <p>{t.crop_advisory_desc}</p>
            </div>
            <div className="step-indicator">
                {STEPS.map((label, i) => (
                    <div key={i} className={`step ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
                        <div className="step-number">{i < step ? '✓' : i + 1}</div>
                        <span className="step-label">{label}</span>
                    </div>
                ))}
            </div>

            {step < 3 ? (
                <div className="card card-elevated" style={{ maxWidth: 700, margin: '0 auto' }}>
                    {step === 0 && (
                        <div className="animate-fade-in">
                            <h3 style={{ marginBottom: '1.25rem' }}>📍 {t.location_farm_details}</h3>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">{t.state}</label>
                                    <select className="form-select" value={form.state} onChange={update('state')} required>
                                        <option value="">{t.select_state}</option>
                                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.district}</label>
                                    <input className="form-input" placeholder={t.district} value={form.district} onChange={update('district')} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">{t.land_size}</label>
                                    <div className="slider-container">
                                        <span className="slider-value">{form.land_size_acres} acres</span>
                                        <input type="range" min="0.5" max="50" step="0.5" value={form.land_size_acres} onChange={updateNum('land_size_acres')} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t.irrigation_type}</label>
                                    <select className="form-select" value={form.irrigation_type} onChange={update('irrigation_type')}>
                                        <option value="Rainfed">Rainfed</option>
                                        <option value="Canal">Canal</option>
                                        <option value="Borewell">Borewell</option>
                                        <option value="Drip">Drip Irrigation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.previous_crop}</label>
                                <input className="form-input" placeholder="e.g. Rice, Wheat" value={form.previous_crop} onChange={update('previous_crop')} />
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h3 style={{ marginBottom: '1.25rem' }}>🧪 {t.soil_data}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                {t.soil_data_desc}
                            </p>
                            <div className="grid-2">
                                {[
                                    { key: 'N', label: t.nitrogen, max: 150, unit: 'kg/ha' },
                                    { key: 'P', label: t.phosphorus, max: 150, unit: 'kg/ha' },
                                    { key: 'K', label: t.potassium, max: 250, unit: 'kg/ha' },
                                    { key: 'ph', label: t.soil_ph, max: 10, unit: '', step: 0.1 },
                                ].map(({ key, label, max, unit, step: s }) => (
                                    <div className="form-group" key={key}>
                                        <label className="form-label">{label}</label>
                                        <div className="slider-container">
                                            <span className="slider-value">{form[key]} {unit}</span>
                                            <input type="range" min={key === 'ph' ? 3.5 : 0} max={max} step={s || 1}
                                                value={form[key]} onChange={updateNum(key)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.soil_type}</label>
                                <select className="form-select" value={form.soil_type} onChange={update('soil_type')}>
                                    {['Loamy', 'Clayey', 'Sandy', 'Red', 'Black', 'Alluvial', 'Laterite'].map(s =>
                                        <option key={s} value={s}>{s}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h3 style={{ marginBottom: '1.25rem' }}>🌤️ {t.weather_season}</h3>
                            <div className="form-group">
                                <label className="form-label">{t.season}</label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {['Kharif', 'Rabi', 'Summer'].map(s => (
                                        <button key={s} type="button"
                                            className={`btn ${form.season === s ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setForm({ ...form, season: s })} style={{ flex: 1 }}>
                                            {s === 'Kharif' ? '🌧️' : s === 'Rabi' ? '❄️' : '☀️'} {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid-2">
                                {[
                                    { key: 'temperature', label: t.temperature, max: 45, unit: '°C' },
                                    { key: 'humidity', label: t.humidity, max: 100, unit: '%' },
                                ].map(({ key, label, max, unit }) => (
                                    <div className="form-group" key={key}>
                                        <label className="form-label">{label}</label>
                                        <div className="slider-container">
                                            <span className="slider-value">{form[key]} {unit}</span>
                                            <input type="range" min="5" max={max} value={form[key]} onChange={updateNum(key)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t.avg_rainfall}</label>
                                <div className="slider-container">
                                    <span className="slider-value">{form.rainfall} mm</span>
                                    <input type="range" min="0" max="400" value={form.rainfall} onChange={updateNum('rainfall')} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                        {step > 0 && <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>← {t.back}</button>}
                        <button className="btn btn-primary" onClick={nextStep} disabled={loading} style={{ marginLeft: 'auto' }}>
                            {loading ? `🔄 ${t.analyzing}` : step === 2 ? `🔍 ${t.get_recommendations}` : `${t.next} →`}
                        </button>
                    </div>
                </div>
            ) : results && (
                <Results data={results} onReset={() => { setStep(0); setResults(null); }} />
            )}
        </div>
    );
}

function Results({ data, onReset }) {
    const { t } = useLang();
    const [openTip, setOpenTip] = useState(-1);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>🎯 {t.top_crop_recommendations}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {data.state} • {data.season}
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={onReset}>← {t.new_analysis}</button>
            </div>

            <div className="grid-3 stagger" style={{ marginBottom: '2rem' }}>
                {data.crops.map((crop, i) => (
                    <div key={i} className={`crop-card rank-${i + 1}`}>
                        <div className="crop-rank">#{i + 1}</div>
                        <h3>{crop.name}</h3>
                        <span className={`badge badge-${crop.risk_level.includes('Low') ? 'low' : crop.risk_level.includes('High') ? 'high' : 'medium'}`}>
                            {crop.risk_level}
                        </span>
                        <div className="profit-value">{crop.estimated_profit}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.estimated_profit}</div>
                        <div className="crop-stats">
                            <div className="crop-stat"><div className="crop-stat-label">{t.yield_label}</div><div className="crop-stat-value">{crop.expected_yield}</div></div>
                            <div className="crop-stat"><div className="crop-stat-label">{t.price}</div><div className="crop-stat-value">{crop.predicted_price}</div></div>
                            <div className="crop-stat"><div className="crop-stat-label">{t.cost}</div><div className="crop-stat-value">{crop.estimated_cost}</div></div>
                            <div className="crop-stat"><div className="crop-stat-label">{t.score}</div><div className="crop-stat-value">{crop.suitability_score}%</div></div>
                        </div>
                        <div className="reason">💡 {crop.why_this_crop}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>📈 {t.market_insight}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(data.market_insight).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                <span style={{ fontWeight: 600 }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>⚠️ {t.risk_assessment}</h3>
                    <div className="risk-gauge">
                        <div className="gauge-circle" style={{
                            background: `conic-gradient(${data.risk_assessment.overall_level.includes('Low') ? 'var(--risk-low)' :
                                data.risk_assessment.overall_level.includes('High') ? 'var(--risk-high)' : 'var(--risk-medium)'
                                } ${data.risk_assessment.overall_score * 360}deg, var(--gray-200) 0deg)`
                        }}>
                            <div className="gauge-inner">
                                <div className="gauge-value">{(data.risk_assessment.overall_score * 100).toFixed(0)}%</div>
                                <div className="gauge-label">{t.risk}</div>
                            </div>
                        </div>
                        <span className={`badge badge-${data.risk_assessment.overall_level.includes('Low') ? 'low' :
                            data.risk_assessment.overall_level.includes('High') ? 'high' : 'medium'
                            }`}>{data.risk_assessment.overall_level}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                        {['climate_risk', 'water_risk', 'market_risk', 'pest_risk'].map(key => (
                            <div key={key} className="crop-stat">
                                <div className="crop-stat-label">{t[key]}</div>
                                <div className="crop-stat-value">{data.risk_assessment[key]}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>💡 {t.productivity_tips}</h3>
                {data.productivity_tips.map((tip, i) => (
                    <div key={i} className={`accordion-item ${openTip === i ? 'open' : ''}`}>
                        <div className="accordion-header" onClick={() => setOpenTip(openTip === i ? -1 : i)}>
                            <span>{tip.title}</span><span className="arrow">▼</span>
                        </div>
                        {openTip === i && (
                            <div className="accordion-body">
                                <span className="tip-category">{tip.category}</span>
                                <p>{tip.description}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
