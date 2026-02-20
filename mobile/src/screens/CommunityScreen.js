/**
 * SmartAgri AI — Community Screen
 * District-scoped farmer feed with 3 tabs: District / Nearby / My Posts
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { COLORS, SHARED, SHADOWS } from '../theme';

const CATEGORIES = [
    { key: 'all', label: '🌐 All', color: COLORS.gray600 },
    { key: 'tip', label: '💡 Tips', color: '#7c3aed' },
    { key: 'price', label: '💰 Price', color: COLORS.green700 },
    { key: 'pest', label: '🐛 Pest', color: '#dc2626' },
    { key: 'question', label: '❓ Q&A', color: '#d97706' },
    { key: 'general', label: '📢 General', color: COLORS.gray700 },
];

const CAT_STYLE = {
    tip: { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9' },
    price: { bg: '#f0fdf4', border: COLORS.green300, text: COLORS.green800 },
    pest: { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
    question: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    general: { bg: COLORS.gray50, border: COLORS.gray300, text: COLORS.gray700 },
};

function timeAgo(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post, onPress, onUpvote }) {
    const cat = CAT_STYLE[post.category] || CAT_STYLE.general;
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{post.user_name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.posterName}>{post.user_name}</Text>
                    <Text style={styles.metaText}>
                        📍 {post.district} · {timeAgo(post.created_at)}
                    </Text>
                </View>
                <View style={[styles.catBadge, { backgroundColor: cat.bg, borderColor: cat.border }]}>
                    <Text style={[styles.catText, { color: cat.text }]}>
                        {CATEGORIES.find(c => c.key === post.category)?.label || post.category}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <Text style={styles.content} numberOfLines={4}>{post.content}</Text>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={[styles.actionBtn, post.upvoted_by_me && styles.actionBtnActive]}
                    onPress={() => onUpvote(post.id)}
                >
                    <Text style={[styles.actionText, post.upvoted_by_me && { color: COLORS.green700 }]}>
                        👍 {post.upvote_count}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
                    <Text style={styles.actionText}>💬 {post.comment_count} comments</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

export default function CommunityScreen({ navigation }) {
    const { user } = useAuth();
    const [tab, setTab] = useState('district');   // district | nearby | mine
    const [category, setCategory] = useState('all');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const district = user?.district;
    const state = user?.state;

    const fetchPosts = useCallback(async (reset = false) => {
        const currentPage = reset ? 1 : page;
        try {
            const params = {
                page: currentPage,
                limit: 15,
                ...(category !== 'all' && { category }),
            };
            if (tab === 'mine') {
                const res = await api.get('/community/my-posts');
                setPosts(res.data.posts || []);
                setHasMore(false);
                return;
            }
            if (tab === 'nearby') {
                params.state = state;
                params.nearby = true;
            } else {
                params.district = district;
            }
            const res = await api.get('/community/posts', { params });
            const newPosts = res.data.posts || [];
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }
            setHasMore(newPosts.length === 15);
            if (reset) setPage(2); else setPage(p => p + 1);
        } catch (e) {
            console.log('Community fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tab, category, district, state, page]);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        setPage(1);
        setHasMore(true);
        fetchPosts(true);
    }, [tab, category]));

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchPosts(true);
    };

    const handleUpvote = async (postId) => {
        try {
            const res = await api.post(`/community/posts/${postId}/upvote`);
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, upvote_count: res.data.upvote_count, upvoted_by_me: res.data.upvoted }
                    : p
            ));
        } catch { }
    };

    const TABS = [
        { key: 'district', label: `📍 ${district || 'My District'}` },
        { key: 'nearby', label: '🗺️ Nearby' },
        { key: 'mine', label: '👤 My Posts' },
    ];

    if (!district && tab === 'district') {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 48 }}>📍</Text>
                <Text style={SHARED.emptyText}>Set Your District</Text>
                <Text style={[SHARED.emptySubtext, { marginHorizontal: 32, textAlign: 'center' }]}>
                    Go to Profile and select your Maharashtra district to see local community posts.
                </Text>
                <TouchableOpacity
                    style={[SHARED.btnPrimary, { marginTop: 20, paddingHorizontal: 32 }]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={SHARED.btnPrimaryText}>Open Profile →</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Tab bar */}
            <View style={styles.tabBar}>
                {TABS.map(t => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tabBtn, tab === t.key && styles.tabActive]}
                        onPress={() => setTab(t.key)}
                    >
                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]} numberOfLines={1}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Category filter */}
            {tab !== 'mine' && (
                <FlatList
                    data={CATEGORIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.key}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.catFilter, category === item.key && styles.catFilterActive]}
                            onPress={() => setCategory(item.key)}
                        >
                            <Text style={[styles.catFilterText, category === item.key && { color: COLORS.green700 }]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Post list */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.green600} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green600]} />}
                    onEndReached={() => { if (hasMore && !loading) fetchPosts(false); }}
                    onEndReachedThreshold={0.3}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            onPress={() => navigation.navigate('PostDetail', { postId: item.id, post: item })}
                            onUpvote={handleUpvote}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ fontSize: 48, marginBottom: 12 }}>🌾</Text>
                            <Text style={SHARED.emptyText}>No posts yet</Text>
                            <Text style={SHARED.emptySubtext}>
                                Be the first farmer in {district} to share something!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB — Create post */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreatePost')}
            >
                <Text style={styles.fabText}>✏️</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    tabBar: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.green600 },
    tabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray500 },
    tabTextActive: { color: COLORS.green700 },
    catFilter: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
        backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
    },
    catFilterActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green400 },
    catFilterText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    card: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: COLORS.borderSubtle, ...SHADOWS.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    avatar: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.green100,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.green800 },
    posterName: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
    metaText: { fontSize: 11, color: COLORS.gray500, marginTop: 1 },
    catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    catText: { fontSize: 10, fontWeight: '700' },
    content: { fontSize: 14, color: COLORS.gray800, lineHeight: 21, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 10 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200,
    },
    actionBtnActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green300 },
    actionText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
    empty: { alignItems: 'center', paddingTop: 60 },
    fab: {
        position: 'absolute', bottom: 24, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: COLORS.green600, alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.green, elevation: 8,
    },
    fabText: { fontSize: 22 },
});
