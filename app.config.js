const packageJson = require('./package.json');

const variant = process.env.EXPO_PUBLIC_APP_VARIANT;

const getAppName = () => {
  if (variant === 'production') return 'Wiewiorka';
  if (variant) return `Wiewiorka (${variant})`;
  return 'Wiewiorka';
};

const getPackageName = () => {
  if (variant === 'production') return 'com.mrek.wiewiorka';
  if (variant) return `com.mrek.wiewiorka.${variant}`;
  return 'com.mrek.wiewiorka';
};

module.exports = {
  expo: {
    name: getAppName(),
    slug: "wiewiorka",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: getPackageName(),
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-web-browser",
      "@react-native-firebase/app",
      "@react-native-firebase/app-distribution",
      "@react-native-firebase/crashlytics"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "5204d94e-0190-43ea-a9b8-1eb28273cc88"
      }
    }
  }
};
