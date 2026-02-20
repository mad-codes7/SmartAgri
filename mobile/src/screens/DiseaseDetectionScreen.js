/**
 * SmartAgri AI Mobile - Disease Detection Screen
 */
import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

export default function DiseaseDetectionScreen() {
    const { t } = useLang();
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async (useCamera = false) => {
        const method = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
        const res = await method({ mediaTypes: ['images'], quality: 0.8 });
        if (!res.canceled && res.assets?.[0]) {
            setImage(res.assets[0]);
            setResult(null);
        }
    };

    const diagnose = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: image.uri,
                type: 'image/jpeg',
                name: 'leaf.jpg',
            });
            const res = await api.post('/disease/diagnose', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(res.data);
        } catch {
            setResult({ disease: 'Error', description: 'Could not process image. Please try again.' });
        } finally { setLoading(false); }
    };

    const reset = () => { setImage(null); setResult(null); };

    const confidenceColor = (c) => c > 0.85 ? COLORS.green600 : c > 0.7 ? COLORS.amber500 : COLORS.red500;

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <Text style={SHARED.pageTitle}>🔬 {t.disease_detection}</Text>
            <Text style={SHARED.pageSubtitle}>{t.disease_detection_desc}</Text>

            {/* Upload Area */}
            {!image && (
                <View style={[SHARED.cardElevated, { alignItems: 'center', paddingVertical: 32 }]}>
                    <Text style={{ fontSize: 48, marginBottom: 12 }}>🍃</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.gray800, marginBottom: 4 }}>{t.drop_photo}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 20 }}>{t.or_click}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={SHARED.btnPrimary} onPress={() => pickImage(false)}>
                            <Text style={SHARED.btnPrimaryText}>📁 Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={SHARED.btnSecondary} onPress={() => pickImage(true)}>
                            <Text style={SHARED.btnSecondaryText}>📸 Camera</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tips */}
                    <View style={styles.tipsBox}>
                        <Text style={styles.tipsTitle}>📷 {t.photo_tips}</Text>
                        {[t.tip_1, t.tip_2, t.tip_3, t.tip_4].map((tip, i) => (
                            <Text key={i} style={styles.tipItem}>• {tip}</Text>
                        ))}
                    </View>
                </View>
            )}

            {/* Preview */}
            {image && !result && (
                <View style={[SHARED.cardElevated, { alignItems: 'center' }]}>
                    <Image source={{ uri: image.uri }} style={styles.preview} />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                        <TouchableOpacity style={SHARED.btnSecondary} onPress={reset}>
                            <Text style={SHARED.btnSecondaryText}>✕ {t.clear}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[SHARED.btnPrimary, loading && { opacity: 0.6 }]} onPress={diagnose} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={SHARED.btnPrimaryText}>🔬 {t.diagnose}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Results */}
            {result && (
                <View style={{ marginTop: 4 }}>
                    <View style={[SHARED.cardElevated, { alignItems: 'center', marginBottom: 12 }]}>
                        <Image source={{ uri: image?.uri }} style={[styles.preview, { height: 160 }]} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.gray900 }}>🩺 {t.diagnosis_results}</Text>
                        <TouchableOpacity style={[SHARED.btnSecondary, { paddingVertical: 8, paddingHorizontal: 12 }]} onPress={reset}>
                            <Text style={[SHARED.btnSecondaryText, { fontSize: 12 }]}>🔄 {t.new_scan}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Disease Name + Confidence */}
                    <View style={[SHARED.card, { marginBottom: 12 }]}>
                        <Text style={styles.diseaseName}>{result.disease}</Text>
                        {result.confidence != null && (
                            <View style={{ marginTop: 8 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.gray500 }}>Confidence</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: confidenceColor(result.confidence) }}>
                                        {(result.confidence * 100).toFixed(0)}%
                                    </Text>
                                </View>
                                <View style={styles.barBg}>
                                    <View style={[styles.barFill, { width: `${result.confidence * 100}%`, backgroundColor: confidenceColor(result.confidence) }]} />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* About */}
                    <View style={[SHARED.card, { marginBottom: 12 }]}>
                        <Text style={styles.sectionTitle}>{t.about_disease}</Text>
                        <Text style={styles.sectionText}>{result.description}</Text>
                    </View>

                    {/* Symptoms */}
                    {result.symptoms?.length > 0 && (
                        <View style={[SHARED.card, { marginBottom: 12 }]}>
                            <Text style={styles.sectionTitle}>🔍 {t.symptoms}</Text>
                            {result.symptoms.map((s, i) => <Text key={i} style={styles.listItem}>• {s}</Text>)}
                        </View>
                    )}

                    {/* Treatment */}
                    {result.treatment?.length > 0 && (
                        <View style={[SHARED.card, { marginBottom: 12 }]}>
                            <Text style={styles.sectionTitle}>💊 {t.treatment_lbl}</Text>
                            {result.treatment.map((s, i) => <Text key={i} style={styles.listItem}>• {s}</Text>)}
                        </View>
                    )}

                    {/* Prevention */}
                    {result.prevention?.length > 0 && (
                        <View style={[SHARED.card, { marginBottom: 12 }]}>
                            <Text style={styles.sectionTitle}>🛡️ {t.prevention_lbl}</Text>
                            {result.prevention.map((s, i) => <Text key={i} style={styles.listItem}>• {s}</Text>)}
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    preview: { width: '100%', height: 200, borderRadius: 14 },
    tipsBox: {
        marginTop: 20, width: '100%', backgroundColor: COLORS.green50,
        borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.green200,
    },
    tipsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.green700, marginBottom: 8 },
    tipItem: { fontSize: 12, color: COLORS.green700, lineHeight: 20 },
    diseaseName: { fontSize: 20, fontWeight: '800', color: COLORS.gray900 },
    barBg: { height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 8 },
    sectionText: { fontSize: 13, color: COLORS.gray600, lineHeight: 20 },
    listItem: { fontSize: 13, color: COLORS.gray700, lineHeight: 22, marginLeft: 4 },
});
