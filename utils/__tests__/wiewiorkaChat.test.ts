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
    expect(getLocalChatReply('Dodaj wydatek', '120 zł')?.action).toBe(
      'add-expense',
    );
    expect(getLocalChatReply('pokaż wykres', '120 zł')?.action).toBe(
      'show-chart',
    );
    expect(getLocalChatReply('Moje budżety', '120 zł')?.action).toBe(
      'show-budgets',
    );
  });

  it('leaves free text, transaction details, and commands for the agent', () => {
    expect(getLocalChatReply('Ile na jedzenie?', '120 zł')).toBeNull();
    expect(
      getLocalChatReply('Dodaj wydatek 12,50 zł za obiad', '120 zł'),
    ).toBeNull();
    expect(getLocalChatReply('/clear', '120 zł')).toBeNull();
  });

  it('uses the supplied real monthly total in the supported recap', () => {
    expect(getLocalChatReply('Ile wydałem w tym miesiącu', '1,250 zł')).toEqual(
      {
        text: 'W tym miesiącu wydałeś 1,250 zł.',
      },
    );
  });
});
