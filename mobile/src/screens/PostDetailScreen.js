/**
 * SmartAgri AI — Post Detail Screen
 * Full post + comment thread
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHARED, SHADOWS } from '../theme';

const CAT_STYLE = {
    tip: { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9' },
    price: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
    pest: { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
    question: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    general: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' },
};

function timeAgo(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailScreen({ route, navigation }) {
    const { postId, post: initialPost } = route.params;
    const { user } = useAuth();
    const { t } = useLang();

    const [post, setPost] = useState(initialPost || null);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const scrollRef = useRef(null);

    const CAT_LABEL = {
        tip: `💡 ${t.cp_crop_tip}`, price: `💰 ${t.cp_price_report}`, pest: `🐛 ${t.cp_pest_alert}`,
        question: `❓ ${t.cp_question}`, general: `📢 ${t.cp_general}`,
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/community/posts/${postId}/comments`);
            setComments(res.data.comments || []);
        } catch { }
        finally { setLoadingComments(false); }
    };

    const handleUpvote = async () => {
        try {
            const res = await api.post(`/community/posts/${postId}/upvote`);
            setPost(p => ({ ...p, upvote_count: res.data.upvote_count, upvoted_by_me: res.data.upvoted }));
        } catch { }
    };

    const handleComment = async () => {
        if (newComment.trim().length < 2) return;
        if (!user?.district) {
            Alert.alert(t.pd_profile_incomplete, t.pd_profile_incomplete_msg);
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post(`/community/posts/${postId}/comments`, { content: newComment.trim() });
            setComments(prev => [...prev, res.data]);
            setPost(p => ({ ...p, comment_count: p.comment_count + 1 }));
            setNewComment('');
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
        } catch (e) {
            Alert.alert(t.cp_error, e.response?.data?.detail || 'Could not post comment.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!post) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.green600} /></View>;
    }

    const cat = CAT_STYLE[post.category] || CAT_STYLE.general;

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}>

            <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
                {/* Post card */}
                <View style={[SHARED.card, { marginBottom: 16 }]}>
                    {/* Author */}
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{post.user_name?.charAt(0)?.toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.authorName}>{post.user_name}</Text>
                            <Text style={styles.metaText}>📍 {post.district}, {post.state} · {timeAgo(post.created_at)}</Text>
                        </View>
                        <View style={[styles.catBadge, { backgroundColor: cat.bg, borderColor: cat.border }]}>
                            <Text style={[styles.catText, { color: cat.text }]}>
                                {CAT_LABEL[post.category] || post.category}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    <Text style={styles.postContent}>{post.content}</Text>

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, post.upvoted_by_me && styles.actionBtnActive]}
                            onPress={handleUpvote}
                        >
                            <Text style={[styles.actionText, post.upvoted_by_me && { color: COLORS.green700 }]}>
                                👍 {post.upvote_count} {t.pd_helpful}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.commentCountText}>💬 {post.comment_count} {t.pd_comments}</Text>
                    </View>
                </View>

                {/* Comments */}
                <Text style={styles.commentsTitle}>{t.pd_comments_title} ({comments.length})</Text>
                {loadingComments ? (
                    <ActivityIndicator color={COLORS.green600} style={{ marginVertical: 20 }} />
                ) : comments.length === 0 ? (
                    <View style={styles.noComments}>
                        <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                        <Text style={SHARED.emptySubtext}>{t.pd_no_comments}</Text>
                    </View>
                ) : (
                    comments.map(c => (
                        <View key={c.id} style={styles.commentCard}>
                            <View style={styles.commentHeader}>
                                <View style={styles.commentAvatar}>
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.green800 }}>
                                        {c.user_name?.charAt(0)?.toUpperCase()}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.commentAuthor}>{c.user_name}</Text>
                                    <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                                </View>
                            </View>
                            <Text style={styles.commentContent}>{c.content}</Text>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Comment input bar */}
            <View style={styles.commentBar}>
                <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder={t.pd_add_comment}
                    placeholderTextColor={COLORS.gray400}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!newComment.trim() || submitting) && { opacity: 0.5 }]}
                    onPress={handleComment}
                    disabled={!newComment.trim() || submitting}
                >
                    {submitting
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>↑</Text>
                    }
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    avatar: {
        width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.green100,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 17, fontWeight: '800', color: COLORS.green800 },
    authorName: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
    metaText: { fontSize: 11, color: COLORS.gray500, marginTop: 1 },
    catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
    catText: { fontSize: 10, fontWeight: '700' },
    postContent: { fontSize: 15, color: COLORS.gray800, lineHeight: 24, marginBottom: 16 },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 12 },
    actionBtn: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
        backgroundColor: COLORS.gray50, borderWidth: 1, borderColor: COLORS.gray200,
    },
    actionBtnActive: { backgroundColor: COLORS.green50, borderColor: COLORS.green300 },
    actionText: { fontSize: 13, fontWeight: '600', color: COLORS.gray600 },
    commentCountText: { fontSize: 13, color: COLORS.gray500, fontWeight: '600' },
    commentsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray900, marginBottom: 10 },
    noComments: { alignItems: 'center', paddingVertical: 30 },
    commentCard: {
        backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8,
        borderWidth: 1, borderColor: COLORS.borderSubtle,
    },
    commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    commentAvatar: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.green100,
        alignItems: 'center', justifyContent: 'center',
    },
    commentAuthor: { fontSize: 12, fontWeight: '700', color: COLORS.gray900 },
    commentTime: { fontSize: 10, color: COLORS.gray400 },
    commentContent: { fontSize: 13, color: COLORS.gray700, lineHeight: 19 },
    commentBar: {
        flexDirection: 'row', padding: 10, paddingHorizontal: 14, backgroundColor: COLORS.white,
        borderTopWidth: 1, borderTopColor: COLORS.borderSubtle, gap: 10, alignItems: 'flex-end',
    },
    commentInput: {
        flex: 1, borderWidth: 1.5, borderColor: COLORS.borderSubtle, borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: COLORS.gray900,
        backgroundColor: COLORS.gray50, maxHeight: 100,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.green600,
        alignItems: 'center', justifyContent: 'center',
    },
});
