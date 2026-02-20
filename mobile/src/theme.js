/**
 * SmartAgri AI Mobile - Design Tokens & Shared Styles
 */
import { StyleSheet } from 'react-native';

export const COLORS = {
    green50: '#f0fdf4',
    green100: '#dcfce7',
    green200: '#bbf7d0',
    green300: '#86efac',
    green400: '#4ade80',
    green500: '#22c55e',
    green600: '#16a34a',
    green700: '#15803d',
    green800: '#0a3d1c',

    blue50: '#eff6ff',
    blue100: '#dbeafe',
    blue500: '#3b82f6',
    blue800: '#1e3a8a',
    blue900: '#1e40af',

    amber50: '#fffbeb',
    amber100: '#fef3c7',
    amber200: '#fde68a',
    amber500: '#f59e0b',
    amber700: '#b45309',

    purple50: '#f5f3ff',
    purple100: '#ede9fe',
    purple500: '#8b5cf6',

    red500: '#ef4444',

    gray50: '#f8fafc',
    gray100: '#f1f5f9',
    gray200: '#e2e8f0',
    gray300: '#cbd5e1',
    gray400: '#94a3b8',
    gray500: '#64748b',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1e293b',
    gray900: '#0f172a',

    white: '#ffffff',
    background: '#fafcfb',
    borderLight: '#edf2ee',
    borderSubtle: '#e8ede9',
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    },
    green: {
        shadowColor: COLORS.green600,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
};

export const SHARED = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.borderSubtle,
        ...SHADOWS.sm,
    },
    cardElevated: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.borderSubtle,
        ...SHADOWS.md,
    },
    pageContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.gray900,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: COLORS.gray500,
        marginBottom: 20,
        lineHeight: 20,
    },
    btnPrimary: {
        backgroundColor: COLORS.green600,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.green,
    },
    btnPrimaryText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 15,
    },
    btnSecondary: {
        backgroundColor: COLORS.gray50,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    btnSecondaryText: {
        color: COLORS.gray700,
        fontWeight: '600',
        fontSize: 15,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.gray600,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    formInput: {
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.gray800,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    badgeLow: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    badgeLowText: {
        color: '#15803d',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeMedium: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    badgeMediumText: {
        color: '#b45309',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeHigh: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    badgeHighText: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeInfo: {
        backgroundColor: COLORS.blue50,
        borderWidth: 1,
        borderColor: COLORS.blue100,
    },
    badgeInfoText: {
        color: COLORS.blue500,
        fontSize: 12,
        fontWeight: '600',
    },
    spinner: {
        marginTop: 40,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    grid2: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem2: {
        flex: 1,
        minWidth: '45%',
    },
    widgetValue: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.gray900,
    },
    widgetLabel: {
        fontSize: 12,
        color: COLORS.gray500,
        fontWeight: '500',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.borderSubtle,
        marginVertical: 16,
    },
    emptyIcon: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.gray800,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 13,
        color: COLORS.gray500,
        textAlign: 'center',
        marginTop: 6,
    },
});
