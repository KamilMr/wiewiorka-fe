import {formatDate} from 'date-fns';

export type AddNewForm = {
  description: string;
  date: Date;
  price: string[];
  category?: string;
};

export type SplitItem = {
  price: string;
  category: string;
  description: string;
};

type ExpenseCategory = {
  id: number;
  name: string;
};

export const initFormState = (date = new Date(), categories: any[] = []) => ({
  description: '',
  date,
  price: ['', ''],
  category: categories[0]?.name,
});

export const initSplitItem = (): SplitItem => ({
  price: '',
  category: '',
  description: '',
});

export const initializeSplitItems = (
  price: string,
  category: string,
): SplitItem[] => {
  const totalPrice = parseFloat(price);
  const halfPrice = (totalPrice / 2).toString();

  return [
    {price: halfPrice, category, description: ''},
    {price: halfPrice, category: '', description: ''},
  ];
};

export const validateAddNewForm = ({
  form,
  isSplit,
  splitItems,
  type,
}: {
  form: AddNewForm;
  isSplit: boolean;
  splitItems: SplitItem[];
  type: string;
}) => {
  if (isSplit && type === 'expense') {
    const hasValidItems = splitItems.every(item => item.price && item.category);
    const totalSplitPrice = splitItems.reduce(
      (sum, item) => sum + (+item.price || 0),
      0,
    );
    const remainingAmount = (+form.price[0] || 0) - totalSplitPrice;
    return hasValidItems && remainingAmount === 0;
  }

  if (!form.price[0] || !form.category) {
    return false;
  }

  return true;
};

const categoryIdFor = (categories: ExpenseCategory[], category?: string) =>
  categories.find(item => item.name === category)?.id || 0;

export const createExpensePayload = ({
  categories,
  form,
  hasVacationTag,
  id,
}: {
  categories: ExpenseCategory[];
  form: AddNewForm;
  hasVacationTag: boolean;
  id: string;
}) => {
  const dataToSave = {
    id: id ? +id : '',
    description: form.description,
    date: formatDate(form.date, 'yyyy-MM-dd'),
    price: +form.price[0],
    categoryId: categoryIdFor(categories, form.category),
    tags: hasVacationTag ? ['urlop'] : [],
  };

  return Object.fromEntries(
    Object.entries(dataToSave).filter(
      ([, value]) => !(typeof value === 'string' && !value),
    ),
  );
};

export const createIncomePayload = ({
  form,
  id,
}: {
  form: AddNewForm;
  id: string;
}) => {
  const dataToSave = {
    id: id ? +id : '',
    date: formatDate(form.date, 'yyyy-MM-dd'),
    price: +form.price[0],
    source: form.category,
    vat: 0,
  };

  return Object.fromEntries(
    Object.entries(dataToSave).filter(
      ([, value]) => !(typeof value === 'string' && !value),
    ),
  );
};

export const createSplitExpensePayloads = ({
  categories,
  date,
  hasVacationTag,
  splitItems,
}: {
  categories: ExpenseCategory[];
  date: Date;
  hasVacationTag: boolean;
  splitItems: SplitItem[];
}) =>
  splitItems.map(item => {
    const dataToSave: {
      id: string;
      date: string;
      price: number;
      categoryId: number;
      description?: string;
      tags: string[];
    } = {
      id: '',
      date: formatDate(date, 'yyyy-MM-dd'),
      price: +item.price,
      categoryId: categoryIdFor(categories, item.category),
      tags: hasVacationTag ? ['urlop'] : [],
    };
    if (item.description) dataToSave.description = item.description;
    return dataToSave;
  });
