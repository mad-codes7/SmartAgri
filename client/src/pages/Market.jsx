import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';

export default function Market() {
    const { user } = useAuth();
    const { t } = useLang();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await api.get('/market/prices', { params: { state: user?.state } });
                setPrices(res.data.prices || []);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchPrices();
    }, [user?.state]);

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>📈 {t.market_prices}</h1>
                <p>{t.market_desc || 'Real-time prices from mandis near you'}</p>
            </div>

            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: '#64748b' }}>{t.crop || 'Crop'}</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>{t.market || 'Market'}</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>{t.price || 'Price'} (₹/Q)</th>
                                <th style={{ padding: '1rem', color: '#64748b' }}>{t.date || 'Date'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prices.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{p.commodity}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{p.market}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.district}, {p.state}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: '#16a34a' }}>₹{p.modal_price}</td>
                                    <td style={{ padding: '1rem', color: '#64748b' }}>
                                        {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {prices.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            No market data available for your region currently.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
