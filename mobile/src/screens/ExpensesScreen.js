/**
 * SmartAgri AI Mobile - Expenses Tracker Screen
 * Track farm expenses, crop income, profit/loss and ROI.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED, SHADOWS } from '../theme';

const CATEGORIES = ['Labour', 'Crop Plantation', 'Fertilizers', 'Pesticides', 'Transportation', 'Equipment', 'Other'];
const SEASONS = ['Kharif', 'Rabi', 'Summer'];
const CAT_COLORS = {
    Labour: COLORS.blue500, 'Crop Plantation': COLORS.green500, Fertilizers: '#f59e0b',
    Pesticides: COLORS.red500, Transportation: COLORS.purple500, Equipment: '#06b6d4', Other: COLORS.gray500,
};

export default function ExpensesScreen({ navigation }) {
    const { t } = useLang();

    const [tab, setTab] = useState('overview');
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [summary, setSummary] = useState(null);
    const [userCrops, setUserCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Filters
    const [filterCrop, setFilterCrop] = useState('');
    const [filterSeason, setFilterSeason] = useState('');

    // Expense form
    const [expAmount, setExpAmount] = useState('');
    const [expCategory, setExpCategory] = useState('Labour');
    const [expCrop, setExpCrop] = useState('');
    const [expSeason, setExpSeason] = useState('');
    const [expNotes, setExpNotes] = useState('');

    // Income form
    const [incAmount, setIncAmount] = useState('');
    const [incCrop, setIncCrop] = useState('');
    const [incSeason, setIncSeason] = useState('');
    const [incQty, setIncQty] = useState('');
    const [incPriceKg, setIncPriceKg] = useState('');
    const [incBuyer, setIncBuyer] = useState('');
    const [incNotes, setIncNotes] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterCrop) params.crop = filterCrop;
            if (filterSeason) params.season = filterSeason;
            const [expRes, incRes, sumRes, cropsRes] = await Promise.all([
                api.get('/expenses/expense', { params }),
                api.get('/expenses/income', { params }),
                api.get('/expenses/summary', { params }),
                api.get('/expenses/crops-list'),
            ]);
            setExpenses(expRes.data);
            setIncomes(incRes.data);
            setSummary(sumRes.data);
            setUserCrops(cropsRes.data);
        } catch (err) {
            console.error('Failed to load expenses', err);
        }
        setLoading(false);
    }, [filterCrop, filterSeason]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const handleAddExpense = async () => {
        if (!expAmount || isNaN(parseFloat(expAmount))) {
            Alert.alert('Error', t.exp_amount || 'Please enter a valid amount');
            return;
        }
        setSaving(true);
        try {
            const payload = { amount: parseFloat(expAmount), category: expCategory, date: today() };
            if (expCrop) payload.crop = expCrop;
            if (expSeason) payload.season = expSeason;
            if (expNotes) payload.notes = expNotes;
            await api.post('/expenses/expense', payload);
            setMsg(t.exp_saved || 'Expense saved!');
            setExpAmount(''); setExpCrop(''); setExpSeason(''); setExpNotes('');
            fetchData();
            setTimeout(() => { setMsg(''); setTab('overview'); }, 1200);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to save expense');
        }
        setSaving(false);
    };

    const handleAddIncome = async () => {
        if (!incAmount || isNaN(parseFloat(incAmount)) || !incCrop) {
            Alert.alert('Error', 'Please enter amount and crop name');
            return;
        }
        setSaving(true);
        try {
            const payload = { amount: parseFloat(incAmount), crop: incCrop, date: today() };
            if (incSeason) payload.season = incSeason;
            if (incQty) payload.quantity_kg = parseFloat(incQty);
            if (incPriceKg) payload.price_per_kg = parseFloat(incPriceKg);
            if (incBuyer) payload.buyer = incBuyer;
            if (incNotes) payload.notes = incNotes;
            await api.post('/expenses/income', payload);
            setMsg(t.exp_income_saved || 'Income saved!');
            setIncAmount(''); setIncCrop(''); setIncSeason(''); setIncQty(''); setIncPriceKg(''); setIncBuyer(''); setIncNotes('');
            fetchData();
            setTimeout(() => { setMsg(''); setTab('overview'); }, 1200);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to save income');
        }
        setSaving(false);
    };

    const handleDeleteExpense = (id) => {
        Alert.alert(t.exp_delete || 'Delete', t.exp_confirm_delete || 'Delete this entry?', [
            { text: t.back || 'Cancel', style: 'cancel' },
            { text: t.exp_delete || 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/expenses/expense/${id}`); fetchData(); } },
        ]);
    };

    const handleDeleteIncome = (id) => {
        Alert.alert(t.exp_delete || 'Delete', t.exp_confirm_delete || 'Delete this entry?', [
            { text: t.back || 'Cancel', style: 'cancel' },
            { text: t.exp_delete || 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/expenses/income/${id}`); fetchData(); } },
        ]);
    };

    // --- Pie chart as simple bar breakdown ---
    const pieData = summary ? Object.entries(summary.expense_by_category).sort((a, b) => b[1] - a[1]) : [];
    const maxCatVal = pieData.length > 0 ? pieData[0][1] : 1;

    const TABS = [
        { id: 'overview', icon: '📊', label: t.exp_overview || 'Overview' },
        { id: 'add-expense', icon: '💸', label: t.exp_add_expense || 'Add Expense' },
        { id: 'add-income', icon: '💰', label: t.exp_add_income || 'Add Income' },
        { id: 'records', icon: '📋', label: t.exp_records || 'Records' },
    ];

    if (loading) {
        return <View style={s.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;
    }

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            {/* Header */}
            <Text style={SHARED.pageTitle}>💰 {t.exp_title || 'Expenses Tracker'}</Text>
            <Text style={SHARED.pageSubtitle}>{t.exp_desc || 'Track your farm spending, crop income, and see your profit at a glance'}</Text>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {TABS.map(tb => (
                    <TouchableOpacity key={tb.id} onPress={() => { setTab(tb.id); setMsg(''); }}
                        style={[s.tabBtn, tab === tb.id && s.tabBtnActive]} activeOpacity={0.7}>
                        <Text style={[s.tabText, tab === tb.id && s.tabTextActive]}>{tb.icon} {tb.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Filter Row */}
            {(tab === 'overview' || tab === 'records') && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        <TouchableOpacity onPress={() => setFilterSeason('')}
                            style={[s.filterChip, !filterSeason && s.filterChipActive]}>
                            <Text style={[s.filterText, !filterSeason && s.filterTextActive]}>{t.exp_all_seasons || 'All Seasons'}</Text>
                        </TouchableOpacity>
                        {SEASONS.map(s2 => (
                            <TouchableOpacity key={s2} onPress={() => setFilterSeason(s2 === filterSeason ? '' : s2)}
                                style={[s.filterChip, filterSeason === s2 && s.filterChipActive]}>
                                <Text style={[s.filterText, filterSeason === s2 && s.filterTextActive]}>{s2}</Text>
                            </TouchableOpacity>
                        ))}
                        {userCrops.length > 0 && (
                            <>
                                <View style={{ width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 6 }} />
                                <TouchableOpacity onPress={() => setFilterCrop('')}
                                    style={[s.filterChip, !filterCrop && s.filterChipActive]}>
                                    <Text style={[s.filterText, !filterCrop && s.filterTextActive]}>{t.exp_all_crops || 'All Crops'}</Text>
                                </TouchableOpacity>
                                {userCrops.map(c => (
                                    <TouchableOpacity key={c} onPress={() => setFilterCrop(c === filterCrop ? '' : c)}
                                        style={[s.filterChip, filterCrop === c && s.filterChipActive]}>
                                        <Text style={[s.filterText, filterCrop === c && s.filterTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </ScrollView>
                </View>
            )}

            {/* ═══════ OVERVIEW ═══════ */}
            {tab === 'overview' && summary && (
                <>
                    {/* Summary Cards 2×2 */}
                    <View style={s.grid}>
                        <SummaryCard icon="💸" label={t.exp_total_expenses || 'Total Spent'} value={`₹${summary.total_expenses.toLocaleString()}`} color={COLORS.red500} />
                        <SummaryCard icon="💰" label={t.exp_total_income || 'Total Earned'} value={`₹${summary.total_income.toLocaleString()}`} color={COLORS.green600} />
                        <SummaryCard icon={summary.net_profit >= 0 ? '📈' : '📉'} label={t.exp_net_profit || 'Net Profit / Loss'} value={`₹${summary.net_profit.toLocaleString()}`} color={summary.net_profit >= 0 ? COLORS.green600 : COLORS.red500} />
                        <SummaryCard icon="🎯" label={t.exp_roi || 'ROI'} value={`${summary.roi_percent}%`} color={summary.roi_percent >= 0 ? COLORS.blue500 : COLORS.red500} />
                    </View>

                    {/* Expense Breakdown (horizontal bars) */}
                    <View style={[SHARED.card, { marginTop: 12 }]}>
                        <Text style={s.sectionTitle}>📊 {t.exp_where_money_goes || 'Where Your Money Goes'}</Text>
                        {pieData.length === 0 ? (
                            <Text style={s.emptySmall}>{t.exp_no_data || 'No expenses yet'}</Text>
                        ) : pieData.map(([cat, val]) => (
                            <View key={cat} style={{ marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray700 }}>{t[`exp_cat_${cat.toLowerCase().replace(/ /g, '_')}`] || cat}</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.gray900 }}>₹{val.toLocaleString()}</Text>
                                </View>
                                <View style={s.barBg}>
                                    <View style={[s.barFill, { width: `${(val / maxCatVal) * 100}%`, backgroundColor: CAT_COLORS[cat] || COLORS.gray400 }]} />
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* ROI Explanation */}
                    <View style={[SHARED.card, { marginTop: 12, alignItems: 'center', paddingVertical: 20 }]}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.gray500, marginBottom: 4 }}>
                            🎯 {t.exp_roi_explained || 'For every ₹100 you spent, you earned back:'}
                        </Text>
                        <Text style={{ fontSize: 36, fontWeight: '900', color: summary.roi_percent >= 0 ? COLORS.green600 : COLORS.red500 }}>
                            ₹{(100 + summary.roi_percent).toFixed(0)}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.gray500, marginTop: 4 }}>
                            {summary.roi_percent >= 0
                                ? (t.exp_roi_positive || 'Good return — keep it up!')
                                : (t.exp_roi_negative || 'Loss — review your costs')}
                        </Text>
                    </View>
                </>
            )}

            {/* ═══════ ADD EXPENSE ═══════ */}
            {tab === 'add-expense' && (
                <View style={SHARED.card}>
                    <Text style={s.sectionTitle}>💸 {t.exp_new_expense || 'New Expense'}</Text>
                    {msg ? <Text style={s.msgSuccess}>{msg}</Text> : null}

                    <Text style={SHARED.formLabel}>{t.exp_amount || 'Amount (₹)'} *</Text>
                    <TextInput style={SHARED.formInput} keyboardType="numeric" placeholder="e.g. 5000"
                        value={expAmount} onChangeText={setExpAmount} placeholderTextColor={COLORS.gray400} />

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.exp_category || 'Category'} *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                        {CATEGORIES.map(c => (
                            <TouchableOpacity key={c} onPress={() => setExpCategory(c)}
                                style={[s.catChip, expCategory === c && { backgroundColor: CAT_COLORS[c], borderColor: CAT_COLORS[c] }]}>
                                <Text style={[s.catChipText, expCategory === c && { color: '#fff' }]}>
                                    {t[`exp_cat_${c.toLowerCase().replace(/ /g, '_')}`] || c}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.exp_crop || 'Crop'}</Text>
                    <TextInput style={SHARED.formInput} placeholder={t.exp_crop_placeholder || 'e.g. Rice, Wheat'}
                        value={expCrop} onChangeText={setExpCrop} placeholderTextColor={COLORS.gray400} />

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.season || 'Season'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {SEASONS.map(ss => (
                            <TouchableOpacity key={ss} onPress={() => setExpSeason(expSeason === ss ? '' : ss)}
                                style={[s.seasonChip, expSeason === ss && s.seasonChipActive]}>
                                <Text style={[s.seasonChipText, expSeason === ss && s.seasonChipTextActive]}>{ss}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.exp_notes || 'Notes'}</Text>
                    <TextInput style={SHARED.formInput} placeholder={t.exp_notes_placeholder || 'Optional details'}
                        value={expNotes} onChangeText={setExpNotes} placeholderTextColor={COLORS.gray400} />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                        <TouchableOpacity style={[SHARED.btnPrimary, { flex: 1, opacity: saving ? 0.6 : 1 }]} onPress={handleAddExpense} disabled={saving}>
                            <Text style={SHARED.btnPrimaryText}>{saving ? '⏳' : '✅'} {saving ? (t.saving || 'Saving...') : (t.exp_save_expense || 'Save Expense')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[SHARED.btnSecondary, { flex: 0.6 }]} onPress={() => setTab('overview')}>
                            <Text style={SHARED.btnSecondaryText}>{t.back || 'Back'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ═══════ ADD INCOME ═══════ */}
            {tab === 'add-income' && (
                <View style={SHARED.card}>
                    <Text style={s.sectionTitle}>💰 {t.exp_new_income || 'Record Crop Sale'}</Text>
                    {msg ? <Text style={s.msgSuccess}>{msg}</Text> : null}

                    <Text style={SHARED.formLabel}>{t.exp_total_amount || 'Total Amount (₹)'} *</Text>
                    <TextInput style={SHARED.formInput} keyboardType="numeric" placeholder="e.g. 25000"
                        value={incAmount} onChangeText={setIncAmount} placeholderTextColor={COLORS.gray400} />

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.exp_crop || 'Crop'} *</Text>
                    <TextInput style={SHARED.formInput} placeholder={t.exp_crop_placeholder || 'e.g. Rice'}
                        value={incCrop} onChangeText={setIncCrop} placeholderTextColor={COLORS.gray400} />

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.season || 'Season'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {SEASONS.map(ss => (
                            <TouchableOpacity key={ss} onPress={() => setIncSeason(incSeason === ss ? '' : ss)}
                                style={[s.seasonChip, incSeason === ss && s.seasonChipActive]}>
                                <Text style={[s.seasonChipText, incSeason === ss && s.seasonChipTextActive]}>{ss}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={SHARED.formLabel}>{t.exp_quantity || 'Quantity (kg)'}</Text>
                            <TextInput style={SHARED.formInput} keyboardType="numeric" placeholder="e.g. 500"
                                value={incQty} onChangeText={setIncQty} placeholderTextColor={COLORS.gray400} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={SHARED.formLabel}>{t.exp_price_per_kg || '₹/kg'}</Text>
                            <TextInput style={SHARED.formInput} keyboardType="numeric" placeholder="e.g. 22"
                                value={incPriceKg} onChangeText={setIncPriceKg} placeholderTextColor={COLORS.gray400} />
                        </View>
                    </View>

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.exp_buyer || 'Buyer / Mandi'}</Text>
                    <TextInput style={SHARED.formInput} placeholder={t.exp_buyer_placeholder || 'e.g. Local Mandi'}
                        value={incBuyer} onChangeText={setIncBuyer} placeholderTextColor={COLORS.gray400} />

                    <Text style={[SHARED.formLabel, { marginTop: 12 }]}>{t.exp_notes || 'Notes'}</Text>
                    <TextInput style={SHARED.formInput} placeholder={t.exp_notes_placeholder || 'Optional details'}
                        value={incNotes} onChangeText={setIncNotes} placeholderTextColor={COLORS.gray400} />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                        <TouchableOpacity style={[SHARED.btnPrimary, { flex: 1, opacity: saving ? 0.6 : 1 }]} onPress={handleAddIncome} disabled={saving}>
                            <Text style={SHARED.btnPrimaryText}>{saving ? '⏳' : '✅'} {saving ? (t.saving || 'Saving...') : (t.exp_save_income || 'Save Income')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[SHARED.btnSecondary, { flex: 0.6 }]} onPress={() => setTab('overview')}>
                            <Text style={SHARED.btnSecondaryText}>{t.back || 'Back'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ═══════ RECORDS ═══════ */}
            {tab === 'records' && (
                <>
                    {/* Expenses */}
                    <View style={[SHARED.card, { marginBottom: 12 }]}>
                        <Text style={s.sectionTitle}>💸 {t.exp_expense_list || 'Expenses'} ({expenses.length})</Text>
                        {expenses.length === 0 ? (
                            <Text style={s.emptySmall}>{t.exp_no_expenses || 'No expenses recorded. Add your first!'}</Text>
                        ) : expenses.map(ex => (
                            <View key={ex.id} style={s.recordRow}>
                                <View style={[s.catDot, { backgroundColor: CAT_COLORS[ex.category] || COLORS.gray400 }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.recordTitle}>{t[`exp_cat_${ex.category.toLowerCase().replace(/ /g, '_')}`] || ex.category}</Text>
                                    <Text style={s.recordMeta}>{ex.date}{ex.crop ? ` • ${ex.crop}` : ''}{ex.season ? ` • ${ex.season}` : ''}</Text>
                                    {ex.notes ? <Text style={s.recordNotes}>{ex.notes}</Text> : null}
                                </View>
                                <Text style={[s.recordAmount, { color: COLORS.red500 }]}>-₹{ex.amount.toLocaleString()}</Text>
                                <TouchableOpacity onPress={() => handleDeleteExpense(ex.id)} style={s.deleteBtn}>
                                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {/* Income */}
                    <View style={SHARED.card}>
                        <Text style={s.sectionTitle}>💰 {t.exp_income_list || 'Income from Sales'} ({incomes.length})</Text>
                        {incomes.length === 0 ? (
                            <Text style={s.emptySmall}>{t.exp_no_income || 'No income recorded. Record your first sale!'}</Text>
                        ) : incomes.map(inc => (
                            <View key={inc.id} style={s.recordRow}>
                                <View style={[s.catDot, { backgroundColor: COLORS.green500 }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.recordTitle}>{inc.crop}</Text>
                                    <Text style={s.recordMeta}>
                                        {inc.date}{inc.season ? ` • ${inc.season}` : ''}
                                        {inc.quantity_kg ? ` • ${inc.quantity_kg}kg` : ''}
                                        {inc.buyer ? ` • ${inc.buyer}` : ''}
                                    </Text>
                                    {inc.notes ? <Text style={s.recordNotes}>{inc.notes}</Text> : null}
                                </View>
                                <Text style={[s.recordAmount, { color: COLORS.green600 }]}>+₹{inc.amount.toLocaleString()}</Text>
                                <TouchableOpacity onPress={() => handleDeleteIncome(inc.id)} style={s.deleteBtn}>
                                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </>
            )}
        </ScrollView>
    );
}

/* ─── Summary Card Component ─── */
function SummaryCard({ icon, label, value, color }) {
    return (
        <View style={[SHARED.card, s.summaryCard]}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.gray500 }}>{label}</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color, marginTop: 2 }}>{value}</Text>
        </View>
    );
}

/* ─── Styles ─── */
const s = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    summaryCard: { width: '47%', alignItems: 'center', paddingVertical: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, marginBottom: 12 },
    emptySmall: { fontSize: 13, color: COLORS.gray500, textAlign: 'center', paddingVertical: 20 },

    tabBtn: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginRight: 8,
        borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.white,
    },
    tabBtnActive: { backgroundColor: COLORS.green600, borderColor: COLORS.green600 },
    tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
    tabTextActive: { color: COLORS.white },

    filterChip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 6,
        borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.white,
    },
    filterChipActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green300 },
    filterText: { fontSize: 12, color: COLORS.gray500 },
    filterTextActive: { color: COLORS.green700, fontWeight: '700' },

    catChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8,
        borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.gray50,
    },
    catChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },

    seasonChip: {
        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.gray50,
    },
    seasonChipActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green300 },
    seasonChipText: { fontSize: 13, color: COLORS.gray500, fontWeight: '600' },
    seasonChipTextActive: { color: COLORS.green700 },

    msgSuccess: {
        backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 12,
        color: COLORS.green600, fontWeight: '600', fontSize: 13, textAlign: 'center',
    },

    barBg: { height: 8, borderRadius: 4, backgroundColor: COLORS.gray100, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },

    recordRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle,
    },
    catDot: { width: 10, height: 10, borderRadius: 5 },
    recordTitle: { fontSize: 14, fontWeight: '600', color: COLORS.gray900 },
    recordMeta: { fontSize: 11, color: COLORS.gray500, marginTop: 1 },
    recordNotes: { fontSize: 11, color: COLORS.gray400, fontStyle: 'italic', marginTop: 2 },
    recordAmount: { fontSize: 14, fontWeight: '800', marginRight: 4 },
    deleteBtn: { padding: 4, opacity: 0.6 },
});
