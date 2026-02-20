/**
 * SmartAgri AI Mobile - Register Screen
 */
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { COLORS, SHADOWS, SHARED } from '../theme';

const STATES = [
    'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan',
    'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Haryana',
    'Kerala', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Odisha',
];

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const { t, lang, changeLang, LANGUAGES } = useLang();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', state: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            await register(form);
        } catch (err) {
            setError(err.response?.data?.detail || t.registration_failed);
        } finally {
            setLoading(false);
        }
    };

    const update = (field, value) => setForm({ ...form, [field]: value });

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Language Switcher */}
                <View style={styles.langRow}>
                    {Object.entries(LANGUAGES).map(([code, info]) => (
                        <TouchableOpacity
                            key={code}
                            style={[styles.langBtn, lang === code && styles.langActive]}
                            onPress={() => changeLang(code)}
                        >
                            <Text style={[styles.langText, lang === code && styles.langActiveText]}>
                                {info.nativeName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={styles.logoIcon}>
                        <Text style={{ fontSize: 36 }}>🌾</Text>
                    </View>
                    <Text style={styles.title}>{t.smartagri_ai}</Text>
                    <Text style={styles.subtitle}>{t.join_tagline}</Text>
                </View>

                {error ? (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : null}

                <View style={styles.formCard}>
                    <View style={{ marginBottom: 14 }}>
                        <Text style={SHARED.formLabel}>{t.full_name}</Text>
                        <TextInput
                            style={SHARED.formInput}
                            placeholder={t.full_name}
                            placeholderTextColor={COLORS.gray400}
                            value={form.name}
                            onChangeText={(v) => update('name', v)}
                        />
                    </View>
                    <View style={{ marginBottom: 14 }}>
                        <Text style={SHARED.formLabel}>{t.email}</Text>
                        <TextInput
                            style={SHARED.formInput}
                            placeholder="farmer@example.com"
                            placeholderTextColor={COLORS.gray400}
                            value={form.email}
                            onChangeText={(v) => update('email', v)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={{ marginBottom: 14 }}>
                        <Text style={SHARED.formLabel}>{t.password}</Text>
                        <TextInput
                            style={SHARED.formInput}
                            placeholder="••••••"
                            placeholderTextColor={COLORS.gray400}
                            value={form.password}
                            onChangeText={(v) => update('password', v)}
                            secureTextEntry
                        />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={SHARED.formLabel}>{t.phone}</Text>
                            <TextInput
                                style={SHARED.formInput}
                                placeholder="+91 ..."
                                placeholderTextColor={COLORS.gray400}
                                value={form.phone}
                                onChangeText={(v) => update('phone', v)}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={SHARED.formLabel}>{t.state}</Text>
                            <View style={[SHARED.formInput, { paddingHorizontal: 0, paddingVertical: 0 }]}>
                                <Picker
                                    selectedValue={form.state}
                                    onValueChange={(v) => update('state', v)}
                                    style={{ height: 48, color: COLORS.gray800 }}
                                >
                                    <Picker.Item label={t.select_state} value="" color={COLORS.gray400} />
                                    {STATES.map((s) => (
                                        <Picker.Item key={s} label={s} value={s} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[SHARED.btnPrimary, loading && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={SHARED.btnPrimaryText}>
                            {loading ? t.creating_account : t.create_account}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t.have_account} </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>{t.sign_in}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    langRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
    langBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderLight },
    langActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green300 },
    langText: { fontSize: 12, color: COLORS.gray500 },
    langActiveText: { color: COLORS.green700, fontWeight: '700' },
    logoSection: { alignItems: 'center', marginBottom: 24 },
    logoIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: COLORS.green50, alignItems: 'center', justifyContent: 'center', marginBottom: 10, ...SHADOWS.green },
    title: { fontSize: 26, fontWeight: '900', color: COLORS.green800, marginBottom: 4 },
    subtitle: { fontSize: 13, color: COLORS.gray500 },
    errorBanner: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 12, marginBottom: 16 },
    errorText: { color: '#b45309', fontSize: 13, fontWeight: '500' },
    formCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 20, ...SHADOWS.md },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    footerText: { fontSize: 13, color: COLORS.gray500 },
    footerLink: { fontSize: 13, color: COLORS.green600, fontWeight: '700' },
});
