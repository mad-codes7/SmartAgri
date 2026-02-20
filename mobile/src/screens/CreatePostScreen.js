/**
 * SmartAgri AI — Create Post Screen
 */
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { COLORS, SHARED, SHADOWS } from '../theme';

const CATEGORIES = [
    { key: 'tip', label: '💡 Crop Tip', desc: 'Share a growing tip or technique' },
    { key: 'price', label: '💰 Price Report', desc: 'Report mandi price you got today' },
    { key: 'pest', label: '🐛 Pest Alert', desc: 'Warn others about a pest or disease' },
    { key: 'question', label: '❓ Question', desc: 'Ask other farmers for advice' },
    { key: 'general', label: '📢 General', desc: 'Anything else worth sharing' },
];

const PLACEHOLDERS = {
    tip: 'E.g. "For better soybean yield, apply zinc sulfate 15 days after sowing..."',
    price: 'E.g. "Got ₹2,400/q for onion at Lasalgaon mandi today. Quality was Grade A."',
    pest: 'E.g. "Seeing white fly on cotton in Wardha area. Recommend spraying imidacloprid."',
    question: 'E.g. "Which variety of wheat works best in black soil of Nagpur district?"',
    general: 'Share any farming news, experience, or update with your community...',
};

export default function CreatePostScreen({ navigation }) {
    const { user } = useAuth();
    const [category, setCategory] = useState('general');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    const handlePost = async () => {
        if (content.trim().length < 10) {
            Alert.alert('Too short', 'Please write at least 10 characters.');
            return;
        }
        if (!user?.district) {
            Alert.alert('District required', 'Please set your district in Profile before posting.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/community/posts', { content: content.trim(), category });
            navigation.goBack();
        } catch (e) {
            const msg = e.response?.data?.detail || 'Could not publish post. Try again.';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const selectedCat = CATEGORIES.find(c => c.key === category);

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}
                contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

                {/* District banner */}
                {user?.district ? (
                    <View style={styles.districtBanner}>
                        <Text style={styles.districtText}>
                            📍 Posting to <Text style={{ fontWeight: '800' }}>{user.district}</Text> community · {user.state}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.districtBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                        <Text style={[styles.districtText, { color: '#dc2626' }]}>
                            ⚠️ Set your district in Profile before posting
                        </Text>
                    </View>
                )}

                {/* Category picker */}
                <Text style={styles.sectionLabel}>What are you sharing?</Text>
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
                <Text style={styles.sectionLabel}>Your post</Text>
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
                        : <Text style={SHARED.btnPrimaryText}>🌾 Post to {user?.district || 'Community'}</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={[SHARED.btnSecondary, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
                    <Text style={SHARED.btnSecondaryText}>Cancel</Text>
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
