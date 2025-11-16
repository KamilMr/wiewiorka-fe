import {useEffect} from 'react';
import {Stack} from 'expo-router';
import {Provider} from 'react-redux';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {KeyboardProvider} from 'react-native-keyboard-controller';

import 'react-native-reanimated';
import {useFonts} from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {PersistGate} from 'redux-persist/integration/react';
import {Provider as PaperProvider} from 'react-native-paper';

import {store, persistor} from '@/redux/store';
import {paperTheme} from '@/constants/theme';
import {SnackBar} from '@/components';
import {useSync} from '@/hooks';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const Sync = () => {
  useSync();

  return null;
};

const RootLayout = () => {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <Sync />
          <PaperProvider theme={paperTheme}>
            <KeyboardProvider>
              <Stack initialRouteName="(tabs)">
                <Stack.Screen name="sign-in" options={{headerShown: false}} />
                <Stack.Screen name="sign-up" options={{headerShown: false}} />
                <Stack.Screen name="(tabs)" options={{headerShown: false}} />
                <Stack.Screen
                  name="categories"
                  options={{headerShown: false}}
                />
                <Stack.Screen name="budget" options={{headerShown: false}} />
                <Stack.Screen
                  name="income-summary"
                  options={{headerShown: false}}
                />
                <Stack.Screen name="dev" options={{headerShown: false}} />
                <Stack.Screen
                  name="changelog"
                  options={{title: 'Historia Zmian'}}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
            </KeyboardProvider>
            <SnackBar />
          </PaperProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};
export default RootLayout;
