import {useMemo} from 'react';
import {format} from 'date-fns';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import _ from 'lodash';
import {router} from 'expo-router';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {BudgetCard, Text} from '@/components';
import DevModeToggle from '@/components/DevModeToggle';
import StatusIndicator from '@/components/StatusIndicator';
import WarmCard from '@/components/warm/WarmCard';
import {formatPrice} from '@/common';
import {warmColors, warmRadius, warmShadow} from '@/constants/warmTheme';
import {useAppSelector, usePullToRefresh} from '@/hooks';
import {selectBudgets, selectComparison} from '@/redux/main/selectors';
import {MONTHLY_SPEND_PROMPT, QUICK_CHAT_PROMPTS} from '@/utils/wiewiorkaChat';

const DASHBOARD_PROMPTS = [
  {label: QUICK_CHAT_PROMPTS[0], icon: 'plus'},
  {label: MONTHLY_SPEND_PROMPT, icon: 'chart-pie'},
  {label: QUICK_CHAT_PROMPTS[2], icon: 'piggy-bank'},
] as const;

const Home = () => {
  const now = new Date();
  const month = format(now, 'MM/yyyy');
  const monthStart = format(now, 'yyyy-MM-01');
  const name = useAppSelector(state => state.auth.name)?.trim();
  const budgetSelector = useMemo(() => selectBudgets(monthStart), [monthStart]);
  const budgets = useAppSelector(budgetSelector);
  const summary = useAppSelector(state => selectComparison(state, 1));
  const {refreshing, onRefresh} = usePullToRefresh();
  const {income, outcome} = summary.find(item => item.date === month) ?? {
    income: 0,
    outcome: 0,
  };
  const monthlySpend = formatPrice(outcome);

  const openChat = (prompt?: string) =>
    router.push({pathname: '/chat', params: prompt ? {prompt} : {}});

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={warmColors.primary}
            colors={[warmColors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>WIEWIÓRKA</Text>
            <Text style={styles.greeting}>
              {name ? `Cześć, ${name}!` : 'Cześć!'}
            </Text>
          </View>
          <DevModeToggle>
            <StatusIndicator />
          </DevModeToggle>
        </View>

        <WarmCard style={styles.hero}>
          <View style={styles.mascotWrap}>
            <Image
              source={require('../../assets/mascot/dashboard.png')}
              style={styles.mascot}
              accessibilityLabel="Wiewiórka, asystent finansowy"
            />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.spendLabel}>Wydane w tym miesiącu</Text>
            <Text style={styles.spend} numberOfLines={1} adjustsFontSizeToFit>
              {monthlySpend}
            </Text>
            <Text style={styles.heroHint}>
              Saldo: {formatPrice(income - outcome)}
            </Text>
          </View>
        </WarmCard>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Porozmawiaj z Wiewiórką"
          onPress={() => openChat()}
          style={({pressed}) => [styles.chatCta, pressed && styles.pressed]}
        >
          <View style={styles.chatIcon}>
            <FontAwesome6
              name="comment-dots"
              size={20}
              color={warmColors.primaryForeground}
            />
          </View>
          <View style={styles.chatCopy}>
            <Text style={styles.chatTitle}>Porozmawiaj z Wiewiórką</Text>
            <Text style={styles.chatSubtitle}>
              Sprawdź wydatki, budżety lub otwórz formularz.
            </Text>
          </View>
          <FontAwesome6
            name="chevron-right"
            size={14}
            color={warmColors.primaryForeground}
          />
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {DASHBOARD_PROMPTS.map(({label, icon}) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={`Wpisz w czacie: ${label}`}
              onPress={() => openChat(label)}
              style={({pressed}) => [
                styles.chip,
                pressed && styles.chipPressed,
              ]}
            >
              <FontAwesome6 name={icon} size={12} color={warmColors.primary} />
              <Text style={styles.chipText}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budżety</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zarządzaj budżetami"
            onPress={() => router.push('/budget')}
            hitSlop={8}
          >
            <Text style={styles.manage}>Zarządzaj</Text>
          </Pressable>
        </View>
        {budgets.length ? (
          <BudgetCard
            items={_.sortBy(budgets, ['budgetedName'])}
            date={monthStart}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ustaw pierwszy budżet"
            onPress={() => router.push('/budget')}
            style={({pressed}) => [
              styles.emptyBudget,
              pressed && styles.chipPressed,
            ]}
          >
            <FontAwesome6
              name="compass"
              size={17}
              color={warmColors.mutedForeground}
            />
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>Nie masz jeszcze budżetów</Text>
              <Text style={styles.emptyText}>
                Ustaw pierwszy, gdy będziesz gotowy.
              </Text>
            </View>
            <FontAwesome6
              name="chevron-right"
              size={12}
              color={warmColors.mutedForeground}
            />
          </Pressable>
        )}

        <View style={styles.secondaryActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/summary/chart-details',
                params: {date: monthStart},
              })
            }
            style={styles.secondaryAction}
          >
            <FontAwesome6
              name="chart-pie"
              size={15}
              color={warmColors.primary}
            />
            <Text style={styles.secondaryText}>Wykres wydatków</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/income-summary',
                params: {date: monthStart},
              })
            }
            style={styles.secondaryAction}
          >
            <FontAwesome6
              name="arrow-trend-up"
              size={15}
              color={warmColors.success}
            />
            <Text style={styles.secondaryText}>
              Wpływy {formatPrice(income)}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: warmColors.background},
  content: {gap: 16, padding: 20, paddingBottom: 28},
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerCopy: {flex: 1},
  eyebrow: {
    color: warmColors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  greeting: {
    color: warmColors.foreground,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 3,
  },
  hero: {alignItems: 'center', flexDirection: 'row', gap: 14},
  mascotWrap: {
    backgroundColor: warmColors.accent,
    borderRadius: warmRadius.xl,
    height: 82,
    overflow: 'hidden',
    width: 82,
  },
  mascot: {height: '100%', width: '100%'},
  heroText: {flex: 1, minWidth: 0},
  spendLabel: {
    color: warmColors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
  },
  spend: {
    color: warmColors.foreground,
    fontSize: 29,
    fontWeight: '700',
    marginTop: 2,
  },
  heroHint: {
    color: warmColors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  chatCta: {
    alignItems: 'center',
    backgroundColor: warmColors.primary,
    borderRadius: warmRadius.xxl,
    flexDirection: 'row',
    gap: 13,
    padding: 18,
    ...warmShadow.md,
  },
  pressed: {opacity: 0.88, transform: [{scale: 0.99}]},
  chatIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: warmRadius.lg,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  chatCopy: {flex: 1, minWidth: 0},
  chatTitle: {
    color: warmColors.primaryForeground,
    fontSize: 16,
    fontWeight: '700',
  },
  chatSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  chips: {gap: 8, paddingRight: 20},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 6,
    backgroundColor: warmColors.card,
    borderColor: warmColors.border,
    borderRadius: warmRadius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipPressed: {opacity: 0.7},
  chipText: {color: warmColors.foreground, fontSize: 12, fontWeight: '600'},
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: warmColors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  manage: {color: warmColors.primary, fontSize: 12, fontWeight: '700'},
  emptyBudget: {
    alignItems: 'center',
    borderColor: warmColors.border,
    borderRadius: warmRadius.xl,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  emptyCopy: {flex: 1},
  emptyTitle: {
    color: warmColors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {color: warmColors.mutedForeground, fontSize: 11, marginTop: 3},
  secondaryActions: {flexDirection: 'row', gap: 10},
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: warmColors.card,
    borderColor: warmColors.border,
    borderRadius: warmRadius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 11,
  },
  secondaryText: {
    color: warmColors.foreground,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Home;
