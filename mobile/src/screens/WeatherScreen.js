/**
 * SmartAgri AI Mobile - Weather Screen
 * Live weather with source badge, time-of-day theming, and auto-refresh.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator,
    RefreshControl, Animated, AppState,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

// ── Time-of-day helpers ──────────────────────────
function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 20) return 'evening';
    return 'night';
}

const TOD_CONFIG = {
    morning: { emoji: '🌅', gradient: ['#FFF7ED', '#FFEDD5'], accent: '#EA580C', label: 'Good Morning', bg: '#FFFBF5' },
    afternoon: { emoji: '☀️', gradient: ['#FEF9C3', '#FEF08A'], accent: '#CA8A04', label: 'Good Afternoon', bg: '#FFFEF5' },
    evening: { emoji: '🌇', gradient: ['#FFF1F2', '#FFE4E6'], accent: '#E11D48', label: 'Good Evening', bg: '#FFFBFC' },
    night: { emoji: '🌙', gradient: ['#EEF2FF', '#E0E7FF'], accent: '#4F46E5', label: 'Good Night', bg: '#F8F9FF' },
};

const WEATHER_EMOJI = {
    sunny: '☀️',
    'partly-cloudy': '⛅',
    cloudy: '☁️',
    rainy: '🌧️',
    thunderstorm: '⛈️',
    snowy: '❄️',
    foggy: '🌫️',
};

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export default function WeatherScreen() {
    const { user } = useAuth();
    const { t } = useLang();
    const [current, setCurrent] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [tod, setTod] = useState(getTimeOfDay());

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const intervalRef = useRef(null);

    // ── Fetch weather data ─────────────────────────
    const fetchWeather = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const st = user?.state || 'Maharashtra';
            const dist = user?.district || '';
            const [cur, fcast] = await Promise.all([
                api.get('/weather/current', { params: { state: st, district: dist } }),
                api.get('/weather/forecast', { params: { state: st, days: 5 } }),
            ]);
            setCurrent(cur.data);
            setForecast(fcast.data.forecast || []);
            setLastUpdated(new Date());
            setTod(getTimeOfDay());
            setError(null);
        } catch (e) {
            console.warn('Weather fetch error:', e?.message || e);
            if (!current) setError(e?.message || 'Failed to load weather');
        }
        setLoading(false);
        setRefreshing(false);
    }, [user?.state, user?.district]);

    // ── Initial load + auto-refresh ────────────────
    useEffect(() => {
        fetchWeather();
        intervalRef.current = setInterval(() => fetchWeather(true), AUTO_REFRESH_MS);
        return () => clearInterval(intervalRef.current);
    }, [fetchWeather]);

    // ── Refresh when app comes back to foreground ──
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                setTod(getTimeOfDay());
                fetchWeather(true);
            }
        });
        return () => sub.remove();
    }, [fetchWeather]);

    // ── Pulse animation for live dot ───────────────
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulseAnim]);

    const onRefresh = () => { setRefreshing(true); fetchWeather(); };

    const theme = TOD_CONFIG[tod];
    const isLive = current?.source === 'openweathermap';

    if (loading && !current) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;
    }

    const timeAgo = lastUpdated
        ? `${Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 60000))} min ago`
        : '';

    return (
        <ScrollView
            style={[SHARED.pageContainer, { backgroundColor: theme.bg }]}
            contentContainerStyle={SHARED.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} />}
        >
            {/* ── Time-of-Day Greeting ────────────── */}
            <View style={[styles.greetingRow]}>
                <Text style={{ fontSize: 28 }}>{theme.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.greeting, { color: theme.accent }]}>{theme.label}</Text>
                    <Text style={styles.greetingSub}>{user?.name || 'Farmer'}</Text>
                </View>
                {/* ── Live / Simulated Badge ──── */}
                <View style={[styles.badge, { backgroundColor: isLive ? '#DCFCE7' : '#FEE2E2', borderColor: isLive ? '#86EFAC' : '#FECACA' }]}>
                    <Animated.View style={[styles.dot, { backgroundColor: isLive ? '#22C55E' : '#EF4444', opacity: pulseAnim }]} />
                    <Text style={[styles.badgeText, { color: isLive ? '#15803D' : '#DC2626' }]}>
                        {isLive ? 'Live' : 'Simulated'}
                    </Text>
                </View>
            </View>

            {/* ── Last Updated ────────────────────── */}
            {lastUpdated && (
                <Text style={styles.lastUpdated}>
                    🔄 Updated {timeAgo} • Auto-refreshes every 5 min
                </Text>
            )}

            {/* ── Current Weather Card ────────────── */}
            {current && (
                <View style={[styles.currentCard, { borderColor: theme.accent + '30' }]}>
                    <View style={styles.currentRow}>
                        <Text style={{ fontSize: 60 }}>
                            {WEATHER_EMOJI[current.icon] || '⛅'}
                        </Text>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={[styles.temp, { color: theme.accent }]}>{current.temperature}°C</Text>
                            <Text style={styles.feelsLike}>Feels like {current.feels_like || current.temperature}°C</Text>
                            <Text style={styles.desc}>{current.description}</Text>
                            <Text style={styles.loc}>📍 {current.city || user?.district}, {user?.state}</Text>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { borderColor: theme.accent + '20' }]}>
                            <Text style={styles.statIcon}>💧</Text>
                            <Text style={styles.statVal}>{current.humidity}%</Text>
                            <Text style={styles.statLabel}>Humidity</Text>
                        </View>
                        <View style={[styles.statBox, { borderColor: theme.accent + '20' }]}>
                            <Text style={styles.statIcon}>🌧️</Text>
                            <Text style={styles.statVal}>{current.rainfall}mm</Text>
                            <Text style={styles.statLabel}>Rainfall</Text>
                        </View>
                        <View style={[styles.statBox, { borderColor: theme.accent + '20' }]}>
                            <Text style={styles.statIcon}>💨</Text>
                            <Text style={styles.statVal}>{current.wind_speed} km/h</Text>
                            <Text style={styles.statLabel}>Wind</Text>
                        </View>
                    </View>

                    {current.pressure && (
                        <View style={[styles.statsRow, { marginTop: 8 }]}>
                            <View style={[styles.statBox, { borderColor: theme.accent + '20' }]}>
                                <Text style={styles.statIcon}>🌡️</Text>
                                <Text style={styles.statVal}>{current.pressure} hPa</Text>
                                <Text style={styles.statLabel}>Pressure</Text>
                            </View>
                            <View style={[styles.statBox, { borderColor: theme.accent + '20' }]}>
                                <Text style={styles.statIcon}>👁️</Text>
                                <Text style={styles.statVal}>{current.visibility} km</Text>
                                <Text style={styles.statLabel}>Visibility</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* ── 5-Day Forecast ──────────────────── */}
            <Text style={styles.forecastTitle}>📅 5-Day Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {forecast.map((day, i) => {
                    const isLiveDay = day.source === 'openweathermap';
                    return (
                        <View key={i} style={styles.forecastCard}>
                            <Text style={styles.forecastDay}>
                                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </Text>
                            <Text style={{ fontSize: 30, marginVertical: 6 }}>
                                {day.rainfall > 5 ? '🌧️' : day.temp_max > 35 ? '🔥' : day.temp_max > 30 ? '☀️' : '⛅'}
                            </Text>
                            <Text style={styles.forecastHigh}>{day.temp_max}°</Text>
                            <Text style={styles.forecastLow}>{day.temp_min}°</Text>
                            <Text style={styles.forecastHumidity}>💧 {day.humidity}%</Text>
                            {day.rainfall > 0 && (
                                <Text style={styles.forecastRain}>🌧 {day.rainfall}mm</Text>
                            )}
                            {isLiveDay && <View style={[styles.tinyDot, { backgroundColor: '#22C55E' }]} />}
                        </View>
                    );
                })}
            </ScrollView>

            {/* ── Data Source Footer ──────────────── */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {isLive
                        ? '📡 Live data from OpenWeatherMap API'
                        : '📊 Simulated regional weather data'
                    }
                </Text>
                <Text style={styles.footerSub}>
                    {tod === 'morning' ? '🌾 Great time for early morning irrigation'
                        : tod === 'afternoon' ? '☀️ Avoid spraying pesticides in peak sun'
                            : tod === 'evening' ? '🌿 Good time for field inspection'
                                : '🌙 Plan tomorrow\'s farm activities'}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

    // Greeting
    greetingRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingVertical: 8,
    },
    greeting: { fontSize: 22, fontWeight: '800' },
    greetingSub: { fontSize: 14, color: COLORS.gray500, fontWeight: '500', marginTop: 1 },

    // Live Badge
    badge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1,
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    badgeText: { fontSize: 12, fontWeight: '700' },

    // Last updated
    lastUpdated: {
        fontSize: 11, color: COLORS.gray400, marginBottom: 14, fontWeight: '500',
    },

    // Current
    currentCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        marginBottom: 20,
        ...SHADOWS.md,
    },
    currentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    temp: { fontSize: 40, fontWeight: '900' },
    feelsLike: { fontSize: 13, color: COLORS.gray500, fontWeight: '500' },
    desc: { fontSize: 16, fontWeight: '600', color: COLORS.gray800, marginTop: 2 },
    loc: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
        flex: 1, backgroundColor: COLORS.gray50, borderRadius: 14, padding: 12,
        alignItems: 'center', borderWidth: 1,
    },
    statIcon: { fontSize: 18, marginBottom: 4 },
    statLabel: { fontSize: 11, color: COLORS.gray500, marginTop: 2, fontWeight: '500' },
    statVal: { fontSize: 16, fontWeight: '800', color: COLORS.gray900 },

    // Forecast
    forecastTitle: {
        fontSize: 18, fontWeight: '700', color: COLORS.gray900, marginBottom: 12,
    },
    forecastCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 14,
        marginRight: 10,
        alignItems: 'center',
        width: 95,
        borderWidth: 1,
        borderColor: COLORS.borderSubtle,
        ...SHADOWS.sm,
    },
    forecastDay: { fontSize: 13, fontWeight: '700', color: COLORS.gray800 },
    forecastHigh: { fontSize: 18, fontWeight: '800', color: COLORS.gray900 },
    forecastLow: { fontSize: 14, color: COLORS.gray500 },
    forecastHumidity: { fontSize: 11, color: COLORS.blue500, marginTop: 6, fontWeight: '600' },
    forecastRain: { fontSize: 10, color: COLORS.blue700, marginTop: 2, fontWeight: '600' },
    tinyDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },

    // Footer
    footer: {
        backgroundColor: COLORS.gray50,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderSubtle,
    },
    footerText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    footerSub: { fontSize: 11, color: COLORS.gray400, marginTop: 4, textAlign: 'center' },
});
