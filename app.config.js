module.exports = {
  expo: {
    name: "Wiewiorka",
    slug: "wiewiorka",
    version: "1.0.3",
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
      package: "com.mrek.wiewiorka",
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
      "@react-native-firebase/app-distribution"
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
