import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'OneDayReco',
  slug: 'onedayreco',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#1a1a2e',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.onedayreco.app',
  },
  android: {
    package: 'com.onedayreco.app',
  },
  web: {
    favicon: './assets/favicon.png',
  },
});
