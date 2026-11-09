import { useColorScheme } from 'react-native';
import type { RiskType, Severity } from '../api/types';

/**
 * Tokens do design system "Accessible & Ethical" (design-system/urban-risk/MASTER.md),
 * gerado com a skill ui-ux-pro-max. Todos os pares texto/fundo passam de 4.5:1 (WCAG AA).
 */
const light = {
  primary: '#0F172A',
  onPrimary: '#FFFFFF',
  secondary: '#334155',
  accent: '#0369A1',
  onAccent: '#FFFFFF',
  background: '#F8FAFC',
  foreground: '#020617',
  card: '#FFFFFF',
  muted: '#E8ECF1',
  mutedForeground: '#475569',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  ring: '#0F172A',
  success: '#15803D',
  successSurface: '#DCFCE7',
  warning: '#92400E',
  warningSurface: '#FEF3C7',
  danger: '#B91C1C',
  dangerSurface: '#FEE2E2',
};

const dark: typeof light = {
  primary: '#E2E8F0',
  onPrimary: '#0F172A',
  secondary: '#CBD5E1',
  accent: '#38BDF8',
  onAccent: '#0F172A',
  background: '#0B1120',
  foreground: '#F1F5F9',
  card: '#131C2E',
  muted: '#1E293B',
  mutedForeground: '#A3B1C6',
  border: '#243047',
  borderStrong: '#334155',
  ring: '#E2E8F0',
  success: '#4ADE80',
  successSurface: '#14321F',
  warning: '#FBBF24',
  warningSurface: '#3A2A0A',
  danger: '#F87171',
  dangerSurface: '#3B1414',
};

export type Palette = typeof light;

/** Severidade: cor + ícone + texto (nunca só cor). */
export const severityColors = (p: 'light' | 'dark') =>
  ({
    LOW: p === 'light' ? { fg: '#166534', bg: '#DCFCE7' } : { fg: '#86EFAC', bg: '#14321F' },
    MODERATE: p === 'light' ? { fg: '#854D0E', bg: '#FEF9C3' } : { fg: '#FDE047', bg: '#3A330A' },
    HIGH: p === 'light' ? { fg: '#9A3412', bg: '#FFEDD5' } : { fg: '#FDBA74', bg: '#3D2210' },
    CRITICAL: p === 'light' ? { fg: '#FFFFFF', bg: '#B91C1C' } : { fg: '#FFFFFF', bg: '#B91C1C' },
  }) satisfies Record<Severity, { fg: string; bg: string }>;

export const SEVERITY_ICON: Record<Severity, 'information-circle' | 'alert-circle' | 'warning' | 'flash'> = {
  LOW: 'information-circle',
  MODERATE: 'alert-circle',
  HIGH: 'warning',
  CRITICAL: 'flash',
};

export const RISK_ICON: Record<RiskType, 'water' | 'thermometer' | 'flash-off'> = {
  FLOOD: 'water',
  HEAT_ISLAND: 'thermometer',
  SERVICE_OUTAGE: 'flash-off',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const font = {
  regular: 'AtkinsonHyperlegible_400Regular',
  bold: 'AtkinsonHyperlegible_700Bold',
} as const;

/** Escala tipográfica com corpo de 16 px e altura de linha 1.5. */
export const type = {
  display: { fontFamily: font.bold, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: font.bold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodyBold: { fontFamily: font.bold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: font.bold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
} as const;

/** Movimento (design-motion-principles, lente Jakub/Emil para app mobile): curto e com propósito. */
export const motion = { fast: 160, base: 220, slow: 320 } as const;

export function useTheme() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, c: scheme === 'dark' ? dark : light, severity: severityColors(scheme) } as const;
}
