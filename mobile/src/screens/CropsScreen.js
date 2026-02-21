/**
 * SmartAgri AI Mobile - Regional Best Crops Screen
 * Shows top 5 crops ranked for user's region/district, real-time & automatic.
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { COLORS, SHARED } from '../theme';

const CROP_EMOJI = {
    Wheat: '🌾', Rice: '🍚', Cotton: '🌿', Maize: '🌽', Sugarcane: '🎋',
    Soybean: '🫘', Mustard: '🌼', Potato: '🥔', Onion: '🧅', Tomato: '🍅',
    Chickpea: '🫘', Groundnut: '🥜',
};

const FIT_CONFIG = {
    optimal: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', label: '✅ Best Season' },
    marginal: { bg: '#fef9c3', border: '#fde68a', text: '#92400e', label: '⚠️ Late Window' },
    offseason: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: '❌ Off Season' },
};

export default function CropsScreen() {
    const { t } = useLang();
    const { user } = useAuth();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState({ state: '', district: '' });

    useEffect(() => {
        const state = user?.state || 'Maharashtra';
        const district = user?.district || '';
        setInfo({ state, district });

        api.get('/calendar/crops-ranked', { params: { state, district } })
            .then((res) => {
                // Combine local + other, take top 5
                const local = res.data.local_crops || [];
                const other = res.data.other_crops || [];
                const all = [...local, ...other];
                setCrops(all.slice(0, 5));
            })
            .catch(() => setCrops([]))
            .finally(() => setLoading(false));
    }, [user?.id]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.green600} />
                <Text style={{ marginTop: 12, color: COLORS.gray500 }}>Loading best crops for your region...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={SHARED.pageContainer} contentContainerStyle={SHARED.scrollContent}>
            <Text style={SHARED.pageTitle}>🏆 Best Crops for You</Text>
            <Text style={SHARED.pageSubtitle}>
                Top picks for {info.district || info.state}, ranked by regional priority & season
            </Text>

            {/* Location badge */}
            <View style={styles.locationBadge}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>
                    {info.district ? `${info.district}, ` : ''}{info.state}
                </Text>
            </View>

            {crops.length === 0 ? (
                <View style={[SHARED.card, { alignItems: 'center', padding: 30 }]}>
                    <Text style={{ fontSize: 40 }}>🌱</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.gray700, marginTop: 10 }}>No crop data available</Text>
                    <Text style={{ fontSize: 13, color: COLORS.gray500, marginTop: 4, textAlign: 'center' }}>
                        Update your profile with state & district to see recommendations
                    </Text>
                </View>
            ) : (
                crops.map((crop, i) => {
                    const fit = FIT_CONFIG[crop.season_fit] || FIT_CONFIG.marginal;
                    const emoji = CROP_EMOJI[crop.name] || '🌱';
                    return (
                        <View key={crop.name} style={styles.cropCard}>
                            {/* Rank */}
                            <View style={styles.rankRow}>
                                <View style={[styles.rankBadge, i === 0 && styles.rankGold, i === 1 && styles.rankSilver, i === 2 && styles.rankBronze]}>
                                    <Text style={styles.rankText}>#{i + 1}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.cropName}>{emoji} {crop.name}</Text>
                                    <Text style={styles.seasonLabel}>{crop.season_icon} {crop.season_label}</Text>
                                </View>
                                {crop.is_local && (
                                    <View style={styles.localBadge}>
                                        <Text style={styles.localBadgeText}>📍 Local</Text>
                                    </View>
                                )}
                            </View>

                            {/* Season fit */}
                            <View style={[styles.fitBadge, { backgroundColor: fit.bg, borderColor: fit.border }]}>
                                <Text style={[styles.fitText, { color: fit.text }]}>{fit.label}</Text>
                            </View>

                            {/* Why this crop */}
                            <View style={styles.whyBox}>
                                <Text style={styles.whyText}>
                                    {crop.is_local
                                        ? `🏅 Widely grown in ${info.district || info.state} — farmers here have expertise & established supply chains`
                                        : `🌍 Suitable for ${info.state}'s climate and soil conditions`
                                    }
                                </Text>
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

    locationBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.green50,
        borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start',
        marginBottom: 16, borderWidth: 1, borderColor: COLORS.green200,
    },
    locationIcon: { fontSize: 14, marginRight: 6 },
    locationText: { fontSize: 13, fontWeight: '700', color: COLORS.green700 },

    cropCard: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
        marginBottom: 14, borderWidth: 1, borderColor: COLORS.borderLight,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4,
    },
    rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    rankBadge: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.gray100,
        alignItems: 'center', justifyContent: 'center',
    },
    rankGold: { backgroundColor: '#fef3c7' },
    rankSilver: { backgroundColor: '#e5e7eb' },
    rankBronze: { backgroundColor: '#fed7aa' },
    rankText: { fontSize: 14, fontWeight: '800', color: COLORS.gray800 },
    cropName: { fontSize: 18, fontWeight: '800', color: COLORS.gray900 },
    seasonLabel: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },

    localBadge: {
        backgroundColor: COLORS.green50, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
        borderWidth: 1, borderColor: COLORS.green200,
    },
    localBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.green700 },

    fitBadge: {
        borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start',
        marginBottom: 10, borderWidth: 1,
    },
    fitText: { fontSize: 12, fontWeight: '700' },

    whyBox: {
        backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    whyText: { fontSize: 12, color: COLORS.gray600, lineHeight: 18 },
});
