/**
 * SmartAgri AI Mobile - Profile Screen
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS, SHARED } from '../theme';

const STATES = [
    'Punjab', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan',
    'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Haryana',
    'Kerala', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Odisha',
];

export default function ProfileScreen() {
    const { user, setUser } = useAuth();
    const { t } = useLang();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [stats, setStats] = useState(null);
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        state: user?.state || '',
        district: user?.district || '',
    });

    useEffect(() => {
        api.get('/history/stats').then((r) => setStats(r.data)).catch(() => { });
    }, []);

    const update = (f, v) => setForm({ ...form, [f]: v });

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/auth/me', form);
            setUser(res.data);
            setSaved(true);
            setEditing(false);
            setTimeout(() => setSaved(false), 2000);
        } catch { }
        setSaving(false);
    };

    const handleReset = () => {
        setForm({
            name: user?.name || '',
            phone: user?.phone || '',
            state: user?.state || '',
            district: user?.district || '',
        });
        setEditing(false);
    };

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <Text style={SHARED.pageTitle}>👤 {t.profile}</Text>
            <Text style={SHARED.pageSubtitle}>{t.profile_desc}</Text>

            {/* Avatar Card */}
            <View style={[SHARED.cardElevated, { alignItems: 'center', paddingVertical: 24, marginBottom: 16 }]}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                {user?.created_at && (
                    <Text style={styles.memberSince}>
                        📅 {t.member_since}: {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                )}
            </View>

            {/* Stats */}
            {stats && (
                <View style={[SHARED.card, { marginBottom: 16 }]}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 10 }}>
                        📊 {t.farm_activity}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={styles.statItem}>
                            <Text style={SHARED.widgetValue}>{stats.total_recommendations}</Text>
                            <Text style={SHARED.widgetLabel}>{t.recommendations}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[SHARED.widgetValue, { color: COLORS.green600, fontSize: 16 }]}>
                                ₹{stats.avg_profit_estimate?.toLocaleString() || '0'}
                            </Text>
                            <Text style={SHARED.widgetLabel}>{t.avg_profit}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Profile Form */}
            <View style={SHARED.cardElevated}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.gray900 }}>
                        {editing ? '✏️ Edit Profile' : '📋 Details'}
                    </Text>
                    {!editing && (
                        <TouchableOpacity
                            style={[SHARED.btnSecondary, { paddingVertical: 8, paddingHorizontal: 14 }]}
                            onPress={() => setEditing(true)}
                        >
                            <Text style={[SHARED.btnSecondaryText, { fontSize: 12 }]}>✏️ {t.edit_profile}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={SHARED.formLabel}>{t.full_name}</Text>
                <TextInput
                    style={[SHARED.formInput, !editing && styles.disabledInput]}
                    value={form.name}
                    onChangeText={(v) => update('name', v)}
                    editable={editing}
                />

                <View style={{ marginTop: 12 }}>
                    <Text style={SHARED.formLabel}>{t.email}</Text>
                    <TextInput
                        style={[SHARED.formInput, styles.disabledInput]}
                        value={user?.email}
                        editable={false}
                    />
                    <Text style={{ fontSize: 11, color: COLORS.gray400, marginTop: 4 }}>🔒 {t.email_locked}</Text>
                </View>

                <View style={{ marginTop: 12 }}>
                    <Text style={SHARED.formLabel}>{t.phone}</Text>
                    <TextInput
                        style={[SHARED.formInput, !editing && styles.disabledInput]}
                        value={form.phone}
                        onChangeText={(v) => update('phone', v)}
                        editable={editing}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={SHARED.formLabel}>{t.state}</Text>
                        {editing ? (
                            <View style={styles.pickerWrap}>
                                <Picker selectedValue={form.state} onValueChange={(v) => update('state', v)} style={{ height: 50 }}>
                                    <Picker.Item label={t.select_state} value="" />
                                    {STATES.map((s) => <Picker.Item key={s} label={s} value={s} />)}
                                </Picker>
                            </View>
                        ) : (
                            <TextInput style={[SHARED.formInput, styles.disabledInput]} value={form.state} editable={false} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={SHARED.formLabel}>{t.district}</Text>
                        <TextInput
                            style={[SHARED.formInput, !editing && styles.disabledInput]}
                            value={form.district}
                            onChangeText={(v) => update('district', v)}
                            editable={editing}
                        />
                    </View>
                </View>

                {editing && (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                        <TouchableOpacity style={[SHARED.btnSecondary, { flex: 1 }]} onPress={handleReset}>
                            <Text style={SHARED.btnSecondaryText}>{t.reset}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[SHARED.btnPrimary, { flex: 1 }, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={SHARED.btnPrimaryText}>
                                {saving ? t.saving : saved ? `✓ ${t.saved}` : t.save_changes}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                {saved && !editing && (
                    <View style={styles.savedBanner}>
                        <Text style={{ color: COLORS.green700, fontWeight: '600', fontSize: 13 }}>✓ {t.saved}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    avatar: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.green100,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        borderWidth: 3, borderColor: COLORS.green300,
    },
    avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.green800 },
    userName: { fontSize: 20, fontWeight: '800', color: COLORS.gray900, marginBottom: 2 },
    userEmail: { fontSize: 13, color: COLORS.gray500 },
    memberSince: { fontSize: 12, color: COLORS.gray400, marginTop: 8 },
    statItem: {
        flex: 1, backgroundColor: COLORS.gray50, borderRadius: 12, padding: 14,
        alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    disabledInput: { backgroundColor: COLORS.gray50, color: COLORS.gray600 },
    pickerWrap: {
        borderWidth: 1.5, borderColor: COLORS.borderLight, borderRadius: 12,
        backgroundColor: COLORS.white, overflow: 'hidden',
    },
    savedBanner: {
        marginTop: 16, backgroundColor: COLORS.green50, borderRadius: 10, padding: 10,
        alignItems: 'center', borderWidth: 1, borderColor: COLORS.green200,
    },
});
