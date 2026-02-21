/**
 * SmartAgri AI — Interactive Farm Map (Personalized District Intelligence Hub)
 * 5 sections: My District, Mandis, Crops, Nearby, Alerts
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
    ScrollView, Linking, RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

const CROP_EMOJI = {
    sugarcane: '🎋', wheat: '🌾', soybean: '🫘', grapes: '🍇', onion: '🧅',
    tomato: '🍅', orange: '🍊', cotton: '🌸', rice: '🍚', jowar: '🌾',
    pomegranate: '🍎', groundnut: '🥜', banana: '🍌', bajra: '🌾',
    'corn (maize)': '🌽', 'mosambi (sweet lime)': '🍋', turmeric: '🟡',
};
const cropEmoji = (n) => CROP_EMOJI[(n || '').toLowerCase()] || '🌿';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthIdx = (name) => MONTHS_SHORT.findIndex(m => (name || '').toLowerCase().startsWith(m.toLowerCase()));

const TABS = [
    { key: 'overview', icon: '🏠', label: 'My District' },
    { key: 'mandis', icon: '🏪', label: 'Mandis' },
    { key: 'crops', icon: '🌾', label: 'Crops' },
    { key: 'nearby', icon: '🗺️', label: 'Nearby' },
    { key: 'alerts', icon: '⚡', label: 'Alerts' },
    { key: 'contact', icon: '📞', label: 'Krishi' },
];


// ── Overview Section ────────────────────────────────────────
function OverviewSection({ data }) {
    const ov = data.overview;
    const irr = ov?.irrigation || {};
    const coverage = irr.coverage_percent || 0;

    return (
        <View>
            {/* District Banner */}
            <View style={styles.heroBanner}>
                <Text style={styles.heroDistrict}>📍 {data.district}</Text>
                <Text style={styles.heroRegion}>{ov?.region} • {ov?.division} Division</Text>
                <View style={styles.heroChips}>
                    <View style={styles.climateChip}>
                        <Text style={styles.climateText}>🌡️ {ov?.agro_climate}</Text>
                    </View>
                </View>
            </View>

            {/* Soil Types */}
            <View style={[SHARED.card, { marginBottom: 12 }]}>
                <Text style={styles.sectionHead}>🪨 Soil Types</Text>
                <View style={styles.chipRow}>
                    {(ov?.soil_types || []).map((s, i) => (
                        <View key={i} style={styles.soilChip}>
                            <Text style={styles.soilChipText}>{s}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Irrigation */}
            <View style={[SHARED.card, { marginBottom: 12 }]}>
                <Text style={styles.sectionHead}>💧 Irrigation</Text>
                <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={styles.irrLabel}>{irr.type || 'N/A'}</Text>
                        <Text style={[styles.irrLabel, { fontWeight: '800', color: COLORS.green700 }]}>{coverage}%</Text>
                    </View>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${coverage}%` }]} />
                    </View>
                    <Text style={styles.irrSource}>Source: {irr.main_source || '—'}</Text>
                </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{data.crops?.length || 0}</Text>
                    <Text style={styles.statLabel}>Crops</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{data.mandis?.length || 0}</Text>
                    <Text style={styles.statLabel}>Mandis</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{data.nearby_districts?.length || 0}</Text>
                    <Text style={styles.statLabel}>Nearby</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{data.alerts?.length || 0}</Text>
                    <Text style={styles.statLabel}>Alerts</Text>
                </View>
            </View>
        </View>
    );
}


// ── Mandis Section ──────────────────────────────────────────
function MandisSection({ mandis, district }) {
    const dialPhone = (phone) => {
        if (phone) Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    };

    return (
        <View>
            <Text style={styles.sectionHead}>🏪 APMC Mandis near {district}</Text>
            {mandis.map((m, i) => (
                <View key={i} style={[SHARED.card, { marginBottom: 12 }]}>
                    <View style={styles.mandiHeader}>
                        <View style={styles.mandiIcon}>
                            <Text style={{ fontSize: 20 }}>🏪</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.mandiName}>{m.name}</Text>
                            <Text style={styles.mandiAddr}>📍 {m.address}</Text>
                        </View>
                        {m.distance_km != null && (
                            <View style={styles.distBadge}>
                                <Text style={styles.distText}>{m.distance_km === 0 ? 'In city' : `${m.distance_km} km`}</Text>
                            </View>
                        )}
                    </View>

                    {/* Commodities */}
                    <View style={[styles.chipRow, { marginTop: 10 }]}>
                        {(m.commodities || []).map((c, j) => (
                            <View key={j} style={styles.commodityChip}>
                                <Text style={styles.commodityText}>{cropEmoji(c)} {c}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Volume + Contact */}
                    <View style={styles.mandiFooter}>
                        {m.weekly_volume_crore && (
                            <Text style={styles.volumeText}>₹{m.weekly_volume_crore} Cr/week</Text>
                        )}
                        {m.contact && (
                            <TouchableOpacity style={styles.callBtn} onPress={() => dialPhone(m.contact)}>
                                <Text style={styles.callText}>📞 {m.contact}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ))}
            {mandis.length === 0 && (
                <View style={styles.emptyBox}>
                    <Text style={SHARED.emptySubtext}>No mandi data available for this district.</Text>
                </View>
            )}
        </View>
    );
}


// ── Crops Section ────────────────────────────────────────────
function CropsSection({ crops }) {
    return (
        <View>
            <Text style={styles.sectionHead}>🌾 Dominant Crops</Text>
            {crops.map((crop, i) => {
                const sowMonths = (crop.sowing_months || []).map(monthIdx).filter(m => m >= 0);
                const harvMonths = (crop.harvest_months || []).map(monthIdx).filter(m => m >= 0);

                return (
                    <View key={i} style={[SHARED.card, { marginBottom: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <View style={styles.cropIcon}>
                                <Text style={{ fontSize: 24 }}>{cropEmoji(crop.name)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cropName}>{crop.name}</Text>
                                {crop.hindi_name && <Text style={styles.cropHindi}>{crop.hindi_name}</Text>}
                            </View>
                            {crop.area_lakh_ha && (
                                <View style={styles.areaBadge}>
                                    <Text style={styles.areaText}>{crop.area_lakh_ha}L ha</Text>
                                </View>
                            )}
                        </View>

                        {/* Month Timeline */}
                        <View style={styles.timeline}>
                            {MONTHS_SHORT.map((m, idx) => {
                                const isSow = sowMonths.includes(idx);
                                const isHarv = harvMonths.includes(idx);
                                return (
                                    <View key={idx} style={styles.monthCol}>
                                        <View style={[
                                            styles.monthDot,
                                            isSow && styles.monthSow,
                                            isHarv && styles.monthHarv,
                                        ]} />
                                        <Text style={[
                                            styles.monthLabel,
                                            (isSow || isHarv) && { fontWeight: '700', color: COLORS.gray900 }
                                        ]}>{m}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.green500 }]} />
                                <Text style={styles.legendText}>Sowing</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                                <Text style={styles.legendText}>Harvest</Text>
                            </View>
                        </View>

                        {/* Stats */}
                        <View style={styles.cropStats}>
                            <View style={styles.cropStatItem}>
                                <Text style={styles.cropStatLabel}>Yield</Text>
                                <Text style={styles.cropStatVal}>{crop.avg_yield_ton_per_acre} T/acre</Text>
                            </View>
                            <View style={styles.cropStatItem}>
                                <Text style={styles.cropStatLabel}>Price</Text>
                                <Text style={[styles.cropStatVal, { color: COLORS.green700 }]}>₹{crop.avg_price_per_quintal}/q</Text>
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}


// ── Nearby Districts Section ─────────────────────────────────
function NearbySection({ nearby, onExplore, currentDistrict }) {
    return (
        <View>
            <Text style={styles.sectionHead}>🗺️ Nearby Districts</Text>
            <Text style={styles.sectionSub}>Same region as {currentDistrict}. Tap to explore.</Text>
            {nearby.map((d, i) => (
                <TouchableOpacity
                    key={i}
                    style={[SHARED.card, { marginBottom: 10 }]}
                    onPress={() => onExplore(d.name)}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.nearbyIcon}>
                            <Text style={{ fontSize: 18 }}>📍</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.nearbyName}>{d.name}</Text>
                            <Text style={styles.nearbyRegion}>{d.region} • {d.division}</Text>
                        </View>
                        <Text style={{ color: COLORS.green500, fontSize: 18, fontWeight: '700' }}>→</Text>
                    </View>
                    <View style={[styles.chipRow, { marginTop: 8 }]}>
                        {(d.dominant_crops || []).map((c, j) => (
                            <View key={j} style={styles.nearbyCropChip}>
                                <Text style={styles.nearbyCropText}>{cropEmoji(c)} {c}</Text>
                            </View>
                        ))}
                        <View style={styles.mandiCountChip}>
                            <Text style={styles.mandiCountText}>🏪 {d.num_mandis} mandis</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
            {nearby.length === 0 && (
                <View style={styles.emptyBox}>
                    <Text style={SHARED.emptySubtext}>No nearby districts found.</Text>
                </View>
            )}
        </View>
    );
}


// ── Alerts Section ───────────────────────────────────────────
function AlertsSection({ alerts, district }) {
    const dirIcon = { up: '▲', down: '▼', stable: '→' };
    const dirColor = { up: COLORS.green700, down: '#dc2626', stable: COLORS.gray500 };
    const dirBg = { up: COLORS.green50, down: '#fef2f2', stable: COLORS.gray50 };

    return (
        <View>
            <Text style={styles.sectionHead}>⚡ Price Alerts — {district}</Text>
            {alerts.map((a, i) => (
                <View key={i} style={[SHARED.card, { marginBottom: 10, borderLeftWidth: 4, borderLeftColor: dirColor[a.direction] || COLORS.gray300 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 20, marginRight: 8 }}>{cropEmoji(a.crop)}</Text>
                        <Text style={styles.alertCrop}>{a.crop}</Text>
                        <View style={[styles.alertBadge, { backgroundColor: dirBg[a.direction] }]}>
                            <Text style={[styles.alertPct, { color: dirColor[a.direction] }]}>
                                {dirIcon[a.direction]} {a.change_percent}%
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.alertDetail}>{a.detail}</Text>
                </View>
            ))}
            {alerts.length === 0 && (
                <View style={styles.emptyBox}>
                    <Text style={SHARED.emptySubtext}>No price alerts at the moment.</Text>
                </View>
            )}
        </View>
    );
}


// ── No District Prompt ───────────────────────────────────────
function NoDistrictView({ all, onExplore, navigation }) {
    return (
        <View style={{ padding: 16 }}>
            <View style={styles.noBanner}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🗺️</Text>
                <Text style={styles.noTitle}>Set your district to personalize</Text>
                <Text style={styles.noSub}>Go to Profile → select your Maharashtra district for local mandis, crop data, and alerts.</Text>
                <TouchableOpacity
                    style={[SHARED.btnPrimary, { marginTop: 16, alignSelf: 'center' }]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={SHARED.btnPrimaryText}>👤 Go to Profile</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.sectionHead, { marginTop: 20 }]}>🗺️ Explore Maharashtra Districts</Text>
            {(all || []).map((d, i) => (
                <TouchableOpacity
                    key={i}
                    style={[SHARED.card, { marginBottom: 10 }]}
                    onPress={() => onExplore(d.name)}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, marginRight: 10 }}>📍</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.nearbyName}>{d.name}</Text>
                            <Text style={styles.nearbyRegion}>{d.region}</Text>
                        </View>
                        <Text style={{ color: COLORS.green500, fontSize: 16 }}>→</Text>
                    </View>
                    <View style={[styles.chipRow, { marginTop: 6 }]}>
                        {(d.dominant_crops || []).map((c, j) => (
                            <View key={j} style={styles.nearbyCropChip}>
                                <Text style={styles.nearbyCropText}>{c}</Text>
                            </View>
                        ))}
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}


// ── Krishi Contact Section ───────────────────────────────────
function KrishiContactSection({ profile, district }) {
    const callPhone = (phone) => {
        Linking.openURL(`tel:${phone}`).catch(() =>
            Alert.alert('Error', 'Unable to open phone app.')
        );
    };
    const sendEmail = (email) => {
        Linking.openURL(`mailto:${email}`).catch(() =>
            Alert.alert('Error', 'Unable to open email app.')
        );
    };

    if (!profile?.krishi_vibhag) {
        return (
            <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📞</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.gray700 }}>No Krishi contact data</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray500, marginTop: 4 }}>Contact data isn't available for this district yet</Text>
            </View>
        );
    }

    const kv = profile.krishi_vibhag;
    return (
        <View>
            <Text style={styles.sectionHead}>📞 Krishi Vibhag — {district}</Text>
            <View style={[SHARED.card, { marginBottom: 14 }]}>
                <Text style={styles.kvOffice}>{kv.office}</Text>
                <Text style={styles.kvDao}>👤 {kv.dao_name}</Text>
                <Text style={styles.kvAddr}>📍 {kv.address}</Text>
                <Text style={styles.kvHours}>🕐 {kv.office_hours}</Text>
                <View style={styles.contactBtns}>
                    <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: COLORS.green600 }]}
                        onPress={() => callPhone(kv.mobile || kv.phone)}
                    >
                        <Text style={styles.contactBtnText}>📞 Call Mobile</Text>
                        <Text style={styles.contactBtnSub}>{kv.mobile}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: COLORS.blue500 }]}
                        onPress={() => callPhone(kv.phone)}
                    >
                        <Text style={styles.contactBtnText}>☎️ Office</Text>
                        <Text style={styles.contactBtnSub}>{kv.phone}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.emailBtn}
                    onPress={() => sendEmail(kv.email)}
                >
                    <Text style={styles.emailBtnText}>✉️ {kv.email}</Text>
                </TouchableOpacity>
            </View>

            {/* KVK Card */}
            {kv.kvk && (
                <View style={[SHARED.card, { marginBottom: 14, borderColor: COLORS.green200, borderWidth: 1.5 }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.green700, marginBottom: 6 }}>🏫 Krishi Vigyan Kendra (KVK)</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.gray900, marginBottom: 3 }}>{kv.kvk.name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 10 }}>📍 {kv.kvk.address}</Text>
                    <TouchableOpacity
                        style={styles.kvkCallBtn}
                        onPress={() => callPhone(kv.kvk.phone)}
                    >
                        <Text style={styles.kvkCallText}>📞 {kv.kvk.phone}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}


// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function FarmMapScreen({ navigation }) {
    const { user } = useAuth();
    const { t } = useLang();
    const [data, setData] = useState(null);
    const [districtProfile, setDistrictProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState('overview');
    const [exploringDistrict, setExploringDistrict] = useState(null);

    const fetchData = useCallback(async (district = null, showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const params = district ? { district } : {};
            const [mapRes, profileRes] = await Promise.allSettled([
                api.get('/map/data', { params }),
                api.get('/districts/profile', { params: { district: district || user?.district || 'Pune', state: user?.state || 'Maharashtra' } }),
            ]);
            if (mapRes.status === 'fulfilled') setData(mapRes.value.data);
            else setData(null);
            if (profileRes.status === 'fulfilled') setDistrictProfile(profileRes.value.data);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.district, user?.state]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleExplore = (districtName) => {
        setExploringDistrict(districtName);
        setTab('overview');
        fetchData(districtName);
    };

    const goBackToMyDistrict = () => {
        setExploringDistrict(null);
        fetchData();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.green600} />
                <Text style={{ color: COLORS.gray500, marginTop: 10 }}>Loading farm intelligence...</Text>
            </View>
        );
    }

    // No district set — show explore view
    if (!data?.personalized) {
        return (
            <ScrollView style={SHARED.pageContainer}>
                <NoDistrictView
                    all={data?.available_districts}
                    onExplore={handleExplore}
                    navigation={navigation}
                />
            </ScrollView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Exploring banner */}
            {exploringDistrict && (
                <TouchableOpacity style={styles.exploreBanner} onPress={goBackToMyDistrict}>
                    <Text style={styles.exploreText}>
                        🔍 Exploring <Text style={{ fontWeight: '800' }}>{exploringDistrict}</Text> • Tap to go back to your district
                    </Text>
                </TouchableOpacity>
            )}

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 8 }}>
                {TABS.map(t => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                        onPress={() => setTab(t.key)}
                    >
                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                            {t.icon} {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(exploringDistrict, true)} colors={[COLORS.green600]} />}
            >
                {tab === 'overview' && <OverviewSection data={data} />}
                {tab === 'mandis' && <MandisSection mandis={data.mandis || []} district={data.district} />}
                {tab === 'crops' && <CropsSection crops={data.crops || []} />}
                {tab === 'nearby' && <NearbySection nearby={data.nearby_districts || []} onExplore={handleExplore} currentDistrict={data.district} />}
                {tab === 'alerts' && <AlertsSection alerts={data.alerts || []} district={data.district} />}
                {tab === 'contact' && <KrishiContactSection profile={districtProfile} district={data.district} />}
            </ScrollView>
        </View>
    );
}


// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

    exploreBanner: {
        backgroundColor: COLORS.blue50, paddingVertical: 10, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: COLORS.blue100,
    },
    exploreText: { fontSize: 12, color: COLORS.blue800, textAlign: 'center' },

    tabBar: {
        backgroundColor: COLORS.white, borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSubtle, maxHeight: 48,
    },
    tabBtn: { paddingHorizontal: 14, paddingVertical: 12 },
    tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.green600 },
    tabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
    tabTextActive: { color: COLORS.green700, fontWeight: '700' },

    // Hero banner
    heroBanner: {
        backgroundColor: COLORS.green800, borderRadius: 18, padding: 22, marginBottom: 14,
        ...SHADOWS.green,
    },
    heroDistrict: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
    heroRegion: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 10, fontWeight: '500' },
    heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    climateChip: {
        backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    climateText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

    sectionHead: { fontSize: 15, fontWeight: '800', color: COLORS.gray900, marginBottom: 10 },
    sectionSub: { fontSize: 12, color: COLORS.gray500, marginBottom: 12, marginTop: -6 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    soilChip: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
        backgroundColor: COLORS.amber50, borderWidth: 1, borderColor: COLORS.amber200,
    },
    soilChipText: { fontSize: 11, fontWeight: '600', color: COLORS.amber700 },

    // Irrigation
    irrLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
    progressBg: {
        height: 10, borderRadius: 5, backgroundColor: COLORS.gray100, overflow: 'hidden',
    },
    progressFill: {
        height: '100%', borderRadius: 5, backgroundColor: COLORS.green500,
    },
    irrSource: { fontSize: 11, color: COLORS.gray500, marginTop: 6, fontStyle: 'italic' },

    // Stats
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    statBox: {
        flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.borderSubtle, ...SHADOWS.sm,
    },
    statVal: { fontSize: 22, fontWeight: '900', color: COLORS.green700 },
    statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.gray500, marginTop: 2, textTransform: 'uppercase' },

    // Mandis
    mandiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mandiIcon: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff7ed',
        alignItems: 'center', justifyContent: 'center',
    },
    mandiName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 2 },
    mandiAddr: { fontSize: 11, color: COLORS.gray500 },
    distBadge: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: COLORS.blue50, borderWidth: 1, borderColor: COLORS.blue100,
    },
    distText: { fontSize: 10, fontWeight: '700', color: COLORS.blue800 },
    commodityChip: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: COLORS.green50, borderWidth: 1, borderColor: COLORS.green200,
    },
    commodityText: { fontSize: 10, fontWeight: '600', color: COLORS.green700 },
    mandiFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.gray100,
    },
    volumeText: { fontSize: 12, fontWeight: '700', color: COLORS.gray700 },
    callBtn: {
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
        backgroundColor: COLORS.green50, borderWidth: 1, borderColor: COLORS.green300,
    },
    callText: { fontSize: 11, fontWeight: '700', color: COLORS.green700 },

    // Crops
    cropIcon: {
        width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.green50,
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    cropName: { fontSize: 16, fontWeight: '800', color: COLORS.gray900 },
    cropHindi: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
    areaBadge: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: COLORS.amber50, borderWidth: 1, borderColor: COLORS.amber200,
    },
    areaText: { fontSize: 10, fontWeight: '700', color: COLORS.amber700 },

    timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 4 },
    monthCol: { alignItems: 'center', flex: 1 },
    monthDot: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gray200, marginBottom: 3,
    },
    monthSow: { backgroundColor: COLORS.green500 },
    monthHarv: { backgroundColor: '#f59e0b' },
    monthLabel: { fontSize: 8, color: COLORS.gray400, fontWeight: '500' },
    legendRow: { flexDirection: 'row', gap: 16, marginTop: 6, marginBottom: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, color: COLORS.gray500, fontWeight: '600' },
    cropStats: { flexDirection: 'row', gap: 10 },
    cropStatItem: {
        flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    cropStatLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray400, textTransform: 'uppercase', marginBottom: 3 },
    cropStatVal: { fontSize: 14, fontWeight: '800', color: COLORS.gray800 },

    // Nearby
    nearbyIcon: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.blue50,
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    nearbyName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 1 },
    nearbyRegion: { fontSize: 11, color: COLORS.gray500 },
    nearbyCropChip: {
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        backgroundColor: COLORS.green50, borderWidth: 1, borderColor: COLORS.green200,
    },
    nearbyCropText: { fontSize: 10, fontWeight: '600', color: COLORS.green700 },
    mandiCountChip: {
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa',
    },
    mandiCountText: { fontSize: 10, fontWeight: '600', color: '#c2410c' },

    // Alerts
    alertCrop: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, flex: 1 },
    alertBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    alertPct: { fontSize: 13, fontWeight: '800' },
    alertDetail: { fontSize: 12, color: COLORS.gray600, lineHeight: 18, marginTop: 2 },

    // Empty
    emptyBox: { alignItems: 'center', paddingVertical: 40 },

    // No district
    noBanner: {
        backgroundColor: COLORS.white, borderRadius: 18, padding: 24, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.borderSubtle, ...SHADOWS.md,
    },
    noTitle: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, marginBottom: 6, textAlign: 'center' },
    noSub: { fontSize: 13, color: COLORS.gray500, textAlign: 'center', lineHeight: 19 },

    // Krishi Contact
    kvOffice: { fontSize: 15, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
    kvDao: { fontSize: 14, fontWeight: '600', color: COLORS.green700, marginBottom: 6 },
    kvAddr: { fontSize: 12, color: COLORS.gray600, marginBottom: 4 },
    kvHours: { fontSize: 12, color: COLORS.gray500, marginBottom: 14 },
    contactBtns: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    contactBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
    contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    contactBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
    emailBtn: {
        backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12,
        borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center',
    },
    emailBtnText: { color: COLORS.blue500, fontWeight: '600', fontSize: 13 },
    kvkCallBtn: {
        backgroundColor: COLORS.green50, borderRadius: 8, paddingHorizontal: 14,
        paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.green200,
    },
    kvkCallText: { fontSize: 13, fontWeight: '700', color: COLORS.green700 },
});
