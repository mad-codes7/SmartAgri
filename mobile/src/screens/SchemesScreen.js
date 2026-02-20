/**
 * SmartAgri AI Mobile - Government Schemes Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED } from '../theme';

export default function SchemesScreen() {
    const { t } = useLang();
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/schemes/').then((r) => {
            setSchemes(r.data.items || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const renderItem = ({ item }) => (
        <View style={[SHARED.card, { marginBottom: 12 }]}>
            <View style={styles.header}>
                <Text style={styles.name}>{item.name}</Text>
                {item.max_land_size && (
                    <View style={[SHARED.badge, SHARED.badgeInfo]}>
                        <Text style={SHARED.badgeInfoText}>≤ {item.max_land_size} ha</Text>
                    </View>
                )}
            </View>
            <Text style={styles.desc}>{item.description}</Text>
            <View style={styles.detailsRow}>
                {item.eligibility && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>✅ {t.eligibility}</Text>
                        <Text style={styles.detailVal}>{item.eligibility}</Text>
                    </View>
                )}
                {item.benefits && (
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>💰 {t.benefits}</Text>
                        <Text style={styles.detailVal}>{item.benefits}</Text>
                    </View>
                )}
            </View>
            {item.apply_url && (
                <TouchableOpacity
                    style={[SHARED.btnPrimary, { marginTop: 12, paddingVertical: 10 }]}
                    onPress={() => Linking.openURL(item.apply_url)}
                >
                    <Text style={[SHARED.btnPrimaryText, { fontSize: 13 }]}>{t.apply_now} →</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;

    return (
        <View style={SHARED.pageContainer}>
            <View style={{ padding: 16, paddingBottom: 0 }}>
                <Text style={SHARED.pageTitle}>🏛️ {t.government_schemes}</Text>
                <Text style={SHARED.pageSubtitle}>{t.schemes_desc}</Text>
            </View>
            <FlatList
                data={schemes}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 80 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    name: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, flex: 1, marginRight: 8 },
    desc: { fontSize: 13, color: COLORS.gray600, lineHeight: 19, marginBottom: 10 },
    detailsRow: { flexDirection: 'row', gap: 10 },
    detailItem: {
        flex: 1, backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    detailLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray500, marginBottom: 4 },
    detailVal: { fontSize: 12, color: COLORS.gray800 },
});
