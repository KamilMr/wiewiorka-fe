import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button, Icon, Text} from 'react-native-paper';

import WarmCard from '@/components/warm/WarmCard';
import {warmColors, warmRadius} from '@/constants/warmTheme';

import {useAppDispatch, useAppSelector} from '@/hooks';
import {
  selectFailedOperations,
  retryOperation,
  discardOperation,
  retryAllFailed,
  discardAllFailed,
} from '@/redux/sync/syncSlice';
import {SyncOperation} from '@/types';

const getOperationTypeLabel = (path: string[]): string => {
  const pathStr = path.join('/').toLowerCase();
  if (pathStr.includes('expenses')) return 'Wydatek';
  if (pathStr.includes('income-plan')) return 'Planowany przychód';
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
  if (pathStr.includes('income-plan')) return 'calendar-cash';
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
  const typeLabel = getOperationTypeLabel(operation.path);
  const icon = getOperationIcon(operation.path);
  const methodLabel = getMethodLabel(operation.method);

  return (
    <WarmCard variant="solid" padded={false} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.detailsRow}>
          <View style={styles.iconContainer}>
            <Icon source={icon} size={22} color={warmColors.destructive} />
          </View>
          <View style={styles.infoContainer}>
            <Text variant="titleSmall" style={styles.itemTitle}>
              {typeLabel}
            </Text>
            <Text variant="bodySmall" style={styles.itemMeta}>
              {methodLabel} - {formatDate(operation.timestamp)}
            </Text>
            {error && (
              <Text
                variant="bodySmall"
                style={styles.errorText}
                numberOfLines={2}
              >
                {error}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={onRetry}
            icon="refresh"
            compact
            buttonColor={warmColors.primary}
            textColor={warmColors.primaryForeground}
            style={styles.retryButton}
            contentStyle={styles.buttonContent}
          >
            Ponów
          </Button>
          <Button
            mode="outlined"
            onPress={onDiscard}
            icon="delete"
            compact
            textColor={warmColors.destructive}
            style={styles.discardButton}
            contentStyle={styles.buttonContent}
          >
            Usuń
          </Button>
        </View>
      </View>
    </WarmCard>
  );
};

const FailedSyncList = () => {
  const dispatch = useAppDispatch();
  const failedOperations = useAppSelector(selectFailedOperations);
  const syncErrors = useAppSelector(state => state.sync.syncErrors);

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
        <View style={styles.headerIcon}>
          <Icon source="sync-alert" color={warmColors.destructive} size={20} />
        </View>
        <View style={styles.headerTitle}>
          <Text variant="titleMedium" style={styles.heading}>
            Niezsynchronizowane ({failedOperations.length})
          </Text>
          <Text variant="bodySmall" style={styles.headingDescription}>
            Operacje wymagające Twojej uwagi
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
          mode="contained"
          onPress={handleRetryAll}
          icon="refresh"
          compact
          buttonColor={warmColors.primary}
          textColor={warmColors.primaryForeground}
          style={[styles.bulkButton, styles.bulkRetryButton]}
          contentStyle={styles.buttonContent}
        >
          Ponów wszystkie
        </Button>
        <Button
          mode="outlined"
          onPress={handleDiscardAll}
          icon="delete"
          compact
          textColor={warmColors.destructive}
          style={[styles.bulkButton, styles.bulkDiscardButton]}
          contentStyle={styles.buttonContent}
        >
          Usuń wszystkie
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: warmRadius.pill,
    backgroundColor: warmColors.dangerBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  heading: {
    color: warmColors.foreground,
    fontWeight: '700',
  },
  headingDescription: {
    marginTop: 2,
    color: warmColors.mutedForeground,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    marginRight: 10,
    borderRadius: warmRadius.md,
    backgroundColor: warmColors.dangerBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    paddingTop: 3,
  },
  itemTitle: {
    color: warmColors.foreground,
    fontWeight: '700',
  },
  itemMeta: {
    marginTop: 2,
    color: warmColors.mutedForeground,
  },
  errorText: {
    marginTop: 5,
    color: warmColors.destructive,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 14,
  },
  retryButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: warmRadius.lg,
  },
  discardButton: {
    flex: 1,
    borderColor: warmColors.destructive,
    borderRadius: warmRadius.lg,
  },
  buttonContent: {
    minHeight: 40,
  },
  bulkActions: {
    marginTop: 4,
  },
  bulkButton: {
    borderRadius: warmRadius.lg,
  },
  bulkRetryButton: {
    marginBottom: 10,
  },
  bulkDiscardButton: {
    borderColor: warmColors.destructive,
  },
});

export default FailedSyncList;
