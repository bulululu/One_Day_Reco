/**
 * OneDayReco App 入口
 * React Navigation: Onboarding ↔ Chat
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/appStore';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { MainAppScreen } from '@/screens/MainAppScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

(Text as any).defaultProps = { ...(Text as any).defaultProps, maxFontSizeMultiplier: 1.08 };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, maxFontSizeMultiplier: 1.08 };

function AppContent() {
  const { isOnboarding, isHydratingUser, currentTheme } = useAppStore();
  const colors = currentTheme.colors;

  if (isHydratingUser) {
    return (
      <>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
      </>
    );
  }

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
          {isOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <Stack.Screen name="Chat" component={MainAppScreen} />
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
