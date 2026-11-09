import { confidenceLabel, formatValue, relativeTime } from '../logic/format';

describe('format', () => {
  it('formata valores por unidade', () => {
    expect(formatValue(42.4, 'cm')).toBe('42 cm');
    expect(formatValue(38.26, '°C')).toBe('38.3 °C');
    expect(formatValue(45, 'min')).toBe('45 min');
    expect(formatValue(150, 'min')).toBe('2 h 30 min');
  });

  it('descreve tempo relativo em português', () => {
    const now = 1_000_000;
    expect(relativeTime(now - 2000, now)).toBe('agora');
    expect(relativeTime(now - 12_000, now)).toBe('há 12 s');
    expect(relativeTime(now - 180_000, now)).toBe('há 3 min');
    expect(relativeTime(null, now)).toBe('—');
  });

  it('traduz a confiança em palavras', () => {
    expect(confidenceLabel(0.9)).toBe('Alta');
    expect(confidenceLabel(0.6)).toBe('Média');
    expect(confidenceLabel(0.3)).toBe('Baixa');
  });
});
