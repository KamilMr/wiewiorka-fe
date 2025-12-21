import {TouchableOpacity, View, StyleSheet} from 'react-native';

import {Avatar, Card, IconButton} from 'react-native-paper';
import {Text} from '@/components';
import {formatPrice} from '@/common';
import {selectComparison} from '@/redux/main/selectors';
import {useAppSelector} from '@/hooks';
import {format} from 'date-fns';
import {router} from 'expo-router';

interface SummaryCard_v2Props {
  date?: string;
}

const SummaryCard_v2 = (props: SummaryCard_v2Props) => {
  const summary = useAppSelector(state => selectComparison(state, 1));
  const date = props.date
    ? format(new Date(props.date), 'MM/yyyy')
    : format(new Date(), 'MM/yyyy');

  const filteredSummary = summary.find(item => item.date === date) || {
    income: 0,
    outcome: 0,
  };

  return (
    <Card style={styles.root}>
      <Card.Title title={date} />
      <Card.Content style={{padding: 8}}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => {
              router.navigate({
                pathname: '/income-summary',
                params: {date: date.split('/').reverse().join('-') + '-01'},
              });
            }}
            style={styles.buttonContainer}
          >
            <View
              style={[
                styles.buttonContent,
                {backgroundColor: 'rgba(0, 255, 0, 0.1)'},
              ]}
            >
              <IconButton icon="arrow-down" iconColor="green" />
              <View>
                <Text>Wpłynęło</Text>
                <Text>{`${formatPrice(filteredSummary?.income)}`}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.navigate({
                pathname: '/summary/chart-details',
                params: {date: date.split('/').reverse().join('-') + '-01'},
              });
            }}
            style={styles.buttonContainer}
          >
            <View
              style={[
                styles.buttonContent,
                {backgroundColor: 'rgba(255, 0, 0, 0.1)'},
              ]}
            >
              <IconButton icon="arrow-up" iconColor="red" />
              <View>
                <Text>Wydano</Text>
                <Text>{`${formatPrice(filteredSummary?.outcome)}`}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: {
    margin: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  buttonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '48%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
});

export default SummaryCard_v2;
