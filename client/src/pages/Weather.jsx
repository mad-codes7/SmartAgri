import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';

export default function Weather() {
    const { user } = useAuth();
    const { t } = useLang();
    const [current, setCurrent] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const [cur, fcast] = await Promise.all([
                    api.get('/weather/current', { params: { state: user?.state } }),
                    api.get('/weather/forecast', { params: { state: user?.state, days: 5 } }),
                ]);
                setCurrent(cur.data);
                setForecast(fcast.data.forecast || []);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchWeather();
    }, [user?.state]);

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>🌤️ {t.weather_update}</h1>
                <p>{t.weather_desc || 'Current weather and 5-day forecast'}</p>
            </div>

            {/* Current Weather Card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '4rem' }}>
                        {current.icon === 'sunny' ? '☀️' : current.icon === 'partly-cloudy' ? '⛅' : '☁️'}
                    </div>
                    <div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e3a8a' }}>{current.temperature}°C</div>
                        <div style={{ fontSize: '1.1rem', color: '#1e40af', fontWeight: 500 }}>{current.description}</div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>📍 {user?.district}, {user?.state}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
                        <div className="weather-stat">
                            <span>💧 Humidity</span>
                            <strong>{current.humidity}%</strong>
                        </div>
                        <div className="weather-stat">
                            <span>🌧️ Rainfall</span>
                            <strong>{current.rainfall}mm</strong>
                        </div>
                        <div className="weather-stat">
                            <span>💨 Wind</span>
                            <strong>{current.wind_speed} km/h</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecast List */}
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>📅 5-Day Forecast</h2>
            <div className="grid-5 stagger">
                {forecast.map((day, i) => (
                    <div key={i} className="card" style={{ textAlign: 'center', padding: '1.25rem 0.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                        </div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {day.rainfall > 5 ? '🌧️' : day.temp_max > 30 ? '☀️' : '⛅'}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{day.temp_max}°</div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{day.temp_min}°</div>
                        <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                            💧 {day.humidity}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
