import { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import api from '../api';

export default function Chatbot() {
    const { t } = useLang();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([{
        from: 'bot', text: '🌾 Hello! I\'m your SmartAgri AI assistant. Ask me about crops, diseases, weather, schemes, or farming tips!',
        suggestions: ['Best crop for Kharif?', 'How to treat blight?', 'Government schemes', 'Soil health tips']
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const send = async (text) => {
        const msg = text || input.trim();
        if (!msg) return;
        setInput('');
        setMessages(p => [...p, { from: 'user', text: msg }]);
        setLoading(true);
        try {
            const res = await api.post('/chatbot/', { message: msg });
            setMessages(p => [...p, { from: 'bot', text: res.data.reply, suggestions: res.data.suggestions }]);
        } catch {
            setMessages(p => [...p, { from: 'bot', text: 'Sorry, I couldn\'t process that. Please try again!' }]);
        }
        setLoading(false);
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

    return (
        <>
            {/* FAB */}
            <button onClick={() => setOpen(!open)} style={{
                position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
                borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 1000,
                background: open ? '#334155' : 'linear-gradient(135deg, #0a3d1c, #16a34a)',
                boxShadow: open ? '0 6px 24px rgba(0,0,0,0.2)' : '0 6px 24px rgba(22,163,74,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: open ? '1.1rem' : '1.4rem', color: 'white',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: open ? 'scale(0.9)' : 'scale(1)',
            }}>
                {open ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {open && (
                <div style={{
                    position: 'fixed', bottom: 92, right: 24, width: 380, maxHeight: 520,
                    borderRadius: 20, overflow: 'hidden', zIndex: 999,
                    background: 'white',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'chatFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0a3d1c, #15803d)',
                        padding: '1rem 1.25rem', color: 'white',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>🤖</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>SmartAgri AI</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>🟢 Online • Ask me anything</div>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '1rem',
                        maxHeight: 340, display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        background: '#fafcfb',
                    }}>
                        {messages.map((m, i) => (
                            <div key={i}>
                                <div style={{
                                    maxWidth: '85%', padding: '0.6rem 0.85rem',
                                    borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                    background: m.from === 'user' ? 'linear-gradient(135deg, #0a3d1c, #16a34a)' : 'white',
                                    color: m.from === 'user' ? 'white' : '#1e293b',
                                    marginLeft: m.from === 'user' ? 'auto' : '0',
                                    fontSize: '0.82rem', lineHeight: 1.55,
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                    boxShadow: m.from === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
                                }}>
                                    {m.text.split('**').map((part, j) =>
                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                                    )}
                                </div>
                                {m.suggestions && (
                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        {m.suggestions.map((s, j) => (
                                            <button key={j} onClick={() => send(s)} style={{
                                                padding: '0.28rem 0.6rem', fontSize: '0.68rem',
                                                background: 'white', border: '1px solid #edf2ee',
                                                borderRadius: 20, cursor: 'pointer', color: '#16a34a',
                                                fontWeight: 600, transition: 'all 0.2s',
                                                fontFamily: 'inherit',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                            }}
                                                onMouseEnter={e => { e.target.style.background = '#f0fdf4'; e.target.style.borderColor = '#bbf7d0'; }}
                                                onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#edf2ee'; }}
                                            >{s}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', gap: 5, padding: '0.5rem 0.75rem', background: 'white', width: 'fit-content', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
                                        animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                                    }} />
                                ))}
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '0.7rem 0.85rem', borderTop: '1px solid #edf2ee',
                        display: 'flex', gap: '0.5rem', background: 'white',
                    }}>
                        <input
                            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                            placeholder={t.ask_me || "Ask me anything..."}
                            style={{
                                flex: 1, padding: '0.6rem 0.85rem', borderRadius: 24,
                                border: '1.5px solid #edf2ee', outline: 'none',
                                fontSize: '0.82rem', fontFamily: 'inherit',
                                background: '#fafcfb',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#bbf7d0'}
                            onBlur={e => e.target.style.borderColor = '#edf2ee'}
                        />
                        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
                            width: 38, height: 38, borderRadius: '50%', border: 'none',
                            background: input.trim() ? 'linear-gradient(135deg, #0a3d1c, #16a34a)' : '#e2e8f0',
                            color: 'white', cursor: input.trim() ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem',
                            transition: 'all 0.2s',
                            boxShadow: input.trim() ? '0 2px 8px rgba(22,163,74,0.25)' : 'none',
                        }}>➤</button>
                    </div>
                </div>
            )}
        </>
    );
}
