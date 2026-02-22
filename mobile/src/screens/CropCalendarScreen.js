/**
 * SmartAgri AI Mobile - Smart Crop Calendar & Task Scheduler
 * A full decision engine: crop biology + weather → dynamic farm action plan
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet,
    TextInput, ActivityIndicator, Animated,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../api';
import { useLang } from '../context/LanguageContext';
import { COLORS, SHADOWS, SHARED } from '../theme';

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────
/** Parse YYYY-MM-DD safely in local timezone (avoids UTC midnight off-by-1 bug) */
function parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function fmtDate(dateStr, opts = { day: 'numeric', month: 'short' }) {
    return parseLocalDate(dateStr).toLocaleDateString('en-IN', opts);
}

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────
const WATER_SOURCES = ['Rainfed', 'Canal', 'Borewell'];

const STATUS_BASE = {
    urgent: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
    upcoming: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
    scheduled: { color: '#3b82f6', bg: '#eff6ff', border: '#dbeafe', dot: '#3b82f6' },
    done: { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' },
};

const CATEGORY_COLORS = {
    planting: { bg: '#f0fdf4', icon: '#16a34a' },
    irrigation: { bg: '#eff6ff', icon: '#3b82f6' },
    nutrition: { bg: '#fefce8', icon: '#ca8a04' },
    pest: { bg: '#fdf4ff', icon: '#9333ea' },
    monitoring: { bg: '#f0f9ff', icon: '#0284c7' },
    harvest: { bg: '#fff7ed', icon: '#ea580c' },
};

const SEASON_FIT_BASE = {
    optimal: { color: '#16a34a', bg: '#dcfce7', dot: '🟢' },
    marginal: { color: '#b45309', bg: '#fef9c3', dot: '🟡' },
    offseason: { color: '#dc2626', bg: '#fee2e2', dot: '🔴' },
};

const ALL_STATES = [
    'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
    'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

// ─────────────────────────────────────────────────
// CROP CARD — visual, tappable tile
// ─────────────────────────────────────────────────
function CropCard({ entry, selected, onSelect, t }) {
    const fitBase = SEASON_FIT_BASE[entry.season_fit] || SEASON_FIT_BASE.marginal;
    const fitLabels = { optimal: t.cc_optimal, marginal: t.cc_marginal, offseason: t.cc_offseason };
    const fit = { ...fitBase, label: fitLabels[entry.season_fit] || t.cc_marginal };
    const isSel = selected === entry.name;

    return (
        <TouchableOpacity
            style={[styles.cropCard, isSel && styles.cropCardSelected, entry.is_local && styles.cropCardLocal]}
            onPress={() => onSelect(entry.name)}
            activeOpacity={0.75}
        >
            {entry.is_local && (
                <View style={styles.localBadge}>
                    <Text style={styles.localBadgeText}>📍 {t.cc_local_badge}</Text>
                </View>
            )}
            {isSel && (
                <View style={styles.checkmark}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>
                </View>
            )}
            <Text style={[styles.cropCardName, isSel && { color: COLORS.green700 }]}>
                {entry.season_icon} {entry.name}
            </Text>
            <View style={[styles.fitBadge, { backgroundColor: fit.bg }]}>
                <Text style={[styles.fitText, { color: fit.color }]}>{fit.dot} {fit.label}</Text>
            </View>
            <Text style={styles.cropSeasonLabel} numberOfLines={2}>{entry.season_label}</Text>
        </TouchableOpacity>
    );
}

// ─────────────────────────────────────────────────
// SETUP WIZARD — geo-aware, local-first crop picker
// ─────────────────────────────────────────────────
function SetupWizard({ onGenerate, loading, t }) {
    const [crop, setCrop] = useState('');
    const [date, setDate] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [water, setWater] = useState('Rainfed');
    const [error, setError] = useState('');

    const [districts, setDistricts] = useState([]);
    const [loadingDist, setLoadingDist] = useState(false);
    const [localCrops, setLocalCrops] = useState([]);
    const [otherCrops, setOtherCrops] = useState([]);
    const [loadingCrops, setLoadingCrops] = useState(false);
    const [counts, setCounts] = useState({ local: 0, other: 0, total: 0 });
    const [showOther, setShowOther] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    // Load districts when state changes
    useEffect(() => {
        if (!state) { setDistricts([]); setDistrict(''); return; }
        setDistrict('');
        setCrop('');
        setLoadingDist(true);
        api.get('/calendar/districts', { params: { state } })
            .then((r) => setDistricts(r.data.districts || []))
            .catch(() => setDistricts([]))
            .finally(() => setLoadingDist(false));
    }, [state]);

    // Load ranked crops when state or district changes
    useEffect(() => {
        if (!state) { setLocalCrops([]); setOtherCrops([]); return; }
        setLoadingCrops(true);
        setCrop('');
        api.get('/calendar/crops-ranked', { params: { state, district } })
            .then((r) => {
                setLocalCrops(r.data.local_crops || []);
                setOtherCrops(r.data.other_crops || []);
                setCounts({ local: r.data.local_count || 0, other: r.data.other_count || 0, total: r.data.total || 0 });
            })
            .catch(() => { setLocalCrops([]); setOtherCrops([]); })
            .finally(() => setLoadingCrops(false));
    }, [state, district]);

    const validate = () => {
        if (!state) return setError('Please select your state');
        if (!district) return setError('Please select your district');
        if (!crop) return setError('Please select a crop');
        if (!date) return setError('Please enter sowing date');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Date must be YYYY-MM-DD format');
        if (isNaN(new Date(date).getTime())) return setError('Invalid date entered');
        setError('');
        onGenerate({ crop, sowing_date: date, state, district, water_source: water });
    };

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            {/* Hero */}
            <View style={styles.setupHero}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>📅</Text>
                <Text style={styles.setupHeroTitle}>{t.cc_smart_crop_calendar}</Text>
                <Text style={styles.setupHeroSub}>{t.cc_hero_desc}</Text>
            </View>

            {/* How it works */}
            <View style={[SHARED.card, { marginBottom: 16 }]}>
                <Text style={styles.sectionHeader}>⚙️ {t.cc_how_it_works}</Text>
                {[
                    { icon: '🌱', title: t.cc_crop_science, desc: t.cc_crop_science_desc },
                    { icon: '📍', title: t.cc_local_first, desc: t.cc_local_first_desc },
                    { icon: '🌤️', title: t.cc_weather_smart, desc: t.cc_weather_smart_desc },
                    { icon: '🔔', title: t.cc_action_ready, desc: t.cc_action_ready_desc },
                ].map((s) => (
                    <View key={s.title} style={styles.howRow}>
                        <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.howTitle}>{s.title}</Text>
                            <Text style={styles.howDesc}>{s.desc}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Form card */}
            <View style={[SHARED.cardElevated, { marginBottom: 16 }]}>
                <Text style={styles.sectionHeader}>📍 {t.cc_your_location}</Text>

                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View> : null}

                {/* State */}
                <Text style={SHARED.formLabel}>{t.cc_state}</Text>
                <View style={[SHARED.formInput, { paddingHorizontal: 0, paddingVertical: 0, marginBottom: 14 }]}>
                    <Picker selectedValue={state} onValueChange={setState} style={{ height: 48, color: COLORS.gray800 }}>
                        <Picker.Item label={t.cc_select_state} value="" color={COLORS.gray400} />
                        {ALL_STATES.map((s) => <Picker.Item key={s} label={s} value={s} />)}
                    </Picker>
                </View>

                {/* District */}
                <Text style={SHARED.formLabel}>
                    {t.cc_district}{loadingDist ? ` (${t.cc_loading})` : state ? ` — ${districts.length} ${t.cc_districts}` : ''}
                </Text>
                <View style={[SHARED.formInput, { paddingHorizontal: 0, paddingVertical: 0, marginBottom: 18 }, !state && { opacity: 0.45 }]}>
                    <Picker selectedValue={district} onValueChange={setDistrict} style={{ height: 48, color: COLORS.gray800 }} enabled={!!state && !loadingDist}>
                        <Picker.Item label={!state ? t.cc_select_state_first : t.cc_select_district} value="" color={COLORS.gray400} />
                        {districts.map((d) => <Picker.Item key={d} label={d} value={d} />)}
                    </Picker>
                </View>

                {/* Crops */}
                <Text style={[SHARED.formLabel, { marginBottom: 6 }]}>
                    🌾 {t.cc_select_crop}
                    {counts.total > 0 && (
                        <Text style={{ color: COLORS.gray400, fontWeight: '400', fontSize: 12 }}>
                            {'  '}{counts.local} {t.cc_local} · {counts.other} {t.cc_more}
                        </Text>
                    )}
                </Text>

                {!state ? (
                    <View style={styles.cropPlaceholder}>
                        <Text style={{ fontSize: 28, marginBottom: 6 }}>📍</Text>
                        <Text style={{ color: COLORS.gray400, fontSize: 13, textAlign: 'center' }}>{t.cc_select_state_to_see}</Text>
                    </View>
                ) : loadingCrops ? (
                    <View style={styles.cropPlaceholder}>
                        <ActivityIndicator color={COLORS.green600} />
                        <Text style={{ color: COLORS.gray500, fontSize: 12, marginTop: 8 }}>{t.cc_loading_crops}</Text>
                    </View>
                ) : (
                    <>
                        {/* LOCAL */}
                        {localCrops.length > 0 && (
                            <>
                                <View style={styles.cropSecRow}>
                                    <View style={[styles.cropSecDot, { backgroundColor: COLORS.green600 }]} />
                                    <Text style={styles.cropSecTitle}>
                                        📍 {t.cc_grown_in} {district || state}
                                    </Text>
                                    <View style={styles.cropSecPill}><Text style={styles.cropSecPillTxt}>{localCrops.length} {t.cc_crops}</Text></View>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                    <View style={styles.cropRow}>
                                        {localCrops.map((e) => <CropCard key={e.name} entry={e} selected={crop} onSelect={setCrop} t={t} />)}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* OTHER */}
                        {otherCrops.length > 0 && (
                            <>
                                <TouchableOpacity style={styles.cropSecRow} onPress={() => setShowOther(!showOther)}>
                                    <View style={[styles.cropSecDot, { backgroundColor: COLORS.gray300 }]} />
                                    <Text style={[styles.cropSecTitle, { color: COLORS.gray500 }]}>🌍 {t.cc_other_crops}</Text>
                                    <View style={[styles.cropSecPill, { backgroundColor: COLORS.gray100 }]}>
                                        <Text style={[styles.cropSecPillTxt, { color: COLORS.gray500 }]}>{otherCrops.length} {t.cc_crops}</Text>
                                    </View>
                                    <Text style={{ color: COLORS.gray400, marginLeft: 6, fontSize: 12 }}>{showOther ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                                {showOther && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                        <View style={styles.cropRow}>
                                            {otherCrops.map((e) => <CropCard key={e.name} entry={e} selected={crop} onSelect={setCrop} t={t} />)}
                                        </View>
                                    </ScrollView>
                                )}
                            </>
                        )}

                        {crop ? (
                            <View style={styles.selectedBar}>
                                <Text style={styles.selectedBarTxt}>✅ {t.cc_selected}: <Text style={{ fontWeight: '800' }}>{crop}</Text></Text>
                            </View>
                        ) : null}
                    </>
                )}

                {/* Date */}
                <Text style={[SHARED.formLabel, { marginTop: 16 }]}>{t.cc_sowing_date}</Text>
                <TextInput
                    style={[SHARED.formInput, { marginBottom: 14 }]}
                    placeholder="e.g. 2025-11-01"
                    placeholderTextColor={COLORS.gray400}
                    value={date}
                    onChangeText={setDate}
                    keyboardType="numbers-and-punctuation"
                />

                {/* Water Source */}
                <Text style={SHARED.formLabel}>{t.cc_water_source}</Text>
                <View style={styles.chipRow}>
                    {WATER_SOURCES.map((w) => {
                        const wLabel = w === 'Rainfed' ? t.cc_rainfed : w === 'Canal' ? t.cc_canal : t.cc_borewell;
                        return (
                            <TouchableOpacity key={w} style={[styles.chip, water === w && styles.chipActive]} onPress={() => setWater(w)}>
                                <Text style={[styles.chipText, water === w && styles.chipTextActive]}>
                                    {w === 'Rainfed' ? '🌧️' : w === 'Canal' ? '🏞️' : '🔩'} {wLabel}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={[SHARED.btnPrimary, { marginTop: 20 }, loading && { opacity: 0.6 }]} onPress={validate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={SHARED.btnPrimaryText}>📅 {t.cc_generate}</Text>}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────
// PROGRESS BAR COMPONENT
// ─────────────────────────────────────────────────
function ProgressBar({ pct, color = COLORS.green600 }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(anim, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
    }, [pct]);
    return (
        <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, {
                width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                backgroundColor: color,
            }]} />
        </View>
    );
}

// ─────────────────────────────────────────────────
// TASK CARD COMPONENT
// ─────────────────────────────────────────────────
function TaskCard({ task, index }) {
    const [expanded, setExpanded] = useState(false);
    const status = task._statusConfig || STATUS_BASE[task.status] || STATUS_BASE.scheduled;
    const cat = CATEGORY_COLORS[task.category] || { bg: COLORS.gray50, icon: COLORS.gray600 };
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
                style={[styles.taskCard, { borderColor: status.border, borderLeftColor: status.dot, borderLeftWidth: 4 }]}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.8}
            >
                <View style={styles.taskHeader}>
                    <View style={[styles.taskIcon, { backgroundColor: cat.bg }]}>
                        <Text style={{ fontSize: 20 }}>{task.icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.taskTitleRow}>
                            <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                            </View>
                        </View>
                        <Text style={[styles.taskDate, task.is_adjusted && { color: COLORS.amber500 }]}>
                            {task.is_adjusted ? '📅' : ''} {task.date_label}
                        </Text>
                    </View>
                    <Text style={{ color: COLORS.gray300, fontSize: 16, marginLeft: 4 }}>
                        {expanded ? '▲' : '▼'}
                    </Text>
                </View>

                {expanded && (
                    <View style={styles.taskExpanded}>
                        <Text style={styles.taskDesc}>{task.desc}</Text>
                        {task.weather_alert && (
                            <View style={styles.alertBox}>
                                <Text style={styles.alertText}>{task.weather_alert}</Text>
                            </View>
                        )}
                        {task.adjustment_reason && (
                            <View style={styles.adjustBox}>
                                <Text style={styles.adjustText}>🔄 {task.adjustment_reason}</Text>
                            </View>
                        )}
                        <View style={styles.dateChip}>
                            <Text style={styles.dateChipText}>
                                📅 {fmtDate(task.adjusted_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                                {task.is_adjusted && ` (orig: ${fmtDate(task.original_date)})`}
                            </Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────
// SCHEDULE VIEW — Full calendar display
// ─────────────────────────────────────────────────
function ScheduleView({ data, onReset, t }) {
    const [filter, setFilter] = useState('all');
    const [catFilter, setCatFilter] = useState('all');

    // Safe defaults — prevents crash if any field is missing
    const tasks = data?.tasks || [];
    const growthDays = data?.growth_days ?? 0;
    const daysElapsed = data?.days_elapsed ?? 0;
    const progressPct = data?.progress_pct ?? 0;

    const FILTERS = [
        { key: 'all', label: t.cc_all },
        { key: 'urgent', label: `🔴 ${t.cc_urgent}` },
        { key: 'upcoming', label: `🟡 ${t.cc_upcoming}` },
        { key: 'scheduled', label: `🔵 ${t.cc_planned}` },
        { key: 'done', label: `✅ ${t.cc_done}` },
    ];

    const CAT_FILTERS = ['all', 'irrigation', 'nutrition', 'pest', 'harvest', 'monitoring'];

    const filtered = tasks.filter((t) => {
        const matchStatus = filter === 'all' || t.status === filter;
        const matchCat = catFilter === 'all' || t.category === catFilter;
        return matchStatus && matchCat;
    });

    return (
        <View>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.headerCardTop}>
                    <View>
                        <Text style={styles.headerCrop}>{data.crop}</Text>
                        <Text style={styles.headerPhase}>{data.current_phase}</Text>
                        {data.district && (
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                                📍 {data.district}, {data.state}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
                        <Text style={styles.resetText}>✕ {t.cc_reset}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>{t.cc_growth_progress}</Text>
                        <Text style={styles.progressPct}>{progressPct}%</Text>
                    </View>
                    <ProgressBar pct={progressPct} color={progressPct > 75 ? COLORS.amber500 : COLORS.green600} />
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                        <Text style={styles.statChipVal}>{daysElapsed}d</Text>
                        <Text style={styles.statChipLbl}>{t.cc_elapsed}</Text>
                    </View>
                    <View style={styles.statChip}>
                        <Text style={styles.statChipVal}>{Math.max(0, growthDays - daysElapsed)}d</Text>
                        <Text style={styles.statChipLbl}>{t.cc_remaining}</Text>
                    </View>
                    <View style={styles.statChip}>
                        <Text style={styles.statChipVal}>
                            {fmtDate(data.harvest_date)}
                        </Text>
                        <Text style={styles.statChipLbl}>{t.cc_harvest}</Text>
                    </View>
                    <View style={styles.statChip}>
                        <Text style={[styles.statChipVal, { color: '#f59e0b' }]}>
                            {tasks.filter(t => t.status === 'urgent').length}
                        </Text>
                        <Text style={styles.statChipLbl}>{t.cc_urgent}</Text>
                    </View>
                </View>
            </View>

            {/* Weather Summary */}
            {data.weather_summary?.temperature != null && (
                <View style={[SHARED.card, { marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                    <Text style={{ fontSize: 28 }}>
                        {(data.weather_summary.humidity ?? 0) > 80 ? '⛅' : (data.weather_summary.humidity ?? 0) > 60 ? '🌤️' : '☀️'}
                    </Text>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: COLORS.gray900 }}>
                            {data.weather_summary.temperature?.toFixed(1) ?? '--'}°C · {data.weather_summary.description ?? 'Clear'}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.gray500 }}>
                            💧 {data.weather_summary.humidity?.toFixed(0) ?? '--'}% {t.cc_humidity} · 🌧️ {data.weather_summary.rainfall?.toFixed(1) ?? '0'}mm {t.cc_today}
                        </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: COLORS.green600, fontWeight: '600' }}>{data.state}</Text>
                </View>
            )}

            {/* Next urgent task highlight */}
            {data.next_task && (
                <View style={styles.nextTaskBanner}>
                    <View style={styles.nextTaskLeft}>
                        <Text style={styles.nextTaskLabel}>⚡ {t.cc_next_action}</Text>
                        <Text style={styles.nextTaskTitle}>{data.next_task.icon} {data.next_task.title}</Text>
                        <Text style={styles.nextTaskDate}>{data.next_task.date_label}</Text>
                    </View>
                    <View style={styles.nextTaskRight}>
                        <Text style={styles.nextTaskDays}>
                            {data.next_task.days_from_today <= 0 ? t.cc_overdue : `${data.next_task.days_from_today}d`}
                        </Text>
                        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                            {data.next_task.days_from_today <= 0 ? '' : t.cc_to_go}
                        </Text>
                    </View>
                </View>
            )}

            {/* Status Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={styles.filterRow}>
                    {FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                            onPress={() => setFilter(f.key)}
                        >
                            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={styles.filterRow}>
                    {CAT_FILTERS.map((c) => (
                        <TouchableOpacity
                            key={c}
                            style={[styles.catChip, catFilter === c && styles.catChipActive]}
                            onPress={() => setCatFilter(c)}
                        >
                            <Text style={[styles.catChipText, catFilter === c && styles.catChipTextActive]}>
                                {c.charAt(0).toUpperCase() + c.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <Text style={styles.taskCount}>{filtered.length} {filtered.length !== 1 ? t.cc_tasks : t.cc_task}</Text>

            {filtered.length === 0 ? (
                <View style={[SHARED.card, { alignItems: 'center', padding: 32 }]}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
                    <Text style={SHARED.emptyText}>{t.cc_no_tasks}</Text>
                </View>
            ) : (
                filtered.map((task, i) => (
                    <TaskCard key={`${task.day}-${task.type}`} task={task} index={i} />
                ))
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────
export default function CropCalendarScreen() {
    const { t } = useLang();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async ({ crop, sowing_date, state, district, water_source }) => {
        setLoading(true);
        setError('');
        try {
            const r = await api.get('/calendar/schedule', {
                params: { crop, sowing_date, state, district, water_source },
            });
            // Server may return {error: "..."}  with 200 status — handle it
            if (r.data?.error) {
                setError(r.data.error);
            } else if (!r.data?.tasks) {
                setError('Invalid response from server. Please try again.');
            } else {
                setSchedule(r.data);
            }
        } catch (e) {
            setError(e.response?.data?.detail || e.message || 'Failed to generate schedule. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity onPress={() => setError('')} style={{ marginTop: 8 }}>
                        <Text style={{ color: '#b45309', fontWeight: '700', fontSize: 13 }}>✕ {t.cc_dismiss}</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {!schedule ? (
                <SetupWizard onGenerate={handleGenerate} loading={loading} t={t} />
            ) : (
                <ScheduleView data={schedule} onReset={() => { setSchedule(null); setError(''); }} t={t} />
            )}
        </ScrollView>
    );
}

// ─────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Setup Wizard
    setupHero: {
        backgroundColor: COLORS.green800,
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        marginBottom: 16,
        ...SHADOWS.green,
    },
    setupHeroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
    setupHeroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 19 },
    sectionHeader: { fontSize: 14, fontWeight: '800', color: COLORS.gray900, marginBottom: 14 },
    howRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    howTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray800 },
    howDesc: { fontSize: 12, color: COLORS.gray500 },

    errorBox: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 12, marginBottom: 14 },
    errorText: { color: '#b45309', fontSize: 13, fontWeight: '500' },

    chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.borderLight, backgroundColor: COLORS.gray50 },
    chipActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green500 },
    chipText: { fontSize: 13, color: COLORS.gray600, fontWeight: '600' },
    chipTextActive: { color: COLORS.green700 },

    // Crop selection
    cropPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        backgroundColor: COLORS.gray50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderStyle: 'dashed',
        marginBottom: 14,
    },
    cropRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 2, paddingBottom: 4 },
    cropCard: {
        width: 130,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        ...SHADOWS.sm,
        position: 'relative',
    },
    cropCardSelected: { borderColor: COLORS.green500, backgroundColor: COLORS.green50 },
    cropCardLocal: { borderColor: '#86efac' },
    cropCardName: { fontSize: 13, fontWeight: '800', color: COLORS.gray900, marginBottom: 6, marginTop: 4 },
    fitBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginBottom: 5, alignSelf: 'flex-start' },
    fitText: { fontSize: 10, fontWeight: '700' },
    cropSeasonLabel: { fontSize: 10, color: COLORS.gray400, lineHeight: 13 },
    localBadge: {
        backgroundColor: COLORS.green800,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    localBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
    checkmark: {
        position: 'absolute', top: 8, right: 8,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: COLORS.green600,
        alignItems: 'center', justifyContent: 'center',
    },
    cropSecRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
    cropSecDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green600 },
    cropSecTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray800, flex: 1 },
    cropSecPill: { backgroundColor: COLORS.green100, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    cropSecPillTxt: { fontSize: 10, fontWeight: '700', color: COLORS.green700 },
    selectedBar: { backgroundColor: COLORS.green50, borderRadius: 10, padding: 10, marginTop: 4, borderWidth: 1, borderColor: '#86efac' },
    selectedBarTxt: { fontSize: 13, color: COLORS.green700 },

    // Header Card
    headerCard: {
        backgroundColor: COLORS.green800,
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        ...SHADOWS.green,
    },
    headerCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    headerCrop: { fontSize: 22, fontWeight: '900', color: '#fff' },
    headerPhase: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    resetBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    resetText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    progressSection: { marginBottom: 16 },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    progressPct: { fontSize: 12, color: '#fff', fontWeight: '800' },
    progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, borderRadius: 4 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statChip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, alignItems: 'center' },
    statChipVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
    statChipLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

    // Next task banner
    nextTaskBanner: {
        backgroundColor: '#16a34a', borderRadius: 14, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.green,
    },
    nextTaskLeft: { flex: 1 },
    nextTaskLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
    nextTaskTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 2 },
    nextTaskDate: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
    nextTaskRight: { alignItems: 'center', marginLeft: 16 },
    nextTaskDays: { fontSize: 26, fontWeight: '900', color: '#fff' },

    // Filters
    filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.borderLight },
    filterChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
    filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    filterChipTextActive: { color: '#fff' },
    catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.borderLight },
    catChipActive: { backgroundColor: COLORS.blue900, borderColor: COLORS.blue900 },
    catChipText: { fontSize: 11, fontWeight: '600', color: COLORS.gray500 },
    catChipTextActive: { color: '#fff' },
    taskCount: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', marginBottom: 8, marginLeft: 2 },

    // Task Card
    taskCard: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, ...SHADOWS.sm,
    },
    taskHeader: { flexDirection: 'row', alignItems: 'center' },
    taskIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    taskTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
    taskTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, flex: 1 },
    taskDate: { fontSize: 12, color: COLORS.gray500 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: '700' },
    taskExpanded: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle, paddingTop: 12 },
    taskDesc: { fontSize: 13, color: COLORS.gray600, lineHeight: 19, marginBottom: 10 },
    alertBox: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 10, padding: 10, marginBottom: 8 },
    alertText: { fontSize: 12, color: '#c2410c', fontWeight: '600', lineHeight: 18 },
    adjustBox: { backgroundColor: COLORS.blue50, borderWidth: 1, borderColor: COLORS.blue100, borderRadius: 10, padding: 10, marginBottom: 8 },
    adjustText: { fontSize: 12, color: COLORS.blue900, lineHeight: 18 },
    dateChip: { backgroundColor: COLORS.green50, borderRadius: 8, padding: 8, alignSelf: 'flex-start' },
    dateChipText: { fontSize: 11, color: COLORS.green700, fontWeight: '700' },
});
