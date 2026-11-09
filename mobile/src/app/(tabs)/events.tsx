import { FlatList, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';
import type { RiskType } from '../../api/types';
import { AlertCard } from '../../components/AlertCard';
import { EmptyState } from '../../components/EmptyState';
import { EventsMap } from '../../components/EventsMap';
import { LiveIndicator } from '../../components/LiveIndicator';
import { Screen } from '../../components/Screen';
import { FilterChips, Segmented } from '../../components/Segmented';
import { useLiveData, useNow } from '../../state/LiveData';
import { space } from '../../theme/tokens';

type Filter = 'ALL' | RiskType;

export default function Events() {
  const { alerts, refresh } = useLiveData();
  const now = useNow();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filter, setFilter] = useState<Filter>('ALL');
  const visible = useMemo(() => (filter === 'ALL' ? alerts : alerts.filter((a) => a.riskType === filter)), [alerts, filter]);

  return (
    <Screen title="Eventos" subtitle={<LiveIndicator />} scroll={false}>
      <Segmented label="Modo de visualização" value={view} onChange={setView}
        options={[{ value: 'list', label: 'Lista' }, { value: 'map', label: 'Mapa' }]} />
      <FilterChips label="Filtrar por tipo de risco" value={filter} onChange={setFilter} options={[
        { value: 'ALL', label: 'Todos' },
        { value: 'FLOOD', label: 'Alagamento' },
        { value: 'HEAT_ISLAND', label: 'Calor' },
        { value: 'SERVICE_OUTAGE', label: 'Serviços' },
      ]} />
      {view === 'map' ? (
        <EventsMap alerts={visible} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          data={visible}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => <AlertCard alert={item} now={now} />}
          ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
          onRefresh={refresh}
          refreshing={false}
          ListEmptyComponent={<EmptyState icon="shield-checkmark" title="Nenhum alerta ativo"
            body="Quando sensores, bases públicas ou moradores indicarem risco, ele aparece aqui, do mais urgente para o menos urgente." />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { paddingBottom: space.xxl } });
