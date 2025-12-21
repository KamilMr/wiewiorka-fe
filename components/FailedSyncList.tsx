import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button, Card, Text, IconButton} from 'react-native-paper';

import {useAppDispatch, useAppSelector} from '@/hooks';
import {
  selectFailedOperations,
  retryOperation,
  discardOperation,
  retryAllFailed,
  discardAllFailed,
} from '@/redux/sync/syncSlice';
import {SyncOperation} from '@/types';
import {useAppTheme} from '@/constants/theme';

const getOperationTypeLabel = (path: string[]): string => {
  const pathStr = path.join('/').toLowerCase();
  if (pathStr.includes('expenses')) return 'Wydatek';
  if (pathStr.includes('income')) return 'Przychód';
  if (pathStr.includes('budget')) return 'Budżet';
  if (pathStr.includes('category/group')) return 'Grupa kategorii';
  if (pathStr.includes('category')) return 'Kategoria';
  if (pathStr.includes('debt')) return 'Dług';
  return 'Operacja';
};

const getOperationIcon = (path: string[]): string => {
  const pathStr = path.join('/').toLowerCase();
  if (pathStr.includes('expenses')) return 'cart-arrow-up';
  if (pathStr.includes('income')) return 'cash-plus';
  if (pathStr.includes('budget')) return 'wallet';
  if (pathStr.includes('category')) return 'tag';
  if (pathStr.includes('debt')) return 'account-cash';
  return 'sync-alert';
};

const getMethodLabel = (method: string): string => {
  switch (method) {
    case 'POST':
      return 'Dodawanie';
    case 'PUT':
    case 'PATCH':
      return 'Aktualizacja';
    case 'DELETE':
      return 'Usuwanie';
    default:
      return method;
  }
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface FailedSyncItemProps {
  operation: SyncOperation;
  error?: string;
  onRetry: () => void;
  onDiscard: () => void;
}

const FailedSyncItem = ({
  operation,
  error,
  onRetry,
  onDiscard,
}: FailedSyncItemProps) => {
  const t = useAppTheme();
  const typeLabel = getOperationTypeLabel(operation.path);
  const icon = getOperationIcon(operation.path);
  const methodLabel = getMethodLabel(operation.method);

  return (
    <Card style={styles.card} mode="outlined">
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <IconButton icon={icon} size={24} iconColor={t.colors.error} />
        </View>
        <View style={styles.infoContainer}>
          <Text variant="titleSmall" style={{color: t.colors.onSurface}}>
            {typeLabel}
          </Text>
          <Text variant="bodySmall" style={{color: t.colors.onSurfaceVariant}}>
            {methodLabel} - {formatDate(operation.timestamp)}
          </Text>
          {error && (
            <Text
              variant="bodySmall"
              style={{color: t.colors.error, marginTop: 4}}
              numberOfLines={2}
            >
              {error}
            </Text>
          )}
        </View>
        <View style={styles.actionsContainer}>
          <IconButton
            icon="refresh"
            size={20}
            iconColor={t.colors.primary}
            onPress={onRetry}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor={t.colors.error}
            onPress={onDiscard}
          />
        </View>
      </View>
    </Card>
  );
};

const FailedSyncList = () => {
  const dispatch = useAppDispatch();
  const failedOperations = useAppSelector(selectFailedOperations);
  const syncErrors = useAppSelector(state => state.sync.syncErrors);
  const t = useAppTheme();

  if (failedOperations.length === 0) return null;

  const handleRetry = (operationId: string) => {
    dispatch(retryOperation(operationId));
  };

  const handleDiscard = (operationId: string) => {
    dispatch(discardOperation(operationId));
  };

  const handleRetryAll = () => {
    dispatch(retryAllFailed());
  };

  const handleDiscardAll = () => {
    dispatch(discardAllFailed());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <IconButton icon="sync-alert" iconColor={t.colors.error} size={20} />
          <Text variant="titleMedium" style={{color: t.colors.error}}>
            Niezsynchronizowane ({failedOperations.length})
          </Text>
        </View>
      </View>

      {failedOperations.map(operation => (
        <FailedSyncItem
          key={operation.id}
          operation={operation}
          error={syncErrors[operation.id]}
          onRetry={() => handleRetry(operation.id)}
          onDiscard={() => handleDiscard(operation.id)}
        />
      ))}

      <View style={styles.bulkActions}>
        <Button
          mode="outlined"
          onPress={handleRetryAll}
          icon="refresh"
          compact
          style={styles.bulkButton}
        >
          Ponów wszystkie
        </Button>
        <Button
          mode="outlined"
          onPress={handleDiscardAll}
          icon="delete"
          compact
          textColor={t.colors.error}
          style={[styles.bulkButton, {borderColor: t.colors.error}]}
        >
          Usuń wszystkie
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  iconContainer: {
    marginRight: 4,
  },
  infoContainer: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bulkButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default FailedSyncList;
