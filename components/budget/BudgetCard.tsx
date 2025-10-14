import {Card, ProgressBar, IconButton} from 'react-native-paper';
import {StyleSheet, View, ScrollView} from 'react-native';
import {useState} from 'react';
import {router} from 'expo-router';

import Text from '../CustomText';
import Menu from '../Menu';
import {sizes, useAppTheme} from '@/constants/theme';
import {formatPrice} from '@/common';
import {BudgetCardProps} from '@/utils/types';

export default function BudgetCard({items = [], date}: BudgetCardProps) {
  const t = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  // three stages of color based of percentage
  const getColor = (percentage: number) => {
    if (percentage > 0.9) {
      return t.colors.error;
    } else {
      return t.colors.primary;
    }
  };

  const calculateProgress = (amount: number, allocated: number = 0) => {
    if (Number.isNaN(amount) || Number.isNaN(allocated)) return 0;
    const progress = amount / allocated;

    return Number.isFinite(progress) ? Math.min(progress, 1) : 0;
  };

  const [yy, mm] = date.split('-');

  // Calculate dynamic height based on number of items
  // Each item takes roughly 60px, with some padding
  const calculateCardHeight = () => {
    const itemHeight = 60;
    const headerHeight = 56;
    const minHeight = 200;
    const maxHeight = 400;

    const calculatedHeight = items.length * itemHeight + headerHeight;
    return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title={`Budżet ${mm}-${yy}`}
        right={props => (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            closeMenu={() => setMenuVisible(false)}
            anchor={
              <IconButton
                {...props}
                icon="dots-vertical"
                disabled={true}
                onPress={() => setMenuVisible(true)}
              />
            }
            items={[
              {
                title: 'Dodaj nowy budżet',
                onPress: () => {
                  setMenuVisible(false);
                  router.push({
                    pathname: '/budget/create-budget',
                    params: {date},
                  });
                },
              },
            ]}
          />
        )}
      />
      <Card.Content style={{paddingBottom: 0}}>
        <ScrollView
          style={[styles.scrollView, {maxHeight: calculateCardHeight() - 56}]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {items.map(item => (
            <View key={item.id} style={styles.mainContentBox}>
              {/* Top box */}
              <View style={styles.mainInnerBox}>
                {/* Left side */}
                <View>
                  <Text variant="titleMedium">{item.budgetedName}</Text>
                  <Text variant="bodySmall">{formatPrice(item.amount)}</Text>
                </View>

                {/* Right side */}
                <View>
                  <Text variant="titleMedium">
                    {formatPrice(item.allocated)}
                  </Text>
                </View>
              </View>

              {/* Bottom box slider */}
              <View>
                <ProgressBar
                  progress={calculateProgress(
                    +item.amount,
                    +item.allocated || 0,
                  )}
                  color={getColor(
                    calculateProgress(+item.amount, +item.allocated || 0),
                  )}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: sizes.md,
  },
  scrollView: {
    flexGrow: 1,
  },
  mainContentBox: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginVertical: sizes.sm,
    paddingHorizontal: sizes.xs,
  },
  mainInnerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.xs,
  },
});
