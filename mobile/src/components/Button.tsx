import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { radius, space, useTheme } from '../theme/tokens';
import { Text } from './Text';

type Kind = 'primary' | 'secondary' | 'danger';

export function Button({ label, onPress, kind = 'primary', icon, loading, disabled, accessibilityHint }: {
  label: string;
  onPress: () => void;
  kind?: Kind;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const { c } = useTheme();
  const palette = {
    primary: { bg: c.accent, fg: c.onAccent, border: c.accent },
    secondary: { bg: c.card, fg: c.foreground, border: c.borderStrong },
    danger: { bg: c.danger, fg: '#FFFFFF', border: c.danger },
  }[kind];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={palette.fg} /> : icon ? <Ionicons name={icon} size={20} color={palette.fg} /> : null}
        <Text variant="bodyBold" color={palette.fg}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space.lg, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
});
