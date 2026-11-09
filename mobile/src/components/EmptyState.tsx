import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { space, useTheme } from '../theme/tokens';
import { Card } from './Card';
import { Text } from './Text';

export function EmptyState({ icon, title, body }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
}) {
  const { c } = useTheme();
  return (
    <Card style={styles.card}>
      <Ionicons name={icon} size={32} color={c.mutedForeground} />
      <Text variant="heading" style={{ textAlign: 'center' }}>{title}</Text>
      {body ? <Text muted style={{ textAlign: 'center' }}>{body}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({ card: { alignItems: 'center', paddingVertical: space.xl } });
