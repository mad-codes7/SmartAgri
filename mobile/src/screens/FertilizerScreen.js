import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, TextInput, Modal, FlatList
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import { COLORS, SHARED, SHADOWS } from '../theme';
import api from '../api';

const CROPS = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean',
    'Chickpea', 'Mustard', 'Groundnut', 'Banana', 'Mango', 'Lentil',
    'Pigeon Peas', 'Mung Bean', 'Black Gram', 'Orange', 'Watermelon',
];

const SOIL_TYPES = [
    'Loamy', 'Sandy', 'Sandy Loam', 'Clayey', 'Clayey Loam',
    'Black Soil', 'Red Soil', 'Alluvial', 'Laterite',
];

// Simple dropdown component using Modal
function DropdownPicker({ label, value, displayValue, options, onSelect, selectLabel }) {
    const [visible, setVisible] = useState(false);
    return (
        <View>
            <Text style={SHARED.formLabel}>{label}</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setVisible(true)}>
                <Text style={styles.dropdownText}>{displayValue || value}</Text>
                <Text style={styles.dropdownArrow}>&#9660;</Text>
            </TouchableOpacity>
            <Modal visible={visible} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{selectLabel} {label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item, i) => String(i)}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => {
                                const val = typeof item === 'object' ? item.value : item;
                                const lbl = typeof item === 'object' ? item.label : item;
                                const selected = val === value;
                                return (
                                    <TouchableOpacity
                                        style={[styles.modalOption, selected && styles.modalOptionActive]}
                                        onPress={() => { onSelect(val); setVisible(false); }}
                                    >
                                        <Text style={[styles.modalOptionText, selected && styles.modalOptionTextActive]}>
                                            {lbl}
                                        </Text>
                                        {selected && <Text style={{ color: COLORS.green600 }}>&#10003;</Text>}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

export default function FertilizerScreen() {
    const { user } = useAuth();
    const { t } = useLang();
    const [crop, setCrop] = useState('Rice');
    const [stage, setStage] = useState('vegetative');
    const [soilType, setSoilType] = useState('Loamy');
    const [temperature, setTemperature] = useState('');
    const [humidity, setHumidity] = useState('');
    const [rainfall, setRainfall] = useState('');
    const [weatherLive, setWeatherLive] = useState(false);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        fertilizers: true, pests: true, pesticides: false, safety: false,
    });

    const GROWTH_STAGES = [
        { label: t.fert_stage_basal, value: 'basal' },
        { label: t.fert_stage_seedling, value: 'seedling' },
        { label: t.fert_stage_vegetative, value: 'vegetative' },
        { label: t.fert_stage_flowering, value: 'flowering' },
        { label: t.fert_stage_fruiting, value: 'fruiting' },
        { label: t.fert_stage_maturity, value: 'maturity' },
    ];

    // Auto-fetch real-time weather on mount
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const state = user?.state || 'Maharashtra';
                const district = user?.district || '';
                const res = await api.get(`/weather/current?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
                const w = res.data;
                if (w) {
                    setTemperature(String(Math.round(w.temperature || w.temp || 28)));
                    setHumidity(String(Math.round(w.humidity || 70)));
                    setRainfall(String(Math.round(w.rainfall || w.rain || 100)));
                    setWeatherLive(true);
                }
            } catch (e) {
                setTemperature('28');
                setHumidity('70');
                setRainfall('100');
                setWeatherLive(false);
            } finally {
                setWeatherLoading(false);
            }
        };
        fetchWeather();
    }, [user?.state, user?.district]);

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const getStageLabel = (val) => {
        const found = GROWTH_STAGES.find(s => s.value === val);
        return found ? found.label : val;
    };

    const fetchRecommendation = async () => {
        setLoading(true);
        try {
            const res = await api.post('/fertilizer/recommend', {
                state: user?.state || 'Maharashtra',
                district: user?.district || '',
                crop,
                growth_stage: stage,
                soil_type: soilType,
                temperature: parseFloat(temperature) || 25,
                humidity: parseFloat(humidity) || 70,
                rainfall: parseFloat(rainfall) || 100,
            });
            setResult(res.data);
            setExpandedSections({ fertilizers: true, pests: true, pesticides: true, safety: false });
        } catch (e) {
            const detail = e.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : 'Failed to get recommendations. Check server connection.';
            Alert.alert(t.cp_error, msg);
        } finally {
            setLoading(false);
        }
    };

    const riskBadge = (level) => {
        const m = {
            High: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
            Medium: { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
            Low: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
        };
        const s = m[level] || m.Low;
        return (
            <View style={[styles.riskBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
                <Text style={[styles.riskBadgeText, { color: s.color }]}>{level}</Text>
            </View>
        );
    };

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <Text style={SHARED.pageTitle}>{t.fert_title}</Text>
            <Text style={SHARED.pageSubtitle}>{t.fert_desc}</Text>

            {/* Input Form */}
            <View style={[SHARED.card, { marginBottom: 12 }]}>
                <Text style={styles.sectionTitle}>{t.fert_select_crop}</Text>
                <DropdownPicker label={t.fert_crop} value={crop} displayValue={crop} options={CROPS} onSelect={setCrop} selectLabel={t.fert_select} />
                <View style={{ height: 10 }} />
                <DropdownPicker label={t.fert_growth_stage} value={stage} displayValue={getStageLabel(stage)} options={GROWTH_STAGES} onSelect={setStage} selectLabel={t.fert_select} />
                <View style={{ height: 10 }} />
                <DropdownPicker label={t.fert_soil_type} value={soilType} displayValue={soilType} options={SOIL_TYPES} onSelect={setSoilType} selectLabel={t.fert_select} />
            </View>

            {/* Weather Inputs */}
            <View style={[SHARED.card, { marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.sectionTitle}>{t.fert_weather}</Text>
                    {weatherLoading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <ActivityIndicator size="small" color={COLORS.green600} />
                            <Text style={{ fontSize: 11, color: COLORS.gray400 }}>{t.fert_fetching}</Text>
                        </View>
                    ) : weatherLive ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
                            <Text style={{ fontSize: 8, color: COLORS.green600 }}>🟢</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.green700 }}>{t.fert_live_weather}</Text>
                        </View>
                    ) : (
                        <Text style={{ fontSize: 11, color: COLORS.gray400 }}>{t.fert_manual_input}</Text>
                    )}
                </View>
                <View style={styles.weatherRow}>
                    <View style={styles.weatherInput}>
                        <Text style={SHARED.formLabel}>{t.fert_temp}</Text>
                        <TextInput style={SHARED.formInput} value={temperature}
                            onChangeText={(v) => { setTemperature(v); setWeatherLive(false); }} keyboardType="numeric" placeholder="28" />
                    </View>
                    <View style={styles.weatherInput}>
                        <Text style={SHARED.formLabel}>{t.fert_humidity}</Text>
                        <TextInput style={SHARED.formInput} value={humidity}
                            onChangeText={(v) => { setHumidity(v); setWeatherLive(false); }} keyboardType="numeric" placeholder="75" />
                    </View>
                    <View style={styles.weatherInput}>
                        <Text style={SHARED.formLabel}>{t.fert_rain}</Text>
                        <TextInput style={SHARED.formInput} value={rainfall}
                            onChangeText={(v) => { setRainfall(v); setWeatherLive(false); }} keyboardType="numeric" placeholder="120" />
                    </View>
                </View>
            </View>

            {/* Submit */}
            <TouchableOpacity style={SHARED.btnPrimary} onPress={fetchRecommendation} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={SHARED.btnPrimaryText}>{t.fert_get_recommendations}</Text>
                )}
            </TouchableOpacity>

            {/* Results */}
            {result && (
                <View style={{ marginTop: 20 }}>
                    {/* Overview */}
                    <View style={[SHARED.card, styles.overviewCard]}>
                        <Text style={styles.overviewTitle}>
                            {result.crop} - {(result.growth_stage || '').charAt(0).toUpperCase() + (result.growth_stage || '').slice(1)}
                        </Text>
                        <View style={styles.overviewRow}>
                            <Text style={styles.overviewLabel}>{t.fert_overall_risk}</Text>
                            {riskBadge(result.overall_risk)}
                        </View>
                        <Text style={styles.overviewSummary}>{result.risk_summary}</Text>
                        {result.fertilizers?.total_npk ? (
                            <View style={styles.npkBox}>
                                <Text style={styles.npkLabel}>{t.fert_recommended_npk}</Text>
                                <Text style={styles.npkValue}>{result.fertilizers.total_npk}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* 1. Fertilizer Schedule */}
                    <TouchableOpacity style={[SHARED.card, styles.accordionHeader]} onPress={() => toggleSection('fertilizers')}>
                        <Text style={styles.accordionTitle}>{t.fert_schedule}</Text>
                        <Text style={styles.arrow}>{expandedSections.fertilizers ? '\u25BC' : '\u25B6'}</Text>
                    </TouchableOpacity>
                    {expandedSections.fertilizers && (
                        <View style={styles.accordionBody}>
                            {result.fertilizers?.current_stage?.length > 0 ? (
                                <>
                                    <Text style={styles.subHeader}>{t.fert_current_stage}</Text>
                                    {result.fertilizers.current_stage.map((f, i) => (
                                        <View key={i} style={styles.fertCard}>
                                            <View style={styles.fertHeader}>
                                                <Text style={styles.fertName}>{f.name}</Text>
                                                <View style={[styles.typeBadge, { backgroundColor: COLORS.blue50, borderColor: COLORS.blue100 }]}>
                                                    <Text style={{ color: COLORS.blue500, fontSize: 10, fontWeight: '700' }}>{f.type}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.fertDetails}>
                                                <View style={styles.doseRow}>
                                                    <Text style={styles.doseLabel}>{t.fert_per_hectare}</Text>
                                                    <Text style={styles.doseValue}>{f.dosage_kg_per_ha} kg</Text>
                                                </View>
                                                <View style={styles.doseRow}>
                                                    <Text style={styles.doseLabel}>{t.fert_per_acre}</Text>
                                                    <Text style={styles.doseValue}>{f.dosage_kg_per_acre} kg</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.fertMethod}>{f.method}</Text>
                                            <Text style={styles.fertNutrient}>{t.fert_nutrient} {f.nutrient}</Text>
                                        </View>
                                    ))}
                                </>
                            ) : (
                                <View style={styles.emptyStage}>
                                    <Text style={styles.emptyText}>{t.fert_no_fertilizer}</Text>
                                    <Text style={styles.emptySubtext}>{t.fert_refer_basal}</Text>
                                </View>
                            )}

                            {result.fertilizers?.basal_reference?.length > 0 ? (
                                <>
                                    <Text style={[styles.subHeader, { marginTop: 12 }]}>{t.fert_basal_ref}</Text>
                                    {result.fertilizers.basal_reference.map((f, i) => (
                                        <View key={'b' + i} style={[styles.fertCard, { borderColor: COLORS.borderLight, opacity: 0.85 }]}>
                                            <Text style={styles.fertName}>{f.name}</Text>
                                            <View style={styles.fertDetails}>
                                                <View style={styles.doseRow}>
                                                    <Text style={styles.doseLabel}>{t.fert_per_hectare}</Text>
                                                    <Text style={styles.doseValue}>{f.dosage_kg_per_ha} kg</Text>
                                                </View>
                                                <View style={styles.doseRow}>
                                                    <Text style={styles.doseLabel}>{t.fert_per_acre}</Text>
                                                    <Text style={styles.doseValue}>{f.dosage_kg_per_acre} kg</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.fertMethod}>{f.method}</Text>
                                        </View>
                                    ))}
                                </>
                            ) : null}

                            {result.fertilizers?.soil_amendment ? (
                                <View style={styles.amendmentBox}>
                                    <Text style={styles.amendmentText}>{result.fertilizers.soil_amendment}</Text>
                                </View>
                            ) : null}
                        </View>
                    )}

                    {/* 2. Pest & Disease Risks */}
                    <TouchableOpacity style={[SHARED.card, styles.accordionHeader]} onPress={() => toggleSection('pests')}>
                        <Text style={styles.accordionTitle}>{t.fert_pest_risks}</Text>
                        <Text style={styles.arrow}>{expandedSections.pests ? '\u25BC' : '\u25B6'}</Text>
                    </TouchableOpacity>
                    {expandedSections.pests && (
                        <View style={styles.accordionBody}>
                            {(result.pest_risks || []).map((p, i) => (
                                <View key={i} style={styles.pestCard}>
                                    <View style={styles.pestHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.pestName}>{p.pest_name}</Text>
                                            <Text style={styles.pestType}>{p.pest_type}</Text>
                                        </View>
                                        {riskBadge(p.risk_level)}
                                    </View>
                                    {p.weather_match ? (
                                        <View style={styles.weatherAlert}>
                                            <Text style={styles.weatherAlertText}>
                                                {t.fert_weather_favors}
                                            </Text>
                                        </View>
                                    ) : null}
                                    <Text style={styles.pestTrigger}>{p.trigger_description}</Text>
                                    <Text style={styles.pestStages}>
                                        {t.fert_affects} {(p.affected_stages || []).join(', ')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 3. Pesticide Recommendations */}
                    {(result.pesticides || []).length > 0 ? (
                        <>
                            <TouchableOpacity style={[SHARED.card, styles.accordionHeader]} onPress={() => toggleSection('pesticides')}>
                                <Text style={styles.accordionTitle}>{t.fert_pesticide_recs}</Text>
                                <Text style={styles.arrow}>{expandedSections.pesticides ? '\u25BC' : '\u25B6'}</Text>
                            </TouchableOpacity>
                            {expandedSections.pesticides && (
                                <View style={styles.accordionBody}>
                                    {result.pesticides.map((p, i) => (
                                        <View key={i} style={[styles.pesticideCard,
                                        p.type === 'Bio-control' ? styles.bioCard : styles.chemCard
                                        ]}>
                                            <View style={styles.pesticideHeader}>
                                                <View style={[styles.typeBadge, p.type === 'Bio-control'
                                                    ? { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }
                                                    : { backgroundColor: '#fef3c7', borderColor: '#fde68a' }
                                                ]}>
                                                    <Text style={{
                                                        color: p.type === 'Bio-control' ? '#15803d' : '#b45309',
                                                        fontSize: 10, fontWeight: '700',
                                                    }}>
                                                        {p.type === 'Bio-control' ? 'BIO-CONTROL' : 'CHEMICAL'}
                                                    </Text>
                                                </View>
                                                {riskBadge(p.risk_level)}
                                            </View>
                                            <Text style={styles.pesticideName}>{p.product_name}</Text>
                                            <Text style={styles.pesticideTarget}>{t.fert_for_pest} {p.for_pest}</Text>
                                            <View style={styles.pesticideDose}>
                                                <Text style={styles.doseLabel}>{t.fert_dosage}</Text>
                                                <Text style={styles.pesticideDoseText}>{p.dosage}</Text>
                                            </View>
                                            {p.safety_interval_days > 0 ? (
                                                <View style={styles.phiBox}>
                                                    <Text style={styles.phiText}>
                                                        {t.fert_phi} {p.safety_interval_days} {t.fert_phi_days}
                                                    </Text>
                                                </View>
                                            ) : null}
                                            <Text style={styles.pesticidePrecaution}>{p.precautions}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    ) : null}

                    {/* 4. Safety Precautions */}
                    <TouchableOpacity style={[SHARED.card, styles.accordionHeader]} onPress={() => toggleSection('safety')}>
                        <Text style={styles.accordionTitle}>{t.fert_safety}</Text>
                        <Text style={styles.arrow}>{expandedSections.safety ? '\u25BC' : '\u25B6'}</Text>
                    </TouchableOpacity>
                    {expandedSections.safety && (
                        <View style={styles.accordionBody}>
                            {(result.safety_precautions || []).map((s, i) => (
                                <View key={i} style={styles.safetyItem}>
                                    <View style={styles.safetyBullet}>
                                        <Text style={styles.safetyBulletText}>{i + 1}</Text>
                                    </View>
                                    <Text style={styles.safetyText}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray800, marginBottom: 10 },

    dropdownBtn: {
        borderWidth: 1.5, borderColor: COLORS.borderLight, borderRadius: 12,
        backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 13,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    dropdownText: { fontSize: 15, color: COLORS.gray800 },
    dropdownArrow: { fontSize: 10, color: COLORS.gray400 },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', paddingHorizontal: 30,
    },
    modalCard: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
        maxHeight: 400, ...SHADOWS.lg,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray800, marginBottom: 12 },
    modalOption: {
        paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    modalOptionActive: { backgroundColor: COLORS.green50 },
    modalOptionText: { fontSize: 15, color: COLORS.gray700 },
    modalOptionTextActive: { color: COLORS.green700, fontWeight: '700' },

    weatherRow: { flexDirection: 'row', gap: 10 },
    weatherInput: { flex: 1 },

    overviewCard: { marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.green500 },
    overviewTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray900, marginBottom: 8 },
    overviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    overviewLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
    overviewSummary: { fontSize: 13, color: COLORS.gray500, lineHeight: 18, marginBottom: 10 },
    npkBox: {
        backgroundColor: COLORS.green50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.green200,
    },
    npkLabel: { fontSize: 11, fontWeight: '600', color: COLORS.green700, marginBottom: 2 },
    npkValue: { fontSize: 14, fontWeight: '800', color: COLORS.green800 },

    accordionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0,
        marginTop: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    },
    accordionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.gray800 },
    arrow: { fontSize: 12, color: COLORS.gray400 },
    accordionBody: {
        backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.borderSubtle,
        borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 4,
    },

    subHeader: { fontSize: 13, fontWeight: '700', color: COLORS.green700, marginBottom: 8 },

    fertCard: {
        backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: COLORS.borderSubtle, marginBottom: 8,
    },
    fertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    fertName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, flex: 1 },
    fertDetails: { marginBottom: 6 },
    doseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    doseLabel: { fontSize: 12, color: COLORS.gray500 },
    doseValue: { fontSize: 12, fontWeight: '700', color: COLORS.gray800 },
    fertMethod: { fontSize: 12, color: COLORS.green700, fontStyle: 'italic', marginBottom: 2 },
    fertNutrient: { fontSize: 11, color: COLORS.gray400 },

    typeBadge: {
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
        borderWidth: 1, alignSelf: 'flex-start',
    },

    emptyStage: { padding: 16, alignItems: 'center' },
    emptyText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
    emptySubtext: { fontSize: 12, color: COLORS.gray400, marginTop: 4 },

    amendmentBox: {
        backgroundColor: COLORS.amber50, borderRadius: 10,
        padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#fde68a',
    },
    amendmentText: { fontSize: 12, color: '#92400e', lineHeight: 18 },

    pestCard: {
        backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: COLORS.borderSubtle, marginBottom: 8,
    },
    pestHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    pestName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
    pestType: { fontSize: 11, color: COLORS.gray500, marginTop: 1 },
    weatherAlert: {
        backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
        marginTop: 6, borderWidth: 1, borderColor: '#fecaca', alignSelf: 'flex-start',
    },
    weatherAlertText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
    pestTrigger: { fontSize: 12, color: COLORS.gray600, marginTop: 6, lineHeight: 16 },
    pestStages: { fontSize: 11, color: COLORS.gray400, marginTop: 4 },

    riskBadge: {
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
        borderWidth: 1, alignSelf: 'flex-start',
    },
    riskBadgeText: { fontSize: 11, fontWeight: '700' },

    pesticideCard: {
        borderRadius: 12, padding: 12,
        borderWidth: 1, marginBottom: 8,
    },
    bioCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    chemCard: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    pesticideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    pesticideName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 2 },
    pesticideTarget: { fontSize: 12, color: COLORS.gray600, marginBottom: 6 },
    pesticideDose: { marginBottom: 4 },
    pesticideDoseText: { fontSize: 12, color: COLORS.gray700, lineHeight: 16 },
    phiBox: {
        backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
        marginTop: 4, marginBottom: 4, borderWidth: 1, borderColor: '#fecaca', alignSelf: 'flex-start',
    },
    phiText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
    pesticidePrecaution: { fontSize: 11, color: COLORS.gray500, marginTop: 4, fontStyle: 'italic', lineHeight: 16 },

    safetyItem: {
        flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start',
    },
    safetyBullet: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.amber50,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#fde68a',
    },
    safetyBulletText: { fontSize: 11, fontWeight: '700', color: '#b45309' },
    safetyText: { flex: 1, fontSize: 12, color: COLORS.gray700, lineHeight: 18 },
});
