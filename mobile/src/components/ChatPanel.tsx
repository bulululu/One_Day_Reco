import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChatMessage, MBTITheme, Recommendation } from '@/types';
import { hexToRgba, UI } from '@/styles/ui';

type Props = {
  visible: boolean;
  theme: MBTITheme;
  messages: ChatMessage[];
  inputText: string;
  isLoading: boolean;
  onClose: () => void;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onPrompt: (prompt: string) => void;
  onOpenRecommendation: (recommendation: Recommendation) => void;
};

const QUICK_PROMPTS = [
  '我现在想放松一下',
  '推荐一个人少的地方',
  '帮我记录今天的感受',
];

export function ChatPanel({
  visible,
  theme,
  messages,
  inputText,
  isLoading,
  onClose,
  onInputChange,
  onSend,
  onPrompt,
  onOpenRecommendation,
}: Props) {
  const colors = theme.colors;
  const visibleMessages = messages.slice(-12);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.bg }]}
      >
        <View style={styles.shell}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>和{theme.name}聊聊</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>我会把状态变成具体计划。</Text>
            </View>
            <Pressable style={[styles.close, { backgroundColor: colors.card }]} onPress={onClose}>
              <Text style={[styles.closeText, { color: colors.text }]}>×</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.messageList}>
            {visibleMessages.length ? visibleMessages.map((message, index) => {
              const isUser = message.role === 'user';
              const messageRecommendations = !isUser ? message.recommendations?.slice(0, 3) || [] : [];
              return (
                <View
                  key={`${message.timestamp || index}-${index}`}
                  style={[
                    styles.bubble,
                    {
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      backgroundColor: isUser ? colors.accent : colors.card,
                      borderColor: isUser ? colors.accent : hexToRgba(colors.accent, 0.12),
                    },
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: isUser ? '#fff' : colors.text }]}>
                    {message.content}
                  </Text>
                  {!isUser && message.reply_source === 'fallback' ? (
                    <Text style={[styles.sourceBadge, { color: colors.subtext }]}>本地灵感</Text>
                  ) : null}
                  {messageRecommendations.map((recommendation) => (
                    <Pressable
                      key={recommendation.activity_id}
                      style={[styles.recoCard, { backgroundColor: hexToRgba(colors.accent, 0.08), borderColor: hexToRgba(colors.accent, 0.16) }]}
                      onPress={() => onOpenRecommendation(recommendation)}
                    >
                      <Text style={[styles.recoTitle, { color: colors.text }]} numberOfLines={1}>
                        {recommendation.specific_info?.name || recommendation.activity_name}
                      </Text>
                      <Text style={[styles.recoMeta, { color: colors.subtext }]} numberOfLines={1}>
                        {[recommendation.specific_info?.location, recommendation.specific_info?.route, recommendation.specific_info?.duration, recommendation.specific_info?.price]
                          .filter(Boolean)
                          .join(' · ') || '查看具体安排'}
                      </Text>
                      <Text style={[styles.recoAction, { color: colors.accent }]}>查看详情 ›</Text>
                    </Pressable>
                  ))}
                </View>
              );
            }) : (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.12) }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>今天想从哪里开始？</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>可以直接说“我不想去人多的地方，但想看电影”。</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.quickRow}>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                style={[styles.quickChip, { backgroundColor: hexToRgba(colors.accent, 0.08) }]}
                onPress={() => onPrompt(prompt)}
              >
                <Text style={[styles.quickText, { color: colors.accent }]} numberOfLines={1}>{prompt}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.inputBar, { backgroundColor: colors.card, borderColor: hexToRgba(colors.accent, 0.1) }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="说点什么..."
              placeholderTextColor={colors.subtext}
              value={inputText}
              onChangeText={onInputChange}
              multiline
              maxLength={500}
            />
            <Pressable
              disabled={!inputText.trim() || isLoading}
              onPress={onSend}
              style={[styles.send, { backgroundColor: colors.accent }, (!inputText.trim() || isLoading) && styles.disabled]}
            >
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: UI.space.pageX,
    paddingTop: 18,
    paddingBottom: 18,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    gap: 10,
    paddingVertical: 18,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    marginTop: 7,
  },
  recoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  recoTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  recoMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  recoAction: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  empty: {
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    padding: 18,
    marginTop: 48,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quickText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  inputBar: {
    minHeight: 58,
    borderRadius: 29,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
  },
  input: {
    flex: 1,
    maxHeight: 96,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 9,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.42,
  },
});
