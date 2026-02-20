/**
 * SmartAgri AI Mobile - Custom Drawer Navigation
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { COLORS, SHADOWS } from '../theme';

export default function CustomDrawer(props) {
    const { user, logout } = useAuth();
    const { t, lang, changeLang, LANGUAGES } = useLang();
    const { navigation } = props;

    const NAV_ITEMS = [
        { name: 'Dashboard', icon: '📊', label: t.nav_dashboard },
        { name: 'Recommend', icon: '🌱', label: t.nav_crop_advisory },
        { name: 'Market', icon: '📈', label: t.nav_market },
        { name: 'Weather', icon: '🌤️', label: t.nav_weather },
        { name: 'Crops', icon: '🌾', label: t.nav_crops },
        { name: 'Schemes', icon: '🏛️', label: t.nav_schemes },
        { name: 'History', icon: '📋', label: t.nav_history },
    ];

    const TOOL_ITEMS = [
        { name: 'DiseaseDetection', icon: '🔬', label: t.nav_disease || 'Disease Detection' },
        { name: 'FarmMap', icon: '🗺️', label: t.nav_map || 'Farm Map' },
    ];

    const navigateTo = (name) => {
        navigation.closeDrawer();
        navigation.navigate(name);
    };

    const currentRoute = props.state?.routes?.[props.state.index]?.name;

    return (
        <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoSection}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoEmoji}>🌾</Text>
                </View>
                <Text style={styles.logoText}>SmartAgri AI</Text>
                <Text style={styles.logoSub}>{t.tagline}</Text>
            </View>

            <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
                {/* Main Menu */}
                <Text style={styles.sectionLabel}>{t.nav_main_menu || 'MAIN MENU'}</Text>
                {NAV_ITEMS.map((item) => {
                    const active = currentRoute === item.name;
                    return (
                        <TouchableOpacity
                            key={item.name}
                            style={[styles.navItem, active && styles.navItemActive]}
                            onPress={() => navigateTo(item.name)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.navIcon}>{item.icon}</Text>
                            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}

                {/* AI Tools */}
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t.nav_ai_tools || 'AI TOOLS'}</Text>
                {TOOL_ITEMS.map((item) => {
                    const active = currentRoute === item.name;
                    return (
                        <TouchableOpacity
                            key={item.name}
                            style={[styles.navItem, active && styles.navItemActive]}
                            onPress={() => navigateTo(item.name)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.navIcon}>{item.icon}</Text>
                            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}

                {/* Language */}
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t.language || 'LANGUAGE'}</Text>
                <View style={styles.langRow}>
                    {Object.entries(LANGUAGES).map(([code, info]) => (
                        <TouchableOpacity
                            key={code}
                            style={[styles.langBtn, lang === code && styles.langBtnActive]}
                            onPress={() => changeLang(code)}
                        >
                            <Text style={[styles.langText, lang === code && styles.langTextActive]}>
                                {info.nativeName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* User Profile + Logout */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.profileRow} onPress={() => navigateTo('Profile')}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'F'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Farmer'}</Text>
                        <Text style={styles.userEmail} numberOfLines={1}>{user?.email || ''}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>🚪 {t.logout || 'Logout'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    logoSection: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSubtle,
        alignItems: 'center',
    },
    logoIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.green50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoEmoji: {
        fontSize: 24,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.green800,
    },
    logoSub: {
        fontSize: 11,
        color: COLORS.gray500,
        marginTop: 2,
    },
    navScroll: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 16,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.gray400,
        letterSpacing: 1.2,
        marginBottom: 8,
        paddingHorizontal: 8,
        textTransform: 'uppercase',
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 2,
    },
    navItemActive: {
        backgroundColor: COLORS.green50,
    },
    navIcon: {
        fontSize: 18,
        marginRight: 12,
        width: 24,
        textAlign: 'center',
    },
    navLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.gray600,
    },
    navLabelActive: {
        color: COLORS.green700,
        fontWeight: '700',
    },
    langRow: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 8,
    },
    langBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    langBtnActive: {
        backgroundColor: COLORS.green50,
        borderColor: COLORS.green300,
    },
    langText: {
        fontSize: 12,
        color: COLORS.gray500,
    },
    langTextActive: {
        color: COLORS.green700,
        fontWeight: '700',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.borderSubtle,
        padding: 16,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.green100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.green800,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray800,
    },
    userEmail: {
        fontSize: 11,
        color: COLORS.gray500,
    },
    logoutBtn: {
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: COLORS.gray50,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    logoutText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.gray600,
    },
});
