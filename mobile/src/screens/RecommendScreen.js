/**
 * SmartAgri AI Mobile - Crop Recommendation Screen (4-step wizard)
 */
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

const STATES = [
    'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan',
    'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Haryana',
    'Kerala', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Odisha',
];

export default function RecommendScreen() {
    const { t } = useLang();
    const STEPS = [t.step_location, t.step_soil, t.step_weather, t.step_results];
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [form, setForm] = useState({
        state: '', district: '', land_size_acres: 2, irrigation_type: 'Rainfed',
        previous_crop: '', N: 60, P: 40, K: 40, ph: 6.5, soil_type: 'Loamy',
        temperature: 28, humidity: 70, rainfall: 150, season: 'Kharif',
    });

    const update = (field, value) => setForm({ ...form, [field]: value });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                state: form.state, district: form.district,
                land_size_acres: form.land_size_acres, irrigation_type: form.irrigation_type,
                previous_crop: form.previous_crop,
                soil: { N: form.N, P: form.P, K: form.K, ph: form.ph, soil_type: form.soil_type },
                weather: { temperature: form.temperature, humidity: form.humidity, rainfall: form.rainfall, season: form.season },
            };
            const res = await api.post('/recommend/', payload);
            setResults(res.data);
            setStep(3);
        } catch (err) {
            alert(err.response?.data?.detail || 'Recommendation failed');
        } finally { setLoading(false); }
    };

    const nextStep = () => {
        if (step === 2) handleSubmit();
        else setStep(step + 1);
    };

    const renderSlider = (key, label, min, max, unit, stepVal = 1) => (
        <View style={styles.sliderGroup} key={key}>
            <View style={styles.sliderHeader}>
                <Text style={SHARED.formLabel}>{label}</Text>
                <Text style={styles.sliderValue}>{form[key]} {unit}</Text>
            </View>
            <Slider
                minimumValue={min}
                maximumValue={max}
                step={stepVal}
                value={form[key]}
                onValueChange={(v) => update(key, Math.round(v * 100) / 100)}
                minimumTrackTintColor={COLORS.green500}
                maximumTrackTintColor={COLORS.gray200}
                thumbTintColor={COLORS.green600}
                style={{ height: 40 }}
            />
        </View>
    );

    if (step === 3 && results) {
        return <ResultsView data={results} onReset={() => { setStep(0); setResults(null); }} />;
    }

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <Text style={SHARED.pageTitle}>🌱 {t.crop_advisory}</Text>
            <Text style={SHARED.pageSubtitle}>{t.crop_advisory_desc}</Text>

            {/* Step Indicator */}
            <View style={styles.stepRow}>
                {STEPS.map((label, i) => (
                    <View key={i} style={styles.stepItem}>
                        <View style={[styles.stepCircle, i === step && styles.stepActive, i < step && styles.stepDone]}>
                            <Text style={[styles.stepNum, (i === step || i < step) && { color: '#fff' }]}>
                                {i < step ? '✓' : i + 1}
                            </Text>
                        </View>
                        <Text style={[styles.stepLabel, i === step && { color: COLORS.green700, fontWeight: '700' }]}>{label}</Text>
                    </View>
                ))}
            </View>

            <View style={SHARED.cardElevated}>
                {step === 0 && (
                    <>
                        <Text style={styles.sectionTitle}>📍 {t.location_farm_details}</Text>
                        <Text style={SHARED.formLabel}>{t.state}</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={form.state} onValueChange={(v) => update('state', v)} style={styles.picker}>
                                <Picker.Item label={t.select_state} value="" color={COLORS.gray400} />
                                {STATES.map((s) => <Picker.Item key={s} label={s} value={s} />)}
                            </Picker>
                        </View>
                        <Text style={SHARED.formLabel}>{t.district}</Text>
                        <TextInput style={SHARED.formInput} placeholder={t.district} placeholderTextColor={COLORS.gray400}
                            value={form.district} onChangeText={(v) => update('district', v)} />
                        {renderSlider('land_size_acres', t.land_size, 0.5, 50, 'acres', 0.5)}
                        <Text style={[SHARED.formLabel, { marginTop: 8 }]}>{t.irrigation_type}</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={form.irrigation_type} onValueChange={(v) => update('irrigation_type', v)} style={styles.picker}>
                                {['Rainfed', 'Canal', 'Borewell', 'Drip'].map((o) => <Picker.Item key={o} label={o} value={o} />)}
                            </Picker>
                        </View>
                        <Text style={SHARED.formLabel}>{t.previous_crop}</Text>
                        <TextInput style={SHARED.formInput} placeholder="e.g. Rice, Wheat" placeholderTextColor={COLORS.gray400}
                            value={form.previous_crop} onChangeText={(v) => update('previous_crop', v)} />
                    </>
                )}

                {step === 1 && (
                    <>
                        <Text style={styles.sectionTitle}>🧪 {t.soil_data}</Text>
                        <Text style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 12 }}>{t.soil_data_desc}</Text>
                        {renderSlider('N', t.nitrogen, 0, 150, 'kg/ha')}
                        {renderSlider('P', t.phosphorus, 0, 150, 'kg/ha')}
                        {renderSlider('K', t.potassium, 0, 250, 'kg/ha')}
                        {renderSlider('ph', t.soil_ph, 3.5, 10, '', 0.1)}
                        <Text style={SHARED.formLabel}>{t.soil_type}</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={form.soil_type} onValueChange={(v) => update('soil_type', v)} style={styles.picker}>
                                {['Loamy', 'Clayey', 'Sandy', 'Red', 'Black', 'Alluvial', 'Laterite'].map((s) =>
                                    <Picker.Item key={s} label={s} value={s} />
                                )}
                            </Picker>
                        </View>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Text style={styles.sectionTitle}>🌤️ {t.weather_season}</Text>
                        <Text style={SHARED.formLabel}>{t.season}</Text>
                        <View style={styles.seasonRow}>
                            {[{ k: 'Kharif', icon: '🌧️' }, { k: 'Rabi', icon: '❄️' }, { k: 'Summer', icon: '☀️' }].map(({ k, icon }) => (
                                <TouchableOpacity key={k}
                                    style={[styles.seasonBtn, form.season === k && styles.seasonActive]}
                                    onPress={() => update('season', k)}>
                                    <Text style={[styles.seasonText, form.season === k && { color: '#fff' }]}>{icon} {k}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {renderSlider('temperature', t.temperature, 5, 45, '°C')}
                        {renderSlider('humidity', t.humidity, 5, 100, '%')}
                        {renderSlider('rainfall', t.avg_rainfall, 0, 400, 'mm')}
                    </>
                )}

                {/* Navigation */}
                <View style={styles.navRow}>
                    {step > 0 && (
                        <TouchableOpacity style={SHARED.btnSecondary} onPress={() => setStep(step - 1)}>
                            <Text style={SHARED.btnSecondaryText}>← {t.back}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[SHARED.btnPrimary, { flex: 1, marginLeft: step > 0 ? 10 : 0 }]}
                        onPress={nextStep}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={SHARED.btnPrimaryText}>
                                {step === 2 ? `🔍 ${t.get_recommendations}` : `${t.next} →`}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

function ResultsView({ data, onReset }) {
    const { t } = useLang();
    const [openTip, setOpenTip] = useState(-1);

    const riskColor = (level) => {
        if (level?.includes('Low')) return COLORS.green500;
        if (level?.includes('High')) return COLORS.red500;
        return COLORS.amber500;
    };

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                    <Text style={SHARED.pageTitle}>🎯 {t.top_crop_recommendations}</Text>
                    <Text style={{ color: COLORS.gray500, fontSize: 13 }}>{data.state} • {data.season}</Text>
                </View>
                <TouchableOpacity style={[SHARED.btnSecondary, { paddingVertical: 8, paddingHorizontal: 14 }]} onPress={onReset}>
                    <Text style={[SHARED.btnSecondaryText, { fontSize: 12 }]}>← {t.new_analysis}</Text>
                </TouchableOpacity>
            </View>

            {/* Crop Cards */}
            {data.crops?.map((crop, i) => (
                <View key={i} style={[SHARED.card, { marginBottom: 12 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={styles.rankBadge}>
                                <Text style={styles.rankText}>#{i + 1}</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.gray900 }}>{crop.name}</Text>
                        </View>
                        <View style={[SHARED.badge, crop.risk_level?.includes('Low') ? SHARED.badgeLow : crop.risk_level?.includes('High') ? SHARED.badgeHigh : SHARED.badgeMedium]}>
                            <Text style={crop.risk_level?.includes('Low') ? SHARED.badgeLowText : crop.risk_level?.includes('High') ? SHARED.badgeHighText : SHARED.badgeMediumText}>
                                {crop.risk_level}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.profitValue}>{crop.estimated_profit}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.gray500, marginBottom: 10 }}>{t.estimated_profit}</Text>
                    <View style={styles.cropStats}>
                        {[
                            { label: t.yield_label, value: crop.expected_yield },
                            { label: t.price, value: crop.predicted_price },
                            { label: t.cost, value: crop.estimated_cost },
                            { label: t.score, value: `${crop.suitability_score}%` },
                        ].map((s, j) => (
                            <View key={j} style={styles.cropStatItem}>
                                <Text style={styles.cropStatLabel}>{s.label}</Text>
                                <Text style={styles.cropStatVal}>{s.value}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.reasonBox}>
                        <Text style={styles.reasonText}>💡 {crop.why_this_crop}</Text>
                    </View>
                </View>
            ))}

            {/* Market Insight */}
            <View style={[SHARED.card, { marginBottom: 12 }]}>
                <Text style={styles.sectionTitle}>📈 {t.market_insight}</Text>
                {data.market_insight && Object.entries(data.market_insight).map(([key, val]) => (
                    <View key={key} style={styles.insightRow}>
                        <Text style={{ color: COLORS.gray500, fontSize: 13, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Text>
                        <Text style={{ fontWeight: '600', fontSize: 13, color: COLORS.gray800 }}>{val}</Text>
                    </View>
                ))}
            </View>

            {/* Risk Assessment */}
            <View style={[SHARED.card, { marginBottom: 12 }]}>
                <Text style={styles.sectionTitle}>⚠️ {t.risk_assessment}</Text>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.gaugeCircle, { borderColor: riskColor(data.risk_assessment?.overall_level) }]}>
                        <Text style={styles.gaugeValue}>{(data.risk_assessment?.overall_score * 100)?.toFixed(0)}%</Text>
                        <Text style={{ fontSize: 10, color: COLORS.gray500 }}>{t.risk}</Text>
                    </View>
                    <View style={[SHARED.badge, { marginTop: 8 },
                    data.risk_assessment?.overall_level?.includes('Low') ? SHARED.badgeLow :
                        data.risk_assessment?.overall_level?.includes('High') ? SHARED.badgeHigh : SHARED.badgeMedium
                    ]}>
                        <Text style={
                            data.risk_assessment?.overall_level?.includes('Low') ? SHARED.badgeLowText :
                                data.risk_assessment?.overall_level?.includes('High') ? SHARED.badgeHighText : SHARED.badgeMediumText
                        }>{data.risk_assessment?.overall_level}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['climate_risk', 'water_risk', 'market_risk', 'pest_risk'].map((key) => (
                        <View key={key} style={[styles.cropStatItem, { minWidth: '45%' }]}>
                            <Text style={styles.cropStatLabel}>{t[key]}</Text>
                            <Text style={styles.cropStatVal}>{data.risk_assessment?.[key]}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Productivity Tips */}
            <View style={[SHARED.card, { marginBottom: 20 }]}>
                <Text style={styles.sectionTitle}>💡 {t.productivity_tips}</Text>
                {data.productivity_tips?.map((tip, i) => (
                    <TouchableOpacity key={i} onPress={() => setOpenTip(openTip === i ? -1 : i)} activeOpacity={0.7}>
                        <View style={styles.accordionHeader}>
                            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.gray800 }}>{tip.title}</Text>
                            <Text style={{ color: COLORS.gray400 }}>{openTip === i ? '▲' : '▼'}</Text>
                        </View>
                        {openTip === i && (
                            <View style={styles.accordionBody}>
                                <View style={[SHARED.badge, SHARED.badgeInfo, { marginBottom: 6 }]}>
                                    <Text style={SHARED.badgeInfoText}>{tip.category}</Text>
                                </View>
                                <Text style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 20 }}>{tip.description}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    stepItem: { alignItems: 'center', flex: 1 },
    stepCircle: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray200,
        alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    stepActive: { backgroundColor: COLORS.green600 },
    stepDone: { backgroundColor: COLORS.green500 },
    stepNum: { fontSize: 13, fontWeight: '700', color: COLORS.gray500 },
    stepLabel: { fontSize: 10, color: COLORS.gray500, textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray900, marginBottom: 14 },
    pickerWrap: {
        borderWidth: 1.5, borderColor: COLORS.borderLight, borderRadius: 12,
        backgroundColor: COLORS.white, marginBottom: 12, overflow: 'hidden',
    },
    picker: { height: 50, color: COLORS.gray800 },
    sliderGroup: { marginBottom: 8 },
    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sliderValue: { fontSize: 14, fontWeight: '700', color: COLORS.green700 },
    seasonRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    seasonBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
        backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.borderLight,
    },
    seasonActive: { backgroundColor: COLORS.green600, borderColor: COLORS.green600 },
    seasonText: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },
    navRow: { flexDirection: 'row', marginTop: 20 },
    rankBadge: {
        width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.green50,
        alignItems: 'center', justifyContent: 'center',
    },
    rankText: { fontSize: 12, fontWeight: '800', color: COLORS.green700 },
    profitValue: { fontSize: 22, fontWeight: '800', color: COLORS.green600 },
    cropStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    cropStatItem: {
        flex: 1, minWidth: '22%', backgroundColor: COLORS.gray50, borderRadius: 10,
        padding: 8, borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    cropStatLabel: { fontSize: 10, color: COLORS.gray500, fontWeight: '600', marginBottom: 2 },
    cropStatVal: { fontSize: 13, fontWeight: '700', color: COLORS.gray800 },
    reasonBox: {
        backgroundColor: COLORS.green50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.green200,
    },
    reasonText: { fontSize: 12, color: COLORS.green700, lineHeight: 18 },
    insightRow: {
        flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    gaugeCircle: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 5,
        alignItems: 'center', justifyContent: 'center',
    },
    gaugeValue: { fontSize: 20, fontWeight: '800', color: COLORS.gray900 },
    accordionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
    },
    accordionBody: { paddingVertical: 10 },
});
