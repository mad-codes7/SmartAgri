/**
 * SmartAgri AI Mobile - Dashboard Screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

const stripMinus = (val) => {
    if (typeof val === 'string') return val.replace(/-/g, '');
    if (typeof val === 'number') return Math.abs(val);
    return val;
};

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
    const [communityPosts, setCommunityPosts] = useState([]);
    const [expenseSummary, setExpenseSummary] = useState(null);
    const [topForecasts, setTopForecasts] = useState([]);
    const [loadingStates, setLoadingStates] = useState({ stats: true, weather: true, regional: true });
    const [refreshing, setRefreshing] = useState(false);

    const loadAll = useCallback(() => {
        const state = user?.state || 'Maharashtra';
        const district = user?.district || null;

        Promise.allSettled([
            api.get('/history/stats').catch(e => { console.log('Stats Error:', e); throw e; }),
            api.get('/weather/current', { params: { state } }).catch(e => { console.log('Weather Error:', e); throw e; }),
            api.get('/crops/regional', { params: { state, ...(district && { district }) } }).catch(e => { console.log('Regional Error:', e); throw e; }),
            api.get('/community/posts', { params: { district, limit: 3 } }).catch(e => { console.log('Community Error:', e); throw e; }),
            api.get('/expenses/summary').catch(e => { console.log('Expense Error:', e); throw e; }),
        ]).then(([s, w, r, c, exp]) => {
            if (s.status === 'fulfilled') setStats(s.value.data);
            if (w.status === 'fulfilled') setWeather(w.value.data);
            if (r.status === 'fulfilled') setRegionalCrops(r.value.data);
            if (c.status === 'fulfilled') setCommunityPosts(c.value.data?.posts || []);
            if (exp.status === 'fulfilled') setExpenseSummary(exp.value.data);

            setLoadingStates({ stats: false, weather: false, regional: false });
            setRefreshing(false);
        });

        // Fetch top harvest forecasts
        api.get('/market/harvest-forecast/bulk', {
            params: { state: user?.state || 'Maharashtra', land_size: user?.land_size || 2 },
        }).then(res => {
            setTopForecasts((res.data?.forecasts || []).slice(0, 3));
        }).catch(() => { });
    }, [user?.state, user?.district]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAll();
    }, [loadAll]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? t.good_morning : hour < 17 ? t.good_afternoon : t.good_evening;



    const AI_TOOLS = [
        { icon: '🗺️', label: t.nav_map || 'Farm Map', screen: 'FarmMap', desc: t.farm_map_desc || 'Explore crop zones & mandis' },
    ];

    const getCropEmoji = (name) => CROP_EMOJI[name?.toLowerCase()] || '🌿';

    return (
        <ScrollView
            style={SHARED.pageContainer}
            contentContainerStyle={SHARED.scrollContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green600]} tintColor={COLORS.green600} />
            }
        >
            {/* Hero Card */}
            <View style={styles.heroCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>{greeting}, {user?.name || 'Farmer'} 👋</Text>
                        <Text style={styles.heroSub}>{t.dashboard_subtitle}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshBtn}
                        onPress={onRefresh}
                        activeOpacity={0.7}
                    >
                        <Text style={{ fontSize: 18 }}>🔄</Text>
                    </TouchableOpacity>
                </View>
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

            {/* 🔮 Harvest Forecast Teaser */}
            {topForecasts.length > 0 && (
                <View style={[SHARED.card, { marginBottom: 14 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={styles.widgetHeader}>🔮 Harvest Price Forecast</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Market')}>
                            <Text style={styles.viewAllText}>View All →</Text>
                        </TouchableOpacity>
                    </View>
                    {topForecasts.map((fc, i) => {
                        const isUp = fc.price_change_pct >= 0;
                        return (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: COLORS.borderSubtle }}>
                                <Text style={{ fontSize: 20, marginRight: 10 }}>{CROP_EMOJI[fc.crop?.toLowerCase()] || '🌿'}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.gray900 }}>{fc.crop}</Text>
                                    <Text style={{ fontSize: 10, color: COLORS.gray400 }}>{fc.days_to_harvest}d to harvest · {fc.confidence} conf.</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.green700 }}>₹{fc.predicted_harvest_price?.toLocaleString('en-IN')}/q</Text>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: isUp ? COLORS.green600 : '#dc2626' }}>
                                        {isUp ? '▲' : '▼'} {Math.abs(fc.price_change_pct)}%
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}


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
                    <Text style={styles.widgetHeader}>💰 {t.expense_tracker || 'Expense Tracker'}</Text>
                    {expenseSummary ? (
                        <>
                            <View style={styles.statGrid}>
                                <View style={styles.statItem}>
                                    <Text style={[SHARED.widgetValue, { color: COLORS.green600, fontSize: 16 }]}>₹{stripMinus(expenseSummary.total_income).toLocaleString()}</Text>
                                    <Text style={SHARED.widgetLabel}>{t.total_income || 'Income'}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[SHARED.widgetValue, { color: '#ef4444', fontSize: 16 }]}>₹{stripMinus(expenseSummary.total_expenses).toLocaleString()}</Text>
                                    <Text style={SHARED.widgetLabel}>{t.total_expenses || 'Expenses'}</Text>
                                </View>
                            </View>
                            <View style={[styles.statItem, { marginTop: 8 }]}>
                                <Text style={[SHARED.widgetValue, { color: expenseSummary.net_profit >= 0 ? COLORS.green600 : '#ef4444' }]}>₹{stripMinus(expenseSummary.net_profit).toLocaleString()}</Text>
                                <Text style={SHARED.widgetLabel}>{expenseSummary.net_profit >= 0 ? (t.net_profit || 'Net Profit') : (t.net_loss || 'Net Loss')}</Text>
                            </View>
                            {expenseSummary.roi_percent !== 0 && (
                                <View style={[styles.roiBadge, { backgroundColor: expenseSummary.roi_percent >= 0 ? '#ecfdf5' : '#fef2f2' }]}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: expenseSummary.roi_percent >= 0 ? COLORS.green700 : '#991b1b' }}>
                                        {expenseSummary.roi_percent >= 0 ? '📈' : '📉'} ROI: {stripMinus(expenseSummary.roi_percent)}%
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
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
                    )}
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

            {/* 🏛️ Government Schemes Banner */}
            <TouchableOpacity
                style={styles.schemesBanner}
                onPress={() => navigation.navigate('Schemes')}
                activeOpacity={0.85}
            >
                <View style={styles.schemesBannerLeft}>
                    <Text style={{ fontSize: 28 }}>🏛️</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.schemesBannerTitle}>Government Schemes</Text>
                    <Text style={styles.schemesBannerSub}>Explore subsidies, loans & farmer welfare programmes</Text>
                </View>
                <Text style={{ fontSize: 16, color: '#fff' }}>→</Text>
            </TouchableOpacity>

            {/* 🤝 Community Banner */}
            <TouchableOpacity
                style={styles.communityBanner}
                onPress={() => navigation.navigate('Community')}
                activeOpacity={0.85}
            >
                <View style={styles.communityBannerLeft}>
                    <Text style={{ fontSize: 28 }}>🤝</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.communityBannerTitle}>Farmer Community</Text>
                    <Text style={styles.communityBannerSub}>
                        {communityPosts.length > 0
                            ? `${communityPosts.length} new post${communityPosts.length > 1 ? 's' : ''} from farmers near you`
                            : 'Connect, share tips & get help from nearby farmers'}
                    </Text>
                </View>
                <Text style={{ fontSize: 16, color: '#fff' }}>→</Text>
            </TouchableOpacity>

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
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    /* ─── Schemes Banner ─── */
    schemesBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#92400e',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
    },
    schemesBannerLeft: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    schemesBannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
    schemesBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 17 },

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

    /* ─── Community Banner ─── */
    communityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: COLORS.green800,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        ...SHADOWS.green,
    },
    communityBannerLeft: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    communityBannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
    communityBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 17 },
    roiBadge: { marginTop: 8, borderRadius: 8, padding: 8, alignItems: 'center' },
});
