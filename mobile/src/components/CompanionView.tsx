import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityInspirationPanel } from '@/components/ActivityInspirationPanel';
import { ScreenBreakPanel } from '@/components/ScreenBreakPanel';
import { ChatMessage, MBTITheme } from '@/types';
import { hexToRgba, UI } from '@/styles/ui';

type ScreenBreakTrigger = {
  appName: string;
  appCategory: string;
  usageMinutes: number;
  continuousMinutes: number;
};

type CompanionViewProps = {
  theme: MBTITheme;
  location: string;
  isLoading: boolean;
  messages: ChatMessage[];
  inputText: string;
  onPrompt: (prompt: string) => void;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onTrigger: (trigger: ScreenBreakTrigger) => void;
};

const MOOD_PROMPTS = [
  { label: '放松一下', prompt: '我现在想放松一下，推荐一个具体活动' },
  { label: '想要灵感', prompt: '我想找点灵感，推荐一个不俗套的具体活动' },
  { label: '不想出门', prompt: '我今天不想出门，推荐一个居家具体活动' },
  { label: '一个人待着', prompt: '我想一个人待着，推荐一个低社交活动' },
];

export function CompanionView({
  theme,
  location,
  isLoading,
  messages,
  inputText,
  onPrompt,
  onInputChange,
  onSend,
  onTrigger,
}: CompanionViewProps) {
  const colors = theme.colors;
  const visibleMessages = messages.slice(-4);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
        <View style={[styles.avatar, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}>
          <Text style={[styles.avatarText, { color: colors.accent }]}>{theme.avatar}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.title, { color: colors.text }]}>今天想怎么被陪着？</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            你不需要先想清楚需求，点一个状态，我来把它变成具体安排。
          </Text>
        </View>
      </View>

      <View style={styles.promptGrid}>
        {MOOD_PROMPTS.map((item) => (
          <Pressable
            key={item.label}
            style={[styles.promptCard, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}
            onPress={() => onPrompt(item.prompt)}
          >
            <Text style={[styles.promptTitle, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.promptArrow, { color: colors.accent }]}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.chatPanel, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, { color: colors.text }]}>AI 小搭子</Text>
          <Text style={[styles.chatStatus, { color: colors.subtext }]}>说状态，我来变成具体计划</Text>
        </View>
        {visibleMessages.length ? (
          <View style={styles.messageList}>
            {visibleMessages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <View key={`${message.timestamp || index}-${index}`} style={[styles.messageBubble, { backgroundColor: isUser ? colors.accent : hexToRgba(colors.accent, 0.08), alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.messageText, { color: isUser ? '#fff' : colors.text }]}>{message.content}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.chatEmpty, { color: colors.subtext }]}>比如：“想放松一下”“不想出门”“推荐一个人少的地方”。</Text>
        )}
        <View style={[styles.inputBar, { backgroundColor: hexToRgba(colors.accent, 0.06) }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="聊点什么..."
            placeholderTextColor={colors.subtext}
            value={inputText}
            onChangeText={onInputChange}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.accent }, (!inputText.trim() || isLoading) && styles.disabled]}
            disabled={!inputText.trim() || isLoading}
            onPress={onSend}
          >
            <Text style={styles.sendText}>➤</Text>
          </Pressable>
        </View>
      </View>

      <ScreenBreakPanel theme={theme} isLoading={isLoading} onTrigger={onTrigger as any} />
      <ActivityInspirationPanel theme={theme} location={location} onPrompt={onPrompt} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: UI.space.pageX,
    paddingTop: 18,
    paddingBottom: 112,
  },
  hero: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '900',
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
    marginTop: 16,
  },
  promptCard: {
    width: '48.3%',
    minHeight: 92,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  promptArrow: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
  chatPanel: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  chatHeader: {
    marginBottom: 10,
  },
  chatTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  chatStatus: {
    fontSize: 13,
    marginTop: 4,
  },
  messageList: {
    gap: 8,
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  chatEmpty: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  inputBar: {
    minHeight: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 5,
  },
  input: {
    flex: 1,
    maxHeight: 88,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.45,
  },
});
