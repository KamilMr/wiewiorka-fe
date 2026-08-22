import {IconButton, ProgressBar} from 'react-native-paper';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useState} from 'react';
import {router} from 'expo-router';
import {format, startOfMonth, endOfMonth} from 'date-fns';

import Text from '../CustomText';
import Menu from '../Menu';
import WarmButton from '@/components/warm/WarmButton';
import WarmCard from '@/components/warm/WarmCard';
import {formatPrice} from '@/common';
import {warmColors, warmRadius} from '@/constants/warmTheme';
import {BudgetCardProps} from '@/utils/types';

export default function BudgetCard({items = [], date}: BudgetCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  // three stages of color based of percentage
  const getColor = (percentage: number) => {
    if (percentage > 0.9) {
      return warmColors.danger;
    } else {
      return warmColors.primary;
    }
  };

  const calculateProgress = (amount: number, allocated: number = 0) => {
    if (Number.isNaN(amount) || Number.isNaN(allocated)) return 0;
    const progress = amount / allocated;

    return Number.isFinite(progress) ? Math.min(progress, 1) : 0;
  };

  const [yy, mm] = date.split('-');

  // Calculate dynamic height based on number of items
  const calculateListHeight = () => {
    const itemHeight = 76;
    const minHeight = 152;
    const maxHeight = 344;

    return Math.min(Math.max(items.length * itemHeight, minHeight), maxHeight);
  };

  const handleBudgetItemPress = (categoryName: string) => {
    // Calculate date range for the month
    const dateObj = new Date(date);
    const startDate = startOfMonth(dateObj);
    const endDate = endOfMonth(dateObj);

    // Format dates as yyyy-MM-dd for the records screen
    const formattedStart = format(startDate, 'yyyy-MM-dd');
    const formattedEnd = format(endDate, 'yyyy-MM-dd');

    router.push({
      pathname: '/(tabs)/records',
      params: {
        category: categoryName,
        dateStart: formattedStart,
        dateEnd: formattedEnd,
      },
    });
  };

  return (
    <WarmCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Plan miesięczny</Text>
          <Text style={styles.title}>{`Budżet ${mm}-${yy}`}</Text>
        </View>
        <Menu
          visible={menuVisible}
          closeMenu={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              iconColor={warmColors.mutedForeground}
              disabled={true}
              style={styles.menuButton}
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
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Brak budżetu</Text>
          <Text style={styles.emptyText}>
            Nie masz jeszcze budżetu na ten miesiąc.
          </Text>
          <WarmButton
            label="Dodaj budżet"
            fullWidth={false}
            onPress={() => router.push('/budget')}
          />
        </View>
      ) : (
        <ScrollView
          style={[styles.scrollView, {maxHeight: calculateListHeight()}]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {items.map(item => {
            const progress = calculateProgress(
              +item.amount,
              +item.allocated || 0,
            );

            return (
              <Pressable
                key={item.id}
                onPress={() => handleBudgetItemPress(item.budgetedName)}
                style={({pressed}) => [
                  styles.budgetItem,
                  pressed && styles.pressedItem,
                ]}
              >
                <Text style={styles.budgetName}>{item.budgetedName}</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>
                    Wydano {formatPrice(item.amount)}
                  </Text>
                  <Text style={styles.limitLabel}>
                    z {formatPrice(item.allocated)}
                  </Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color={getColor(progress)}
                  style={styles.progressBar}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </WarmCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: {
    color: warmColors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: warmColors.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
  menuButton: {
    margin: 0,
  },
  scrollView: {
    flexGrow: 1,
  },
  budgetItem: {
    borderTopWidth: 1,
    borderTopColor: warmColors.cardBorder,
    borderRadius: warmRadius.md,
    paddingHorizontal: 4,
    paddingVertical: 14,
  },
  pressedItem: {
    backgroundColor: warmColors.muted,
  },
  budgetName: {
    color: warmColors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  amountLabel: {
    color: warmColors.foreground,
    fontSize: 12,
    fontWeight: '500',
  },
  limitLabel: {
    color: warmColors.mutedForeground,
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: warmRadius.pill,
    backgroundColor: warmColors.muted,
  },
  emptyState: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: warmColors.cardBorder,
    paddingTop: 28,
    paddingBottom: 12,
  },
  emptyTitle: {
    color: warmColors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: warmColors.mutedForeground,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
});
