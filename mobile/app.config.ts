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
    infoPlist: {
      NSUserNotificationUsageDescription: 'OneDayReco 会在你设置的时间提醒你查看今日活动推荐。',
      NSLocationWhenInUseUsageDescription: 'OneDayReco 会根据你的位置推荐附近可以直接去的活动。',
    },
  },
  android: {
    package: 'com.onedayreco.app',
    permissions: ['POST_NOTIFICATIONS', 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
};
