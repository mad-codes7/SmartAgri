/**
 * SmartAgri AI Mobile — Government Schemes Screen
 * Comprehensive scheme explorer with search, category chips,
 * state filter, type tabs, and detailed filter panel.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Linking, TextInput, ScrollView, Modal,
    RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED, SHADOWS } from '../theme';


// ── Category icons ─────────────────────────────────────────
const CAT_ICON = {
    'Insurance': '🛡️',
    'Income Support': '💰',
    'Credit & Finance': '🏦',
    'Irrigation': '💧',
    'Marketing': '🏪',
    'Production': '🌾',
    'Mechanization': '⚙️',
    'Infrastructure': '🏗️',
    'Horticulture': '🍎',
    'Organic Farming': '🌿',
    'Sustainable Farming': '♻️',
    'Allied Activities': '🐄',
    'Soil & Inputs': '🧪',
    'Price Support': '📊',
    'Pension & Welfare': '🧓',
    'Food Processing': '🏭',
    'Technology': '📱',
    'Women & SC/ST': '👩‍🌾',
};
const catIcon = (cat) => CAT_ICON[cat] || '📋';

const TYPE_TABS = [
    { key: '', label: 'All' },
    { key: 'Central', label: '🏛️ Central' },
    { key: 'State', label: '🗾 State' },
];


// ── Scheme Card ────────────────────────────────────────────
function SchemeCard({ item, onApply }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.card}>
            {/* Header */}
            <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                    <View style={[styles.catBadge, { backgroundColor: item.type === 'State' ? '#dbeafe' : '#dcfce7' }]}>
                        <Text style={{ fontSize: 18 }}>{catIcon(item.category)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.schemeName} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.tagRow}>
                            <View style={[styles.tag, styles.catTag]}>
                                <Text style={styles.catTagText}>{item.category}</Text>
                            </View>
                            <View style={[styles.tag, item.type === 'State' ? styles.stateTag : styles.centralTag]}>
                                <Text style={item.type === 'State' ? styles.stateTagText : styles.centralTagText}>
                                    {item.type === 'State' ? '🗾 State' : '🏛️ Central'}
                                </Text>
                            </View>
                            {item.max_land_size && (
                                <View style={[styles.tag, styles.landTag]}>
                                    <Text style={styles.landTagText}>≤ {item.max_land_size} ha</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={{ fontSize: 16, color: COLORS.gray400 }}>{expanded ? '▲' : '▼'}</Text>
                </View>
            </TouchableOpacity>

            {/* Description (always visible) */}
            <Text style={styles.desc} numberOfLines={expanded ? undefined : 2}>{item.description}</Text>

            {/* Expanded details */}
            {expanded && (
                <View style={styles.expandedSection}>
                    {item.eligibility && (
                        <View style={styles.detailBox}>
                            <Text style={styles.detailLabel}>✅ Eligibility</Text>
                            <Text style={styles.detailVal}>{item.eligibility}</Text>
                        </View>
                    )}
                    {item.benefits && (
                        <View style={styles.detailBox}>
                            <Text style={styles.detailLabel}>💰 Benefits</Text>
                            <Text style={styles.detailVal}>{item.benefits}</Text>
                        </View>
                    )}
                    <View style={styles.metaRow}>
                        {item.applicable_states && (
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>📍 States</Text>
                                <Text style={styles.metaVal} numberOfLines={2}>{item.applicable_states}</Text>
                            </View>
                        )}
                        {item.applicable_crops && (
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>🌾 Crops</Text>
                                <Text style={styles.metaVal} numberOfLines={2}>{item.applicable_crops}</Text>
                            </View>
                        )}
                    </View>
                    {item.ministry && (
                        <Text style={styles.ministry}>🏢 {item.ministry}</Text>
                    )}
                    {item.apply_url && (
                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={() => Linking.openURL(item.apply_url)}
                        >
                            <Text style={styles.applyBtnText}>Apply Now →</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}


// ── Filter Panel Modal ─────────────────────────────────────
function FilterPanel({ visible, onClose, filters, setFilters, meta }) {
    const [local, setLocal] = useState(filters);

    useEffect(() => { if (visible) setLocal(filters); }, [visible]);

    const apply = () => { setFilters(local); onClose(); };
    const reset = () => {
        const empty = { category: '', state: '', type: '' };
        setLocal(empty);
        setFilters(empty);
        onClose();
    };

    const activeCount = [local.category, local.state, local.type].filter(Boolean).length;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.filterRoot}>
                <View style={styles.filterHeader}>
                    <Text style={styles.filterTitle}>🔍 Filter Schemes</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={{ fontSize: 16, color: COLORS.gray700 }}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    {/* Scheme Type */}
                    <Text style={styles.filterSectionTitle}>Scheme Type</Text>
                    <View style={styles.chipRow}>
                        {[{ key: '', label: 'All' }, { key: 'Central', label: '🏛️ Central' }, { key: 'State', label: '🗾 State' }].map(t => (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.chip, local.type === t.key && styles.chipActive]}
                                onPress={() => setLocal(p => ({ ...p, type: t.key }))}
                            >
                                <Text style={[styles.chipText, local.type === t.key && styles.chipTextActive]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Category */}
                    <Text style={styles.filterSectionTitle}>Category</Text>
                    <View style={styles.chipRow}>
                        <TouchableOpacity
                            style={[styles.chip, !local.category && styles.chipActive]}
                            onPress={() => setLocal(p => ({ ...p, category: '' }))}
                        >
                            <Text style={[styles.chipText, !local.category && styles.chipTextActive]}>All</Text>
                        </TouchableOpacity>
                        {(meta?.categories || []).map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.chip, local.category === c && styles.chipActive]}
                                onPress={() => setLocal(p => ({ ...p, category: p.category === c ? '' : c }))}
                            >
                                <Text style={[styles.chipText, local.category === c && styles.chipTextActive]}>
                                    {catIcon(c)} {c}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* State */}
                    <Text style={styles.filterSectionTitle}>State</Text>
                    <View style={styles.chipRow}>
                        <TouchableOpacity
                            style={[styles.chip, !local.state && styles.chipActive]}
                            onPress={() => setLocal(p => ({ ...p, state: '' }))}
                        >
                            <Text style={[styles.chipText, !local.state && styles.chipTextActive]}>All States</Text>
                        </TouchableOpacity>
                        {(meta?.states || []).map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, local.state === s && styles.chipActive]}
                                onPress={() => setLocal(p => ({ ...p, state: p.state === s ? '' : s }))}
                            >
                                <Text style={[styles.chipText, local.state === s && styles.chipTextActive]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Bottom action bar */}
                <View style={styles.filterActions}>
                    <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                        <Text style={styles.resetBtnText}>Reset All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.applyFilterBtn} onPress={apply}>
                        <Text style={styles.applyFilterText}>
                            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}


// ── Main Screen ────────────────────────────────────────────
export default function SchemesScreen() {
    const { user } = useAuth();
    const { t } = useLang();

    const [schemes, setSchemes] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ category: '', state: '', type: '' });
    const [filterVisible, setFilterVisible] = useState(false);

    const fetchSchemes = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const params = { per_page: 100 };
            if (search) params.search = search;
            if (filters.category) params.category = filters.category;
            if (filters.state) params.state = filters.state;
            if (filters.type) params.type = filters.type;

            const [schemeRes, metaRes] = await Promise.allSettled([
                api.get('/schemes/', { params }),
                meta ? Promise.resolve({ data: meta }) : api.get('/schemes/meta'),
            ]);

            if (schemeRes.status === 'fulfilled') setSchemes(schemeRes.value.data.items || []);
            if (metaRes.status === 'fulfilled') setMeta(metaRes.value.data);
        } catch (err) {
            console.warn('Schemes fetch error:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, filters]);

    useEffect(() => { fetchSchemes(); }, [fetchSchemes]);

    const activeFilterCount = [filters.category, filters.state, filters.type].filter(Boolean).length;

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.green600} />
                <Text style={{ color: COLORS.gray500, marginTop: 10 }}>Loading schemes...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Header */}
            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>🏛️ Government Schemes</Text>
                <Text style={styles.pageSubtitle}>
                    {meta?.total_schemes || 0} schemes available for Indian farmers
                </Text>
            </View>

            {/* Search + Filter bar */}
            <View style={styles.searchRow}>
                <View style={styles.searchWrap}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by name, benefit..."
                        placeholderTextColor={COLORS.gray400}
                        clearButtonMode="while-editing"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Text style={{ color: COLORS.gray400, fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                    onPress={() => setFilterVisible(true)}
                >
                    <Text style={{ fontSize: 16 }}>⚙️</Text>
                    {activeFilterCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFilters}>
                    {filters.type ? (
                        <TouchableOpacity style={styles.activeChip} onPress={() => setFilters(p => ({ ...p, type: '' }))}>
                            <Text style={styles.activeChipText}>{filters.type} ✕</Text>
                        </TouchableOpacity>
                    ) : null}
                    {filters.category ? (
                        <TouchableOpacity style={styles.activeChip} onPress={() => setFilters(p => ({ ...p, category: '' }))}>
                            <Text style={styles.activeChipText}>{catIcon(filters.category)} {filters.category} ✕</Text>
                        </TouchableOpacity>
                    ) : null}
                    {filters.state ? (
                        <TouchableOpacity style={styles.activeChip} onPress={() => setFilters(p => ({ ...p, state: '' }))}>
                            <Text style={styles.activeChipText}>📍 {filters.state} ✕</Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={styles.clearAll} onPress={() => setFilters({ category: '', state: '', type: '' })}>
                        <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Quick category chips (scrollable) */}
            {!search && activeFilterCount === 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickChips}>
                    {(meta?.categories || []).slice(0, 8).map(c => (
                        <TouchableOpacity
                            key={c}
                            style={styles.quickChip}
                            onPress={() => setFilters(p => ({ ...p, category: c }))}
                        >
                            <Text style={styles.quickChipIcon}>{catIcon(c)}</Text>
                            <Text style={styles.quickChipText}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Results count */}
            <View style={styles.resultBar}>
                <Text style={styles.resultText}>
                    {schemes.length} scheme{schemes.length !== 1 ? 's' : ''} found
                </Text>
            </View>

            {/* Scheme list */}
            <FlatList
                data={schemes}
                renderItem={({ item }) => <SchemeCard item={item} />}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchSchemes(true)} colors={[COLORS.green600]} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 40, marginBottom: 12 }}>🏛️</Text>
                        <Text style={SHARED.emptyText}>No schemes found</Text>
                        <Text style={SHARED.emptySubtext}>
                            {search ? `No results for "${search}"` : 'Try adjusting your filters'}
                        </Text>
                        {activeFilterCount > 0 && (
                            <TouchableOpacity
                                style={[SHARED.btnSecondary, { marginTop: 14 }]}
                                onPress={() => { setFilters({ category: '', state: '', type: '' }); setSearch(''); }}
                            >
                                <Text style={SHARED.btnSecondaryText}>Clear All Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* Filter Panel Modal */}
            <FilterPanel
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                filters={filters}
                setFilters={setFilters}
                meta={meta}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

    pageHeader: { padding: 16, paddingBottom: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
    pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.gray900 },
    pageSubtitle: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },

    // Search
    searchRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 4, gap: 8 },
    searchWrap: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12,
        borderWidth: 1.5, borderColor: COLORS.borderSubtle,
    },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.gray900 },
    filterBtn: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: COLORS.borderSubtle,
    },
    filterBtnActive: { borderColor: COLORS.green600, backgroundColor: COLORS.green50 },
    filterBadge: {
        position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.green600,
        borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    },
    filterBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.white },

    // Active filter chips
    activeFilters: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
    activeChip: {
        backgroundColor: COLORS.green50, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
        marginRight: 8, borderWidth: 1.5, borderColor: COLORS.green200, minHeight: 40,
        justifyContent: 'center',
    },
    activeChipText: { fontSize: 13, fontWeight: '700', color: COLORS.green700 },
    clearAll: { paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'center' },
    clearAllText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },

    // Quick category chips
    quickChips: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
    quickChip: {
        backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
        marginRight: 10, borderWidth: 1.5, borderColor: COLORS.borderSubtle,
        flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 46,
    },
    quickChipIcon: { fontSize: 18 },
    quickChipText: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },

    // Results bar
    resultBar: { paddingHorizontal: 16, paddingVertical: 6 },
    resultText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },

    // Scheme card
    card: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.borderSubtle, ...SHADOWS.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    catBadge: {
        width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    },
    schemeName: { fontSize: 14, fontWeight: '800', color: COLORS.gray900, lineHeight: 19 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    catTag: { backgroundColor: COLORS.gray100 },
    catTagText: { fontSize: 9, fontWeight: '700', color: COLORS.gray600 },
    centralTag: { backgroundColor: COLORS.green50, borderWidth: 1, borderColor: COLORS.green200 },
    centralTagText: { fontSize: 9, fontWeight: '700', color: COLORS.green700 },
    stateTag: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd' },
    stateTagText: { fontSize: 9, fontWeight: '700', color: '#1d4ed8' },
    landTag: { backgroundColor: COLORS.amber100 },
    landTagText: { fontSize: 9, fontWeight: '700', color: COLORS.amber700 },
    desc: { fontSize: 12, color: COLORS.gray600, lineHeight: 18 },

    // Expanded
    expandedSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle, paddingTop: 12 },
    detailBox: {
        backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10, marginBottom: 8,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    detailLabel: { fontSize: 11, fontWeight: '700', color: COLORS.gray500, marginBottom: 4 },
    detailVal: { fontSize: 12, color: COLORS.gray800, lineHeight: 17 },
    metaRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    metaItem: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: COLORS.borderSubtle },
    metaLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray400, marginBottom: 2 },
    metaVal: { fontSize: 11, color: COLORS.gray700 },
    ministry: { fontSize: 10, color: COLORS.gray400, fontStyle: 'italic', marginBottom: 8 },
    applyBtn: {
        backgroundColor: COLORS.green600, borderRadius: 10, paddingVertical: 11,
        alignItems: 'center',
    },
    applyBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.white },

    // Empty
    empty: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 32 },

    // Filter Modal
    filterRoot: { flex: 1, backgroundColor: COLORS.background },
    filterHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, paddingTop: 24, backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle,
    },
    filterTitle: { fontSize: 20, fontWeight: '900', color: COLORS.gray900 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray100,
        alignItems: 'center', justifyContent: 'center',
    },
    filterSectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.gray900, marginTop: 16, marginBottom: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.borderSubtle,
    },
    chipActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green600 },
    chipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    chipTextActive: { color: COLORS.green700, fontWeight: '700' },

    filterActions: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', padding: 16, gap: 12,
        backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle,
    },
    resetBtn: {
        flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
        borderWidth: 1.5, borderColor: COLORS.gray300,
    },
    resetBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.gray600 },
    applyFilterBtn: {
        flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
        backgroundColor: COLORS.green600,
    },
    applyFilterText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});
