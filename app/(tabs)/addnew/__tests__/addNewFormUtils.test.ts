import {
  createExpensePayload,
  createIncomePayload,
  createSplitExpensePayloads,
  initFormState,
  initSplitItem,
  initializeSplitItems,
  validateAddNewForm,
} from '../addNewFormUtils';

const categories = [
  {id: 4, name: 'Food'},
  {id: 8, name: 'Travel'},
];

const form = (overrides = {}) => ({
  ...initFormState(new Date(2024, 4, 6), categories),
  price: ['12', '12'],
  category: 'Food',
  ...overrides,
});

describe('add new form utilities', () => {
  it('keeps the initial form and split-item shapes and initializes a split from the total', () => {
    expect(initFormState(new Date(2024, 4, 6), categories)).toEqual({
      description: '',
      date: new Date(2024, 4, 6),
      price: ['', ''],
      category: 'Food',
    });
    expect(initSplitItem()).toEqual({price: '', category: '', description: ''});
    expect(initializeSplitItems('11', 'Food')).toEqual([
      {price: '5.5', category: 'Food', description: ''},
      {price: '5.5', category: '', description: ''},
    ]);
  });

  it('validates ordinary forms only when converted price and category are truthy', () => {
    expect(
      validateAddNewForm({
        form: form(),
        isSplit: false,
        splitItems: [],
        type: 'expense',
      }),
    ).toBe(true);
    expect(
      validateAddNewForm({
        form: form({price: ['', '12']}),
        isSplit: false,
        splitItems: [],
        type: 'income',
      }),
    ).toBe(false);
    expect(
      validateAddNewForm({
        form: form({category: ''}),
        isSplit: false,
        splitItems: [],
        type: 'expense',
      }),
    ).toBe(false);
  });

  it('requires complete split rows with an exact total allocation', () => {
    const splitItems = [
      {price: '5', category: 'Food', description: ''},
      {price: '7', category: 'Travel', description: ''},
    ];
    expect(
      validateAddNewForm({
        form: form(),
        isSplit: true,
        splitItems,
        type: 'expense',
      }),
    ).toBe(true);
    expect(
      validateAddNewForm({
        form: form(),
        isSplit: true,
        splitItems: [
          {price: '5', category: '', description: ''},
          splitItems[1],
        ],
        type: 'expense',
      }),
    ).toBe(false);
    expect(
      validateAddNewForm({
        form: form(),
        isSplit: true,
        splitItems: [
          {price: '5', category: 'Food', description: ''},
          {price: '6.99', category: 'Travel', description: ''},
        ],
        type: 'expense',
      }),
    ).toBe(false);
  });

  it('creates a new expense payload with category, date, tags, and no empty fields', () => {
    expect(
      createExpensePayload({
        categories,
        form: form({description: ''}),
        hasVacationTag: true,
        id: '',
      }),
    ).toEqual({
      date: '2024-05-06',
      price: 12,
      categoryId: 4,
      tags: ['urlop'],
    });
  });

  it('preserves an edited expense ID and description', () => {
    expect(
      createExpensePayload({
        categories,
        form: form({description: 'Lunch'}),
        hasVacationTag: false,
        id: '42',
      }),
    ).toEqual({
      id: 42,
      description: 'Lunch',
      date: '2024-05-06',
      price: 12,
      categoryId: 4,
      tags: [],
    });
  });

  it('creates custom income payloads and retains an edited income ID', () => {
    expect(
      createIncomePayload({form: form({category: 'Freelance'}), id: ''}),
    ).toEqual({date: '2024-05-06', price: 12, source: 'Freelance', vat: 0});
    expect(createIncomePayload({form: form(), id: '9'})).toEqual({
      id: 9,
      date: '2024-05-06',
      price: 12,
      source: 'Food',
      vat: 0,
    });
  });

  it('creates one split expense payload per row with optional descriptions and category IDs', () => {
    expect(
      createSplitExpensePayloads({
        categories,
        date: new Date(2024, 4, 6),
        hasVacationTag: true,
        splitItems: [
          {price: '5', category: 'Food', description: 'Breakfast'},
          {price: '7', category: 'Travel', description: ''},
        ],
      }),
    ).toEqual([
      {
        id: '',
        date: '2024-05-06',
        price: 5,
        categoryId: 4,
        description: 'Breakfast',
        tags: ['urlop'],
      },
      {
        id: '',
        date: '2024-05-06',
        price: 7,
        categoryId: 8,
        tags: ['urlop'],
      },
    ]);
  });
});
