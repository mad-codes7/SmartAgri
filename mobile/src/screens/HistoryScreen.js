/**
 * SmartAgri AI Mobile - History Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED } from '../theme';

export default function HistoryScreen() {
    const { t } = useLang();
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            api.get('/history/'),
            api.get('/history/stats'),
        ]).then(([h, s]) => {
            if (h.status === 'fulfilled') setItems(h.value.data.items || []);
            if (s.status === 'fulfilled') setStats(s.value.data);
            setLoading(false);
        });
    }, []);

    const renderItem = ({ item }) => (
        <View style={[SHARED.card, { marginBottom: 10 }]}>
            <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cropName}>🌱 {item.top_crop}</Text>
                    <Text style={styles.meta}>{item.season} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.profit}>{item.profit_estimate}</Text>
                    <Text style={styles.profitLabel}>{t.est_profit}</Text>
                </View>
                <View style={[SHARED.badge, { marginLeft: 8 },
                item.risk_level?.includes('Low') ? SHARED.badgeLow :
                    item.risk_level?.includes('High') ? SHARED.badgeHigh : SHARED.badgeMedium
                ]}>
                    <Text style={
                        item.risk_level?.includes('Low') ? SHARED.badgeLowText :
                            item.risk_level?.includes('High') ? SHARED.badgeHighText : SHARED.badgeMediumText
                    }>{item.risk_level}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;

    return (
        <View style={SHARED.pageContainer}>
            <View style={{ padding: 16, paddingBottom: 0 }}>
                <Text style={SHARED.pageTitle}>📋 {t.recommendation_history}</Text>
                <Text style={SHARED.pageSubtitle}>{t.history_desc}</Text>
            </View>

            {/* Stats Row */}
            {stats && (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={SHARED.widgetValue}>{stats.total_recommendations}</Text>
                        <Text style={SHARED.widgetLabel}>{t.total}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[SHARED.widgetValue, { fontSize: 16 }]}>{stats.most_recommended_crop}</Text>
                        <Text style={SHARED.widgetLabel}>{t.top_crop}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[SHARED.widgetValue, { color: COLORS.green600, fontSize: 16 }]}>₹{stats.avg_profit_estimate?.toLocaleString()}</Text>
                        <Text style={SHARED.widgetLabel}>{t.avg_profit}</Text>
                    </View>
                </View>
            )}

            {items.length === 0 ? (
                <View style={[SHARED.card, { margin: 16, alignItems: 'center', padding: 40 }]}>
                    <Text style={SHARED.emptyIcon}>📋</Text>
                    <Text style={SHARED.emptyText}>{t.no_recommendations}</Text>
                    <Text style={SHARED.emptySubtext}>{t.no_recommendations_desc}</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 80 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    statsRow: {
        flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8, marginBottom: 8,
    },
    statItem: {
        flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
        alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    itemRow: { flexDirection: 'row', alignItems: 'center' },
    cropName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
    meta: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
    profit: { fontSize: 14, fontWeight: '800', color: COLORS.green600 },
    profitLabel: { fontSize: 10, color: COLORS.gray500 },
});
