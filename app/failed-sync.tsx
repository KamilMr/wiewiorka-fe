import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Icon, Text} from 'react-native-paper';
import {Stack} from 'expo-router';

import FailedSyncList from '@/components/FailedSyncList';
import WarmCard from '@/components/warm/WarmCard';
import {warmColors, warmRadius} from '@/constants/warmTheme';
import {useAppSelector} from '@/hooks';
import {selectFailedOperationsCount} from '@/redux/sync/syncSlice';

const FailedSyncPage = () => {
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
        style={styles.page}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {failedCount === 0 ? (
          <View style={styles.emptyState}>
            <WarmCard variant="solid" style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Icon
                  source="check-circle-outline"
                  color={warmColors.success}
                  size={28}
                />
              </View>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Brak niezsynchronizowanych operacji
              </Text>
            </WarmCard>
          </View>
        ) : (
          <FailedSyncList />
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: warmColors.background,
  },
  container: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    marginBottom: 14,
    borderRadius: warmRadius.pill,
    backgroundColor: warmColors.successBackground,
  },
  emptyText: {
    color: warmColors.mutedForeground,
    textAlign: 'center',
  },
});

export default FailedSyncPage;
