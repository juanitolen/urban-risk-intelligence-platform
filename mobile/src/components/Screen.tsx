import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLiveData } from '../state/LiveData';
import { space, useTheme } from '../theme/tokens';
import { ConnectionBanner } from './ConnectionBanner';
import { Text } from './Text';

export function Screen({ title, subtitle, children, scroll = true, right }: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  right?: React.ReactNode;
}) {
  const { c } = useTheme();
  const { refresh, connection } = useLiveData();
  const header = (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="title" accessibilityRole="header">{title}</Text>
        {typeof subtitle === 'string' ? <Text variant="caption" muted>{subtitle}</Text> : subtitle}
      </View>
      {right}
    </View>
  );
  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: c.background }]}>
      <ConnectionBanner />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refresh} tintColor={c.accent} colors={[c.accent]}
              accessibilityLabel={connection.status === 'online' ? 'Atualizar' : 'Tentar reconectar'} />
          }
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
});
