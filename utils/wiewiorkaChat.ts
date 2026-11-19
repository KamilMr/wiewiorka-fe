export const MONTHLY_SPEND_PROMPT = 'Ile wydałem w tym miesiącu?';
export const QUICK_CHAT_PROMPTS = [
  'Dodaj wydatek',
  'Pokaż wykres',
  'Moje budżety',
] as const;

export const getChatDraft = (value: unknown) =>
  typeof value === 'string' &&
  (value === MONTHLY_SPEND_PROMPT ||
    QUICK_CHAT_PROMPTS.some(prompt => prompt === value))
    ? value
    : '';

export type ChatAction = 'add-expense' | 'show-chart' | 'show-budgets';

export type LocalChatReply = {
  text: string;
  action?: ChatAction;
};

export const normalizeChatPrompt = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[?!.]+$/, '');

export const getLocalChatReply = (
  prompt: string,
  monthlySpend: string,
): LocalChatReply => {
  switch (normalizeChatPrompt(prompt)) {
    case 'ile wydalem w tym miesiacu':
      return {text: `W tym miesiącu wydałeś ${monthlySpend}.`};
    case 'dodaj wydatek':
      return {
        text: 'Mogę otworzyć formularz dodawania wydatku. Dane wpiszesz samodzielnie.',
        action: 'add-expense',
      };
    case 'pokaz wykres':
      return {
        text: 'Otworzę wykres wydatków z bieżącego miesiąca.',
        action: 'show-chart',
      };
    case 'moje budzety':
    case 'ustaw budzet':
      return {
        text: 'Otworzę Twoje budżety, gdzie możesz je przejrzeć lub ustawić.',
        action: 'show-budgets',
      };
    default:
      return {
        text: 'To lokalny, ograniczony czat. Obsługuję: „Ile wydałem w tym miesiącu?”, „Dodaj wydatek”, „Pokaż wykres” i „Moje budżety”.',
      };
  }
};
