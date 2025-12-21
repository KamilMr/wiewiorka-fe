import {
  getCrashlytics,
  recordError as fbRecordError,
  log as fbLog,
  setUserId as fbSetUserId,
  setAttribute as fbSetAttribute,
  crash as fbCrash,
} from '@react-native-firebase/crashlytics';

const crashlyticsInstance = getCrashlytics();

const safeExecute = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch (err) {
    console.log('Crashlytics error:', err);
    return undefined;
  }
};

const logError = (error: Error, context?: string) => {
  safeExecute(() => {
    if (context) fbLog(crashlyticsInstance, context);
    fbRecordError(crashlyticsInstance, error);
  });
};

const log = (message: string) => {
  safeExecute(() => fbLog(crashlyticsInstance, message));
};

const setUserId = (userId: string | number) => {
  safeExecute(() => {
    fbSetUserId(crashlyticsInstance, String(userId)).catch((err) =>
      console.log('Crashlytics setUserId error:', err),
    );
  });
};

const setAttribute = (key: string, value: string | number) => {
  safeExecute(() => fbSetAttribute(crashlyticsInstance, key, String(value)));
};

const testCrash = () => {
  fbCrash(crashlyticsInstance);
};

export {logError, log, setUserId, setAttribute, testCrash};
