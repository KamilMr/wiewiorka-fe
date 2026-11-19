import React from 'react';
import {
  GestureResponderEvent,
  Image,
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
import {IconButton, Text} from '@/components';
import WarmCard from '@/components/warm/WarmCard';
import WarmIconChip from '@/components/warm/WarmIconChip';
import WarmSectionHeader from '@/components/warm/WarmSectionHeader';
import {warmColors, warmShadow} from '@/constants/warmTheme';
import {formatPrice} from '@/common';

interface SelExpense {
  id: number | string;
  description: string;
  exp: boolean;
  color: string;
  category: string;
  price: string | number;
  owner: string;
  ownerId?: number | string;
  source?: string;
  date: string;
  image?: string;
  tags?: {id: string; name: string}[] | string[];
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
  scrollEnabled?: boolean;
  ownerAvatar?: {
    id?: number | string;
    name?: string;
    avatarUrl?: string | null;
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
  if (!hex) return warmColors.decorPrimary;
  const h = hex.replace('#', '');
  if (h.length !== 6) return warmColors.decorPrimary;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getOwnerInitials = (owner?: string) => {
  const names = owner?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!names.length) return '?';
  return `${names[0][0]}${
    names.length > 1 ? names[names.length - 1][0] : ''
  }`.toUpperCase();
};

const isCurrentOwner = (
  record: SelExpense,
  ownerAvatar: Props['ownerAvatar'],
) => {
  if (!ownerAvatar) return false;
  if (record.ownerId !== undefined && record.ownerId !== null) {
    return String(record.ownerId) === String(ownerAvatar.id);
  }

  const recordOwner = record.owner?.trim().replace(/\s+/g, ' ');
  const currentOwner = ownerAvatar.name?.trim().replace(/\s+/g, ' ');
  return Boolean(recordOwner && currentOwner && recordOwner === currentOwner);
};

const OwnerAvatar = ({
  owner,
  imageUrl,
}: {
  owner?: string;
  imageUrl?: string | null;
}) => {
  const [imageError, setImageError] = React.useState(false);
  const showImage = Boolean(imageUrl) && !imageError;

  React.useEffect(() => setImageError(false), [imageUrl]);

  return (
    <View style={styles.ownerAvatarPosition}>
      <View style={styles.ownerAvatar}>
        {showImage ? (
          <Image
            source={{uri: imageUrl!}}
            resizeMode="cover"
            style={styles.ownerAvatarImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <Text style={styles.ownerAvatarInitials}>
            {getOwnerInitials(owner)}
          </Text>
        )}
      </View>
    </View>
  );
};

const formatGroupLabel = (dateKey: string) => {
  const d = parse(dateKey, 'dd/MM/yyyy', new Date());
  if (isToday(d)) return `Dziś, ${formatDate(d, 'dd MMM', {locale: pl})}`;
  if (isYesterday(d))
    return `Wczoraj, ${formatDate(d, 'dd MMM', {locale: pl})}`;
  return formatDate(d, 'EEEE, dd MMM', {locale: pl});
};

export default function DynamicRecordList({
  records,
  handleScroll = () => {},
  handleNavigate = () => () => {},
  scrollEnabled = true,
  ownerAvatar,
}: Props) {
  return (
    <ScrollView onScroll={handleScroll} scrollEnabled={scrollEnabled}>
      {_.keys(records).map(dateKey => (
        <View key={dateKey} style={styles.group}>
          <WarmSectionHeader
            label={
              records[dateKey].length < 2
                ? formatGroupLabel(dateKey)
                : `${formatGroupLabel(dateKey)} • wydano ${formatPrice(
                    records[dateKey].reduce((sum, item) => {
                      if (!item.exp) return sum;
                      const price = Number(item.price);
                      return sum + (Number.isFinite(price) ? price : 0);
                    }, 0),
                  )}`
            }
          />

          <WarmCard variant="glass" padded={false}>
            {records[dateKey].map((exp, idx) => {
              const isLast = idx === records[dateKey].length - 1;
              const amount = `${exp.exp ? '-' : '+'}${formatPrice(
                Math.abs(Number(exp.price)),
                {roundUp: false},
              )}`;
              const amountColor = exp.exp
                ? warmColors.danger
                : warmColors.success;
              const chipBg = exp.exp
                ? hexWithAlpha(exp.color || warmColors.primary, 0.22)
                : warmColors.successBackground;
              const chipIconColor = exp.exp
                ? warmColors.primary
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
                  <View style={styles.categoryIcon}>
                    <WarmIconChip
                      icon={exp.exp ? 'tag' : 'arrow-down'}
                      background={chipBg}
                      color={chipIconColor}
                    />
                    {ownerAvatar && (
                      <OwnerAvatar
                        owner={exp.owner}
                        imageUrl={
                          isCurrentOwner(exp, ownerAvatar)
                            ? ownerAvatar.avatarUrl
                            : null
                        }
                      />
                    )}
                  </View>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {exp.description || exp.category || 'Brak opisu'}
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {`${exp.category || exp.source || (exp.exp ? 'Bez kategorii' : 'Nieznana')}${
                        hasHoliday(exp.tags) ? ' 🏖️' : ''
                      }${!ownerAvatar && exp.owner ? ` • ${exp.owner}` : ''}`}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    {isUnsynced(exp.id) && (
                      <IconButton
                        icon="sync-off"
                        size={14}
                        iconColor={warmColors.primary}
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
  categoryIcon: {
    position: 'relative',
  },
  ownerAvatarPosition: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    elevation: 2,
    ...warmShadow.sm,
  },
  ownerAvatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: warmColors.background,
    borderRadius: 9,
    backgroundColor: warmColors.cardSolid,
  },
  ownerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  ownerAvatarInitials: {
    fontSize: 8,
    fontWeight: '700',
    color: warmColors.foreground,
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
