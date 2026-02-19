import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

const STATES = ['Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Haryana', 'Kerala', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Odisha'];

export default function Register() {
    const { register } = useAuth();
    const { t, lang, changeLang, LANGUAGES } = useLang();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', state: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || t.registration_failed);
        } finally {
            setLoading(false);
        }
    };

    const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginBottom: '1.25rem' }}>
                    {Object.entries(LANGUAGES).map(([code, info]) => (
                        <button key={code} onClick={() => changeLang(code)} style={{
                            padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: lang === code ? 700 : 400,
                            background: lang === code ? 'var(--green-50)' : 'transparent',
                            border: lang === code ? '1px solid var(--green-300)' : '1px solid var(--border-light)',
                            borderRadius: '6px', color: lang === code ? 'var(--green-700)' : 'var(--text-muted)',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                            {info.nativeName}
                        </button>
                    ))}
                </div>

                <div className="logo-section">
                    <div className="logo-icon-lg">🌾</div>
                    <h1 className="text-gradient">{t.smartagri_ai}</h1>
                    <p className="auth-subtitle">{t.join_tagline}</p>
                </div>

                {error && <div className="alert-banner alert-warning">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t.full_name}</label>
                        <input className="form-input" placeholder={t.full_name} value={form.name} onChange={update('name')} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t.email}</label>
                        <input className="form-input" type="email" placeholder="farmer@example.com" value={form.email} onChange={update('email')} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t.password}</label>
                        <input className="form-input" type="password" placeholder="••••••" value={form.password} onChange={update('password')} required minLength={6} />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">{t.phone}</label>
                            <input className="form-input" placeholder="+91 ..." value={form.phone} onChange={update('phone')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t.state}</label>
                            <select className="form-select" value={form.state} onChange={update('state')}>
                                <option value="">{t.select_state}</option>
                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? t.creating_account : t.create_account}
                    </button>
                </form>

                <div className="auth-footer">
                    {t.have_account} <Link to="/login">{t.sign_in}</Link>
                </div>
            </div>
        </div>
    );
}
