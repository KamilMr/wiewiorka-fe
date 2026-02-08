import {StyleSheet, View} from 'react-native';
import {FAB, Badge} from 'react-native-paper';
import {useAppTheme} from '@/constants/theme';

interface StorageFabProps {
  count: number;
  icon: string;
  onPress: () => void;
}

const StorageFab = ({count, icon, onPress}: StorageFabProps) => {
  const t = useAppTheme();

  if (count === 0) return null;

  return (
    <View style={styles.container}>
      <FAB
        icon={icon}
        onPress={onPress}
        style={[styles.fab, {backgroundColor: t.colors.primary}]}
        color={t.colors.onPrimary}
        size="medium"
      />
      <Badge style={styles.badge}>{count}</Badge>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  fab: {
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});

export default StorageFab;
