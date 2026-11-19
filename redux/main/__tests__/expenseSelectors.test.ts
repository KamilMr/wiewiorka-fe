/** @jest-environment node */

import type {RootState} from '@/redux/store';
import type {Expense, MainSlice} from '@/types';
import {selectBudgets, selectExpense} from '../selectors';

const expense = (id: number, categoryId?: number | null): Expense => ({
  id,
  description: 'Lunch',
  date: '2025-02-03',
  price: 12,
  ...(categoryId === undefined ? {} : {categoryId}),
  category: '',
  image: '',
  houseId: '',
  owner: 'Alice',
});

const state = {
  main: {
    expenses: [expense(1), expense(2, null), expense(3, 99), expense(4, 4)],
    categories: {
      2: {
        name: 'Home',
        color: '#ffffff',
        subcategories: [
          {
            id: 4,
            name: 'Food',
            color: '#ffffff',
            groupId: 2,
            owner: 'user',
            ownerId: 1,
          },
        ],
      },
    },
    budgets: [
      {
        id: '1',
        yearMonth: '2025-02-01',
        groupId: 2,
        categoryId: null,
        amount: 100,
      },
    ],
  } satisfies Pick<MainSlice, 'expenses' | 'categories' | 'budgets'>,
} as unknown as RootState; // Only the selector inputs are needed here.

it.each([1, 2, 3])('opens expense %d without a matching subcategory', id => {
  expect(selectExpense(id)(state)).toMatchObject({
    id,
    description: 'Lunch',
    category: '',
    catColor: '',
  });
});

it('still shows the category for an assigned expense', () => {
  expect(selectExpense(4)(state)).toMatchObject({
    category: 'Food',
    catColor: '#ffffff',
  });
});

it('excludes uncategorized expenses from a category group budget', () => {
  expect(selectBudgets('2025-02-01')(state)).toMatchObject([{amount: 12}]);
});
