export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#121B22',
        image: './assets/LoreForge_logo.png',
        resizeMode: 'contain',
        imageWidth: 160,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'LoreForge needs photo access to set character portraits.',
      },
    ],
    'expo-sharing',
  ],
  android: {
    ...config.android,
    package: 'com.waengs.loreforge',
    versionCode: 6,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.waengs.loreforge',
    buildNumber: '2',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
    },
  },
  userInterfaceStyle: 'dark',
  backgroundColor: '#121B22',
});
