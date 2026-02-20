/**
 * SmartAgri AI Mobile - Crop Library Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED } from '../theme';

export default function CropsScreen() {
    const { t } = useLang();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/crops/').then((res) => {
            setCrops(res.data.items || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const renderItem = ({ item }) => (
        <View style={[SHARED.card, { marginBottom: 12 }]}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.hindi}>{item.hindi_name}</Text>
                </View>
                <View style={[SHARED.badge, SHARED.badgeInfo]}>
                    <Text style={SHARED.badgeInfoText}>{(item.seasons || []).join(', ')}</Text>
                </View>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>⏱️ Duration</Text>
                    <Text style={styles.statVal}>{item.growth_days} days</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>🌱 Soil</Text>
                    <Text style={styles.statVal}>{(item.soil_types || []).length} types</Text>
                </View>
            </View>
            <View style={styles.soilBox}>
                <Text style={styles.soilLabel}>IDEAL SOIL</Text>
                <Text style={styles.soilText}>{(item.soil_types || []).join(', ')}</Text>
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;

    return (
        <View style={SHARED.pageContainer}>
            <View style={{ padding: 16, paddingBottom: 0 }}>
                <Text style={SHARED.pageTitle}>🌾 {t.crops_library || 'Crop Library'}</Text>
                <Text style={SHARED.pageSubtitle}>{t.crops_desc || 'Information about various crops'}</Text>
            </View>
            <FlatList
                data={crops}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 80 }}
                numColumns={1}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    name: { fontSize: 18, fontWeight: '800', color: COLORS.gray900, marginBottom: 2 },
    hindi: { fontSize: 13, color: COLORS.gray500, fontStyle: 'italic' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    statItem: {
        flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    statLabel: { fontSize: 11, color: COLORS.gray500, fontWeight: '600', marginBottom: 3 },
    statVal: { fontSize: 14, fontWeight: '700', color: COLORS.gray800 },
    soilBox: {
        backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.gray200,
    },
    soilLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray500, marginBottom: 4, letterSpacing: 0.5 },
    soilText: { fontSize: 13, color: COLORS.gray800 },
});
