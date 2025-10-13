import {
  useEffect,
  useState,
  memo,
  useCallback,
  useRef,
  forwardRef,
} from 'react';
import {SafeAreaView, ScrollView, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import _, {parseInt} from 'lodash';
import {TextInput as PaperTextInput} from 'react-native-paper';

import {TextInput, ButtonWithStatus as Button, Text} from '@/components';

import {useAppDispatch, useAppSelector} from '@/hooks';
import {sizes, useAppTheme} from '@/constants/theme';
import {selectBudgets, selectCategories} from '@/redux/main/selectors';
import {createUpdateBudget} from '@/redux/main/thunks';
import {setSnackbar} from '@/redux/main/mainSlice';
import formatDateTz from '@/utils/formatTimeTz';
import {formatToDashDate} from '@/common';
import {BudgetCardItem} from '@/utils/types';

interface Subcategory {
  id: number;
  name: string;
  groupName?: string;
  color: string;
  groupId: number;
}

interface CategoryInputProps {
  category: Subcategory;
  value: string;
  onChangeText: (categoryName: string, text: string) => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
  containerRef?: (ref: View | null) => void;
}

const CategoryInput = memo(
  forwardRef<any, CategoryInputProps>(
    (
      {
        category,
        value,
        onChangeText,
        onSubmitEditing,
        returnKeyType = 'next',
        containerRef,
      },
      ref,
    ) => {
      const handleChange = useCallback(
        (text: string) => {
          onChangeText(category.name, text);
        },
        [category.name, onChangeText],
      );

      return (
        <View
          key={category.id}
          style={{marginBottom: sizes.md}}
          ref={containerRef}
        >
          <TextInput
            ref={ref}
            label={category.name}
            value={value}
            keyboardType="numeric"
            onChangeText={handleChange}
            right={<PaperTextInput.Affix text="zł" />}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={false}
          />
        </View>
      );
    },
  ),
);

const CreateBudget = () => {
  const categories: Subcategory[] = useAppSelector(selectCategories);
  const {date: budgetDate}: {date: string} = useLocalSearchParams();
  const budgets: BudgetCardItem[] = useAppSelector(
    selectBudgets(formatToDashDate(new Date(budgetDate))),
  );
  const dispatch = useAppDispatch();
  const t = useAppTheme();

  const getPrefillAmounts = (budgets: any[]): {[key: number]: string} => {
    const prefillAmounts: {[key: string]: string} = {};
    budgets.forEach((budget: BudgetCardItem) => {
      prefillAmounts[budget.budgetedName] = budget.allocated.toString();
    });

    return prefillAmounts;
  };

  const [budgetAmounts, setBudgetAmounts] = useState<{[key: string]: string}>(
    () => getPrefillAmounts(budgets),
  );

  const groupedByMain = _.groupBy(categories, 'groupName');
  const flatCategories = Object.values(groupedByMain).flat();
  const inputRefs = useRef<{[key: number]: any}>({});
  const containerRefs = useRef<{[key: number]: View | null}>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const handleAmountChange = useCallback(
    (categoryName: string, amount: string) => {
      setBudgetAmounts(prev => ({...prev, [categoryName]: amount}));
    },
    [],
  );

  const scrollToInput = useCallback((categoryId: number) => {
    const containerView = containerRefs.current[categoryId];
    const scrollView = scrollViewRef.current;

    if (containerView && scrollView) {
      // Add a small delay to ensure the focus is complete
      setTimeout(() => {
        containerView.measureLayout(
          scrollView,
          (x, y, width, height) => {
            // Scroll to position with some padding (100px above the input)
            const scrollY = Math.max(0, y - 100);
            scrollView.scrollTo({y: scrollY, animated: true});
          },
          () => {
            // Fallback if measureLayout fails
          },
        );
      }, 100);
    }
  }, []);

  const focusNextInput = useCallback(
    (currentCategoryId: number) => {
      const currentIndex = flatCategories.findIndex(
        cat => cat.id === currentCategoryId,
      );
      const nextIndex = currentIndex + 1;

      if (nextIndex < flatCategories.length) {
        const nextCategoryId = flatCategories[nextIndex].id;
        inputRefs.current[nextCategoryId]?.focus();
        scrollToInput(nextCategoryId);
      }
    },
    [flatCategories, scrollToInput],
  );

  const handleSave = async () => {
    const budgetsToSave = Object.entries(budgetAmounts).reduce(
      (acc, [categoryName, amount]) => {
        const numAmount = parseInt(amount);
        const foundCategory = categories.find(c => c.name === categoryName);

        // TODO: group name is present here but should not
        if (
          amount &&
          amount.trim() !== '' &&
          !isNaN(numAmount) &&
          numAmount > 0 &&
          foundCategory
        ) {
          acc.push({
            id: budgets.find(b => b.budgetedName === categoryName)?.id,
            amount: numAmount,
            date: budgetDate,
            categoryId: foundCategory.id,
          });
        }

        return acc;
      },
      [] as Array<{amount: number; date: string; categoryId: number}>,
    );

    if (budgetsToSave.length === 0) {
      dispatch(
        setSnackbar({open: true, msg: 'Nie wprowadzono żadnych budżetów'}),
      );
      return;
    }

    try {
      await dispatch(createUpdateBudget(budgetsToSave)).unwrap();
      router.back();
    } catch (error: any) {
      let message = 'Wystąpił błąd podczas zapisywania budżetu';
      if (error?.message === 'budget_exists_for_month') {
        message = 'Budżet już istnieje dla tego miesiąca';
      }
      dispatch(setSnackbar({open: true, msg: message}));
    }
  };

  return (
    <SafeAreaView>
      <ScrollView ref={scrollViewRef} style={{padding: sizes.xl}}>
        <Text
          variant="bodyLarge"
          style={{textAlign: 'center', marginBottom: sizes.xl}}
        >
          Nowy Budżet{' '}
          {formatDateTz({date: new Date(budgetDate), pattern: 'MMM yyyy'})}
        </Text>

        {Object.entries(groupedByMain).map(([groupName, subcategories]) => (
          <View key={groupName} style={{marginBottom: sizes.lg}}>
            <Text
              variant="bodyMedium"
              style={{marginBottom: sizes.md, color: t.colors.primary}}
            >
              {groupName}
            </Text>
            {subcategories.map(category => {
              const isLastInput =
                flatCategories[flatCategories.length - 1].id === category.id;
              return (
                <CategoryInput
                  key={category.id}
                  ref={ref => {
                    if (ref) {
                      inputRefs.current[category.id] = ref;
                    }
                  }}
                  containerRef={ref => {
                    containerRefs.current[category.id] = ref;
                  }}
                  category={category}
                  value={budgetAmounts[category.name] || ''}
                  onChangeText={handleAmountChange}
                  onSubmitEditing={() => focusNextInput(category.id)}
                  returnKeyType={isLastInput ? 'done' : 'next'}
                />
              );
            })}
          </View>
        ))}

        <Button
          mode="contained"
          onPress={handleSave}
          style={{
            marginTop: sizes.lg,
            alignSelf: 'center',
            marginBottom: sizes.xxxl,
          }}
        >
          Zapisz budżet
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateBudget;
