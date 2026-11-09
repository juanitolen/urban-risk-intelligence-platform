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
  muted: 'rgba(226,232,240,0.72)',
  mutedForeground: '#475569',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  ring: '#0F172A',
  success: '#15803D',
  successSurface: 'rgba(220,252,231,0.82)',
  warning: '#92400E',
  warningSurface: 'rgba(254,243,199,0.82)',
  danger: '#B91C1C',
  dangerSurface: 'rgba(254,226,226,0.85)',
  // Glassmorphism (ui-ux-pro-max: blur 10-20px, borda clara 1px, fundo vibrante, contraste 4.5:1)
  glassFill: 'rgba(255,255,255,0.58)',
  glassFillStrong: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(255,255,255,0.85)',
  glassHighlight: 'rgba(255,255,255,0.65)',
  glassShadow: 'rgba(15,23,42,0.12)',
  scrim: 'rgba(15,23,42,0.25)',
  bgGradient: ['#E0F2FE', '#F0F9FF', '#ECFEFF'] as [string, string, string],
  blobs: ['#7DD3FC', '#5EEAD4', '#FDE68A'] as [string, string, string],
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
  muted: 'rgba(30,41,59,0.65)',
  mutedForeground: '#A3B1C6',
  border: '#243047',
  borderStrong: '#334155',
  ring: '#E2E8F0',
  success: '#4ADE80',
  successSurface: 'rgba(20,50,31,0.78)',
  warning: '#FBBF24',
  warningSurface: 'rgba(58,42,10,0.78)',
  danger: '#F87171',
  dangerSurface: 'rgba(59,20,20,0.82)',
  glassFill: 'rgba(22,32,54,0.58)',
  glassFillStrong: 'rgba(22,32,54,0.80)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassHighlight: 'rgba(255,255,255,0.08)',
  glassShadow: 'rgba(0,0,0,0.45)',
  scrim: 'rgba(2,6,23,0.45)',
  bgGradient: ['#0B1120', '#0C1A2E', '#081A1F'] as [string, string, string],
  blobs: ['#0369A1', '#0F766E', '#1E3A8A'] as [string, string, string],
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
export const radius = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;

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

/** Spring sem overshoot para navegação (frequente); leve bounce só no menu gooey (raro). */
export const springs = {
  pill: { useNativeDriver: true, speed: 20, bounciness: 0 },
  gooey: { useNativeDriver: false, speed: 14, bounciness: 7 },
} as const;

/** Espaço reservado no fim das telas para a tab bar flutuante. */
export const TAB_BAR_SPACE = 180;

export function useTheme() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, c: scheme === 'dark' ? dark : light, severity: severityColors(scheme) } as const;
}
