import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function Login() {
    const { login } = useAuth();
    const { t, lang, changeLang, LANGUAGES } = useLang();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || t.login_failed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                {/* Language Switcher */}
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
                    <p className="auth-subtitle">{t.tagline}</p>
                </div>

                {error && <div className="alert-banner alert-warning">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t.email}</label>
                        <input className="form-input" type="email" placeholder="farmer@example.com"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t.password}</label>
                        <input className="form-input" type="password" placeholder="••••••"
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? t.signing_in : t.sign_in}
                    </button>
                </form>

                <div className="auth-footer">
                    {t.no_account} <Link to="/register">{t.create_account}</Link>
                </div>
            </div>
        </div>
    );
}
