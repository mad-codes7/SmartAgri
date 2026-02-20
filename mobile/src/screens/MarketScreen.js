/**
 * SmartAgri AI Mobile - Market Prices Screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED } from '../theme';

export default function MarketScreen() {
    const { user } = useAuth();
    const { t } = useLang();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/market/prices', { params: { state: user?.state } })
            .then((res) => setPrices(res.data.prices || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user?.state]);

    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <View style={{ flex: 1.2 }}>
                <Text style={styles.commodity}>{item.commodity}</Text>
            </View>
            <View style={{ flex: 1.3 }}>
                <Text style={styles.market}>{item.market}</Text>
                <Text style={styles.location}>{item.district}, {item.state}</Text>
            </View>
            <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                <Text style={styles.price}>₹{item.modal_price}</Text>
            </View>
            <View style={{ flex: 0.7, alignItems: 'flex-end' }}>
                <Text style={styles.date}>{item.date ? new Date(item.date).toLocaleDateString() : '—'}</Text>
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;

    return (
        <View style={SHARED.pageContainer}>
            <View style={{ padding: 16, paddingBottom: 0 }}>
                <Text style={SHARED.pageTitle}>📈 {t.market_prices}</Text>
                <Text style={SHARED.pageSubtitle}>{t.market_desc || 'Real-time prices from mandis near you'}</Text>
            </View>
            <View style={[SHARED.card, { margin: 16, padding: 0, flex: 1 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerText, { flex: 1.2 }]}>{t.crop || 'Crop'}</Text>
                    <Text style={[styles.headerText, { flex: 1.3 }]}>{t.market || 'Market'}</Text>
                    <Text style={[styles.headerText, { flex: 0.8, textAlign: 'right' }]}>{t.price || 'Price'}</Text>
                    <Text style={[styles.headerText, { flex: 0.7, textAlign: 'right' }]}>{t.date || 'Date'}</Text>
                </View>
                <FlatList
                    data={prices}
                    renderItem={renderItem}
                    keyExtractor={(_, i) => String(i)}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={SHARED.emptySubtext}>No market data available for your region.</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 2, borderBottomColor: COLORS.gray100,
    },
    headerText: { fontSize: 12, fontWeight: '700', color: COLORS.gray500, textTransform: 'uppercase' },
    row: {
        flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray50, alignItems: 'center',
    },
    commodity: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
    market: { fontSize: 13, fontWeight: '500', color: COLORS.gray800 },
    location: { fontSize: 11, color: COLORS.gray400 },
    price: { fontSize: 15, fontWeight: '800', color: COLORS.green600 },
    date: { fontSize: 11, color: COLORS.gray500 },
    empty: { padding: 32, alignItems: 'center' },
});
