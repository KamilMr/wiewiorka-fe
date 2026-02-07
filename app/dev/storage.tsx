import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, Divider} from 'react-native-paper';
import {useAppTheme} from '@/constants/theme';
import StorageFab from '@/components/storage/StorageFab';
import SwipeToAdd from '@/components/storage/SwipeToAdd';

const mockItems = [
  {id: '1', name: 'Ziemniaki', itemNumber: 1, unit: 'kg'},
  {id: '2', name: 'Masło', itemNumber: 2, unit: 'szt'},
  {id: '3', name: 'Oregano', itemNumber: 1, unit: 'szt'},
];

const StorageDevPage = () => {
  const t = useAppTheme();
  const [shopListCount, setShopListCount] = useState(0);

  const handleAddToShopList = (name: string) => {
    setShopListCount(prev => prev + 1);
    console.log(`Added ${name} to shopping list`);
  };

  return (
    <View style={[styles.root, {backgroundColor: t.colors.background}]}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Swipe right to add to shopping list
      </Text>

      {mockItems.map(item => (
        <SwipeToAdd key={item.id} onAdd={() => handleAddToShopList(item.name)}>
          <View
            style={[styles.itemRow, {backgroundColor: t.colors.surface}]}
          >
            <Text variant="bodyLarge">{item.name}</Text>
            <Text variant="bodyMedium" style={{color: t.colors.textSecondary}}>
              {item.itemNumber} {item.unit}
            </Text>
          </View>
          <Divider />
        </SwipeToAdd>
      ))}

      <StorageFab
        count={shopListCount}
        icon="cart"
        onPress={() => console.log('Navigate to shopping list')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});

export default StorageDevPage;
