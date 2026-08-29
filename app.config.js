const packageJson = require('./package.json');

const BASE_APP_NAME = 'Wiewiorka';
const BASE_PACKAGE_NAME = 'com.mrek.wiewiorka';
const DEFAULT_VARIANT = 'development';

const appVariants = {
  development: {
    name: `${BASE_APP_NAME} (development)`,
    packageName: `${BASE_PACKAGE_NAME}.development`,
  },
  staging: {
    name: `${BASE_APP_NAME} (staging)`,
    packageName: `${BASE_PACKAGE_NAME}.staging`,
  },
  production: {
    name: BASE_APP_NAME,
    packageName: BASE_PACKAGE_NAME,
  },
};

const variant = process.env.EXPO_PUBLIC_APP_VARIANT || DEFAULT_VARIANT;
const appVariant = appVariants[variant];

if (!appVariant) {
  throw new Error(
    `Unsupported EXPO_PUBLIC_APP_VARIANT "${variant}". Expected one of: ${Object.keys(appVariants).join(', ')}`,
  );
}

module.exports = {
  expo: {
    name: appVariant.name,
    slug: 'wiewiorka',
    version: packageJson.version,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#fdfbf7',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#fdfbf7',
      },
      package: appVariant.packageName,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-web-browser',
      '@react-native-firebase/app',
      '@react-native-firebase/app-distribution',
      '@react-native-firebase/crashlytics',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: '5204d94e-0190-43ea-a9b8-1eb28273cc88',
      },
    },
  },
};
