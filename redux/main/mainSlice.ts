import {createSlice} from '@reduxjs/toolkit';

import _ from 'lodash';
import {format} from 'date-fns';

import aggregateDataByDay from '../../utils/aggregateData';
import {MainSlice, Income, Expense} from '@/types';
import {StoredExchangeRate, StoredBidAskExchangeRate} from '../../types/nbpTypes';

const emptyState = (): MainSlice => ({
  status: 'idle',
  expenses: [],
  budgets: [],
  incomes: [],
  categories: {},
  sources: {},
  exchangeRates: [],
  bidAskExchangeRates: [],
  _aggregated: {},
  devMode: false,
  snackbar: {
    open: false,
    type: 'success',
    msg: '',
  },
});

const mainSlice = createSlice({
  name: 'main',
  initialState: emptyState(),
  reducers: {
    startLoading: (state, action) => {
      state.status = 'fetching';
    },
    stopLoading: state => {
      state.status = 'idle';
    },
    setSnackbar: (state, action) => {
      let {open = false, type = '', msg = '', setTime} = action.payload || {};
      if (msg) open = true;
      state.snackbar = {type, msg, open, time: setTime};
    },
    initState: (state, action) => {
      state.expenses = action.payload.expenses.map((ex: Expense) => ({
        ...ex,
        date: format(ex.date, 'yyyy-MM-dd'),
      }));
      state.categories = action.payload.categories;
      state.incomes = action.payload.income;
      state.sources = action.payload.income.reduce(
        (pv: {[key: string]: string[]}, cv: Income) => {
          pv[cv.owner] ??= [];
          if (!pv[cv.owner].includes(cv.source)) pv[cv.owner].push(cv.source);
          return pv;
        },
        {},
      );
    },
    addExpense: (state, action) => {
      state.expenses = [
        ...state.expenses,
        ...action.payload.map((ex: Expense) => ({
          ...ex,
          date: format(ex.date, 'yyyy-MM-dd'),
        })),
      ];
    },
    updateExpense: (state, action) => {
      const expense = action.payload;
      const expIdx = state.expenses.findIndex(ex => ex.id === expense.id);
      if (expIdx !== -1) {
        state.expenses[expIdx] = {
          ...expense,
          date: format(expense.date, 'yyyy-MM-dd'),
        };
      }
    },
    addIncome: (state, action) => {
      state.incomes = [
        ...state.incomes,
        ...action.payload.map((inc: Income) => ({
          ...inc,
          date: format(inc.date, 'yyyy-MM-dd'),
        })),
      ];
    },
    addBudgets: (state, action) => {
      state.budgets = [
        ...state.budgets,
        ...action.payload.map((budget: any) => ({
          ...budget,
          yearMonth: budget.date
            ? format(budget.date, 'yyyy-MM-dd')
            : budget.yearMonth,
        })),
      ];
    },
    updateBudget: (state, action) => {
      const {id, ...data} = action.payload;
      const budgetIndex = state.budgets.findIndex(budget => budget.id === id);
      if (budgetIndex !== -1) {
        state.budgets[budgetIndex] = {
          ...state.budgets[budgetIndex],
          ...data,
        };
      }
    },
    deleteBudget: (state, action) => {
      const {id} = action.payload;
      const budgetIndex = state.budgets.findIndex(budget => budget.id === id);
      if (budgetIndex !== -1) {
        state.budgets.splice(budgetIndex, 1);
      }
    },
    updateIncome: (state, action) => {
      const income = action.payload;
      const incIdx = state.incomes.findIndex(inc => inc.id === income.id);
      if (incIdx !== -1) {
        state.incomes[incIdx] = {
          ...income,
          date: format(income.date, 'yyyy-MM-dd'),
        };
      }
    },
    dropMain: () => emptyState(),
    toggleDevMode: state => {
      state.devMode = !state.devMode;
    },
    clearDevMode: state => {
      state.devMode = false;
    },
    removeExpense: (state, action) => {
      state.expenses = state.expenses.filter(
        exp => exp.id.toString() !== action.payload,
      );
    },
    removeIncome: (state, action) => {
      state.incomes = state.incomes.filter(
        inc => inc.id.toString() !== action.payload,
      );
    },
    replaceExpense: (state, action) => {
      const {frontendId, resp} = action.payload;
      const expenseIndex = state.expenses.findIndex(
        exp => exp.id.toString() === frontendId.toString(),
      );
      if (expenseIndex !== -1) {
        state.expenses[expenseIndex] = {
          ...state.expenses[expenseIndex],
          ...resp,
        }; // TODO: use object.asign
      }
    },
    replaceIncome: (state, action) => {
      const {frontendId, resp} = action.payload;
      const incomeIndex = state.incomes.findIndex(
        inc => inc.id.toString() === frontendId.toString(),
      );
      if (incomeIndex !== -1) {
        state.incomes[incomeIndex] = {...state.incomes[incomeIndex], ...resp};
      }
    },
    replaceBudget: (state, action) => {
      const {frontendId, resp} = action.payload;

      if (Array.isArray(resp)) {
        // Remove all budgets with matching frontendId prefix
        state.budgets = state.budgets.filter(
          budget => !budget.id.startsWith(frontendId),
        );
        // Add the new budgets from server with proper yearMonth field
        const transformedBudgets = resp.map((budget: any) => ({
          ...budget,
          yearMonth: budget.date
            ? budget.date.substring(0, 7)
            : budget.yearMonth,
        }));
        state.budgets = [...state.budgets, ...transformedBudgets];
      } else {
        const budgetIndex = state.budgets.findIndex(
          budget => budget.id === frontendId,
        );
        if (budgetIndex !== -1) {
          const transformedBudget = {
            ...resp,
            yearMonth: resp.date ? resp.date.substring(0, 7) : resp.yearMonth,
          };
          state.budgets[budgetIndex] = {
            ...state.budgets[budgetIndex],
            ...transformedBudget,
          };
        }
      }
    },
    addSubcategoryAction: (state, action) => {
      const subcategory = action.payload;
      const groupId = subcategory.groupId;
      if (state.categories[groupId]) {
        state.categories[groupId].subcategories.push(subcategory);
      }
    },
    replaceSubcategoryAction: (state, action) => {
      const {frontendId, resp} = action.payload;
      const {previousGroupId, ...subcategoryData} = resp;
      const newGroupId = subcategoryData.groupId;

      // If previousGroupId is provided and different from current group
      if (previousGroupId && previousGroupId !== newGroupId) {
        // Remove from previous group
        if (state.categories[previousGroupId]) {
          state.categories[previousGroupId].subcategories = state.categories[
            previousGroupId
          ].subcategories.filter(sub => sub.id !== frontendId);
        }

        // Add to new group
        if (state.categories[newGroupId]) {
          state.categories[newGroupId].subcategories.push(subcategoryData);
        }
      } else {
        // Find and replace in current group
        if (state.categories[newGroupId]) {
          const subIndex = state.categories[newGroupId].subcategories.findIndex(
            sub => sub.id === frontendId,
          );
          if (subIndex !== -1) {
            state.categories[newGroupId].subcategories[subIndex] =
              subcategoryData;
          }
        }
      }
    },
    updateSubcategoryAction: (state, action) => {
      const updatedSubcategory = action.payload;
      const newGroupId = updatedSubcategory.groupId;

      // Find subcategory in any group
      let currentGroupId = null;
      let subIndex = -1;

      Object.keys(state.categories).forEach(groupId => {
        const groupIdNum = parseInt(groupId);
        const index = state.categories[groupIdNum].subcategories.findIndex(
          sub => sub.id === updatedSubcategory.id,
        );
        if (index !== -1) {
          currentGroupId = groupIdNum;
          subIndex = index;
        }
      });

      if (currentGroupId !== null && subIndex !== -1) {
        // If groupId changed, move to new group
        if (currentGroupId !== newGroupId) {
          // Remove from current group
          const subcategory =
            state.categories[currentGroupId].subcategories[subIndex];
          state.categories[currentGroupId].subcategories.splice(subIndex, 1);

          // Add to new group
          if (state.categories[newGroupId]) {
            state.categories[newGroupId].subcategories.push({
              ...subcategory,
              ...updatedSubcategory,
            });
          }
        } else {
          // Update in same group
          state.categories[currentGroupId].subcategories[subIndex] = {
            ...state.categories[currentGroupId].subcategories[subIndex],
            ...updatedSubcategory,
          };
        }
      }
    },
    deleteSubcategoryAction: (state, action) => {
      const subcategoryId = action.payload;
      // Search through all categories to find and remove the subcategory
      Object.keys(state.categories).forEach(groupId => {
        const groupIdNum = parseInt(groupId);
        if (state.categories[groupIdNum]) {
          state.categories[groupIdNum].subcategories = state.categories[
            groupIdNum
          ].subcategories.filter(
            sub => sub.id.toString() !== subcategoryId.toString(),
          );
        }
      });
    },
    addGroupCategoryAction: (state, action) => {
      const groupCategory = action.payload;
      state.categories[groupCategory.id] = {
        name: groupCategory.name,
        color: groupCategory.color,
        subcategories: [],
      };
    },
    updateGroupCategoryAction: (state, action) => {
      const groupCategory = action.payload;
      if (state.categories[groupCategory.id]) {
        state.categories[groupCategory.id] = {
          ...state.categories[groupCategory.id],
          name: groupCategory.name,
          color: groupCategory.color,
        };
      }
    },
    deleteGroupCategoryAction: (state, action) => {
      const groupId = action.payload;
      delete state.categories[groupId];
    },
    replaceGroupCategoryAction: (state, action) => {
      const {frontendId, resp} = action.payload;
      // Replace group category with server response
      if (state.categories[frontendId]) {
        const existingSubcategories =
          state.categories[frontendId].subcategories;
        state.categories[resp.id] = {
          name: resp.name,
          color: resp.color,
          subcategories: existingSubcategories,
        };
        // Remove old entry if ID changed
        if (frontendId !== resp.id) {
          delete state.categories[frontendId];
        }
      }
    },
    /**
     * Stores exchange rate data in the state
     * @param state - Current state
     * @param action - Action containing exchange rate data
     */
    addExchangeRate: (state, action: {payload: StoredExchangeRate}) => {
      const existingIndex = state.exchangeRates.findIndex(
        rate =>
          rate.code === action.payload.code &&
          rate.date === action.payload.date,
      );

      if (existingIndex >= 0) {
        state.exchangeRates[existingIndex] = action.payload;
      } else {
        state.exchangeRates.push(action.payload);
      }
    },
    /**
     * Adds or updates a bid/ask exchange rate in the store
     * @param state - Current state
     * @param action - Action containing bid/ask exchange rate data
     */
    addBidAskExchangeRate: (state, action: {payload: StoredBidAskExchangeRate}) => {
      if (!state.bidAskExchangeRates) {
        state.bidAskExchangeRates = [];
      }
      
      const existingIndex = state.bidAskExchangeRates.findIndex(
        rate =>
          rate.code === action.payload.code &&
          rate.date === action.payload.date,
      );

      if (existingIndex >= 0) {
        state.bidAskExchangeRates[existingIndex] = action.payload;
      } else {
        state.bidAskExchangeRates.push(action.payload);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase('ini/fetchIni/fulfilled', (state, action) => {
        let {expenses, income, categories} = action.payload;
        expenses = expenses.map((ex: Expense) => ({
          ...ex,
          date: format(ex.date, 'yyyy-MM-dd'),
        }));
        state.budgets = action.payload.budgets || [];
        state.expenses = expenses;
        state.categories = categories;
        state.incomes = income.map((inc: Income) => ({
          ...inc,
          date: format(inc.date, 'yyyy-MM-dd'),
        }));
        state.sources = income.reduce(
          (pv: {[key: string]: string[]}, cv: Income) => {
            pv[cv.owner] ??= [];
            if (!pv[cv.owner].includes(cv.source)) pv[cv.owner].push(cv.source);
            return pv;
          },
          {},
        );
        //
        state._aggregated = aggregateDataByDay(expenses, categories);
      })
      .addCase('ini/fetchIni/rejected', (state, action) => {
        state.snackbar.open = true;
        state.snackbar.type = 'error';
        state.snackbar.msg = action.error.message ?? 'Coś poszło nie tak';
      });
  },
});

export const {
  addBudgets,
  addExchangeRate,
  addExpense,
  addGroupCategoryAction,
  addIncome,
  addSubcategoryAction,
  clearDevMode,
  deleteBudget,
  deleteGroupCategoryAction,
  deleteSubcategoryAction,
  dropMain,
  initState,
  removeExpense,
  removeIncome,
  replaceBudget,
  replaceExpense,
  replaceGroupCategoryAction,
  replaceIncome,
  replaceSubcategoryAction,
  setSnackbar,
  startLoading,
  stopLoading,
  toggleDevMode,
  updateBudget,
  updateExpense,
  updateGroupCategoryAction,
  updateIncome,
  updateSubcategoryAction,
} = mainSlice.actions;

export {emptyState as mainEmptyState};

export default mainSlice.reducer;
