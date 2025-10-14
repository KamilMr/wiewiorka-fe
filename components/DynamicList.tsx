import {
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import _ from 'lodash';

import {CircleIcon} from './Icons';
import {IconButton, Text} from '@/components';
import {format as formatDate} from 'date-fns';
import {sizes, useAppTheme} from '@/constants/theme';

interface SelExpense {
  id: number;
  description: string;
  exp: boolean;
  color: string;
  category: string;
  price: string;
  owner: string;
  source: string;
  date: string;
  image: string;
  tags?: Array<{id: string; name: string}>;
}

interface Props {
  handleNavigate?: (
    number: number,
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

// TODO: Consider using flat list

const isUnsynced = (id: number): boolean => {
  return String(id).startsWith('f_');
};

export default function DynamicRecordList({
  records,
  handleScroll = () => {},
  handleNavigate = () => () => {},
}: Props) {
  const t = useAppTheme();
  return (
    <ScrollView onScroll={handleScroll}>
      {_.keys(records).map(dateKey => (
        <View key={dateKey} style={{marginBottom: sizes.xxl}}>
          <Text variant="bodyLarge">
            {dateKey === formatDate(new Date(), 'dd/MM/yyyy')
              ? 'dziś'
              : dateKey}
          </Text>

          {records[dateKey].map((exp: SelExpense) => (
            <View
              style={styles.row}
              key={exp.id}
              onTouchEnd={handleNavigate(exp.id, exp.exp)}
            >
              <CircleIcon
                fillOuter={exp.exp ? exp.color : t.colors.softLavender}
                fillInner={exp.exp ? t.colors.white : t.colors.softLavender}
              />

              {/* Description */}
              <View style={{flex: 1, marginLeft: sizes.lg}}>
                <Text variant="bodyMedium">{exp.description}</Text>
                <Text variant="bodySmall" style={{color: t.colors.secondary}}>
                  {`${exp.category || exp.source || 'Nieznana'}${exp.tags?.some(tag => tag.name === 'urlop') ? ' 🏖️' : ''}`}
                </Text>
              </View>

              {/* Price */}
              <View style={{alignItems: 'flex-end', position: 'relative'}}>
                {isUnsynced(exp.id) && (
                  <IconButton
                    icon="sync-off"
                    size={16}
                    iconColor="#FF8C00"
                    style={{
                      marginLeft: sizes.sm,
                      position: 'absolute',
                      right: -15,
                      top: -30,
                    }}
                  />
                )}
                <View style={styles.priceRow}>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: exp.exp ? t.colors.deepMaroon : t.colors.primary,
                    }}
                  >
                    {exp.price + ' zł'}
                  </Text>
                </View>
                <Text
                  variant="bodySmall"
                  style={{textAlign: 'right', color: t.colors.secondary}}
                >
                  {exp.owner}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      <View style={{height: 80}}></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.xl,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: sizes.xl,
  },
  vacationChip: {
    marginTop: sizes.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  vacationChipText: {
    fontSize: 11,
  },
});
