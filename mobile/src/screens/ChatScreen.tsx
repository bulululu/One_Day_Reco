/**
 * 主聊天屏幕
 * 搭子对话界面：头部 + 消息列表 + 快捷操作 + 输入框
 * 灵感: Character.AI / Replika
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
import { CompanionHeader } from '@/components/CompanionHeader';
import { MessageBubble } from '@/components/MessageBubble';
import { QuickActions } from '@/components/QuickActions';
import { BreathingLoader } from '@/components/BreathingLoader';

const KEYBOARD_OFFSET = Platform.OS === 'ios' ? 0 : 0;

export function ChatScreen() {
  const {
    mbti,
    currentTheme,
    messages,
    isLoading,
    addMessage,
    setLoading,
    getUserProfile,
    userId,
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
        content: persona.placeholder
          ? `嘿，我是你的搭子～${persona.status === '在线' ? '随时都在' : '有事找我'}。今天想干嘛？`
          : '嘿，我是你的搭子～今天想干嘛？',
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

    // 添加用户消息
    addMessage({
      role: 'user',
      content,
      timestamp: Date.now(),
    });
    setInputText('');
    Keyboard.dismiss();

    // 加载状态
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
    } catch (err) {
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
      {/* 搭子头部 */}
      <CompanionHeader theme={currentTheme} persona={persona} />

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, idx) => `msg-${idx}`}
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

      {/* 快捷操作 */}
      <QuickActions persona={persona} theme={currentTheme} onAction={handleSend} />

      {/* 输入框 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={KEYBOARD_OFFSET}
      >
        <View style={[styles.inputBar, { backgroundColor: colors.bg }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderRadius: parseInt(currentTheme.radius) + 8,
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
                backgroundColor: inputText.trim() ? colors.accent : 'rgba(255,255,255,0.1)',
                borderRadius: parseInt(currentTheme.radius) + 6,
              },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendText}>发送</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  loaderWrap: {
    paddingVertical: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  },
  sendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
