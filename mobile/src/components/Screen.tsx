import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLiveData } from '../state/LiveData';
import { space, TAB_BAR_SPACE, useTheme } from '../theme/tokens';
import { ConnectionBanner } from './ConnectionBanner';
import { GlassBackground } from './Glass';
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
        <Text variant="display" accessibilityRole="header">{title}</Text>
        {typeof subtitle === 'string' ? <Text variant="caption" muted>{subtitle}</Text> : subtitle}
      </View>
      {right}
    </View>
  );
  return (
    <GlassBackground>
      <SafeAreaView edges={['top']} style={styles.root}>
        <ConnectionBanner />
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACE }]}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={refresh} tintColor={c.accent} colors={[c.accent]}
                accessibilityLabel={connection.status === 'online' ? 'Atualizar' : 'Tentar reconectar'} />
            }
          >
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1, paddingBottom: 0 }]}>
            {header}
            {children}
          </View>
        )}
      </SafeAreaView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
});
