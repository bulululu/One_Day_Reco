/**
 * OneDayReco App 入口
 * React Navigation: Onboarding ↔ Chat
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { ChatScreen } from '@/screens/ChatScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { isOnboarding, isHydrated, currentTheme } = useAppStore();
  const colors = currentTheme.colors;

  // AsyncStorage 加载完成前显示空白背景，防止 Onboarding 闪烁
  if (!isHydrated) {
    return (
      <>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.accent,
            background: colors.bg,
            card: colors.card,
            text: colors.text,
            border: 'transparent',
            notification: colors.accent,
          },
          fonts: {
            regular: { fontFamily: 'System' },
            medium: { fontFamily: 'System' },
            bold: { fontFamily: 'System' },
            heavy: { fontFamily: 'System' },
          },
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          {isOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <Stack.Screen name="Chat" component={ChatScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
