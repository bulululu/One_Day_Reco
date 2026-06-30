/**
 * 主聊天屏幕（极简版）
 * 头部 + 消息列表 + 输入框
 * 快捷操作整合到输入栏上方
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { MBTI_PERSONAS } from '@/data/personas';
import { chat } from '@/services/api';
import { ChatMessage } from '@/types';
import { MessageBubble } from '@/components/MessageBubble';
import { BreathingLoader } from '@/components/BreathingLoader';

export function ChatScreen() {
  const {
    mbti,
    currentTheme,
    messages,
    isLoading,
    addMessage,
    setLoading,
    getUserProfile,
    resetApp,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const colors = currentTheme.colors;
  const persona = mbti ? MBTI_PERSONAS[mbti] : MBTI_PERSONAS['INTP'];

  // 初始欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: `嘿，我是${currentTheme.name}～今天想干嘛？直接说，我帮你安排。`,
        timestamp: Date.now(),
      });
    }
  }, []);

  // 消息更新时滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isLoading]);

  const handleSend = async (text?: string) => {
    const content = (text || inputText).trim();
    if (!content || isLoading) return;

    addMessage({ role: 'user', content, timestamp: Date.now() });
    setInputText('');
    Keyboard.dismiss();
    setLoading(true);

    try {
      const profile = getUserProfile();
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await chat(profile, content, undefined, history);
      addMessage({
        role: 'assistant',
        content: res.reply,
        recommendations: res.recommendations,
        timestamp: Date.now(),
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: '啊，我刚才走神了…能再说一遍吗？',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} theme={currentTheme} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 极简头部 */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerAvatar}>{currentTheme.avatar}</Text>
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>
              {currentTheme.name}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={[styles.headerStatus, { color: colors.subtext }]}>
                {persona.status}
              </Text>
            </View>
          </View>
        </View>
        <Pressable onPress={resetApp} style={styles.resetBtn}>
          <Text style={[styles.resetText, { color: colors.subtext }]}>重置</Text>
        </Pressable>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, idx) => `${item.timestamp ?? idx}-${item.role}`}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loaderWrap}>
              <BreathingLoader theme={currentTheme} />
            </View>
          ) : null
        }
      />

      {/* 快捷操作 + 输入栏 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 快捷操作 */}
        <View style={styles.quickRow}>
          {persona.quickActions.slice(0, 3).map((action, idx) => (
            <Pressable
              key={idx}
              style={[
                styles.quickPill,
                {
                  backgroundColor: colors.card,
                  borderColor: 'rgba(255,255,255,0.1)',
                },
              ]}
              onPress={() => handleSend(action)}
              disabled={isLoading}
            >
              <Text style={[styles.quickText, { color: colors.text }]}>
                {action}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 输入栏 */}
        <View style={[styles.inputBar, { backgroundColor: colors.bg }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
              },
            ]}
            placeholder={persona.placeholder || '跟搭子聊聊…'}
            placeholderTextColor={colors.subtext}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <Pressable
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() ? colors.accent : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: { fontSize: 28 },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  headerStatus: { fontSize: 11 },
  resetBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  resetText: { fontSize: 13 },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  loaderWrap: { paddingVertical: 4 },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  quickPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickText: { fontSize: 13, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 42,
    borderRadius: 22,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
});
