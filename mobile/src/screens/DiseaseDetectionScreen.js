/**
 * SmartAgri AI Mobile - Disease Detection Screen
 * Dual HF model: MobileNetV2 (38 classes) + ViT-Tiny (15 classes) ensemble
 */
import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, Image, ScrollView,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../context/LanguageContext';
import api, { API_URL } from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

// ─── Helpers ────────────────────────────────────────────────────────────────
const pct = (v) => `${Math.round((v ?? 0) * 100)}%`;

const SEVERITY_COLORS = {
    none: { bg: '#dcfce7', text: '#16a34a', bar: '#22c55e' },
    moderate: { bg: '#fef3c7', text: '#d97706', bar: '#f59e0b' },
    severe: { bg: '#fee2e2', text: '#dc2626', bar: '#ef4444' },
};

function ConfidenceBar({ value, severity }) {
    const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.moderate;
    return (
        <View style={styles.barBg}>
            <View style={[styles.barFill, {
                width: `${Math.min(Math.round((value ?? 0) * 100), 100)}%`,
                backgroundColor: c.bar,
            }]} />
        </View>
    );
}

function SeverityBadge({ severity, label, emoji }) {
    const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.moderate;
    return (
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.badgeText, { color: c.text }]}>{emoji} {label}</Text>
        </View>
    );
}

function ListItems({ items, color }) {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
        <>
            {items.map((s, i) => (
                <Text key={i} style={[styles.listItem, color ? { color } : {}]}>• {String(s)}</Text>
            ))}
        </>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function DiseaseDetectionScreen() {
    const { t } = useLang();
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notPlant, setNotPlant] = useState(false);

    const reset = () => {
        setImage(null);
        setResult(null);
        setError('');
        setNotPlant(false);
        setLoading(false);
    };

    const pickImage = async (useCamera = false) => {
        setError('');
        setNotPlant(false);
        setResult(null);
        const method = useCamera
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync;
        const res = await method({ mediaTypes: ['images'], quality: 0.85 });
        if (!res.canceled && res.assets?.[0]) {
            setImage(res.assets[0]);
        }
    };

    const diagnose = async () => {
        if (!image) return;
        setLoading(true);
        setError('');
        setNotPlant(false);
        setResult(null);

        try {
            const token = await AsyncStorage.getItem('smartagri_token');

            // Use native fetch — Axios merges Content-Type: application/json which
            // overwrites the multipart boundary and causes FastAPI 422 errors.
            // fetch leaves Content-Type unset so RN sets multipart/form-data + boundary.
            const formData = new FormData();
            formData.append('file', {
                uri: image.uri,
                type: image.mimeType || 'image/jpeg',
                name: 'leaf.jpg',
            });

            const response = await fetch(`${API_URL}/disease/diagnose`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    // ⚠️ DO NOT add Content-Type here — RN sets multipart + boundary
                },
                body: formData,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const status = response.status;
                const detail = data?.detail || '';
                if (status === 401) {
                    setError('Session expired. Please log out and log back in.');
                } else if (status === 400) {
                    setNotPlant(true);
                } else if (status === 413) {
                    setError('Image is too large. Please use a photo under 5 MB.');
                } else if (status === 422) {
                    setError('Could not read image file. Please try a different photo.');
                } else {
                    setError(detail || `Server error (${status}). Please try again.`);
                }
                return;
            }

            setResult(data);
        } catch (e) {
            // Network / timeout error
            setError(
                `Cannot reach server (${API_URL}).\nMake sure your phone and PC are on the same Wi-Fi network.`
            );
        } finally {
            setLoading(false);
        }
    };


    // Derived
    const resultSeverity = result?.severity || 'moderate';
    const severityColor = SEVERITY_COLORS[resultSeverity] || SEVERITY_COLORS.moderate;
    const isHealthy = resultSeverity === 'none';

    // ── RENDER ──────────────────────────────────────────────────────────────
    return (
        <ScrollView
            style={SHARED.pageContainer}
            contentContainerStyle={SHARED.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <Text style={SHARED.pageTitle}>🔬 {t.disease_detection || 'Disease Detection'}</Text>
            <Text style={SHARED.pageSubtitle}>
                {t.disease_detection_desc || 'Upload a crop leaf photo to identify diseases'}
            </Text>

            {/* ── Error banner ── */}
            {!!error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity onPress={() => setError('')} style={styles.dismissBtn}>
                        <Text style={styles.dismissText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Step 1: Upload area (no image selected) ── */}
            {!image && !result && (
                <View style={[SHARED.cardElevated, styles.uploadArea]}>
                    <Text style={styles.uploadIcon}>🍃</Text>
                    <Text style={styles.uploadTitle}>
                        {t.drop_photo || 'Take or upload a leaf photo'}
                    </Text>
                    <Text style={styles.uploadSub}>
                        {t.or_click || 'Choose from gallery or use camera'}
                    </Text>

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={SHARED.btnPrimary} onPress={() => pickImage(false)}>
                            <Text style={SHARED.btnPrimaryText}>📁 Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={SHARED.btnSecondary} onPress={() => pickImage(true)}>
                            <Text style={SHARED.btnSecondaryText}>📸 Camera</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tipsBox}>
                        <Text style={styles.tipsTitle}>📷 Tips for best results</Text>
                        {[
                            'Take photo in natural daylight',
                            'Keep only affected leaf in frame',
                            'Capture both sides of the leaf',
                            'Avoid blurry or shadowed images',
                        ].map((tip, i) => (
                            <Text key={i} style={styles.tipItem}>• {tip}</Text>
                        ))}
                    </View>

                    <View style={styles.modelBadgeBox}>
                        <Text style={styles.modelBadgeTitle}>🤖 AI Models Used</Text>
                        <Text style={styles.modelBadgeItem}>• MobileNetV2 — 38 disease classes</Text>
                        <Text style={styles.modelBadgeItem}>• ViT-Tiny — Rice/Wheat/Corn/Potato</Text>
                        <Text style={styles.modelBadgeItem}>• Ensemble voting for accuracy</Text>
                    </View>
                </View>
            )}

            {/* ── Step 2a: Image preview + Diagnose button ── */}
            {image && !result && !notPlant && (
                <View style={[SHARED.cardElevated, styles.previewCard]}>
                    <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={SHARED.btnSecondary} onPress={reset}>
                            <Text style={SHARED.btnSecondaryText}>✕ Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[SHARED.btnPrimary, loading && styles.btnDisabled]}
                            onPress={diagnose}
                            disabled={loading}
                        >
                            {loading ? (
                                <View style={styles.loadingRow}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={SHARED.btnPrimaryText}> Analysing…</Text>
                                </View>
                            ) : (
                                <Text style={SHARED.btnPrimaryText}>🔬 Diagnose</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {loading && (
                        <Text style={styles.loadingHint}>
                            Running dual AI models… may take 20-30s on first use
                        </Text>
                    )}
                </View>
            )}

            {/* ── Step 2b: Non-plant rejection card ── */}
            {image && notPlant && !result && (
                <View style={styles.rejectionCard}>
                    <View style={styles.rejectionImgWrap}>
                        <Image source={{ uri: image.uri }} style={[styles.preview, { opacity: 0.3 }]} resizeMode="cover" />
                        <View style={styles.rejectionOverlay}>
                            <Text style={{ fontSize: 56 }}>🚫</Text>
                        </View>
                    </View>
                    <Text style={styles.rejectionTitle}>Not a Plant Image</Text>
                    <Text style={styles.rejectionDesc}>
                        Our AI could not detect any plant, leaf, or crop in this photo.
                        Please upload a clear photo of a crop leaf showing the affected area.
                    </Text>
                    <View style={styles.rejectionTipsBox}>
                        <Text style={styles.rejectionTipGood}>✅ Close-up of a single leaf</Text>
                        <Text style={styles.rejectionTipGood}>✅ Visible spots or discoloration</Text>
                        <Text style={styles.rejectionTipGood}>✅ Good lighting, sharp focus</Text>
                        <Text style={styles.rejectionTipBad}>❌ Selfies, people, food, vehicles</Text>
                        <Text style={styles.rejectionTipBad}>❌ Very blurry or dark images</Text>
                    </View>
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={SHARED.btnSecondary} onPress={reset}>
                            <Text style={SHARED.btnSecondaryText}>✕ Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={SHARED.btnPrimary} onPress={() => pickImage(false)}>
                            <Text style={SHARED.btnPrimaryText}>📁 Pick Another</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={SHARED.btnSecondary} onPress={() => pickImage(true)}>
                            <Text style={SHARED.btnSecondaryText}>📸 Camera</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Step 3: Results ── */}
            {result && (
                <View>
                    {/* Thumbnail */}
                    <View style={[SHARED.cardElevated, styles.thumbCard]}>
                        {image?.uri && (
                            <Image source={{ uri: image.uri }} style={styles.thumbImg} resizeMode="cover" />
                        )}
                    </View>

                    {/* Header row */}
                    <View style={styles.resultsHeader}>
                        <Text style={styles.resultsTitle}>🩺 Diagnosis Results</Text>
                        <TouchableOpacity
                            style={[SHARED.btnSecondary, styles.newScanBtn]}
                            onPress={reset}
                        >
                            <Text style={[SHARED.btnSecondaryText, { fontSize: 12 }]}>🔄 New Scan</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Primary result card */}
                    <View style={[SHARED.card, styles.section]}>
                        <View style={styles.diseaseHeader}>
                            <Text style={styles.diseaseName} numberOfLines={3}>
                                {result.disease || 'Unknown'}
                            </Text>
                            {result.severity_label ? (
                                <SeverityBadge
                                    severity={resultSeverity}
                                    label={result.severity_label}
                                    emoji={result.severity_emoji || '⚠️'}
                                />
                            ) : null}
                        </View>

                        {Array.isArray(result.crops) && result.crops.length > 0 && !isHealthy && (
                            <Text style={styles.cropsLine}>
                                🌿 Affects: {result.crops.join(', ')}
                            </Text>
                        )}

                        {/* Confidence */}
                        <View style={styles.confidenceBlock}>
                            <View style={styles.confRow}>
                                <Text style={styles.confLabel}>AI Confidence</Text>
                                <Text style={[styles.confPct, { color: severityColor.bar }]}>
                                    {pct(result.confidence)}
                                </Text>
                            </View>
                            <ConfidenceBar value={result.confidence} severity={resultSeverity} />
                        </View>

                        {/* Inference mode badge */}
                        {result.inference_mode === 'dual_model_ensemble' && (
                            <View style={styles.modeTag}>
                                <Text style={styles.modeTagText}>⚡ Dual-model ensemble</Text>
                            </View>
                        )}
                        {result.inference_mode === 'simulation_fallback' && (
                            <View style={[styles.modeTag, styles.modeTagWarn]}>
                                <Text style={[styles.modeTagText, { color: '#92400e' }]}>
                                    ⚠️ Simulation mode — AI models loading
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Top predictions */}
                    {Array.isArray(result.top_predictions) && result.top_predictions.length > 1 && (
                        <View style={[SHARED.card, styles.section]}>
                            <Text style={styles.sectionTitle}>📊 Top Predictions</Text>
                            {result.top_predictions.map((pred, i) => {
                                const sc = SEVERITY_COLORS[pred.severity] || SEVERITY_COLORS.moderate;
                                return (
                                    <View key={i} style={styles.predRow}>
                                        <Text style={[styles.predRank, { color: i === 0 ? COLORS.green600 : COLORS.gray400 }]}>
                                            #{i + 1}
                                        </Text>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.predLabelRow}>
                                                <Text style={[styles.predName, i === 0 && styles.predNameTop]} numberOfLines={2}>
                                                    {pred.severity_emoji || ''} {pred.disease || pred.label || ''}
                                                </Text>
                                                <Text style={[styles.predPct, { color: i === 0 ? COLORS.green600 : COLORS.gray400 }]}>
                                                    {pct(pred.confidence)}
                                                </Text>
                                            </View>
                                            <View style={styles.barBg}>
                                                <View style={[styles.barFill, {
                                                    width: `${Math.min(Math.round((pred.confidence ?? 0) * 100), 100)}%`,
                                                    backgroundColor: i === 0 ? COLORS.green600 : COLORS.gray300,
                                                }]} />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* About */}
                    {!!result.description && (
                        <View style={[SHARED.card, styles.section]}>
                            <Text style={styles.sectionTitle}>📋 About this condition</Text>
                            <Text style={styles.sectionText}>{result.description}</Text>
                        </View>
                    )}

                    {/* Symptoms */}
                    {Array.isArray(result.symptoms) && result.symptoms.length > 0 && (
                        <View style={[SHARED.card, styles.section]}>
                            <Text style={styles.sectionTitle}>🔍 Symptoms</Text>
                            <ListItems items={result.symptoms} />
                        </View>
                    )}

                    {/* Treatment */}
                    {Array.isArray(result.treatment) && result.treatment.length > 0 && (
                        <View style={[SHARED.card, styles.section]}>
                            <Text style={styles.sectionTitle}>
                                {isHealthy ? '✅ Maintenance Tips' : '💊 Treatment'}
                            </Text>
                            <ListItems items={result.treatment} />
                        </View>
                    )}

                    {/* Prevention */}
                    {Array.isArray(result.prevention) && result.prevention.length > 0 && !isHealthy && (
                        <View style={[SHARED.card, styles.section]}>
                            <Text style={styles.sectionTitle}>🛡️ Prevention</Text>
                            <ListItems items={result.prevention} />
                        </View>
                    )}

                    {/* Footer */}
                    {Array.isArray(result.models_used) && result.models_used.length > 0 && (
                        <View style={styles.footer}>
                            <Text style={styles.footerTitle}>🤖 Powered by:</Text>
                            {result.models_used.map((m, i) => (
                                <Text key={i} style={styles.footerItem}>{m}</Text>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Upload area
    uploadArea: { alignItems: 'center', paddingVertical: 28, marginBottom: 8 },
    uploadIcon: { fontSize: 54, marginBottom: 10 },
    uploadTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray800, marginBottom: 4, textAlign: 'center' },
    uploadSub: { fontSize: 13, color: COLORS.gray500, marginBottom: 20, textAlign: 'center' },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
    loadingRow: { flexDirection: 'row', alignItems: 'center' },
    loadingHint: { fontSize: 12, color: COLORS.gray400, marginTop: 10, textAlign: 'center' },
    btnDisabled: { opacity: 0.65 },

    tipsBox: { marginTop: 20, width: '100%', backgroundColor: COLORS.green50, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.green200 },
    tipsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.green700, marginBottom: 8 },
    tipItem: { fontSize: 12, color: COLORS.green700, lineHeight: 20 },
    modelBadgeBox: { marginTop: 12, width: '100%', backgroundColor: '#f0f9ff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bae6fd' },
    modelBadgeTitle: { fontSize: 12, fontWeight: '700', color: '#0369a1', marginBottom: 6 },
    modelBadgeItem: { fontSize: 11, color: '#0c4a6e', lineHeight: 18 },

    // Preview
    previewCard: { alignItems: 'center', marginBottom: 8 },
    preview: { width: '100%', height: 200, borderRadius: 14 },

    // Error
    errorBox: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#fbbf24', flexDirection: 'row', alignItems: 'flex-start' },
    errorText: { fontSize: 13, color: '#92400e', flex: 1, lineHeight: 18 },
    dismissBtn: { marginLeft: 8, padding: 2 },
    dismissText: { fontSize: 14, color: '#b45309', fontWeight: '700' },

    // Results
    thumbCard: { alignItems: 'center', marginBottom: 12, padding: 12 },
    thumbImg: { width: '100%', height: 160, borderRadius: 12 },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    resultsTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray900 },
    newScanBtn: { paddingVertical: 8, paddingHorizontal: 12 },
    section: { marginBottom: 12 },

    diseaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    diseaseName: { fontSize: 19, fontWeight: '800', color: COLORS.gray900, flex: 1, marginRight: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    cropsLine: { fontSize: 12, color: COLORS.gray500, marginTop: 6 },

    confidenceBlock: { marginTop: 14 },
    confRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    confLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
    confPct: { fontSize: 13, fontWeight: '800' },
    barBg: { height: 7, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: 7, borderRadius: 4 },

    modeTag: { marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
    modeTagWarn: { backgroundColor: '#fef3c7' },
    modeTagText: { fontSize: 11, color: '#15803d', fontWeight: '600' },

    predRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    predRank: { fontSize: 13, fontWeight: '800', width: 22 },
    predLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    predName: { fontSize: 13, color: COLORS.gray600, flex: 1 },
    predNameTop: { color: COLORS.gray900, fontWeight: '700' },
    predPct: { fontSize: 12, fontWeight: '700' },

    sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 8 },
    sectionText: { fontSize: 13, color: COLORS.gray600, lineHeight: 20 },
    listItem: { fontSize: 13, color: COLORS.gray700, lineHeight: 22, marginLeft: 4 },

    footer: { backgroundColor: COLORS.gray50, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.gray200 },
    footerTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gray500, marginBottom: 4 },
    footerItem: { fontSize: 10, color: COLORS.gray400, lineHeight: 16 },

    // Non-plant rejection
    rejectionCard: { backgroundColor: '#fff5f5', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#fca5a5', marginBottom: 16, alignItems: 'center' },
    rejectionImgWrap: { position: 'relative', width: '100%', marginBottom: 16 },
    rejectionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    rejectionTitle: { fontSize: 18, fontWeight: '800', color: '#dc2626', marginBottom: 8, textAlign: 'center' },
    rejectionDesc: { fontSize: 13, color: '#7f1d1d', lineHeight: 20, textAlign: 'center', marginBottom: 14 },
    rejectionTipsBox: { width: '100%', backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 4 },
    rejectionTipGood: { fontSize: 12, color: '#15803d', lineHeight: 22 },
    rejectionTipBad: { fontSize: 12, color: '#dc2626', lineHeight: 22 },
});
