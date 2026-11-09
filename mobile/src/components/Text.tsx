import { Text as RNText, type TextProps } from 'react-native';
import { type as typeScale, useTheme } from '../theme/tokens';

type Variant = keyof typeof typeScale;

export function Text({ variant = 'body', muted, color, style, ...rest }: TextProps & {
  variant?: Variant;
  muted?: boolean;
  color?: string;
}) {
  const { c } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      style={[typeScale[variant], { color: color ?? (muted ? c.mutedForeground : c.foreground) }, style]}
      {...rest}
    />
  );
}
