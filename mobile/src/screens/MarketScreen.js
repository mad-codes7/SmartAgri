/**
 * SmartAgri AI Mobile — Real-Time Market Screen
 * Auto-detects user's district, shows ranked crops with live mandi prices,
 * regional crop badges, trend arrows, and detailed modal with forecast.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
    TextInput, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

// ── helpers ────────────────────────────────────────────────
const CROP_EMOJI = {
    wheat: '🌾', rice: '🍚', maize: '🌽', cotton: '🌸', sugarcane: '🎋',
    soybean: '🫘', onion: '🧅', tomato: '🍅', potato: '🥔', garlic: '🧄',
    grapes: '🍇', pomegranate: '🍎', banana: '🍌', mango: '🥭', turmeric: '🟡',
    jowar: '🌾', bajra: '🌾', tur: '🫛', gram: '🫘', groundnut: '🥜',
    chickpea: '🫘', mustard: '🌼',
};
const cropEmoji = (name) => CROP_EMOJI[(name || '').toLowerCase()] || '🌿';

const trendColor = (pct) => {
    if (pct > 0) return COLORS.green600;
    if (pct < 0) return '#dc2626';
    return COLORS.gray500;
};
const trendArrow = (pct) => (pct > 0 ? '▲' : pct < 0 ? '▼' : '→');

const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            + ' · '
            + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return ''; }
};


// ── Crop Card ──────────────────────────────────────────────
function CropCard({ item, onPress }) {
    const pct = item.change_pct || 0;
    return (
        <TouchableOpacity style={styles.cropCard} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardTop}>
                {/* Icon + name */}
                <View style={styles.cropIcon}>
                    <Text style={{ fontSize: 22 }}>{cropEmoji(item.crop)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.cropName}>{item.crop}</Text>
                        {item.is_regional && (
                            <View style={styles.regionalBadge}>
                                <Text style={styles.regionalText}>🏆 Regional</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.cropMarket}>📍 {item.market || item.district}</Text>
                </View>
                {/* Price + trend */}
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cropPrice}>₹{Math.round(item.modal_price || 0).toLocaleString()}</Text>
                    <Text style={styles.cropUnit}>per quintal</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={[styles.trendBadge, { color: trendColor(pct) }]}>
                            {trendArrow(pct)} {Math.abs(pct).toFixed(1)}%
                        </Text>
                    </View>
                </View>
            </View>
            {/* Price range bar */}
            {(item.min_price > 0 || item.max_price > 0) && (
                <View style={styles.rangeRow}>
                    <Text style={styles.rangeLabel}>₹{Math.round(item.min_price || 0)}</Text>
                    <View style={styles.rangeBg}>
                        <View style={[styles.rangeFill, { width: '60%' }]} />
                    </View>
                    <Text style={styles.rangeLabel}>₹{Math.round(item.max_price || 0)}</Text>
                </View>
            )}
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
        const cropName = item.crop || item.commodity;
        Promise.all([
            api.get(`/market/trends/${encodeURIComponent(cropName)}`),
            api.get(`/market/volatility/${encodeURIComponent(cropName)}`),
            api.get(`/market/forecast/${encodeURIComponent(cropName)}`),
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
    const cropName = item.crop || item.commodity || '';

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.modalRoot}>
                {/* Header */}
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>
                            {cropEmoji(cropName)} {cropName}
                        </Text>
                        <Text style={styles.modalSubtitle}>📍 {item.district || ''}, {item.state || ''}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={{ fontSize: 18, color: COLORS.gray700 }}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    {/* Current price */}
                    <View style={[SHARED.card, styles.priceCard]}>
                        <Text style={styles.detailLabel}>Current Mandi Price</Text>
                        <Text style={styles.bigPrice}>₹{Math.round(item.modal_price || 0).toLocaleString()}/q</Text>
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                            <View>
                                <Text style={styles.detailLabel}>Min</Text>
                                <Text style={styles.detailVal}>₹{Math.round(item.min_price || 0).toLocaleString()}</Text>
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>Max</Text>
                                <Text style={styles.detailVal}>₹{Math.round(item.max_price || 0).toLocaleString()}</Text>
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

    const [districtData, setDistrictData] = useState(null);
    const [gainers, setGainers] = useState([]);
    const [losers, setLosers] = useState([]);
    const [forecasts, setForecasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [scope, setScope] = useState('district');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const district = user?.district;
    const state = user?.state;

    const fetchAll = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            // Build params based on scope
            const params = {};
            if (scope === 'district' && district) { params.district = district; params.state = state; }
            else if (scope === 'state' && state) { params.state = state; }

            const [distRes, fcRes] = await Promise.allSettled([
                api.get('/market/district-prices', { params }),
                api.get('/market/harvest-forecast/bulk', {
                    params: { state: state || 'Maharashtra', land_size: user?.land_size || 2 },
                }),
            ]);

            if (distRes.status === 'fulfilled') {
                const data = distRes.value.data;
                setDistrictData(data);
                const crops = data?.crops || [];
                const sorted = [...crops].filter(c => c.modal_price > 0);
                const g = sorted.filter(c => c.change_pct > 0).sort((a, b) => b.change_pct - a.change_pct).slice(0, 3);
                const l = sorted.filter(c => c.change_pct < 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 3);
                setGainers(g.map(c => ({ crop: c.crop, current_price: c.modal_price, change_pct: c.change_pct, state: c.state })));
                setLosers(l.map(c => ({ crop: c.crop, current_price: c.modal_price, change_pct: c.change_pct, state: c.state })));
            }

            if (fcRes.status === 'fulfilled') {
                setForecasts(fcRes.value.data?.forecasts || []);
            }
        } catch (err) {
            console.warn('Market fetch error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [scope, district, state, user]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openDetail = (item) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const crops = districtData?.crops || [];
    const filtered = crops.filter(p =>
        !search || p.crop?.toLowerCase().includes(search.toLowerCase())
    );

    // Separate regional from other
    const regionalCrops = filtered.filter(c => c.is_regional);
    const otherCrops = filtered.filter(c => !c.is_regional);

    const SCOPES = [
        { key: 'district', label: `📍 ${district || 'District'}` },
        { key: 'state', label: `🗾 ${state || 'State'}` },
        { key: 'all', label: '🌐 All India' },
    ];

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.green600} />
                <Text style={{ color: COLORS.gray500, marginTop: 10, fontSize: 13 }}>Loading live market data...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Scope filter bar */}
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

            <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={[COLORS.green600]} />
                }
            >
                {/* Live update header */}
                <View style={styles.liveHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>Live Prices</Text>
                    </View>
                    <Text style={styles.liveTime}>
                        Updated {formatTime(districtData?.updated_at)}
                    </Text>
                </View>

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
                    <View style={{ paddingHorizontal: 14, marginBottom: 6 }}>
                        <Text style={styles.sectionHead}>🔥 Top Movers Today</Text>
                        <View style={styles.moversRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.moverGroupLabel, { color: COLORS.green700 }]}>▲ Gainers</Text>
                                {gainers.slice(0, 3).map((g, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.moverCard, { borderColor: COLORS.green100, backgroundColor: COLORS.green50 }]}
                                        onPress={() => openDetail({ crop: g.crop, modal_price: g.current_price, state: g.state, district: '', min_price: 0, max_price: 0, change_pct: g.change_pct })}
                                    >
                                        <Text style={styles.moverEmoji}>{cropEmoji(g.crop)}</Text>
                                        <Text style={styles.moverCrop} numberOfLines={1}>{g.crop}</Text>
                                        <Text style={[styles.moverPct, { color: COLORS.green600 }]}>+{Math.abs(g.change_pct).toFixed(1)}%</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ width: 1, backgroundColor: COLORS.borderSubtle, marginHorizontal: 8 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.moverGroupLabel, { color: '#dc2626' }]}>▼ Losers</Text>
                                {losers.slice(0, 3).map((g, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.moverCard, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}
                                        onPress={() => openDetail({ crop: g.crop, modal_price: g.current_price, state: g.state, district: '', min_price: 0, max_price: 0, change_pct: g.change_pct })}
                                    >
                                        <Text style={styles.moverEmoji}>{cropEmoji(g.crop)}</Text>
                                        <Text style={styles.moverCrop} numberOfLines={1}>{g.crop}</Text>
                                        <Text style={[styles.moverPct, { color: '#dc2626' }]}>-{Math.abs(g.change_pct).toFixed(1)}%</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* ── HARVEST PRICE FORECAST ── */}
                {!search && forecasts.length > 0 && (
                    <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={styles.sectionHead}>🔮 Harvest Price Forecast</Text>
                            <Text style={{ fontSize: 11, color: COLORS.gray400 }}>{forecasts.length} crops</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {forecasts.map((fc, i) => {
                                const isUp = fc.price_change_pct >= 0;
                                const strategyColor = fc.sell_strategy === 'hold' ? COLORS.amber500
                                    : fc.sell_strategy === 'sell_now' ? '#dc2626' : COLORS.green600;
                                const strategyLabel = fc.sell_strategy === 'hold' ? '⏳ Hold'
                                    : fc.sell_strategy === 'sell_now' ? '🚀 Sell Now' : '🌾 Sell at Harvest';
                                return (
                                    <View key={i} style={styles.forecastCard}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                            <Text style={{ fontSize: 22 }}>{cropEmoji(fc.crop)}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.gray900 }} numberOfLines={1}>{fc.crop}</Text>
                                                <Text style={{ fontSize: 10, color: COLORS.gray400 }}>{fc.category} · {fc.days_to_harvest}d to harvest</Text>
                                            </View>
                                        </View>

                                        {/* Price row */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                                            <View>
                                                <Text style={{ fontSize: 10, color: COLORS.gray400 }}>Now</Text>
                                                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.gray700 }}>₹{fc.current_price?.toLocaleString('en-IN')}</Text>
                                            </View>
                                            <Text style={{ fontSize: 16, color: COLORS.gray300 }}>→</Text>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 10, color: COLORS.gray400 }}>At Harvest</Text>
                                                <Text style={{ fontSize: 14, fontWeight: '800', color: isUp ? COLORS.green600 : '#dc2626' }}>₹{fc.predicted_harvest_price?.toLocaleString('en-IN')}</Text>
                                            </View>
                                        </View>

                                        {/* Change badge */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <View style={[styles.changeBadge, { backgroundColor: isUp ? COLORS.green50 : '#fef2f2' }]}>
                                                <Text style={{ fontSize: 11, fontWeight: '700', color: isUp ? COLORS.green600 : '#dc2626' }}>
                                                    {isUp ? '▲' : '▼'} {Math.abs(fc.price_change_pct)}%
                                                </Text>
                                            </View>
                                            <View style={[styles.changeBadge, { backgroundColor: strategyColor + '18' }]}>
                                                <Text style={{ fontSize: 11, fontWeight: '700', color: strategyColor }}>{strategyLabel}</Text>
                                            </View>
                                        </View>

                                        {/* Revenue */}
                                        <View style={{ backgroundColor: COLORS.gray50, borderRadius: 8, padding: 8, marginBottom: 6 }}>
                                            <Text style={{ fontSize: 10, color: COLORS.gray500 }}>Est. Revenue ({fc.land_size} acres)</Text>
                                            <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.green700 }}>₹{fc.harvest_revenue?.toLocaleString('en-IN')}</Text>
                                            {fc.extra_if_held > 0 && (
                                                <Text style={{ fontSize: 10, color: COLORS.amber700, marginTop: 2 }}>
                                                    +₹{fc.extra_if_held?.toLocaleString('en-IN')} if held {fc.hold_days}d
                                                </Text>
                                            )}
                                        </View>

                                        {/* Confidence */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <View style={[styles.confDot, { backgroundColor: fc.confidence === 'high' ? COLORS.green500 : fc.confidence === 'medium' ? COLORS.amber500 : COLORS.gray400 }]} />
                                            <Text style={{ fontSize: 10, color: COLORS.gray500 }}>{fc.confidence} confidence</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* ── REGIONAL BEST CROPS ── */}
                {!search && regionalCrops.length > 0 && (
                    <View style={{ paddingHorizontal: 14, marginBottom: 8 }}>
                        <View style={styles.regionHeader}>
                            <Text style={styles.sectionHead}>🏆 Best Crops for {districtData?.district || 'Your District'}</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{regionalCrops.length} crops</Text>
                            </View>
                        </View>
                        {regionalCrops.map((item, i) => (
                            <CropCard key={i} item={item} onPress={() => openDetail(item)} />
                        ))}
                    </View>
                )}

                {/* ── OTHER CROPS ── */}
                {otherCrops.length > 0 && (
                    <View style={{ paddingHorizontal: 14, marginBottom: 8 }}>
                        <Text style={styles.sectionHead}>
                            {search ? `🔍 Results for "${search}"` : '📋 All Market Prices'}
                        </Text>
                        {otherCrops.map((item, i) => (
                            <CropCard key={i} item={item} onPress={() => openDetail(item)} />
                        ))}
                    </View>
                )}

                {/* ── SEARCH RESULTS (when searching) ── */}
                {search && regionalCrops.length > 0 && otherCrops.length === 0 && (
                    <View style={{ paddingHorizontal: 14 }}>
                        {regionalCrops.map((item, i) => (
                            <CropCard key={i} item={item} onPress={() => openDetail(item)} />
                        ))}
                    </View>
                )}

                {/* Empty state */}
                {filtered.length === 0 && (
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
                )}
            </ScrollView>

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

    liveHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.green50,
        borderBottomWidth: 1, borderBottomColor: COLORS.green100,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
    liveText: { fontSize: 13, fontWeight: '800', color: COLORS.green700 },
    liveTime: { fontSize: 11, color: COLORS.green600, fontWeight: '600' },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center', margin: 12,
        backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12,
        borderWidth: 1.5, borderColor: COLORS.borderSubtle,
    },
    searchIcon: { fontSize: 15, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.gray900 },

    sectionHead: { fontSize: 14, fontWeight: '800', color: COLORS.gray900, marginBottom: 8 },
    regionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    countBadge: {
        backgroundColor: COLORS.green100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    },
    countText: { fontSize: 11, fontWeight: '700', color: COLORS.green700 },

    // Movers
    moversRow: { flexDirection: 'row', marginBottom: 10 },
    moverGroupLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
    moverCard: {
        borderRadius: 10, padding: 8, marginBottom: 6, borderWidth: 1,
        flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    moverEmoji: { fontSize: 16 },
    moverCrop: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.gray900 },
    moverPct: { fontSize: 11, fontWeight: '800', marginLeft: 2 },

    // Crop Card
    cropCard: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
        ...SHADOWS.sm,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cropIcon: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.green50,
        alignItems: 'center', justifyContent: 'center',
    },
    cropName: { fontSize: 15, fontWeight: '800', color: COLORS.gray900 },
    cropMarket: { fontSize: 11, color: COLORS.gray500, marginTop: 2 },
    cropPrice: { fontSize: 18, fontWeight: '900', color: COLORS.green700 },
    cropUnit: { fontSize: 10, color: COLORS.gray400, fontWeight: '600' },
    trendBadge: { fontSize: 12, fontWeight: '800' },
    regionalBadge: {
        backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
        borderWidth: 1, borderColor: '#fbbf24',
    },
    regionalText: { fontSize: 9, fontWeight: '700', color: '#92400e' },
    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    rangeLabel: { fontSize: 10, fontWeight: '600', color: COLORS.gray500 },
    rangeBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.gray100 },
    rangeFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.green400 },

    // Forecast cards
    forecastCard: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginRight: 12,
        borderWidth: 1.5, borderColor: COLORS.borderSubtle, width: 210,
        ...SHADOWS.sm,
    },
    changeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    confDot: { width: 7, height: 7, borderRadius: 4 },

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
    priceCard: { marginBottom: 12, borderColor: COLORS.green200, borderWidth: 1.5 },
    bigPrice: { fontSize: 26, fontWeight: '900', color: COLORS.green700, marginTop: 4 },
    detailLabel: { fontSize: 11, color: COLORS.gray400, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    detailVal: { fontSize: 14, fontWeight: '700', color: COLORS.gray800 },
    trendDir: { fontSize: 15, fontWeight: '800', color: COLORS.gray800 },
    riskBadge: { fontSize: 15, fontWeight: '900' },
});
