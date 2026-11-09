import { useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import { ApiClient, defaultApiUrl } from '../../api/client';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { Segmented } from '../../components/Segmented';
import { Text } from '../../components/Text';
import { useLiveData } from '../../state/LiveData';
import { radius, space, type as typeScale, useTheme } from '../../theme/tokens';

const STATUS_LABEL = { connecting: 'conectando', online: 'conectado', unstable: 'instável', offline: 'desconectado' } as const;

export default function Settings() {
  const { settings, updateSettings, connection } = useLiveData();
  const { c } = useTheme();
  const [url, setUrl] = useState(settings.apiUrl);
  const [test, setTest] = useState<string | null>(null);

  const testUrl = async () => {
    setTest('Testando…');
    const started = Date.now();
    try {
      await new ApiClient(url).ping();
      setTest(`Servidor respondeu em ${Date.now() - started} ms.`);
    } catch {
      setTest('Servidor não respondeu nesse endereço.');
    }
  };

  return (
    <Screen title="Ajustes">
      <View style={styles.section}>
        <Text variant="heading" accessibilityRole="header">Como você usa o app?</Text>
        <Segmented label="Perfil" value={settings.profile} onChange={(profile) => updateSettings({ profile })}
          options={[{ value: 'resident', label: 'Morador' }, { value: 'agent', label: 'Agente local' }]} />
        <Text variant="caption" muted>
          {settings.profile === 'agent'
            ? 'Mostra fontes conectadas, todos os fatores da análise e permite encerrar alertas resolvidos.'
            : 'Mostra o essencial: o que está acontecendo perto de você e o que fazer.'}
        </Text>
      </View>

      <Card style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold" nativeID="notifLabel">Notificações de alerta</Text>
          <Text variant="caption" muted>Avisa quando surge um alerta alto ou crítico, ou quando um alerta piora.</Text>
        </View>
        <Switch
          accessibilityLabelledBy="notifLabel"
          accessibilityLabel="Notificações de alerta"
          value={settings.notifications}
          onValueChange={(notifications) => updateSettings({ notifications })}
          trackColor={{ true: c.accent, false: c.borderStrong }}
        />
      </Card>

      <View style={styles.section}>
        <Text variant="heading" accessibilityRole="header" nativeID="urlLabel">Servidor</Text>
        <TextInput
          accessibilityLabelledBy="urlLabel"
          accessibilityLabel="Endereço do servidor"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[styles.input, typeScale.body, { color: c.foreground, borderColor: c.glassBorder, backgroundColor: c.glassFillStrong }]}
        />
        <Text variant="caption" muted>Estado: {STATUS_LABEL[connection.status]} · padrão detectado: {defaultApiUrl()}</Text>
        <View style={styles.buttons}>
          <View style={{ flex: 1 }}><Button kind="secondary" label="Testar" onPress={testUrl} /></View>
          <View style={{ flex: 1 }}><Button label="Salvar" onPress={() => updateSettings({ apiUrl: url.trim() })} /></View>
        </View>
        {test && <Text variant="caption" accessibilityLiveRegion="polite">{test}</Text>}
      </View>

      <Card>
        <Text variant="bodyBold">Privacidade (LGPD)</Text>
        <Text variant="caption" muted>
          Seus relatos são anônimos: o servidor guarda só um código embaralhado (hash) no lugar do identificador do
          aparelho, arredonda a localização para cerca de 100 m e remove telefones, e-mails e documentos do texto.
          Os registros são apagados depois de 30 dias.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md },
  buttons: { flexDirection: 'row', gap: space.sm },
});
