import { StyleSheet, View, type ViewProps } from 'react-native';
import { radius, space, useTheme } from '../theme/tokens';

export function Card({ style, ...rest }: ViewProps) {
  const { c } = useTheme();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.lg, gap: space.sm },
});
