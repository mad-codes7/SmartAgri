/**
 * SmartAgri AI - Sidebar Navigation (i18n)
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const { t, lang, changeLang, LANGUAGES } = useLang();

    const NAV_ITEMS = [
        { path: '/', icon: '📊', label: t.nav_dashboard },
        { path: '/recommend', icon: '🌱', label: t.nav_crop_advisory },
        { path: '/market', icon: '📈', label: t.nav_market },
        { path: '/weather', icon: '🌤️', label: t.nav_weather },
        { path: '/crops', icon: '🌾', label: t.nav_crops },
        { path: '/schemes', icon: '🏛️', label: t.nav_schemes },
        { path: '/history', icon: '📋', label: t.nav_history },
    ];

    const TOOL_ITEMS = [
        { path: '/disease', icon: '🔬', label: t.nav_disease || 'Disease Detection' },
        { path: '/map', icon: '🗺️', label: t.nav_map || 'Farm Map' },
    ];

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99,
                display: window.innerWidth <= 768 ? 'block' : 'none'
            }} />}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon">🌾</div>
                    <div>
                        <h2>{t.smartagri_ai}</h2>
                        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>AI Advisory</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">{t.nav_main_menu}</div>
                    {NAV_ITEMS.slice(0, 3).map(item => (
                        <NavLink key={item.path} to={item.path} end={item.path === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}

                    <div className="nav-section-label">{t.nav_intelligence}</div>
                    {NAV_ITEMS.slice(3).map(item => (
                        <NavLink key={item.path} to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}

                    <div className="nav-section-label">🤖 {t.nav_ai_tools || 'AI Tools'}</div>
                    {TOOL_ITEMS.map(item => (
                        <NavLink key={item.path} to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Language Switcher */}
                <div style={{ padding: '0.75rem 1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🌐 {t.language}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {Object.entries(LANGUAGES).map(([code, info]) => (
                            <button key={code} onClick={() => changeLang(code)} style={{
                                flex: 1, padding: '0.4rem', fontSize: '0.72rem', fontWeight: lang === code ? 700 : 400,
                                background: lang === code ? 'rgba(74, 222, 128, 0.25)' : 'rgba(255,255,255,0.06)',
                                border: lang === code ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px', color: lang === code ? '#4ade80' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                            }}>
                                {info.nativeName}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <NavLink to="/profile" onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer', padding: '0.35rem', borderRadius: 10, transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4ade80, #facc15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.9rem', fontWeight: 700, color: '#166534'
                            }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'F'}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'Farmer'}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{user?.state || 'India'}</div>
                            </div>
                        </div>
                    </NavLink>
                    <button onClick={logout} style={{
                        width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                        color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.8rem',
                        fontFamily: 'inherit', fontWeight: 500
                    }}>
                        {t.logout}
                    </button>
                </div>
            </aside>
        </>
    );
}
