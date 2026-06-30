/**
 * OneDayReco App 入口
 * React Navigation: Onboarding ↔ Chat
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { AuthScreen } from '@/screens/AuthScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { ChatScreen } from '@/screens/ChatScreen';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { authToken, hasSkippedAuth, isOnboarding, currentTheme } = useAppStore();
  const colors = currentTheme.colors;
  const needsAuth = !authToken && !hasSkippedAuth;

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer
        theme={{
          dark: false,
          colors: {
            primary: colors.accent,
            background: colors.bg,
            card: colors.card,
            text: colors.text,
            border: 'transparent',
            notification: colors.accent,
          },
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          {needsAuth ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : isOnboarding ? (
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
