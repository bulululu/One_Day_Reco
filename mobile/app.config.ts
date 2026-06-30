/**
 * OneDayReco Expo 配置
 */
export default {
  name: 'OneDayReco',
  slug: 'onedayreco',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#fbf4ee',
  },
  web: {
    favicon: './src/assets/generated/home-hero.png',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.onedayreco.app',
  },
  android: {
    package: 'com.onedayreco.app',
  },
};
