import {
  getChatDraft,
  getLocalChatReply,
  MONTHLY_SPEND_PROMPT,
  normalizeChatPrompt,
  QUICK_CHAT_PROMPTS,
} from '../wiewiorkaChat';

describe('Wiewiórka local chat', () => {
  it('normalizes Polish prompts and repeated whitespace', () => {
    expect(normalizeChatPrompt('  POKAŻ   WYKRES  ')).toBe('pokaz wykres');
  });

  it('accepts dashboard suggestions but ignores arbitrary deep-link drafts', () => {
    expect(getChatDraft(MONTHLY_SPEND_PROMPT)).toBe(MONTHLY_SPEND_PROMPT);
    for (const prompt of QUICK_CHAT_PROMPTS) {
      expect(getChatDraft(prompt)).toBe(prompt);
    }
    expect(getChatDraft(['/budget'])).toBe('');
    expect(getChatDraft('/budget')).toBe('');
  });

  it('only returns navigation actions for supported exact prompts', () => {
    expect(getLocalChatReply('Dodaj wydatek', '120 zł').action).toBe(
      'add-expense',
    );
    expect(getLocalChatReply('pokaż wykres', '120 zł').action).toBe(
      'show-chart',
    );
    expect(getLocalChatReply('Moje budżety', '120 zł').action).toBe(
      'show-budgets',
    );
    expect(getLocalChatReply('Ile na jedzenie?', '120 zł').action).toBeFalsy();
  });

  it('uses the supplied real monthly total in the supported recap', () => {
    expect(getLocalChatReply('Ile wydałem w tym miesiącu', '1,250 zł')).toEqual(
      {
        text: 'W tym miesiącu wydałeś 1,250 zł.',
      },
    );
  });
});
