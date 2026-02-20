/**
 * SmartAgri AI Mobile - Weather Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

export default function WeatherScreen() {
    const { user } = useAuth();
    const { t } = useLang();
    const [current, setCurrent] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/weather/current', { params: { state: user?.state } }),
            api.get('/weather/forecast', { params: { state: user?.state, days: 5 } }),
        ]).then(([cur, fcast]) => {
            setCurrent(cur.data);
            setForecast(fcast.data.forecast || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [user?.state]);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <Text style={SHARED.pageTitle}>🌤️ {t.weather_update}</Text>
            <Text style={SHARED.pageSubtitle}>{t.weather_desc || 'Current weather and 5-day forecast'}</Text>

            {/* Current Weather Card */}
            {current && (
                <View style={styles.currentCard}>
                    <View style={styles.currentRow}>
                        <Text style={{ fontSize: 56 }}>
                            {current.icon === 'sunny' ? '☀️' : current.icon === 'partly-cloudy' ? '⛅' : '☁️'}
                        </Text>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={styles.temp}>{current.temperature}°C</Text>
                            <Text style={styles.desc}>{current.description}</Text>
                            <Text style={styles.loc}>📍 {user?.district}, {user?.state}</Text>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>💧 Humidity</Text>
                            <Text style={styles.statVal}>{current.humidity}%</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>🌧️ Rainfall</Text>
                            <Text style={styles.statVal}>{current.rainfall}mm</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>💨 Wind</Text>
                            <Text style={styles.statVal}>{current.wind_speed} km/h</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* 5-Day Forecast */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.gray900, marginTop: 8, marginBottom: 12 }}>
                📅 5-Day Forecast
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {forecast.map((day, i) => (
                    <View key={i} style={styles.forecastCard}>
                        <Text style={styles.forecastDay}>
                            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                        </Text>
                        <Text style={{ fontSize: 28, marginVertical: 6 }}>
                            {day.rainfall > 5 ? '🌧️' : day.temp_max > 30 ? '☀️' : '⛅'}
                        </Text>
                        <Text style={styles.forecastHigh}>{day.temp_max}°</Text>
                        <Text style={styles.forecastLow}>{day.temp_min}°</Text>
                        <Text style={styles.forecastHumidity}>💧 {day.humidity}%</Text>
                    </View>
                ))}
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    currentCard: {
        backgroundColor: COLORS.blue50,
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.blue100,
        marginBottom: 16,
        ...SHADOWS.md,
    },
    currentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    temp: { fontSize: 36, fontWeight: '800', color: COLORS.blue800 },
    desc: { fontSize: 15, fontWeight: '500', color: COLORS.blue900 },
    loc: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10,
        alignItems: 'center', borderWidth: 1, borderColor: COLORS.blue100,
    },
    statLabel: { fontSize: 11, color: COLORS.gray500, marginBottom: 4 },
    statVal: { fontSize: 15, fontWeight: '800', color: COLORS.gray900 },
    forecastCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 14,
        marginRight: 10,
        alignItems: 'center',
        width: 90,
        borderWidth: 1,
        borderColor: COLORS.borderSubtle,
        ...SHADOWS.sm,
    },
    forecastDay: { fontSize: 13, fontWeight: '700', color: COLORS.gray800 },
    forecastHigh: { fontSize: 18, fontWeight: '800', color: COLORS.gray900 },
    forecastLow: { fontSize: 14, color: COLORS.gray500 },
    forecastHumidity: { fontSize: 11, color: COLORS.blue500, marginTop: 6, fontWeight: '600' },
});
