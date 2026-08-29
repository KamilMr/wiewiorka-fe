import {formatDate, isAfter, isBefore, isSameDay, parse} from 'date-fns';
import {NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import uniqueId from 'react-native-uuid';
import {env} from './config/environment';
import formatDateTz, {timeFormats} from './utils/formatTimeTz';

export const CATEGORY_LIST_ADD_EDIT_PATH = 'category-list/:param';
export const CATS_PATH = 'cats';
export const EXPENSE_ADD_EDIT_PATH = 'expense-list/:param';
export const EXPENSE_LIST_PATH = 'expense-list';
export const HOME_PATH = '/';
export const INCOME_ADD_EDIT_PATH = 'income-list/:param';
export const INCOME_LIST_PATH = 'income-list';
export const LOGIN_PATH = 'login';
export const SUMMARY_PATH = 'summary';
export const SUMMARY_CHART = 'summary/chart/:param';

export const EXCLUDED_CAT = [];

const generateColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to hex color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }

  return color;
};

const getURL = (p = '') => {
  return `${env.apiUrl}/${p}`;
};

export type FormatPriceOptions = {
  roundUp?: false | 'zloty' | 'thousand';
};

const integerPriceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const roundToNearest = (number: number, factor: number = 1) =>
  Math.sign(number) *
  Math.round(
    (Math.abs(number) + Number.EPSILON * Math.max(1, Math.abs(number))) *
      factor,
  );

const formatPrice = (
  value: number,
  {roundUp = 'zloty'}: FormatPriceOptions = {},
): string => {
  if (!Number.isFinite(value)) return '0 zł';

  if (roundUp === 'thousand') {
    return `${integerPriceFormatter.format(
      roundToNearest(value / 1000),
    )} tys. zł`;
  }

  if (roundUp === false) {
    const roundedCents = roundToNearest(value, 100);
    const sign = roundedCents < 0 ? '-' : '';
    const absoluteCents = Math.abs(roundedCents);
    const zloty = Math.floor(absoluteCents / 100);
    const grosze = absoluteCents % 100;

    return `${sign}${integerPriceFormatter.format(zloty)}${
      grosze ? `.${grosze.toString().padStart(2, '0')}` : ''
    } zł`;
  }

  return `${integerPriceFormatter.format(roundToNearest(value))} zł`;
};

const makeNewIdArr = (number: number) => {
  const set = new Set();
  let num = number;

  while (num > 0) {
    const id: string | number[] = uniqueId.v4();
    if (set.has(id)) continue;
    set.add(id);
    --num;
  }
  return Array.from(set);
};

// Function to check if the user scrolled to the bottom
const isCloseToBottom = ({
  layoutMeasurement,
  contentOffset,
  contentSize,
}: NativeSyntheticEvent<NativeScrollEvent>['nativeEvent']): boolean => {
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
};

const dh = {
  isBetweenDates: (d, s, e) =>
    (isBefore(d, e) && isAfter(d, s)) || isSameDay(d, s) || isSameDay(d, e),
};

const convertDate = (
  str: string,
  format: string = 'dd/MM/yyyy',
  newformat: string = 'yyyy-MM-dd',
): string => {
  return formatDate(parse(str, format, new Date()), newformat);
};

const shortenText = (text: string, maxLength: number = 10) => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

/**
 * Replace Polish diacritics with their English counterparts
 * */
const normalize = (str: string): string => {
  const map = 'ąćęłńóśźż';
  const norm = 'acelnoszz';

  return str.replace(/./g, c => {
    const isUpper = c === c.toUpperCase();
    const idx = map.indexOf(c.toLowerCase());

    return idx === -1 ? c : isUpper ? norm[idx].toUpperCase() : norm[idx];
  });
};

const printJsonIndent = (arg1: string | object, arg2?: object) => {
  if (typeof arg1 === 'object') {
    arg2 = arg1;
    arg1 = 'log: ';
  }
  console.log(arg1, JSON.stringify(arg2, null, 2));
};

const makeRandomId = (length: number): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const isFirstBeforeSecond = (date1: string | Date, date2: string | Date) => {
  const d1 =
    typeof date1 === 'string' ? parse(date1, 'yyyy-MM-dd', new Date()) : date1;
  const d2 =
    typeof date2 === 'string' ? parse(date2, 'yyyy-MM-dd', new Date()) : date2;

  if (!(d1 instanceof Date) || !(d2 instanceof Date)) {
    throw new Error('Invalid date format');
  }

  return isBefore(d1, d2);
};

const formatToDashDate = (d: string | Date) => {
  const d1 = typeof d === 'string' ? parse(d, 'yyyy-MM-dd', new Date()) : d;
  if (!(d1 instanceof Date)) {
    throw new Error('Invalid date format');
  }

  return formatDateTz({date: d1, pattern: timeFormats.dateOnly2});
};

export {
  convertDate,
  dh,
  formatPrice,
  formatToDashDate,
  generateColor,
  getURL,
  isCloseToBottom,
  isFirstBeforeSecond,
  makeNewIdArr,
  makeRandomId,
  normalize,
  printJsonIndent,
  shortenText,
};
