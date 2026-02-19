import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function Profile() {
    const { user, setUser } = useAuth();
    const { t } = useLang();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', state: '', district: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        Promise.allSettled([
            api.get('/auth/me'),
            api.get('/history/stats'),
        ]).then(([p, s]) => {
            if (p.status === 'fulfilled') {
                setProfile(p.value.data);
                setForm({
                    name: p.value.data.name || '',
                    phone: p.value.data.phone || '',
                    state: p.value.data.state || '',
                    district: p.value.data.district || '',
                });
            }
            if (s.status === 'fulfilled') setStats(s.value.data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await api.put('/auth/me', form);
            setProfile(res.data);
            // Update stored user in auth context
            const stored = JSON.parse(localStorage.getItem('smartagri_user') || '{}');
            const updated = { ...stored, ...res.data };
            localStorage.setItem('smartagri_user', JSON.stringify(updated));
            if (setUser) setUser(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            alert('Failed to update profile');
        }
        setSaving(false);
    };

    const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : '—';

    if (loading) return (
        <div className="loading-overlay"><div className="spinner" /><div className="loading-text">{t.loading || 'Loading...'}</div></div>
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>👤 {t.profile || 'My Profile'}</h1>
                <p>{t.profile_desc || 'Manage your account details and farm information'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Profile Card */}
                <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                    <div style={{
                        width: 88, height: 88, borderRadius: '50%', margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg, #4ade80, #facc15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.2rem', fontWeight: 800, color: '#0a3d1c',
                        boxShadow: '0 8px 24px rgba(74,222,128,0.25)',
                        border: '4px solid white',
                    }}>
                        {profile?.name?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>{profile?.name}</h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>{profile?.email}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { icon: '📍', label: t.state || 'State', value: profile?.state || '—' },
                            { icon: '🏘️', label: t.district || 'District', value: profile?.district || '—' },
                            { icon: '📱', label: t.phone || 'Phone', value: profile?.phone || '—' },
                            { icon: '📅', label: t.member_since || 'Member Since', value: memberSince },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.55rem 0.75rem', background: '#fafcfb', borderRadius: 10,
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.icon} {item.label}</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                                📊 {t.farm_activity || 'Farm Activity'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div style={{ padding: '0.65rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 10, border: '1px solid rgba(22,163,74,0.1)' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--green-700)' }}>{stats.total_recommendations || 0}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.recommendations || 'Recommendations'}</div>
                                </div>
                                <div style={{ padding: '0.65rem', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.1)' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3b82f6' }}>₹{stats.avg_profit_estimate?.toLocaleString() || '0'}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.avg_profit || 'Avg Profit'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Form */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem' }}>✏️ {t.edit_profile || 'Edit Profile'}</h2>
                        {saved && (
                            <span className="badge badge-low" style={{ animation: 'fadeIn 0.3s ease-out', padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}>
                                ✅ {t.saved || 'Saved'}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">{t.full_name || 'Full Name'}</label>
                            <input className="form-input" value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Enter your name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t.phone || 'Phone Number'}</label>
                            <input className="form-input" value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="+91 XXXXX XXXXX" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t.state || 'State'}</label>
                            <select className="form-select" value={form.state}
                                onChange={e => setForm(p => ({ ...p, state: e.target.value }))}>
                                <option value="">{t.select_state || 'Select State'}</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t.district || 'District'}</label>
                            <input className="form-input" value={form.district}
                                onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                                placeholder="Enter district" />
                        </div>
                    </div>

                    <div style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <div className="form-group">
                            <label className="form-label">✉️ {t.email || 'Email'}</label>
                            <input className="form-input" value={profile?.email || ''} disabled
                                style={{ background: '#f8faf9', cursor: 'not-allowed', opacity: 0.7 }} />
                            <div className="form-helper">{t.email_locked || 'Email cannot be changed'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button onClick={handleSave} className="btn btn-primary btn-lg" disabled={saving}
                            style={{ flex: 1 }}>
                            {saving ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    {t.saving || 'Saving...'}
                                </span>
                            ) : `💾 ${t.save_changes || 'Save Changes'}`}
                        </button>
                        <button onClick={() => setForm({
                            name: profile?.name || '', phone: profile?.phone || '',
                            state: profile?.state || '', district: profile?.district || '',
                        })} className="btn btn-secondary btn-lg">
                            {t.reset || 'Reset'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
