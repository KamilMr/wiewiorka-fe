import {View, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';

import {Text} from '@/components';
import {testCrash, logError, log} from '@/utils/crashlytics';

const CrashlyticsScreen = () => {
  const handleTestLogError = () => {
    const error = new Error('Test logged error');
    logError(error, 'DevScreen manual test');
    log('Test error was logged');
  };

  const handleTestJsError = () => {
    throw new Error('Test JS Error from Dev Screen');
  };

  const handleTestCrash = () => {
    testCrash();
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={styles.title}>
        Crashlytics Test
      </Text>

      <Button mode="contained" onPress={handleTestLogError} style={styles.button}>
        Log Error to Crashlytics
      </Button>

      <Button mode="contained" onPress={handleTestJsError} style={styles.button}>
        Trigger JS Error (ErrorBoundary)
      </Button>

      <Button
        mode="contained"
        onPress={handleTestCrash}
        style={styles.button}
        buttonColor="#d32f2f"
      >
        Force Native Crash
      </Button>

      <Text style={styles.warning}>
        Native crash will close the app. Check Firebase Console after restart.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 32,
  },
  button: {
    marginVertical: 8,
    width: '80%',
  },
  warning: {
    marginTop: 24,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default CrashlyticsScreen;
