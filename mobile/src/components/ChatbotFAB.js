/**
 * SmartAgri AI Mobile - Chatbot FAB
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, TextInput, FlatList, Modal,
    StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLang } from '../context/LanguageContext';
import api from '../api';
import { COLORS, SHADOWS } from '../theme';

export default function ChatbotFAB({ visible = false, onClose }) {
    const { t } = useLang();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([{
        from: 'bot',
        text: '🌾 Hello! I\'m your SmartAgri AI assistant. Ask me about crops, diseases, weather, schemes, or farming tips!',
        suggestions: ['Best crop for Kharif?', 'How to treat blight?', 'Government schemes', 'Soil health tips'],
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    // Sync with external visible prop
    useEffect(() => {
        setOpen(visible);
    }, [visible]);

    const handleClose = () => {
        setOpen(false);
        if (onClose) onClose();
    };

    const send = async (text) => {
        const msg = text || input.trim();
        if (!msg) return;
        setInput('');
        setMessages(p => [...p, { from: 'user', text: msg }]);
        setLoading(true);
        try {
            const res = await api.post('/chatbot/', { message: msg });
            setMessages(p => [...p, { from: 'bot', text: res.data.reply, suggestions: res.data.suggestions }]);
        } catch {
            setMessages(p => [...p, { from: 'bot', text: 'Sorry, I couldn\'t process that. Please try again!' }]);
        }
        setLoading(false);
    };

    const renderMessage = ({ item }) => (
        <View style={{ marginBottom: 10 }}>
            <View style={[
                styles.bubble,
                item.from === 'user' ? styles.userBubble : styles.botBubble,
            ]}>
                <Text style={[styles.bubbleText, item.from === 'user' && { color: '#fff' }]}>
                    {item.text}
                </Text>
            </View>
            {item.suggestions && (
                <View style={styles.suggestionsRow}>
                    {item.suggestions.map((s, j) => (
                        <TouchableOpacity key={j} style={styles.suggestionChip} onPress={() => send(s)}>
                            <Text style={styles.suggestionText}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <>

            {/* Chat Modal */}
            <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.chatContainer}
                    >
                        {/* Header */}
                        <View style={styles.chatHeader}>
                            <View style={styles.headerLeft}>
                                <View style={styles.headerIcon}>
                                    <Text style={{ fontSize: 18 }}>🤖</Text>
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>SmartAgri AI</Text>
                                    <Text style={styles.headerSub}>🟢 Online • Ask me anything</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleClose}>
                                <Text style={{ fontSize: 18, color: '#fff' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Messages */}
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(_, i) => String(i)}
                            contentContainerStyle={styles.messagesList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListFooterComponent={loading ? (
                                <View style={styles.typingRow}>
                                    {[0, 1, 2].map(i => (
                                        <View key={i} style={styles.typingDot} />
                                    ))}
                                </View>
                            ) : null}
                        />

                        {/* Input */}
                        <View style={styles.inputRow}>
                            <TextInput
                                value={input}
                                onChangeText={setInput}
                                placeholder={t.ask_me || 'Ask me anything...'}
                                placeholderTextColor={COLORS.gray400}
                                style={styles.chatInput}
                                onSubmitEditing={() => send()}
                                returnKeyType="send"
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
                                onPress={() => send()}
                                disabled={loading || !input.trim()}
                            >
                                <Text style={{ color: '#fff', fontSize: 16 }}>➤</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    fabIcon: {
        fontSize: 22,
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    chatContainer: {
        height: '70%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.green800,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: '#fff',
    },
    headerSub: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
    },
    messagesList: {
        padding: 14,
        paddingBottom: 10,
    },
    bubble: {
        maxWidth: '85%',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.green600,
        borderRadius: 16,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.gray50,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    bubbleText: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.gray800,
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    suggestionChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    suggestionText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.green600,
    },
    typingRow: {
        flexDirection: 'row',
        gap: 5,
        padding: 10,
        alignSelf: 'flex-start',
    },
    typingDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.gray400,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
    chatInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: COLORS.borderLight,
        fontSize: 13,
        backgroundColor: COLORS.background,
        color: COLORS.gray800,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.green600,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.green,
    },
});
