import {formatPrice} from '../../common';

describe('formatPrice', () => {
  it('rounds to the nearest złoty by default', () => {
    expect(formatPrice(1234)).toBe('1,234 zł');
    expect(formatPrice(1234.32)).toBe('1,234 zł');
    expect(formatPrice(1234.5)).toBe('1,235 zł');
  });

  it('groups large default values with commas', () => {
    expect(formatPrice(1234567)).toBe('1,234,567 zł');
  });

  it('preserves rounded grosze when rounding is disabled', () => {
    expect(formatPrice(1234.32, {roundUp: false})).toBe('1,234.32 zł');
    expect(formatPrice(1234.5, {roundUp: false})).toBe('1,234.50 zł');
    expect(formatPrice(1234, {roundUp: false})).toBe('1,234 zł');
  });

  it('carries rounded grosze into złoty', () => {
    expect(formatPrice(1234.995, {roundUp: false})).toBe('1,235 zł');
  });

  it('formats rounded thousands compactly', () => {
    expect(formatPrice(1234, {roundUp: 'thousand'})).toBe('1 tys. zł');
    expect(formatPrice(1500, {roundUp: 'thousand'})).toBe('2 tys. zł');
    expect(formatPrice(1234567, {roundUp: 'thousand'})).toBe('1,235 tys. zł');
  });

  it('formats zero without decimals', () => {
    expect(formatPrice(0)).toBe('0 zł');
  });

  it('rounds negative half boundaries away from zero', () => {
    expect(formatPrice(-1234.5)).toBe('-1,235 zł');
    expect(formatPrice(-1500, {roundUp: 'thousand'})).toBe('-2 tys. zł');
    expect(formatPrice(-0.005, {roundUp: false})).toBe('-0.01 zł');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'formats non-finite values as zero: %p',
    value => {
      expect(formatPrice(value)).toBe('0 zł');
    },
  );
});
