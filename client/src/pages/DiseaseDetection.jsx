import { useState, useRef } from 'react';
import { useLang } from '../context/LanguageContext';
import api from '../api';

export default function DiseaseDetection() {
    const { t } = useLang();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const handleFile = (f) => {
        if (!f || !f.type.startsWith('image/')) return;
        setFile(f);
        setResult(null);
        const reader = new FileReader();
        reader.onload = e => setPreview(e.target.result);
        reader.readAsDataURL(f);
    };

    const diagnose = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await api.post('/disease/diagnose', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setResult(res.data);
        } catch {
            alert('Diagnosis failed. Please try again.');
        }
        setLoading(false);
    };

    const reset = () => { setFile(null); setPreview(null); setResult(null); };

    const confidenceColor = (c) => c > 0.85 ? '#22c55e' : c > 0.7 ? '#f59e0b' : '#ef4444';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>🔬 {t.disease_detection || 'Plant Disease Detection'}</h1>
                <p>{t.disease_detection_desc || 'Upload a photo of your crop leaf to detect diseases and get treatment advice'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Upload Zone */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {!preview ? (
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                            onClick={() => inputRef.current?.click()}
                            style={{
                                padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer',
                                background: dragOver ? 'linear-gradient(135deg, rgba(22,163,74,0.06), rgba(34,197,94,0.1))' : 'linear-gradient(135deg, #fafcfb, #f0fdf4)',
                                border: dragOver ? '2px dashed var(--green-400)' : '2px dashed #d4e5d9',
                                borderRadius: 'var(--radius-xl)',
                                transition: 'all 0.3s',
                                margin: '1.5rem',
                            }}
                        >
                            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.6 }}>🍃</div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                {t.drop_photo || 'Drop leaf photo here'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                {t.or_click || 'or click to browse'} • JPG, PNG
                            </div>
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <img src={preview} alt="Leaf preview" style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} />
                            <div style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                                <button onClick={reset} className="btn btn-secondary" style={{ flex: 1 }}>
                                    ✕ {t.clear || 'Clear'}
                                </button>
                                <button onClick={diagnose} className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                                    {loading ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                            Analyzing...
                                        </span>
                                    ) : `🔬 ${t.diagnose || 'Diagnose'}`}
                                </button>
                            </div>
                        </div>
                    )}
                    <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />
                </div>

                {/* Results / Tips */}
                {result ? (
                    <div className="card animate-slide-up" style={{ overflow: 'visible' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.15rem' }}>📋 {t.diagnosis_results || 'Diagnosis Results'}</h2>
                            <button onClick={reset} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                                {t.new_scan || 'New Scan'}
                            </button>
                        </div>

                        {/* Confidence Bar */}
                        <div style={{
                            background: '#f8faf9', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem',
                            border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: result.disease === 'Healthy' ? '#22c55e' : '#ef4444' }}>
                                    {result.disease === 'Healthy' ? '✅' : '⚠️'} {result.disease}
                                </span>
                                <span style={{ fontWeight: 800, color: confidenceColor(result.confidence) }}>
                                    {(result.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${result.confidence * 100}%`,
                                    background: `linear-gradient(90deg, ${confidenceColor(result.confidence)}, ${confidenceColor(result.confidence)}99)`,
                                    borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                                }} />
                            </div>
                        </div>

                        {result.disease !== 'Healthy' && (
                            <>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t.symptoms || 'Symptoms'}
                                    </h3>
                                    {result.symptoms?.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>
                                            <span style={{ color: '#f59e0b', flexShrink: 0 }}>•</span> {s}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        💊 {t.treatment_lbl || 'Treatment'}
                                    </h3>
                                    {result.treatment?.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>
                                            <span style={{ color: '#22c55e', flexShrink: 0 }}>{i + 1}.</span> {s}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        🛡️ {t.prevention_lbl || 'Prevention'}
                                    </h3>
                                    {result.prevention?.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.3rem', lineHeight: 1.5 }}>
                                            <span style={{ color: '#3b82f6', flexShrink: 0 }}>•</span> {s}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>📸 {t.photo_tips || 'Tips for Best Results'}</h3>
                        {[
                            { icon: '📷', text: t.tip_1 || 'Take a clear close-up of the affected leaf' },
                            { icon: '☀️', text: t.tip_2 || 'Ensure good lighting (natural light is best)' },
                            { icon: '🎯', text: t.tip_3 || 'Focus on the diseased area' },
                            { icon: '🌿', text: t.tip_4 || 'Keep the leaf flat and centered' },
                        ].map((tip, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.65rem 0.85rem', background: i % 2 === 0 ? '#fafcfb' : 'white',
                                borderRadius: 10, marginBottom: '0.35rem', fontSize: '0.82rem', color: 'var(--text-primary)',
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{tip.icon}</span>
                                {tip.text}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
