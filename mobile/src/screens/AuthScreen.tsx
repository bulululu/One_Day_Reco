import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { login, register } from '@/services/api';
import { useAppStore } from '@/store/appStore';

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function AuthScreen() {
  const { currentTheme, setAuthSession, continueAsGuest } = useAppStore();
  const colors = currentTheme.colors;
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail || password.length < 8 || loading) {
      setStatus('请输入邮箱和至少 8 位密码');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const res = mode === 'register'
        ? await register(nextEmail, password)
        : await login(nextEmail, password);
      setAuthSession(res.token, res.user);
    } catch {
      setStatus(mode === 'register' ? '注册失败，可能邮箱已存在' : '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <View style={styles.brand}>
          <Text style={[styles.wordmark, { color: colors.accent }]}>OneDayReco</Text>
          <Text style={[styles.tagline, { color: colors.subtext }]}>
            让今天的安排，真正属于你。
          </Text>
        </View>

        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.card,
              borderColor: hexToRgba(colors.accent, 0.16),
              shadowColor: colors.accent,
            },
          ]}
        >
          <View style={[styles.switcher, { backgroundColor: hexToRgba(colors.accent, 0.08) }]}>
            {(['register', 'login'] as const).map((item) => {
              const selected = mode === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.switchBtn, selected && { backgroundColor: colors.accent }]}
                  onPress={() => setMode(item)}
                >
                  <Text style={[styles.switchText, { color: selected ? '#fff' : colors.accent }]}>
                    {item === 'register' ? '注册' : '登录'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'register' ? '保存你的推荐偏好' : '回到你的今日推荐'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            账号会同步 MBTI、反馈和推荐历史。你也可以先游客体验。
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: hexToRgba(colors.accent, 0.18),
                backgroundColor: hexToRgba(colors.accent, 0.06),
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="邮箱"
            placeholderTextColor={colors.subtext}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: hexToRgba(colors.accent, 0.18),
                backgroundColor: hexToRgba(colors.accent, 0.06),
              },
            ]}
            value={password}
            onChangeText={setPassword}
            placeholder="密码，至少 8 位"
            placeholderTextColor={colors.subtext}
            secureTextEntry
          />

          {status ? <Text style={[styles.status, { color: colors.accent }]}>{status}</Text> : null}

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.accent }, loading && styles.disabled]}
            onPress={submit}
            disabled={loading}
          >
            <Text style={styles.primaryText}>{loading ? '处理中...' : mode === 'register' ? '创建账号' : '登录'}</Text>
          </Pressable>

          <Pressable style={styles.guestBtn} onPress={continueAsGuest}>
            <Text style={[styles.guestText, { color: colors.subtext }]}>先游客体验</Text>
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
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  brand: {
    marginBottom: 28,
  },
  wordmark: {
    fontSize: 38,
    lineHeight: 45,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0,
  },
  tagline: {
    fontSize: 17,
    marginTop: 8,
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  switcher: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    marginBottom: 22,
  },
  switchBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },
  input: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 12,
  },
  status: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.65,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  guestBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  guestText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
