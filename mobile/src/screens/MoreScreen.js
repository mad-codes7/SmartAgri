/**
 * SmartAgri AI Mobile - More Screen (Hub for extra features)
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { COLORS, SHARED } from '../theme';

export default function MoreScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { t, lang, changeLang, LANGUAGES } = useLang();

    const ITEMS = [
        { name: 'Crops', icon: '🌾', label: t.nav_crops || 'Crop Library', desc: 'Explore crops with growing guides' },
        { name: 'Schemes', icon: '🏛️', label: t.nav_schemes || 'Schemes', desc: 'Government subsidies & schemes' },
        { name: 'Weather', icon: '🌤️', label: t.nav_weather || 'Weather', desc: 'Current weather & 5-day forecast' },
        { name: 'Community', icon: '🤝', label: t.nav_community || 'Community', desc: 'Connect with farmers near you' },
        { name: 'History', icon: '📋', label: t.nav_history || 'History', desc: 'Past crop advisory sessions' },
        { name: 'DiseaseDetection', icon: '🔬', label: t.nav_disease || 'Disease Detection', desc: 'Scan crop leaves for disease' },
        { name: 'FarmMap', icon: '🗺️', label: t.nav_map || 'Farm Map', desc: 'Crop zones & nearby mandis' },
        { name: 'CropCalendar', icon: '📅', label: 'Crop Calendar', desc: 'Smart crop scheduling & task planner' },
        { name: 'Fertilizer', icon: '🧪', label: 'Fertilizer & Pesticide', desc: 'Get fertilizer & pest management advice' },
        { name: 'Profile', icon: '👤', label: t.profile || 'Profile', desc: 'Manage your account details' },
    ];

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            {/* User Card */}
            <View style={[SHARED.card, { marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'F'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user?.name || 'Farmer'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.editBtn}>
                    <Text style={styles.editText}>✏️</Text>
                </TouchableOpacity>
            </View>

            {/* Menu Items */}
            {ITEMS.map((item) => (
                <TouchableOpacity
                    key={item.name}
                    style={[SHARED.card, styles.menuItem]}
                    onPress={() => navigation.navigate(item.name)}
                    activeOpacity={0.7}
                >
                    <View style={styles.menuIcon}>
                        <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <Text style={styles.menuDesc}>{item.desc}</Text>
                    </View>
                    <Text style={{ color: COLORS.gray300, fontSize: 16 }}>›</Text>
                </TouchableOpacity>
            ))}

            {/* Language Switcher */}
            <View style={[SHARED.card, { marginTop: 4 }]}>
                <Text style={styles.sectionLabel}>🌐 {t.language || 'Language'}</Text>
                <View style={styles.langRow}>
                    {Object.entries(LANGUAGES).map(([code, info]) => (
                        <TouchableOpacity
                            key={code}
                            style={[styles.langBtn, lang === code && styles.langActive]}
                            onPress={() => changeLang(code)}
                        >
                            <Text style={[styles.langText, lang === code && styles.langActiveText]}>
                                {info.flag} {info.nativeName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutText}>🚪 {t.logout || 'Logout'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    avatar: {
        width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.green100,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.green800 },
    userName: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
    userEmail: { fontSize: 12, color: COLORS.gray500 },
    editBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray50,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.borderLight,
    },
    editText: { fontSize: 16 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    menuIcon: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.green50,
        alignItems: 'center', justifyContent: 'center',
    },
    menuLabel: { fontSize: 15, fontWeight: '600', color: COLORS.gray900, marginBottom: 2 },
    menuDesc: { fontSize: 12, color: COLORS.gray500 },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.gray800, marginBottom: 10 },
    langRow: { flexDirection: 'row', gap: 8 },
    langBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.gray50,
    },
    langActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green300 },
    langText: { fontSize: 13, color: COLORS.gray500 },
    langActiveText: { color: COLORS.green700, fontWeight: '700' },
    logoutBtn: {
        marginTop: 12, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
        backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.borderLight,
    },
    logoutText: { fontSize: 14, fontWeight: '600', color: COLORS.gray600 },
});
