import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import {router} from 'expo-router';
import {TabBarIcon} from '@/components/navigation/TabBarIcon';
import {useAppTheme} from '@/constants/theme';
import {warmColors} from '@/constants/warmTheme';
import {useAppDispatch} from '@/hooks';
import {addTestFailedOperations} from '@/redux/sync/syncSlice';

const DevPage = () => {
  const t = useAppTheme();
  const dispatch = useAppDispatch();

  const handleAddTestFailedOps = () => {
    dispatch(addTestFailedOperations());
  };

  return (
    <View style={[styles.root, {backgroundColor: t.colors.background}]}>
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.cardItem}
          onPress={() => router.navigate('/dev/show-reel')}
        >
          <TabBarIcon name="film" color={t.colors.primary} />
          <Text style={[styles.cardText, {color: t.colors.primary}]}>
            Show Reel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardItem}
          onPress={() => router.navigate('/dev/dropdown')}
        >
          <TabBarIcon name="list" color={t.colors.primary} />
          <Text style={[styles.cardText, {color: t.colors.primary}]}>
            Dropdown
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardItem}
          onPress={() => router.navigate('/dev/keyboard-avoid')}
        >
          <TabBarIcon name="eye" color={t.colors.primary} />
          <Text style={[styles.cardText, {color: t.colors.primary}]}>
            Keyboard Avoid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardItem}
          onPress={() => router.navigate('/dev/storage')}
        >
          <TabBarIcon name="cube" color={t.colors.primary} />
          <Text style={[styles.cardText, {color: t.colors.primary}]}>
            Storage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardItem}
          onPress={() => router.navigate('/dev/sync-logs')}
        >
          <TabBarIcon name="document-text" color={t.colors.primary} />
          <Text style={[styles.cardText, {color: t.colors.primary}]}>
            Sync Logs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cardItem,
            {backgroundColor: warmColors.dangerBackground},
          ]}
          onPress={handleAddTestFailedOps}
        >
          <TabBarIcon name="sync" color={t.colors.destructive} />
          <Text style={[styles.cardText, {color: t.colors.destructive}]}>
            Add Failed Sync
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardItem: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: warmColors.muted,
    borderRadius: 12,
    width: '45%',
    minHeight: 100,
    justifyContent: 'center',
  },
  cardText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default DevPage;
