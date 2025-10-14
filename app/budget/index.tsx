import {Button, Text, Select} from '@/components';
import {sizes} from '@/constants/theme';
import {useAppSelector, useAppDispatch} from '@/hooks';
import {selectBudgets} from '@/redux/main/selectors';
import {updateBudgetItem, deleteBudget} from '@/redux/main/thunks';
import {addMonths, format} from 'date-fns';
import {router} from 'expo-router';

import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  IconButton,
  Dialog,
  Portal,
  Paragraph,
  Caption,
  Divider,
  TextInput as PaperTextInput,
  useTheme,
  Surface,
} from 'react-native-paper';
import {useState} from 'react';
import formatDateTz, {timeFormats} from '@/utils/formatTimeTz';
import {parseInt} from 'lodash';

interface BudgetProps {}

const SelectDate = ({
  onSelect,
  selectedDate,
}: {
  onSelect: Function;
  selectedDate: string;
}) => {
  const budgets = useAppSelector(state => state.main.budgets);
  const uniqueDates = [
    ...new Set(
      budgets
        .map(budget => budget.yearMonth)
        .concat([
          format(new Date(), 'yyyy-MM-dd'),
          format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        ])
        .map(d => {
          const [y, m] = d.split('-');
          return [y, m, '01'].join('-');
        }),
    ),
  ].filter(Boolean);

  const monthNames = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
  ];

  const dateOptions = uniqueDates
    .map(date => {
      const [year, month] = date.split('-');
      const displayDate = `${monthNames[parseInt(month) - 1]} ${year}`;
      return {
        label: displayDate,
        value: `${year}-${month}-01`,
      };
    })
    .sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());

  return (
    <View style={styles.dateSelector}>
      <Select
        items={dateOptions}
        value={selectedDate}
        onChange={item => onSelect(item.value)}
        placeholder="Wybierz miesiąc"
      />
    </View>
  );
};

const BasicList = ({date}: {date: string}) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const items = useAppSelector(selectBudgets(date));
  const [editingId, setEditingId] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState('');
  const [editedValues, setEditedValues] = useState<{
    [key: string]: {allocated: number};
  }>({});

  const handleEdit = (id: string) => {
    setEditingId(id);
    const item = items.find(item => item.id === id);
    if (item) setEditedValues({[id]: {allocated: item.allocated}});
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    dispatch(deleteBudget({id: itemToDelete}));
    setDeleteDialogVisible(false);
    setItemToDelete('');
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setItemToDelete('');
  };

  const handleSave = (id: string) => {
    const changedKeys = editedValues[id];
    if (changedKeys && Object.keys(changedKeys).length > 0) {
      const changes: {amount?: number} = {};
      // Convert string values to appropriate types
      if (changedKeys.allocated) changes.amount = changedKeys.allocated;

      dispatch(updateBudgetItem({id, changes}));
    }
    setEditingId('');
    setEditedValues(prev => {
      const newState = {...prev};
      delete newState[id];

      return newState;
    });
  };

  const handleCancel = () => {
    setEditingId('');
    setEditedValues(prev => {
      const newState = {...prev};
      delete newState[editingId];
      return newState;
    });
  };

  const updateValue = (id: string, key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: +value,
      },
    }));
  };

  return (
    <View style={{flex: 1}}>
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={cancelDelete}>
          <Dialog.Title>Potwierdź usunięcie</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Czy na pewno chcesz usunąć ten budżet?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>Anuluj</Button>
            <Button onPress={confirmDelete}>Usuń</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {items.length ? (
        <>
          <View style={styles.updateButtonContainer}>
            <Button
              onPress={() =>
                router.push({
                  pathname: '/budget/update-budget',
                  params: {date},
                })
              }
            >
              Zmień budżet
            </Button>
          </View>
          {items.map((item, index) => (
            <View key={item.id}>
              <Card style={styles.budgetCard} elevation={1}>
                <Card.Content>
                  <View style={styles.budgetCardContent}>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetName}>{item.budgetedName}</Text>
                      {editingId === item.id ? (
                        <PaperTextInput
                          mode="outlined"
                          dense
                          style={styles.editInput}
                          value={
                            editedValues[item.id]?.allocated.toString() ||
                            item.allocated.toString()
                          }
                          onChangeText={value =>
                            updateValue(item.id, 'allocated', value)
                          }
                          keyboardType="numeric"
                          label="Ulokowano"
                        />
                      ) : (
                        <Caption style={styles.allocatedText}>
                          Ulokowano: {item.allocated} zł | Wydano:{' '}
                          {Math.floor(item.amount)} zł
                        </Caption>
                      )}
                    </View>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon={editingId === item.id ? 'check' : 'pencil'}
                        size={20}
                        onPress={() =>
                          editingId === item.id
                            ? handleSave(item.id)
                            : handleEdit(item.id)
                        }
                      />
                      <IconButton
                        icon={editingId === item.id ? 'close' : 'delete'}
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={
                          editingId === item.id
                            ? handleCancel
                            : () => handleDelete(item.id)
                        }
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
              {index < items.length - 1 && <Divider />}
            </View>
          ))}
        </>
      ) : (
        <Surface style={styles.emptyContainer} elevation={0}>
          <Button
            mode="contained"
            onPress={() =>
              router.push({
                pathname: '/budget/create-budget',
                params: {date},
              })
            }
          >
            Dodaj Budżet
          </Button>
        </Surface>
      )}
    </View>
  );
};

const BudgetList = () => {
  const [currentDate, setCurrentDate] = useState(
    formatDateTz({pattern: timeFormats.dateOnly})
      .split('/')
      .reverse()
      .slice(0, 2)
      .concat(['01'])
      .join('-'),
  );

  return (
    <View style={styles.budgetListContainer}>
      <SelectDate
        onSelect={(d: string) => setCurrentDate(d)}
        selectedDate={currentDate}
      />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{flexGrow: 1}}
        showsVerticalScrollIndicator={true}
      >
        <BasicList date={currentDate} />
      </ScrollView>
    </View>
  );
};

export default function Page({}: BudgetProps) {
  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: 'white', paddingBottom: 80}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BudgetList />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dateSelector: {
    paddingVertical: sizes.sm,
  },
  budgetCard: {
    marginVertical: sizes.xs,
    marginHorizontal: sizes.sm,
  },
  budgetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetInfo: {
    flex: 1,
    marginRight: sizes.sm,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: sizes.xs,
  },
  allocatedText: {
    marginTop: sizes.xs,
  },
  editInput: {
    marginTop: sizes.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetListContainer: {
    flex: 1,
    padding: sizes.md,
  },
  scrollContainer: {
    flex: 1,
    marginTop: sizes.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  updateButtonContainer: {
    paddingVertical: sizes.sm,
    paddingHorizontal: sizes.md,
    alignItems: 'flex-end',
  },
});
