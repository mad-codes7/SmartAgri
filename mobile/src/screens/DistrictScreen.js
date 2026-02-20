/**
 * SmartAgri AI Mobile - District Profile Screen
 * Dominant crops, APMC mandis, price alerts, Krishi Vibhag contact
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Linking, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

const SEASON_EMOJI = { Kharif: '🌧️', Rabi: '❄️', Summer: '☀️' };
const CROP_EMOJI = {
    rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🧵', soybean: '🌿',
    sugarcane: '🎋', banana: '🍌', mango: '🥭', orange: '🍊', grapes: '🍇',
    onion: '🧅', tomato: '🍅', pomegranate: '🫐', turmeric: '🟡',
    groundnut: '🥜', 'tur (pigeon pea)': '🫘', 'chana (chickpea)': '🫘',
    strawberry: '🍓', 'corn (maize)': '🌽', 'mosambi (sweet lime)': '🍋',
};

const getCropEmoji = (name) => CROP_EMOJI[name?.toLowerCase()] || '🌿';

export default function DistrictScreen({ navigation }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('crops'); // crops | mandis | alerts | contact

    const district = user?.district || 'Pune';
    const state = user?.state || 'Maharashtra';

    useEffect(() => {
        api.get('/districts/profile', { params: { district, state } })
            .then(res => setProfile(res.data))
            .catch(err => {
                const msg = err.response?.data?.detail || 'Could not load district profile.';
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, [district, state]);

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

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.green600} />
            <Text style={{ marginTop: 12, color: COLORS.gray500 }}>Loading district profile...</Text>
        </View>
    );

    if (error) return (
        <View style={styles.center}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🗺️</Text>
            <Text style={SHARED.emptyText}>Profile Not Found</Text>
            <Text style={[SHARED.emptySubtext, { marginHorizontal: 32 }]}>{error}</Text>
        </View>
    );

    const TABS = [
        { key: 'crops', label: '🌾 Crops' },
        { key: 'mandis', label: '🏪 Mandis' },
        { key: 'alerts', label: '📊 Alerts' },
        { key: 'contact', label: '📞 Krishi' },
    ];

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.districtName}>📍 {district}</Text>
                        <Text style={styles.regionName}>{profile.region} · {profile.division} Division</Text>
                    </View>
                    <View style={styles.climateBadge}>
                        <Text style={styles.climateText} numberOfLines={2}>{profile.agro_climate}</Text>
                    </View>
                </View>
                <View style={styles.irrigationRow}>
                    <Text style={styles.irrigLabel}>💧 Irrigation:</Text>
                    <Text style={styles.irrigVal}>{profile.irrigation?.type} · {profile.irrigation?.coverage_percent}% coverage</Text>
                </View>
                <Text style={styles.irrigSource}>⛲ {profile.irrigation?.main_source}</Text>
                <View style={styles.soilRow}>
                    {(profile.soil_types || []).map((s, i) => (
                        <View key={i} style={styles.soilChip}>
                            <Text style={styles.soilChipText}>🪨 {s}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {TABS.map(t => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                        onPress={() => setTab(t.key)}
                    >
                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── CROPS TAB ── */}
            {tab === 'crops' && (
                <View>
                    <Text style={styles.sectionTitle}>Dominant Crops in {district}</Text>
                    {(profile.dominant_crops || []).map((crop, i) => (
                        <View key={i} style={[SHARED.card, { marginBottom: 12 }]}>
                            <View style={styles.cropHeader}>
                                <View style={styles.cropIconCircle}>
                                    <Text style={{ fontSize: 26 }}>{getCropEmoji(crop.name)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cropName}>{crop.name}</Text>
                                    <Text style={styles.cropHindi}>{crop.hindi_name}</Text>
                                    <Text style={styles.cropArea}>📏 {crop.area_lakh_ha} lakh ha cultivated</Text>
                                </View>
                                <View style={styles.priceBox}>
                                    <Text style={styles.priceLabel}>Avg Price</Text>
                                    <Text style={styles.priceVal}>₹{crop.avg_price_per_quintal}/q</Text>
                                </View>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Sowing</Text>
                                    <Text style={styles.statVal}>{(crop.sowing_months || []).join(', ')}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Harvest</Text>
                                    <Text style={styles.statVal}>{(crop.harvest_months || []).join(', ')}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Yield/Acre</Text>
                                    <Text style={styles.statVal}>{crop.avg_yield_ton_per_acre} ton</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* ── MANDIS TAB ── */}
            {tab === 'mandis' && (
                <View>
                    <Text style={styles.sectionTitle}>Top APMC Mandis — {district}</Text>
                    {(profile.mandis || []).map((mandi, i) => (
                        <View key={i} style={[SHARED.card, { marginBottom: 12 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mandiName}>🏪 {mandi.name}</Text>
                                    <Text style={styles.mandiAddr}>📍 {mandi.address}</Text>
                                </View>
                                {mandi.distance_km > 0 && (
                                    <View style={styles.distBadge}>
                                        <Text style={styles.distText}>{mandi.distance_km} km</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.commodityRow}>
                                {(mandi.commodities || []).map((c, j) => (
                                    <View key={j} style={styles.commChip}>
                                        <Text style={styles.commText}>{getCropEmoji(c)} {c}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.mandiFooter}>
                                <Text style={styles.mandiVol}>📦 ₹{mandi.weekly_volume_crore}Cr/week</Text>
                                <TouchableOpacity
                                    style={styles.callBtn}
                                    onPress={() => callPhone(mandi.contact)}
                                >
                                    <Text style={styles.callBtnText}>📞 {mandi.contact}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* ── ALERTS TAB ── */}
            {tab === 'alerts' && (
                <View>
                    <Text style={styles.sectionTitle}>Price Trend Alerts — {district}</Text>
                    <View style={styles.alertDisclaimer}>
                        <Text style={styles.alertDisclaimerText}>🤖 AI-generated weekly market signals based on mandi data trends</Text>
                    </View>
                    {(profile.price_alerts || []).map((alert, i) => {
                        const isUp = alert.direction === 'up';
                        const isStable = alert.direction === 'stable';
                        return (
                            <View key={i} style={[styles.alertCard, isUp ? styles.alertUp : isStable ? styles.alertStable : styles.alertDown]}>
                                <View style={styles.alertHeader}>
                                    <Text style={styles.alertCrop}>{getCropEmoji(alert.crop)} {alert.crop}</Text>
                                    <View style={[styles.alertBadge, isUp ? styles.badgeUp : isStable ? styles.badgeStable : styles.badgeDown]}>
                                        <Text style={[styles.alertBadgeText, isUp ? styles.textUp : isStable ? styles.textStable : styles.textDown]}>
                                            {isUp ? '▲' : isStable ? '━' : '▼'} {alert.change_percent}%
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.alertDetail}>💬 {alert.detail}</Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* ── CONTACT TAB ── */}
            {tab === 'contact' && profile.krishi_vibhag && (
                <View>
                    <Text style={styles.sectionTitle}>Krishi Vibhag — {district}</Text>
                    <View style={[SHARED.card, { marginBottom: 12 }]}>
                        <Text style={styles.kvOffice}>{profile.krishi_vibhag.office}</Text>
                        <Text style={styles.kvDao}>👤 {profile.krishi_vibhag.dao_name}</Text>
                        <Text style={styles.kvAddr}>📍 {profile.krishi_vibhag.address}</Text>
                        <Text style={styles.kvHours}>🕐 {profile.krishi_vibhag.office_hours}</Text>
                        <View style={styles.contactBtns}>
                            <TouchableOpacity
                                style={[styles.contactBtn, { backgroundColor: COLORS.green600 }]}
                                onPress={() => callPhone(profile.krishi_vibhag.mobile || profile.krishi_vibhag.phone)}
                            >
                                <Text style={styles.contactBtnText}>📞 Call Mobile</Text>
                                <Text style={styles.contactBtnSub}>{profile.krishi_vibhag.mobile}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.contactBtn, { backgroundColor: COLORS.blue500 }]}
                                onPress={() => callPhone(profile.krishi_vibhag.phone)}
                            >
                                <Text style={styles.contactBtnText}>☎️ Office</Text>
                                <Text style={styles.contactBtnSub}>{profile.krishi_vibhag.phone}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.emailBtn}
                            onPress={() => sendEmail(profile.krishi_vibhag.email)}
                        >
                            <Text style={styles.emailBtnText}>✉️ {profile.krishi_vibhag.email}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* KVK Card */}
                    {profile.krishi_vibhag.kvk && (
                        <View style={[SHARED.card, styles.kvkCard]}>
                            <Text style={styles.kvkTitle}>🏫 Krishi Vigyan Kendra (KVK)</Text>
                            <Text style={styles.kvkName}>{profile.krishi_vibhag.kvk.name}</Text>
                            <Text style={styles.kvkAddr}>📍 {profile.krishi_vibhag.kvk.address}</Text>
                            <TouchableOpacity
                                style={styles.kvkCallBtn}
                                onPress={() => callPhone(profile.krishi_vibhag.kvk.phone)}
                            >
                                <Text style={styles.kvkCallText}>📞 {profile.krishi_vibhag.kvk.phone}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    headerCard: {
        backgroundColor: COLORS.green800,
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        ...SHADOWS.green,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    districtName: { fontSize: 22, fontWeight: '800', color: '#fff' },
    regionName: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    climateBadge: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        maxWidth: 140,
    },
    climateText: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
    irrigationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    irrigLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginRight: 6 },
    irrigVal: { fontSize: 12, color: '#fff', fontWeight: '600' },
    irrigSource: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10 },
    soilRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    soilChip: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    },
    soilChipText: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

    tabBar: {
        flexDirection: 'row', backgroundColor: COLORS.gray100,
        borderRadius: 12, padding: 4, marginBottom: 16,
    },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabBtnActive: { backgroundColor: COLORS.white, ...SHADOWS.sm },
    tabText: { fontSize: 11, fontWeight: '600', color: COLORS.gray500 },
    tabTextActive: { color: COLORS.green700 },

    sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.gray900, marginBottom: 12 },

    // Crop card
    cropHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    cropIconCircle: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: COLORS.green50, alignItems: 'center', justifyContent: 'center',
    },
    cropName: { fontSize: 16, fontWeight: '800', color: COLORS.gray900 },
    cropHindi: { fontSize: 12, color: COLORS.gray500, fontStyle: 'italic' },
    cropArea: { fontSize: 11, color: COLORS.green600, fontWeight: '600', marginTop: 2 },
    priceBox: { alignItems: 'flex-end' },
    priceLabel: { fontSize: 10, color: COLORS.gray500, fontWeight: '600' },
    priceVal: { fontSize: 15, fontWeight: '800', color: COLORS.green600 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
        flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10,
        padding: 8, borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    statLabel: { fontSize: 10, color: COLORS.gray500, fontWeight: '600', marginBottom: 3 },
    statVal: { fontSize: 11, fontWeight: '700', color: COLORS.gray800 },

    // Mandi card
    mandiName: { fontSize: 14, fontWeight: '800', color: COLORS.gray900, marginBottom: 2 },
    mandiAddr: { fontSize: 11, color: COLORS.gray500 },
    distBadge: {
        backgroundColor: COLORS.blue50, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start',
    },
    distText: { fontSize: 11, fontWeight: '700', color: COLORS.blue500 },
    commodityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
    commChip: {
        backgroundColor: COLORS.green50, borderRadius: 6, borderWidth: 1,
        borderColor: COLORS.green200, paddingHorizontal: 8, paddingVertical: 3,
    },
    commText: { fontSize: 11, fontWeight: '600', color: COLORS.green700 },
    mandiFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mandiVol: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
    callBtn: {
        backgroundColor: COLORS.green600, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    callBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // Alert card
    alertCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
    alertUp: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    alertDown: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    alertStable: { backgroundColor: COLORS.gray50, borderColor: COLORS.gray200 },
    alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    alertCrop: { fontSize: 15, fontWeight: '800', color: COLORS.gray900 },
    alertBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
    badgeUp: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
    badgeDown: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
    badgeStable: { backgroundColor: COLORS.gray100, borderColor: COLORS.gray300 },
    alertBadgeText: { fontSize: 13, fontWeight: '800' },
    textUp: { color: '#15803d' },
    textDown: { color: '#dc2626' },
    textStable: { color: COLORS.gray600 },
    alertDetail: { fontSize: 12, color: COLORS.gray600, lineHeight: 18 },
    alertDisclaimer: {
        backgroundColor: COLORS.amber50, borderRadius: 8, padding: 10,
        marginBottom: 12, borderWidth: 1, borderColor: COLORS.amber200,
    },
    alertDisclaimerText: { fontSize: 11, color: COLORS.amber700, fontStyle: 'italic' },

    // Contact
    kvOffice: { fontSize: 15, fontWeight: '800', color: COLORS.gray900, marginBottom: 4 },
    kvDao: { fontSize: 14, fontWeight: '600', color: COLORS.green700, marginBottom: 6 },
    kvAddr: { fontSize: 12, color: COLORS.gray600, marginBottom: 4 },
    kvHours: { fontSize: 12, color: COLORS.gray500, marginBottom: 14 },
    contactBtns: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    contactBtn: {
        flex: 1, borderRadius: 10, padding: 12, alignItems: 'center',
    },
    contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    contactBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
    emailBtn: {
        backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12,
        borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center',
    },
    emailBtnText: { color: COLORS.blue500, fontWeight: '600', fontSize: 13 },
    kvkCard: { borderColor: COLORS.green200, borderWidth: 1.5 },
    kvkTitle: { fontSize: 13, fontWeight: '700', color: COLORS.green700, marginBottom: 6 },
    kvkName: { fontSize: 15, fontWeight: '800', color: COLORS.gray900, marginBottom: 3 },
    kvkAddr: { fontSize: 12, color: COLORS.gray500, marginBottom: 10 },
    kvkCallBtn: {
        backgroundColor: COLORS.green50, borderRadius: 8, paddingHorizontal: 14,
        paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.green200,
    },
    kvkCallText: { fontSize: 13, fontWeight: '700', color: COLORS.green700 },
});
