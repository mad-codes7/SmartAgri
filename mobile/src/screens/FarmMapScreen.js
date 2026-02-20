/**
 * SmartAgri AI Mobile - Farm Map Screen
 * Uses a list-based view instead of react-native-maps to avoid native-only import issues.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

const CROP_ZONES_FALLBACK = [
    { id: 1, name: 'Rice Belt', region: 'Uttar Pradesh, West Bengal', crop: 'Rice', icon: '🌾', color: '#22c55e', area: '44M hectares' },
    { id: 2, name: 'Wheat Zone', region: 'Punjab, Haryana, UP', crop: 'Wheat', icon: '🌿', color: '#f59e0b', area: '31M hectares' },
    { id: 3, name: 'Cotton Region', region: 'Gujarat, Maharashtra', crop: 'Cotton', icon: '🏵️', color: '#8b5cf6', area: '12M hectares' },
    { id: 4, name: 'Sugarcane Belt', region: 'UP, Maharashtra, Karnataka', crop: 'Sugarcane', icon: '🎋', color: '#06b6d4', area: '5M hectares' },
    { id: 5, name: 'Tea Gardens', region: 'Assam, West Bengal', crop: 'Tea', icon: '🍃', color: '#15803d', area: '0.6M hectares' },
    { id: 6, name: 'Spice Region', region: 'Kerala, Tamil Nadu', crop: 'Spices', icon: '🌶️', color: '#dc2626', area: '3.5M hectares' },
];

const MANDIS_FALLBACK = [
    { id: 1, name: 'Azadpur Mandi', location: 'New Delhi', speciality: 'Fruits & Vegetables', volume: '10,000 tonnes/day' },
    { id: 2, name: 'Vashi Market', location: 'Navi Mumbai', speciality: 'Fruits & Onion', volume: '5,000 tonnes/day' },
    { id: 3, name: 'Koyambedu Market', location: 'Chennai', speciality: 'Vegetables & Flowers', volume: '3,500 tonnes/day' },
    { id: 4, name: 'Yeshwanthpur Mandi', location: 'Bangalore', speciality: 'Vegetables', volume: '2,500 tonnes/day' },
    { id: 5, name: 'Gultekdi Market', location: 'Pune', speciality: 'Grains & Vegetables', volume: '3,000 tonnes/day' },
    { id: 6, name: 'Bowenpally Market', location: 'Hyderabad', speciality: 'Vegetables & Fruits', volume: '2,000 tonnes/day' },
];

export default function FarmMapScreen() {
    const { t } = useLang();
    const [activeLayer, setActiveLayer] = useState('all');
    const [zones, setZones] = useState(CROP_ZONES_FALLBACK);
    const [mandis, setMandis] = useState(MANDIS_FALLBACK);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/map/data').then((res) => {
            if (res.data?.crop_zones?.length) setZones(res.data.crop_zones);
            if (res.data?.mandis?.length) setMandis(res.data.mandis);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const showZones = activeLayer === 'all' || activeLayer === 'zones';
    const showMandis = activeLayer === 'all' || activeLayer === 'mandis';

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <Text style={SHARED.pageTitle}>🗺️ {t.farm_map || 'Farm Intelligence Map'}</Text>
            <Text style={SHARED.pageSubtitle}>{t.farm_map_desc}</Text>

            {/* Layer Toggles */}
            <View style={styles.layerRow}>
                {[
                    { key: 'all', label: t.show_all || 'All', icon: '🗺️' },
                    { key: 'zones', label: t.crop_zones || 'Crop Zones', icon: '🌾' },
                    { key: 'mandis', label: t.mandis || 'Mandis', icon: '🏪' },
                ].map(({ key, label, icon }) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.layerBtn, activeLayer === key && styles.layerActive]}
                        onPress={() => setActiveLayer(key)}
                    >
                        <Text style={[styles.layerText, activeLayer === key && styles.layerActiveText]}>{icon} {label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Crop Zones */}
            {showZones && (
                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>🌾 {t.crop_zones || 'Crop Zones'}</Text>
                    {zones.map((zone) => (
                        <View key={zone.id} style={[SHARED.card, { marginBottom: 10 }]}>
                            <View style={styles.zoneHeader}>
                                <View style={[styles.zoneIcon, { backgroundColor: `${zone.color}20` }]}>
                                    <Text style={{ fontSize: 22 }}>{zone.icon || '🌱'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.zoneName}>{zone.name}</Text>
                                    <Text style={styles.zoneRegion}>📍 {zone.region}</Text>
                                </View>
                                <View style={[SHARED.badge, { backgroundColor: `${zone.color}15`, borderColor: `${zone.color}40`, borderWidth: 1 }]}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: zone.color }}>{zone.crop}</Text>
                                </View>
                            </View>
                            {zone.area && (
                                <View style={styles.areaTag}>
                                    <Text style={styles.areaText}>📐 Area: {zone.area}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {/* Mandis */}
            {showMandis && (
                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>🏪 {t.major_mandis || 'Major Mandis'}</Text>
                    {mandis.map((mandi) => (
                        <View key={mandi.id} style={[SHARED.card, { marginBottom: 10 }]}>
                            <View style={styles.mandiHeader}>
                                <View style={styles.mandiIcon}>
                                    <Text style={{ fontSize: 18 }}>🏪</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mandiName}>{mandi.name}</Text>
                                    <Text style={styles.mandiLoc}>📍 {mandi.location}</Text>
                                </View>
                            </View>
                            <View style={styles.mandiStats}>
                                <View style={styles.mandiStat}>
                                    <Text style={styles.mandiStatLabel}>Speciality</Text>
                                    <Text style={styles.mandiStatVal}>{mandi.speciality}</Text>
                                </View>
                                {mandi.volume && (
                                    <View style={styles.mandiStat}>
                                        <Text style={styles.mandiStatLabel}>Volume</Text>
                                        <Text style={styles.mandiStatVal}>{mandi.volume}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    layerRow: {
        flexDirection: 'row', gap: 8, marginBottom: 16,
    },
    layerBtn: {
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.gray50,
    },
    layerActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green300 },
    layerText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    layerActiveText: { color: COLORS.green700, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, marginBottom: 10 },
    zoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    zoneIcon: {
        width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    },
    zoneName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 2 },
    zoneRegion: { fontSize: 12, color: COLORS.gray500 },
    areaTag: {
        marginTop: 10, backgroundColor: COLORS.gray50, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    areaText: { fontSize: 11, color: COLORS.gray600, fontWeight: '600' },
    mandiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    mandiIcon: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff7ed',
        alignItems: 'center', justifyContent: 'center',
    },
    mandiName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 2 },
    mandiLoc: { fontSize: 12, color: COLORS.gray500 },
    mandiStats: { flexDirection: 'row', gap: 10 },
    mandiStat: {
        flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    mandiStatLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray400, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' },
    mandiStatVal: { fontSize: 12, fontWeight: '600', color: COLORS.gray800 },
});
