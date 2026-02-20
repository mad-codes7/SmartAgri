/**
 * SmartAgri AI Mobile — Upgraded Market Screen
 * District-aware feed + Top Movers + Search + Trend arrows + Crop Detail Modal
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
    TextInput, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED } from '../theme';

// ── helpers ────────────────────────────────────────────────
const CROP_EMOJI = {
    wheat: '🌾', rice: '🍚', maize: '🌽', cotton: '🌸', sugarcane: '🎋',
    soybean: '🫘', onion: '🧅', tomato: '🍅', potato: '🥔', garlic: '🧄',
    grapes: '🍇', pomegranate: '🍎', banana: '🍌', mango: '🥭', turmeric: '🟡',
    jowar: '🌾', bajra: '🌾', tur: '🫛', gram: '🫘', groundnut: '🥜',
};
const cropEmoji = (name) => CROP_EMOJI[(name || '').toLowerCase()] || '🌿';

const trendColor = (pct) => {
    if (pct > 0) return COLORS.green600;
    if (pct < 0) return '#dc2626';
    return COLORS.gray500;
};
const trendArrow = (pct) => (pct > 0 ? '▲' : pct < 0 ? '▼' : '→');


// ── Mover Card ─────────────────────────────────────────────
function MoverCard({ item, type, onPress }) {
    const isGainer = type === 'gainer';
    const bg = isGainer ? COLORS.green50 : '#fef2f2';
    const border = isGainer ? COLORS.green300 : '#fca5a5';
    const pctColor = isGainer ? COLORS.green700 : '#b91c1c';
    return (
        <TouchableOpacity
            style={[styles.moverCard, { backgroundColor: bg, borderColor: border }]}
            onPress={onPress}
        >
            <Text style={styles.moverEmoji}>{cropEmoji(item.crop)}</Text>
            <Text style={styles.moverCrop} numberOfLines={1}>{item.crop}</Text>
            <Text style={styles.moverPrice}>₹{Math.round(item.current_price)}</Text>
            <Text style={[styles.moverPct, { color: pctColor }]}>
                {trendArrow(item.change_pct)}{Math.abs(item.change_pct).toFixed(1)}%
            </Text>
        </TouchableOpacity>
    );
}


// ── Price Row ───────────────────────────────────────────────
function PriceRow({ item, onPress }) {
    const pct = item._change_pct ?? 0;
    const col = trendColor(pct);
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.rowEmoji}>{cropEmoji(item.commodity)}</Text>
            <View style={{ flex: 1.3 }}>
                <Text style={styles.commodity}>{item.commodity}</Text>
                <Text style={styles.marketName} numberOfLines={1}>{item.market || item.district}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
                <Text style={styles.price}>₹{item.modal_price?.toLocaleString()}</Text>
                {pct !== 0 && (
                    <Text style={[styles.change, { color: col }]}>
                        {trendArrow(pct)} {Math.abs(pct).toFixed(1)}%
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}


// ── Crop Detail Modal ───────────────────────────────────────
function CropModal({ visible, item, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible || !item) return;
        setLoading(true);
        setDetail(null);
        Promise.all([
            api.get(`/market/trends/${encodeURIComponent(item.commodity)}`),
            api.get(`/market/volatility/${encodeURIComponent(item.commodity)}`),
            api.get(`/market/forecast/${encodeURIComponent(item.commodity)}`),
        ])
            .then(([trendRes, volRes, fcRes]) => {
                setDetail({
                    trend: trendRes.data,
                    vol: volRes.data,
                    fc: fcRes.data,
                });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [visible, item]);

    if (!item) return null;

    const riskColor = { Low: COLORS.green600, Medium: '#d97706', High: '#dc2626' };
    const dirColor = { up: COLORS.green600, down: '#dc2626', stable: COLORS.gray500 };
    const dirArrow = { up: '▲', down: '▼', stable: '→' };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.modalRoot}>
                {/* Header */}
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>
                            {cropEmoji(item.commodity)} {item.commodity}
                        </Text>
                        <Text style={styles.modalSubtitle}>📍 {item.district}, {item.state}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={{ fontSize: 18, color: COLORS.gray700 }}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    {/* Current price */}
                    <View style={[SHARED.cardElevated, { marginBottom: 12 }]}>
                        <Text style={styles.detailLabel}>Current Modal Price</Text>
                        <Text style={styles.bigPrice}>₹{item.modal_price?.toLocaleString()}/q</Text>
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                            <View>
                                <Text style={styles.detailLabel}>Min</Text>
                                <Text style={styles.detailVal}>₹{item.min_price?.toLocaleString()}</Text>
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Max</Text>
                                <Text style={styles.detailVal}>₹{item.max_price?.toLocaleString()}</Text>
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailVal}>{item.date || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    {loading && <ActivityIndicator color={COLORS.green600} style={{ marginVertical: 20 }} />}

                    {detail && (
                        <>
                            {/* Trend */}
                            <View style={[SHARED.card, { marginBottom: 12 }]}>
                                <Text style={styles.sectionHead}>📊 Price Trend</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Direction</Text>
                                        <Text style={[styles.trendDir, { color: dirColor[detail.trend.trend_direction] ?? COLORS.gray600 }]}>
                                            {dirArrow[detail.trend.trend_direction] ?? '→'} {detail.trend.trend_direction?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Change</Text>
                                        <Text style={[styles.trendDir, { color: trendColor(detail.trend.price_change_pct) }]}>
                                            {trendArrow(detail.trend.price_change_pct)} {Math.abs(detail.trend.price_change_pct).toFixed(1)}%
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Avg Price</Text>
                                        <Text style={styles.trendDir}>₹{Math.round(detail.trend.current_price)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Volatility */}
                            <View style={[SHARED.card, { marginBottom: 12 }]}>
                                <Text style={styles.sectionHead}>⚡ Volatility</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Risk Level</Text>
                                        <Text style={[styles.riskBadge, { color: riskColor[detail.vol.risk_level] ?? COLORS.gray600 }]}>
                                            {detail.vol.risk_level}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Volatility Index</Text>
                                        <Text style={styles.trendDir}>{detail.vol.volatility_index?.toFixed(1)}%</Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Std Dev</Text>
                                        <Text style={styles.trendDir}>₹{detail.vol.std_dev?.toFixed(0)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Forecast */}
                            <View style={[SHARED.card, { marginBottom: 8 }]}>
                                <Text style={styles.sectionHead}>🔮 30-Day Forecast</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Predicted Price</Text>
                                        <Text style={styles.bigPrice}>₹{Math.round(detail.fc.forecast_30d)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Direction</Text>
                                        <Text style={[styles.trendDir, { color: dirColor[detail.fc.forecast_direction] }]}>
                                            {dirArrow[detail.fc.forecast_direction] ?? '→'} {detail.fc.forecast_direction?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={styles.detailLabel}>Confidence</Text>
                                        <Text style={styles.trendDir}>{Math.round(detail.fc.confidence * 100)}%</Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}


// ── Main Screen ─────────────────────────────────────────────
export default function MarketScreen() {
    const { user } = useAuth();
    const { t } = useLang();

    const [prices, setPrices] = useState([]);
    const [gainers, setGainers] = useState([]);
    const [losers, setLosers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [scope, setScope] = useState('district');   // district | state | all
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const district = user?.district;
    const state = user?.state;

    const fetchAll = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        // Build price filter params
        const params = {};
        if (scope === 'district' && district) { params.district = district; params.state = state; }
        else if (scope === 'state' && state) { params.state = state; }

        const [priceRes, gainRes, loseRes] = await Promise.allSettled([
            api.get('/market/prices', { params }),
            api.get('/market/top-gainers'),
            api.get('/market/top-losers'),
        ]);

        if (priceRes.status === 'fulfilled') setPrices(priceRes.value.data.prices || []);
        if (gainRes.status === 'fulfilled') setGainers(gainRes.value.data.movers || []);
        if (loseRes.status === 'fulfilled') setLosers(loseRes.value.data.movers || []);

        setLoading(false);
        setRefreshing(false);
    }, [scope, district, state]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openDetail = (item) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const filtered = prices.filter(p =>
        !search || p.commodity?.toLowerCase().includes(search.toLowerCase())
    );

    const SCOPES = [
        { key: 'district', label: `📍 ${district || 'District'}` },
        { key: 'state', label: `🗾 ${state || 'State'}` },
        { key: 'all', label: '🌐 All India' },
    ];

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.green600} />
                <Text style={{ color: COLORS.gray500, marginTop: 10, fontSize: 13 }}>Loading market data...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Scope filter */}
            <View style={styles.scopeBar}>
                {SCOPES.map(s => (
                    <TouchableOpacity
                        key={s.key}
                        style={[styles.scopeBtn, scope === s.key && styles.scopeBtnActive]}
                        onPress={() => setScope(s.key)}
                    >
                        <Text style={[styles.scopeText, scope === s.key && styles.scopeTextActive]} numberOfLines={1}>
                            {s.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={[COLORS.green600]} />
                }
                ListHeaderComponent={
                    <View>
                        {/* Search bar */}
                        <View style={styles.searchWrap}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search crop (wheat, onion...)"
                                placeholderTextColor={COLORS.gray400}
                                clearButtonMode="while-editing"
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <Text style={{ color: COLORS.gray400, fontSize: 16, marginRight: 4 }}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Top Movers */}
                        {!search && (gainers.length > 0 || losers.length > 0) && (
                            <View style={{ padding: 14, paddingBottom: 0 }}>
                                <Text style={styles.sectionHead}>🔥 Top Movers</Text>
                                <View style={styles.moversRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.moverGroupLabel, { color: COLORS.green700 }]}>▲ Gainers</Text>
                                        {gainers.slice(0, 3).map((g, i) => (
                                            <MoverCard
                                                key={i} item={g} type="gainer"
                                                onPress={() => openDetail({ commodity: g.crop, modal_price: g.current_price, district: '', state: g.state })}
                                            />
                                        ))}
                                    </View>
                                    <View style={{ width: 1, backgroundColor: COLORS.borderSubtle, marginHorizontal: 8 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.moverGroupLabel, { color: '#dc2626' }]}>▼ Losers</Text>
                                        {losers.slice(0, 3).map((g, i) => (
                                            <MoverCard
                                                key={i} item={g} type="loser"
                                                onPress={() => openDetail({ commodity: g.crop, modal_price: g.current_price, district: '', state: g.state })}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Table header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerText, { flex: 1.8 }]}>CROP</Text>
                            <Text style={[styles.headerText, { flex: 1.5 }]}>MARKET</Text>
                            <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>₹/Q · TREND</Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <PriceRow item={item} onPress={() => openDetail(item)} />
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.gray50, marginLeft: 50 }} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
                        <Text style={SHARED.emptyText}>No prices found</Text>
                        <Text style={SHARED.emptySubtext}>
                            {search ? `No results for "${search}"` : `No data for ${scope === 'district' ? district : state} yet.`}
                        </Text>
                        {!search && scope !== 'all' && (
                            <TouchableOpacity
                                style={[SHARED.btnSecondary, { marginTop: 14 }]}
                                onPress={() => setScope('all')}
                            >
                                <Text style={SHARED.btnSecondaryText}>View All India Prices</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* Crop Detail Modal */}
            <CropModal
                visible={modalVisible}
                item={selectedItem}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

    scopeBar: {
        flexDirection: 'row', backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle,
    },
    scopeBtn: { flex: 1, paddingVertical: 11, alignItems: 'center' },
    scopeBtnActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.green600 },
    scopeText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
    scopeTextActive: { color: COLORS.green700 },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center', margin: 12,
        backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12,
        borderWidth: 1.5, borderColor: COLORS.borderSubtle,
    },
    searchIcon: { fontSize: 15, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.gray900 },

    sectionHead: { fontSize: 14, fontWeight: '800', color: COLORS.gray900, marginBottom: 8 },
    moversRow: { flexDirection: 'row', marginBottom: 10 },
    moverGroupLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
    moverCard: {
        borderRadius: 10, padding: 8, marginBottom: 6, borderWidth: 1,
        flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    moverEmoji: { fontSize: 16 },
    moverCrop: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.gray900 },
    moverPrice: { fontSize: 11, fontWeight: '600', color: COLORS.gray700 },
    moverPct: { fontSize: 11, fontWeight: '800', marginLeft: 2 },

    tableHeader: {
        flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: COLORS.gray50, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle,
    },
    headerText: { fontSize: 11, fontWeight: '700', color: COLORS.gray400, letterSpacing: 0.5 },

    row: {
        flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 13,
        alignItems: 'center', backgroundColor: COLORS.white,
    },
    rowEmoji: { fontSize: 20, marginRight: 10 },
    commodity: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
    marketName: { fontSize: 11, color: COLORS.gray500, marginTop: 1 },
    price: { fontSize: 15, fontWeight: '800', color: COLORS.green700 },
    change: { fontSize: 11, fontWeight: '700', marginTop: 2 },

    empty: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 32 },

    // Modal
    modalRoot: { flex: 1, backgroundColor: COLORS.background },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 20, paddingTop: 24, backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle,
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.gray900 },
    modalSubtitle: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray100,
        alignItems: 'center', justifyContent: 'center',
    },
    bigPrice: { fontSize: 26, fontWeight: '900', color: COLORS.green700, marginTop: 4 },
    detailLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    detailVal: { fontSize: 14, fontWeight: '700', color: COLORS.gray800 },
    trendDir: { fontSize: 15, fontWeight: '800', color: COLORS.gray800 },
    riskBadge: { fontSize: 15, fontWeight: '900' },
});
