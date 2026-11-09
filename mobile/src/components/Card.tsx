import { StyleSheet, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { radius, space } from '../theme/tokens';
import { Glass } from './Glass';

/** Cartão de vidro. `style` aceita padding/gap/cores como antes. */
export function Card({ style, children, ...rest }: ViewProps & { style?: StyleProp<ViewStyle> }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const { backgroundColor, borderColor, borderWidth, margin, marginTop, marginBottom, marginHorizontal, flexBasis, flexGrow, flex, ...inner } = flat;
  return (
    <Glass
      fill={typeof backgroundColor === 'string' && backgroundColor !== 'transparent' ? backgroundColor : undefined}
      borderColor={typeof borderColor === 'string' && borderColor !== 'transparent' ? borderColor : undefined}
      style={{ margin, marginTop, marginBottom, marginHorizontal, flexBasis, flexGrow, flex } as ViewStyle}
      contentStyle={[styles.card, inner, borderWidth ? { borderWidth } : null]}
      rounded={radius.lg}
      {...rest}
    >
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, gap: space.sm },
});
