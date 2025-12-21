import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text} from 'react-native-paper';
import {Stack} from 'expo-router';

import FailedSyncList from '@/components/FailedSyncList';
import {useAppSelector} from '@/hooks';
import {selectFailedOperationsCount} from '@/redux/sync/syncSlice';
import {useAppTheme} from '@/constants/theme';

const FailedSyncPage = () => {
  const t = useAppTheme();
  const failedCount = useAppSelector(selectFailedOperationsCount);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Niezsynchronizowane',
          headerShown: true,
        }}
      />
      <ScrollView
        style={{backgroundColor: t.colors.white}}
        contentContainerStyle={styles.container}
      >
        {failedCount === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={{color: t.colors.onSurfaceVariant}}>
              Brak niezsynchronizowanych operacji
            </Text>
          </View>
        ) : (
          <FailedSyncList />
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default FailedSyncPage;
