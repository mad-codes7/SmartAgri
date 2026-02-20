/**
 * SmartAgri AI Mobile - Login Screen
 */
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { COLORS, SHADOWS, SHARED } from '../theme';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const { t, lang, changeLang, LANGUAGES } = useLang();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
        } catch (err) {
            setError(err.response?.data?.detail || t.login_failed);
        } finally {
            setLoading(false);
        }
    };

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
                        <Text style={{ fontSize: 40 }}>🌾</Text>
                    </View>
                    <Text style={styles.title}>{t.smartagri_ai}</Text>
                    <Text style={styles.subtitle}>{t.tagline}</Text>
                </View>

                {/* Error */}
                {error ? (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : null}

                {/* Form */}
                <View style={styles.formCard}>
                    <View style={{ marginBottom: 16 }}>
                        <Text style={SHARED.formLabel}>{t.email}</Text>
                        <TextInput
                            style={SHARED.formInput}
                            placeholder="farmer@example.com"
                            placeholderTextColor={COLORS.gray400}
                            value={form.email}
                            onChangeText={(v) => setForm({ ...form, email: v })}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={{ marginBottom: 20 }}>
                        <Text style={SHARED.formLabel}>{t.password}</Text>
                        <TextInput
                            style={SHARED.formInput}
                            placeholder="••••••"
                            placeholderTextColor={COLORS.gray400}
                            value={form.password}
                            onChangeText={(v) => setForm({ ...form, password: v })}
                            secureTextEntry
                        />
                    </View>
                    <TouchableOpacity
                        style={[SHARED.btnPrimary, loading && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={SHARED.btnPrimaryText}>
                            {loading ? t.signing_in : t.sign_in}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t.no_account} </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.footerLink}>{t.create_account}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    langRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 24,
    },
    langBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    langActive: {
        backgroundColor: COLORS.green50,
        borderColor: COLORS.green300,
    },
    langText: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    langActiveText: {
        color: COLORS.green700,
        fontWeight: '700',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: COLORS.green50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        ...SHADOWS.green,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.green800,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.gray500,
    },
    errorBanner: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#fde68a',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#b45309',
        fontSize: 13,
        fontWeight: '500',
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 24,
        ...SHADOWS.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 13,
        color: COLORS.gray500,
    },
    footerLink: {
        fontSize: 13,
        color: COLORS.green600,
        fontWeight: '700',
    },
});
