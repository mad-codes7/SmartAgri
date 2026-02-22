/**
 * SmartAgri AI — Create Post Screen
 */
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import api from '../api';
import { COLORS, SHARED, SHADOWS } from '../theme';

const PLACEHOLDERS = {
    tip: 'E.g. "For better soybean yield, apply zinc sulfate 15 days after sowing..."',
    price: 'E.g. "Got ₹2,400/q for onion at Lasalgaon mandi today. Quality was Grade A."',
    pest: 'E.g. "Seeing white fly on cotton in Wardha area. Recommend spraying imidacloprid."',
    question: 'E.g. "Which variety of wheat works best in black soil of Nagpur district?"',
    general: 'Share any farming news, experience, or update with your community...',
};

export default function CreatePostScreen({ navigation }) {
    const { user } = useAuth();
    const { t } = useLang();
    const [category, setCategory] = useState('general');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    const CATEGORIES = [
        { key: 'tip', label: `💡 ${t.cp_crop_tip}`, desc: t.cp_crop_tip_desc },
        { key: 'price', label: `💰 ${t.cp_price_report}`, desc: t.cp_price_report_desc },
        { key: 'pest', label: `🐛 ${t.cp_pest_alert}`, desc: t.cp_pest_alert_desc },
        { key: 'question', label: `❓ ${t.cp_question}`, desc: t.cp_question_desc },
        { key: 'general', label: `📢 ${t.cp_general}`, desc: t.cp_general_desc },
    ];

    const handlePost = async () => {
        if (content.trim().length < 10) {
            Alert.alert(t.cp_too_short, t.cp_too_short_msg);
            return;
        }
        if (!user?.district) {
            Alert.alert(t.cp_district_required, t.cp_district_required_msg);
            return;
        }
        setSaving(true);
        try {
            await api.post('/community/posts', { content: content.trim(), category });
            navigation.goBack();
        } catch (e) {
            const msg = e.response?.data?.detail || 'Could not publish post. Try again.';
            Alert.alert(t.cp_error, msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}
                contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

                {/* District banner */}
                {user?.district ? (
                    <View style={styles.districtBanner}>
                        <Text style={styles.districtText}>
                            📍 {t.cp_posting_to} <Text style={{ fontWeight: '800' }}>{user.district}</Text> {t.cp_community} · {user.state}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.districtBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                        <Text style={[styles.districtText, { color: '#dc2626' }]}>
                            ⚠️ {t.cp_set_district_warning}
                        </Text>
                    </View>
                )}

                {/* Category picker */}
                <Text style={styles.sectionLabel}>{t.cp_what_sharing}</Text>
                <View style={styles.catGrid}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.key}
                            style={[styles.catCard, category === cat.key && styles.catCardActive]}
                            onPress={() => setCategory(cat.key)}
                        >
                            <Text style={styles.catCardLabel}>{cat.label}</Text>
                            <Text style={styles.catCardDesc}>{cat.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content input */}
                <Text style={styles.sectionLabel}>{t.cp_your_post}</Text>
                <TextInput
                    style={styles.textArea}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    numberOfLines={8}
                    placeholder={PLACEHOLDERS[category]}
                    placeholderTextColor={COLORS.gray400}
                    textAlignVertical="top"
                    maxLength={1000}
                />
                <Text style={styles.charCount}>{content.length}/1000</Text>

                {/* Submit */}
                <TouchableOpacity
                    style={[SHARED.btnPrimary, saving && { opacity: 0.6 }, { marginTop: 8 }]}
                    onPress={handlePost}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={SHARED.btnPrimaryText}>🌾 {t.cp_post_to} {user?.district || t.community}</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={[SHARED.btnSecondary, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
                    <Text style={SHARED.btnSecondaryText}>{t.cp_cancel}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    districtBanner: {
        backgroundColor: COLORS.green50, borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: COLORS.green200, marginBottom: 16,
    },
    districtText: { fontSize: 13, color: COLORS.green800, fontWeight: '600' },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 10 },
    catGrid: { gap: 8, marginBottom: 20 },
    catCard: {
        padding: 12, borderRadius: 12, borderWidth: 1.5,
        borderColor: COLORS.borderSubtle, backgroundColor: COLORS.white,
    },
    catCardActive: { borderColor: COLORS.green500, backgroundColor: COLORS.green50 },
    catCardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 2 },
    catCardDesc: { fontSize: 11, color: COLORS.gray500 },
    textArea: {
        borderWidth: 1.5, borderColor: COLORS.borderSubtle, borderRadius: 14,
        backgroundColor: COLORS.white, padding: 14, fontSize: 15, color: COLORS.gray900,
        minHeight: 160, lineHeight: 22,
    },
    charCount: { fontSize: 11, color: COLORS.gray400, textAlign: 'right', marginTop: 4, marginBottom: 12 },
});
