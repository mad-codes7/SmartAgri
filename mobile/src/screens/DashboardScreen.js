/**
 * SmartAgri AI Mobile - Dashboard Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

const SEASON_EMOJI = { Kharif: '🌧️', Rabi: '❄️', Summer: '☀️' };
const CROP_EMOJI = {
    rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🧵', chickpea: '🫘',
    lentil: '🫘', 'pigeon peas': '🫘', 'mung bean': '🫘', 'black gram': '🫘',
    'moth beans': '🫘', 'kidney beans': '🫘', sugarcane: '🎋', banana: '🍌',
    mango: '🥭', orange: '🍊', apple: '🍎', grapes: '🍇', watermelon: '🍉',
    muskmelon: '🍈', pomegranate: '🫐', mustard: '🌼', barley: '🌾',
};

export default function DashboardScreen({ navigation }) {
    const { user } = useAuth();
    const { t } = useLang();
    const [stats, setStats] = useState(null);
    const [weather, setWeather] = useState(null);
    const [regionalCrops, setRegionalCrops] = useState(null);
    const [loadingStates, setLoadingStates] = useState({ stats: true, weather: true, regional: true });

    useEffect(() => {
        const state = user?.state || 'Maharashtra';
        const district = user?.district || null;

        Promise.allSettled([
            api.get('/history/stats').catch(e => { console.log('Stats Error:', e); throw e; }),
            api.get('/weather/current', { params: { state } }).catch(e => { console.log('Weather Error:', e); throw e; }),
            api.get('/crops/regional', { params: { state, ...(district && { district }) } }).catch(e => { console.log('Regional Error:', e); throw e; }),
        ]).then(([s, w, r]) => {
            if (s.status === 'fulfilled') setStats(s.value.data);
            if (w.status === 'fulfilled') setWeather(w.value.data);
            if (r.status === 'fulfilled') setRegionalCrops(r.value.data);

            setLoadingStates({
                stats: false,
                weather: false,
                regional: false
            });
        });
    }, [user?.id]); // Re-run if user changes

    const hour = new Date().getHours();
    const greeting = hour < 12 ? t.good_morning : hour < 17 ? t.good_afternoon : t.good_evening;

    const QUICK_ACTIONS = [
        { icon: '🌱', label: t.get_crop_advice, screen: 'Recommend', color: COLORS.green500, bg: COLORS.green50 },
        { icon: '📈', label: t.market_prices, screen: 'Market', color: COLORS.blue500, bg: COLORS.blue50 },
        { icon: '🌤️', label: t.weather_update, screen: 'Weather', color: COLORS.amber500, bg: COLORS.amber50 },
        { icon: '🏛️', label: t.govt_schemes, screen: 'Schemes', color: COLORS.purple500, bg: COLORS.purple50 },
    ];

    const AI_TOOLS = [
        { icon: '🔬', label: t.nav_disease || 'Disease Detection', screen: 'DiseaseDetection', desc: t.disease_detection_desc || 'Scan crop leaves for disease' },
        { icon: '🗺️', label: t.nav_map || 'Farm Map', screen: 'FarmMap', desc: t.farm_map_desc || 'Explore crop zones & mandis' },
    ];

    const getCropEmoji = (name) => CROP_EMOJI[name?.toLowerCase()] || '🌿';

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            {/* Hero Card */}
            <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>{greeting}, {user?.name || 'Farmer'} 👋</Text>
                <Text style={styles.heroSub}>{t.dashboard_subtitle}</Text>
                {user?.state && (
                    <Text style={styles.heroLocation}>📍 {user.district ? `${user.district}, ` : ''}{user.state}</Text>
                )}
                <TouchableOpacity
                    style={styles.heroBtn}
                    onPress={() => navigation.navigate('Recommend')}
                >
                    <Text style={styles.heroBtnText}>🌱 {t.get_crop_recommendation}</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Actions 2×2 */}
            <View style={styles.quickGrid}>
                {QUICK_ACTIONS.map((a) => (
                    <TouchableOpacity
                        key={a.screen}
                        style={SHARED.card}
                        onPress={() => navigation.navigate(a.screen)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                            <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                        </View>
                        <Text style={styles.quickLabel}>{a.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 🌾 Crops in Your Region */}
            {regionalCrops && (
                <View style={styles.regionalSection}>
                    <View style={styles.regionalHeader}>
                        <View>
                            <Text style={styles.regionalTitle}>
                                🌾 {t.crops_in_region || 'Crops in Your Region'}
                            </Text>
                            <Text style={styles.regionalSubtitle}>
                                {SEASON_EMOJI[regionalCrops.season] || '🌿'} {regionalCrops.season} Season
                                {regionalCrops.district ? ` • ${regionalCrops.district}` : ''}, {regionalCrops.state}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewAllBtn}
                            onPress={() => navigation.navigate('Crops')}
                        >
                            <Text style={styles.viewAllText}>{t.view_all || 'View All'} →</Text>
                        </TouchableOpacity>
                    </View>

                    {regionalCrops.soil_types?.length > 0 && (
                        <View style={styles.soilRow}>
                            <Text style={styles.soilLabel}>🪨 Soil: </Text>
                            {regionalCrops.soil_types.map((s, i) => (
                                <View key={i} style={styles.soilChip}>
                                    <Text style={styles.soilChipText}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                        {regionalCrops.crops.map((crop, i) => (
                            <View key={i} style={styles.cropCard}>
                                <View style={styles.cropIconCircle}>
                                    <Text style={{ fontSize: 24 }}>{getCropEmoji(crop.name)}</Text>
                                </View>
                                <Text style={styles.cropName}>{crop.name}</Text>
                                {crop.hindi_name && (
                                    <Text style={styles.cropHindi}>{crop.hindi_name}</Text>
                                )}
                                <View style={styles.cropMeta}>
                                    <Text style={styles.cropDays}>📅 {crop.growth_days || '—'} days</Text>
                                </View>
                                {crop.avg_cost_per_hectare && (
                                    <Text style={styles.cropCost}>
                                        ₹{(crop.avg_cost_per_hectare / 1000).toFixed(0)}K/ha
                                    </Text>
                                )}
                                {crop.cultivation_tips?.[0] && (
                                    <Text style={styles.cropTip} numberOfLines={2}>
                                        💡 {crop.cultivation_tips[0]}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Stats + Weather */}
            <View style={styles.row2}>
                <View style={[SHARED.card, { flex: 1 }]}>
                    <Text style={styles.widgetHeader}>📊 {t.your_farm_stats}</Text>
                    <View style={styles.statGrid}>
                        <View style={styles.statItem}>
                            <Text style={SHARED.widgetValue}>{stats?.total_recommendations || 0}</Text>
                            <Text style={SHARED.widgetLabel}>{t.recommendations}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[SHARED.widgetValue, { fontSize: 18 }]}>{stats?.most_recommended_crop || '—'}</Text>
                            <Text style={SHARED.widgetLabel}>{t.top_crop}</Text>
                        </View>
                    </View>
                    <View style={[styles.statItem, { marginTop: 8 }]}>
                        <Text style={[SHARED.widgetValue, { color: COLORS.green600 }]}>₹{stats?.avg_profit_estimate?.toLocaleString() || '0'}</Text>
                        <Text style={SHARED.widgetLabel}>{t.avg_profit}</Text>
                    </View>
                </View>

                <View style={[SHARED.card, { flex: 1 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.widgetHeader}>🌤️ {t.current_weather}</Text>
                    </View>
                    {weather ? (
                        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                            <Text style={{ fontSize: 36, marginBottom: 4 }}>
                                {weather.icon === 'sunny' ? '☀️' : weather.icon === 'partly-cloudy' ? '⛅' : '☁️'}
                            </Text>
                            <Text style={SHARED.widgetValue}>{weather.temperature}°C</Text>
                            <Text style={{ color: COLORS.gray500, fontSize: 12, marginBottom: 10 }}>{weather.description}</Text>
                            <View style={styles.weatherStats}>
                                <View style={styles.weatherStat}>
                                    <Text style={styles.weatherStatLabel}>💧 {t.humidity}</Text>
                                    <Text style={styles.weatherStatVal}>{weather.humidity}%</Text>
                                </View>
                                <View style={styles.weatherStat}>
                                    <Text style={styles.weatherStatLabel}>🌧️ {t.rainfall}</Text>
                                    <Text style={styles.weatherStatVal}>{weather.rainfall} mm</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.green600} />
                    )}
                </View>
            </View>

            {/* AI Tools */}
            {AI_TOOLS.map((tool) => (
                <TouchableOpacity
                    key={tool.screen}
                    style={[SHARED.card, styles.aiCard]}
                    onPress={() => navigation.navigate(tool.screen)}
                    activeOpacity={0.7}
                >
                    <View style={styles.aiIcon}>
                        <Text style={{ fontSize: 22 }}>{tool.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.aiLabel}>{tool.label}</Text>
                        <Text style={styles.aiDesc}>{tool.desc}</Text>
                    </View>
                    <Text style={{ color: COLORS.green400, fontSize: 18 }}>→</Text>
                </TouchableOpacity>
            ))}

            {/* Tip Banner */}
            <View style={styles.tipBanner}>
                <Text style={styles.tipText}>💡 <Text style={{ fontWeight: '700' }}>Tip:</Text> {t.tip_text}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    heroCard: {
        backgroundColor: COLORS.green800,
        borderRadius: 18,
        padding: 24,
        marginBottom: 16,
        ...SHADOWS.green,
    },
    heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6 },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4, lineHeight: 19 },
    heroLocation: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14, fontWeight: '600' },
    heroBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
    },
    heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    quickIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        alignSelf: 'center',
    },
    quickLabel: {
        fontWeight: '600',
        fontSize: 12,
        color: COLORS.gray800,
        textAlign: 'center',
    },

    /* ─── Regional Crops ─── */
    regionalSection: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.md,
    },
    regionalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    regionalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.gray900 },
    regionalSubtitle: { fontSize: 12, color: COLORS.gray500, marginTop: 3, fontWeight: '500' },
    viewAllBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: COLORS.green50,
    },
    viewAllText: { fontSize: 11, fontWeight: '700', color: COLORS.green700 },
    soilRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 4,
    },
    soilLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray500 },
    soilChip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: COLORS.amber50,
        borderWidth: 1,
        borderColor: COLORS.amber200,
    },
    soilChipText: { fontSize: 10, fontWeight: '600', color: COLORS.amber700 },
    cropCard: {
        width: 140,
        backgroundColor: COLORS.gray50,
        borderRadius: 14,
        padding: 14,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    cropIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.green50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    cropName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 1 },
    cropHindi: { fontSize: 11, color: COLORS.gray500, marginBottom: 6 },
    cropMeta: { flexDirection: 'row', gap: 6, marginBottom: 4 },
    cropDays: { fontSize: 10, color: COLORS.gray500, fontWeight: '500' },
    cropCost: { fontSize: 11, fontWeight: '700', color: COLORS.green600, marginBottom: 4 },
    cropTip: { fontSize: 10, color: COLORS.gray500, lineHeight: 14, fontStyle: 'italic' },

    /* ─── Existing ─── */
    row2: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    widgetHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.gray800,
        marginBottom: 10,
    },
    statGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
    },
    weatherStats: {
        width: '100%',
        gap: 6,
    },
    weatherStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.gray50,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    weatherStatLabel: { fontSize: 11, color: COLORS.gray500 },
    weatherStatVal: { fontSize: 12, fontWeight: '700', color: COLORS.gray800 },
    aiCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
        borderColor: 'rgba(22,163,74,0.1)',
    },
    aiIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.green600,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.green,
    },
    aiLabel: { fontWeight: '700', fontSize: 14, color: COLORS.gray900, marginBottom: 2 },
    aiDesc: { fontSize: 12, color: COLORS.gray500, lineHeight: 16 },
    tipBanner: {
        backgroundColor: COLORS.green50,
        borderWidth: 1,
        borderColor: COLORS.green200,
        borderRadius: 12,
        padding: 14,
        marginTop: 4,
    },
    tipText: { fontSize: 13, color: COLORS.green700, lineHeight: 19 },
});
