import React from 'react';
import {
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import _ from 'lodash';
import {format as formatDate, isToday, isYesterday, parse} from 'date-fns';
import {pl} from 'date-fns/locale';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import {IconButton, Text} from '@/components';
import WarmCard from '@/components/warm/WarmCard';
import WarmIconChip from '@/components/warm/WarmIconChip';
import WarmSectionHeader from '@/components/warm/WarmSectionHeader';
import {warmColors} from '@/constants/warmTheme';

interface SelExpense {
  id: number | string;
  description: string;
  exp: boolean;
  color: string;
  category: string;
  price: string | number;
  owner: string;
  source?: string;
  date: string;
  image?: string;
  tags?: Array<{id: string; name: string}> | string[];
}

interface Props {
  handleNavigate?: (
    id: number,
    exp: boolean,
  ) => (event: GestureResponderEvent) => void;
  handleScroll?: ({
    nativeEvent,
  }: {
    nativeEvent: NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'];
  }) => void;
  records: {
    [key: string]: SelExpense[];
  };
}

const isUnsynced = (id: number | string): boolean => {
  return String(id).startsWith('f_');
};

const hasHoliday = (tags?: SelExpense['tags']) => {
  if (!tags) return false;
  return (tags as any[]).some(tag =>
    typeof tag === 'string' ? tag === 'urlop' : tag?.name === 'urlop',
  );
};

const hexWithAlpha = (hex: string, alpha: number) => {
  if (!hex) return 'rgba(180, 83, 9, 0.15)';
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(180, 83, 9, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatGroupLabel = (dateKey: string) => {
  const d = parse(dateKey, 'dd/MM/yyyy', new Date());
  if (isToday(d)) return `Dziś, ${formatDate(d, 'dd MMM', {locale: pl})}`;
  if (isYesterday(d)) return `Wczoraj, ${formatDate(d, 'dd MMM', {locale: pl})}`;
  return formatDate(d, 'EEEE, dd MMM', {locale: pl});
};

const formatPrice = (price: string | number) => {
  const n = typeof price === 'number' ? price : parseFloat(String(price));
  if (!isFinite(n)) return String(price);
  return `${n.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
};

export default function DynamicRecordList({
  records,
  handleScroll = () => {},
  handleNavigate = () => () => {},
}: Props) {
  return (
    <ScrollView onScroll={handleScroll} scrollEnabled={false}>
      {_.keys(records).map(dateKey => (
        <View key={dateKey} style={styles.group}>
          <WarmSectionHeader label={formatGroupLabel(dateKey)} />

          <WarmCard variant="glass" padded={false}>
            {records[dateKey].map((exp, idx) => {
              const isLast = idx === records[dateKey].length - 1;
              const amount = `${exp.exp ? '-' : '+'}${formatPrice(exp.price)}`;
              const amountColor = exp.exp ? warmColors.danger : warmColors.success;
              const chipBg = exp.exp
                ? hexWithAlpha(exp.color, 0.18)
                : warmColors.successBackground;
              const chipIconColor = exp.exp
                ? exp.color || warmColors.primary
                : warmColors.success;
              return (
                <Pressable
                  key={exp.id}
                  onPress={handleNavigate(exp.id as number, exp.exp)}
                  style={({pressed}) => [
                    styles.row,
                    !isLast && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <WarmIconChip
                    icon={exp.exp ? 'tag' : 'arrow-down'}
                    background={chipBg}
                    color={chipIconColor}
                  />
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {exp.description || exp.category || 'Brak opisu'}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {`${exp.category || exp.source || 'Nieznana'}${
                        hasHoliday(exp.tags) ? ' 🏖️' : ''
                      }${exp.owner ? ` • ${exp.owner}` : ''}`}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    {isUnsynced(exp.id) && (
                      <IconButton
                        icon="sync-off"
                        size={14}
                        iconColor="#FF8C00"
                        style={styles.syncIcon}
                      />
                    )}
                    <Text style={[styles.amount, {color: amountColor}]}>
                      {amount}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </WarmCard>
        </View>
      ))}
      <View style={{height: 80}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: warmColors.cardBorder,
  },
  rowPressed: {
    backgroundColor: warmColors.muted,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: warmColors.foreground,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    color: warmColors.mutedForeground,
  },
  rowRight: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  syncIcon: {
    position: 'absolute',
    right: -8,
    top: -22,
    margin: 0,
  },
});
