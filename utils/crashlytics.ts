import {
  getCrashlytics,
  recordError as fbRecordError,
  log as fbLog,
  setUserId as fbSetUserId,
  setAttribute as fbSetAttribute,
  crash as fbCrash,
} from '@react-native-firebase/crashlytics';

const crashlyticsInstance = getCrashlytics();

const logError = (error: Error, context?: string) => {
  if (context) fbLog(crashlyticsInstance, context);
  fbRecordError(crashlyticsInstance, error);
};

const log = (message: string) => {
  fbLog(crashlyticsInstance, message);
};

const setUserId = (userId: string) => {
  fbSetUserId(crashlyticsInstance, userId);
};

const setAttribute = (key: string, value: string) => {
  fbSetAttribute(crashlyticsInstance, key, value);
};

const testCrash = () => {
  fbCrash(crashlyticsInstance);
};

export {logError, log, setUserId, setAttribute, testCrash};
