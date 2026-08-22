import {ActivityIndicator} from 'react-native-paper';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';

import AppVersion from '@/components/AppVersion';
import {TabBarIcon} from '@/components/navigation/TabBarIcon';
import WarmCard from '@/components/warm/WarmCard';
import {warmColors, warmRadius} from '@/constants/warmTheme';
import {useAppDispatch, useAppSelector, useDev} from '@/hooks';
import {clearDevMode} from '@/redux/main/mainSlice';
import {selectStatus} from '@/redux/main/selectors';
import {fetchIni} from '@/redux/main/thunks';
import {logout} from '@/redux/auth/thunks';
import {
  selectFailedOperationsCount,
  selectOperations,
} from '@/redux/sync/syncSlice';
import {router, type Href} from 'expo-router';
import {useNetInfo} from '@react-native-community/netinfo';

const navigationTiles = [
  {label: 'Budżet', icon: 'wallet', path: '/budget'},
  {label: 'Kategorie', icon: 'list', path: '/categories'},
  {label: 'Długi', icon: 'cash-outline', path: '/debt'},
  {label: 'Spiżarnia', icon: 'cube', path: '/storage'},
] as const;

const Settings = () => {
  const dispatch = useAppDispatch();
  const fetching = useAppSelector(selectStatus);
  const operations = useAppSelector(selectOperations);
  const failedCount = useAppSelector(selectFailedOperationsCount);
  const netInfo = useNetInfo();
  const devMode = useDev();

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleFetch = async () => {
    if (fetching === 'fetching') return;
    dispatch(fetchIni());
  };

  const getReloadIconColor = () => {
    if (!netInfo.isConnected) return warmColors.mutedForeground;
    if (netInfo.isInternetReachable === false) return warmColors.primary;
    return warmColors.success;
  };

  const handleDevModeToggle = () => {
    dispatch(clearDevMode());
  };

  const handleNavigate = (path: Href) => () => router.navigate(path);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.root}
      showsVerticalScrollIndicator={false}
    >
      {__DEV__ && failedCount > 0 && (
        <TouchableOpacity onPress={handleNavigate('/failed-sync')}>
          <WarmCard style={styles.failedSyncCard}>
            <View style={styles.failedSyncContent}>
              <TabBarIcon name="sync" color={warmColors.danger} />
              <View style={styles.failedSyncText}>
                <Text style={styles.failedSyncTitle}>Niezsynchronizowane</Text>
                <Text style={styles.failedSyncSubtitle}>
                  {failedCount}{' '}
                  {failedCount === 1 ? 'operacja wymaga' : 'operacji wymaga'}{' '}
                  uwagi
                </Text>
              </View>
            </View>
            <TabBarIcon
              name="chevron-forward"
              color={warmColors.mutedForeground}
            />
          </WarmCard>
        </TouchableOpacity>
      )}

      <View style={styles.tabsContainer}>
        {navigationTiles.map(({label, icon, path}) => (
          <TouchableOpacity
            key={path}
            style={styles.tileTouchable}
            onPress={handleNavigate(path)}
          >
            <WarmCard style={styles.tabItem}>
              <TabBarIcon name={icon} color={warmColors.primary} />
              <Text style={styles.tabText}>{label}</Text>
            </WarmCard>
          </TouchableOpacity>
        ))}
        {devMode && (
          <TouchableOpacity
            style={styles.tileTouchable}
            onPress={handleNavigate('/dev')}
          >
            <WarmCard style={styles.tabItem}>
              <TabBarIcon name="bug" color={warmColors.primary} />
              <Text style={styles.tabText}>Dev</Text>
            </WarmCard>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        {fetching === 'idle' ? (
          <TouchableOpacity onPress={handleFetch} style={styles.reloadButton}>
            <View style={styles.iconContainer}>
              <TabBarIcon name="reload" color={getReloadIconColor()} />
              {operations.length > 0 && <View style={styles.badge} />}
            </View>
            <Text style={styles.reloadText}>Synchronizuj</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.reloadButton}>
            <ActivityIndicator color={warmColors.primary} />
            <Text style={styles.reloadText}>Synchronizacja...</Text>
          </View>
        )}
        {devMode && (
          <TouchableOpacity
            style={styles.devButton}
            onPress={handleDevModeToggle}
          >
            <TabBarIcon name="bug" color={warmColors.primary} />
            <Text style={styles.devButtonText}>Wyłącz tryb Dev</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <TabBarIcon name="log-out" color={warmColors.primaryForeground} />
          <Text style={styles.logoutText}>Wyloguj się</Text>
        </TouchableOpacity>
      </View>
      <AppVersion />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: warmColors.background,
  },
  root: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  failedSyncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: warmColors.dangerBackground,
    borderColor: warmColors.danger,
  },
  failedSyncContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  failedSyncText: {
    marginLeft: 12,
    flex: 1,
  },
  failedSyncTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: warmColors.destructive,
  },
  failedSyncSubtitle: {
    fontSize: 13,
    color: warmColors.foreground,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  tileTouchable: {
    width: '48%',
    marginBottom: 12,
  },
  tabItem: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  tabText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: warmColors.foreground,
  },
  actions: {
    gap: 12,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: warmRadius.lg,
    backgroundColor: warmColors.cardSolid,
    borderWidth: 1,
    borderColor: warmColors.border,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 10,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    backgroundColor: warmColors.danger,
    borderRadius: warmRadius.pill,
    borderWidth: 2,
    borderColor: warmColors.cardSolid,
  },
  reloadText: {
    fontSize: 16,
    fontWeight: '700',
    color: warmColors.foreground,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: warmRadius.lg,
    borderWidth: 1,
    borderColor: warmColors.primary,
  },
  devButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: warmColors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: warmRadius.lg,
    backgroundColor: warmColors.destructive,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: warmColors.primaryForeground,
  },
});

export default Settings;
