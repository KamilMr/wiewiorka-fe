import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Card, Chip, Divider, Text} from 'react-native-paper';

import {useAppDispatch, useAppSelector} from '@/hooks';
import {
  clearSyncLogs,
  discardOperation,
  selectOperations,
  selectSyncLogs,
} from '@/redux/sync/syncSlice';
import {useAppTheme} from '@/constants/theme';
import {SyncLogEntry, SyncOperation} from '@/types';

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const levelColor = (level: SyncLogEntry['level']) => {
  switch (level) {
    case 'success':
      return '#28A745';
    case 'warning':
      return '#FFA500';
    case 'error':
      return '#DC3545';
    default:
      return '#17A2B8';
  }
};

const safeJson = (value: unknown) => {
  if (!value) return null;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const OperationCard = ({
  operation,
  error,
  onDelete,
}: {
  operation: SyncOperation;
  error?: string;
  onDelete: () => void;
}) => {
  const payload = safeJson(operation.data);

  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content>
        <View style={styles.rowBetween}>
          <Text variant="titleSmall">
            {operation.method} {operation.path.join('/')}
          </Text>
          <Chip compact>{operation.status}</Chip>
        </View>
        <Text variant="bodySmall">ID: {operation.id}</Text>
        <Text variant="bodySmall">
          Created: {formatDate(operation.timestamp)}
        </Text>
        <Text variant="bodySmall">Retries: {operation.retryCount}</Text>
        {operation.frontendId && (
          <Text variant="bodySmall">Frontend ID: {operation.frontendId}</Text>
        )}
        {error && (
          <Text variant="bodySmall" style={styles.errorText}>
            Error: {error}
          </Text>
        )}
        {payload && (
          <Text variant="bodySmall" style={styles.payload} numberOfLines={8}>
            {payload}
          </Text>
        )}
        {operation.status === 'failed' && (
          <Button
            compact
            mode="outlined"
            textColor="#DC3545"
            style={styles.deleteButton}
            onPress={onDelete}
          >
            Delete from queue
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const LogRow = ({log}: {log: SyncLogEntry}) => (
  <View style={styles.logRow}>
    <View style={[styles.levelDot, {backgroundColor: levelColor(log.level)}]} />
    <View style={styles.logContent}>
      <View style={styles.rowBetween}>
        <Text variant="labelSmall" style={{color: levelColor(log.level)}}>
          {log.level.toUpperCase()}
        </Text>
        <Text variant="labelSmall">{formatDate(log.timestamp)}</Text>
      </View>
      <Text variant="bodySmall">{log.message}</Text>
      {!!log.error && (
        <Text variant="bodySmall" style={styles.errorText}>
          {log.error}
        </Text>
      )}
      {!!log.operationId && (
        <Text variant="labelSmall" style={styles.metaText}>
          {log.operationId} · {log.method} {log.path?.join('/')}
        </Text>
      )}
    </View>
  </View>
);

const SyncLogsPage = () => {
  const t = useAppTheme();
  const dispatch = useAppDispatch();
  const operations = useAppSelector(selectOperations);
  const logs = useAppSelector(selectSyncLogs);
  const syncErrors = useAppSelector(state => state.sync.syncErrors || {});

  return (
    <ScrollView
      style={{backgroundColor: t.colors.white}}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text variant="titleMedium">
          Queued operations ({operations.length})
        </Text>
        <Text variant="bodySmall">Last {logs.length}/100 sync log entries</Text>
      </View>

      {operations.length === 0 ? (
        <Text variant="bodyMedium" style={styles.emptyText}>
          No queued sync operations.
        </Text>
      ) : (
        operations.map(operation => (
          <OperationCard
            key={operation.id}
            operation={operation}
            error={syncErrors[operation.id]}
            onDelete={() => dispatch(discardOperation(operation.id))}
          />
        ))
      )}

      <Divider style={styles.divider} />

      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Sync logs</Text>
        <Button
          compact
          mode="outlined"
          onPress={() => dispatch(clearSyncLogs())}
        >
          Clear
        </Button>
      </View>

      {logs.length === 0 ? (
        <Text variant="bodyMedium" style={styles.emptyText}>
          No sync logs yet.
        </Text>
      ) : (
        logs.map(log => <LogRow key={log.id} log={log} />)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  card: {
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#DC3545',
    marginTop: 6,
  },
  payload: {
    backgroundColor: '#F5F5F5',
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  logRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 10,
  },
  logContent: {
    flex: 1,
  },
  metaText: {
    marginTop: 4,
    color: '#666',
  },
  emptyText: {
    color: '#666',
    marginVertical: 12,
  },
});

export default SyncLogsPage;
