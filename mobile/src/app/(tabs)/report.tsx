import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { CommunityReport, RiskType } from '../../api/types';
import { ApiError } from '../../api/client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Glass } from '../../components/Glass';
import { Screen } from '../../components/Screen';
import { FilterChips } from '../../components/Segmented';
import { Text } from '../../components/Text';
import { RISK_LABEL } from '../../logic/format';
import { REGIONS } from '../../logic/regions';
import { useLiveData } from '../../state/LiveData';
import { radius, RISK_ICON, space, type as typeScale, useTheme } from '../../theme/tokens';

type Level = CommunityReport['level'];

const LEVELS: Record<RiskType, { value: Level; label: string }[]> = {
  FLOOD: [
    { value: 'LOW', label: 'Poças, sem risco' },
    { value: 'MEDIUM', label: 'Água na calçada' },
    { value: 'HIGH', label: 'Rua intransitável' },
  ],
  HEAT_ISLAND: [
    { value: 'LOW', label: 'Quente' },
    { value: 'MEDIUM', label: 'Muito quente' },
    { value: 'HIGH', label: 'Insuportável' },
  ],
  SERVICE_OUTAGE: [
    { value: 'LOW', label: 'Instável' },
    { value: 'MEDIUM', label: 'Caiu há pouco' },
    { value: 'HIGH', label: 'Sem serviço há horas' },
  ],
};

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'queued' } | { kind: 'error'; message: string };

export default function Report() {
  const { sendReport } = useLiveData();
  const { c } = useTheme();
  const [risk, setRisk] = useState<RiskType | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const params = useLocalSearchParams<{ risk?: RiskType }>();

  // Atalho vindo do menu gooey: já abre com o tipo de risco escolhido.
  useEffect(() => {
    if (params.risk && params.risk in RISK_LABEL) {
      setRisk(params.risk);
      setLevel(null);
      setStatus({ kind: 'idle' });
    }
  }, [params.risk]);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setStatus({ kind: 'error', message: 'Sem permissão de localização. Escolha o bairro na lista.' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setRegion(null);
    } catch {
      setStatus({ kind: 'error', message: 'Não foi possível obter a localização. Escolha o bairro na lista.' });
    } finally {
      setLocating(false);
    }
  };

  const canSend = risk && level && (coords || region);

  const submit = async () => {
    if (!risk || !level) return;
    const r = REGIONS.find((x) => x.label === region);
    const lat = coords?.lat ?? r?.lat;
    const lng = coords?.lng ?? r?.lng;
    if (lat == null || lng == null) return;
    setStatus({ kind: 'sending' });
    try {
      const result = await sendReport({
        riskType: risk, level, latitude: lat, longitude: lng,
        region: region ?? undefined, description: description.trim() || undefined,
      });
      setStatus({ kind: result });
      setRisk(null); setLevel(null); setDescription('');
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof ApiError ? e.message : 'Não foi possível enviar.' });
    }
  };

  return (
    <Screen title="Relatar um problema" subtitle="Leva menos de 30 segundos. Seu relato é anônimo.">
      {status.kind === 'sent' && <Feedback icon="checkmark-circle" color={c.success} bg={c.successSurface}
        text="Relato enviado. Obrigado! Ele já entra na análise de prioridade." />}
      {status.kind === 'queued' && <Feedback icon="time" color={c.warning} bg={c.warningSurface}
        text="Sem conexão agora. Guardamos seu relato e enviamos sozinhos quando a conexão voltar." />}
      {status.kind === 'error' && <Feedback icon="alert-circle" color={c.danger} bg={c.dangerSurface} text={status.message} />}

      <View style={styles.step}>
        <Text variant="heading" accessibilityRole="header">1. O que está acontecendo?</Text>
        <View style={styles.riskGrid}>
          {(Object.keys(RISK_LABEL) as RiskType[]).map((t) => {
            const active = risk === t;
            return (
              <Pressable key={t} onPress={() => { setRisk(t); setLevel(null); setStatus({ kind: 'idle' }); }}
                accessibilityRole="radio" accessibilityState={{ checked: active }} accessibilityLabel={RISK_LABEL[t]}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}>
                <Glass rounded={radius.lg} fill={active ? c.accent : undefined} borderColor={active ? c.accent : undefined}
                  contentStyle={styles.riskTile}>
                  <Ionicons name={RISK_ICON[t]} size={28} color={active ? c.onAccent : c.accent} />
                  <Text variant="label" color={active ? c.onAccent : c.foreground} style={{ textAlign: 'center' }}>{RISK_LABEL[t]}</Text>
                </Glass>
              </Pressable>
            );
          })}
        </View>
      </View>

      {risk && (
        <View style={styles.step}>
          <Text variant="heading" accessibilityRole="header">2. Qual a gravidade?</Text>
          <FilterChips label="Gravidade" value={level ?? ('' as Level)} onChange={setLevel} options={LEVELS[risk]} />
        </View>
      )}

      {risk && level && (
        <View style={styles.step}>
          <Text variant="heading" accessibilityRole="header">3. Onde?</Text>
          <Button kind="secondary" icon={coords ? 'checkmark-circle' : 'locate'} loading={locating}
            label={coords ? 'Localização aproximada registrada' : 'Usar minha localização'} onPress={useMyLocation}
            accessibilityHint="Registra sua posição arredondada em cerca de 100 metros" />
          <Text variant="caption" muted>Ou escolha o bairro:</Text>
          <FilterChips label="Bairro" value={region ?? ''} onChange={(v) => { setRegion(v); setCoords(null); }}
            options={REGIONS.map((r) => ({ value: r.label, label: r.label }))} />
        </View>
      )}

      {canSend && (
        <View style={styles.step}>
          <Text variant="heading" nativeID="descLabel">4. Detalhes (opcional)</Text>
          <TextInput
            accessibilityLabelledBy="descLabel"
            accessibilityLabel="Detalhes do relato"
            value={description}
            onChangeText={setDescription}
            placeholder="Ex.: água cobrindo a roda dos carros na esquina"
            placeholderTextColor={c.mutedForeground}
            multiline
            maxLength={280}
            style={[styles.input, typeScale.body, { color: c.foreground, borderColor: c.glassBorder, backgroundColor: c.glassFillStrong }]}
          />
          <Text variant="caption" muted>Não escreva nome, telefone ou documento — se escrever, removemos antes de salvar.</Text>
          <Button label="Enviar relato" icon="send" onPress={submit} loading={status.kind === 'sending'} />
        </View>
      )}
    </Screen>
  );
}

function Feedback({ icon, color, bg, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string; text: string }) {
  return (
    <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: bg, borderColor: color }}
      accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name={icon} size={24} color={color} />
      <Text style={{ flex: 1 }}>{text}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  step: { gap: space.sm },
  riskGrid: { flexDirection: 'row', gap: space.sm },
  riskTile: { minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: space.xs, padding: space.sm },
  input: { minHeight: 96, borderWidth: 1, borderRadius: radius.md, padding: space.md, textAlignVertical: 'top' },
});
