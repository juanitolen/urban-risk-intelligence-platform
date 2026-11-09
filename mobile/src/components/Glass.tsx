import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { radius, useTheme } from '../theme/tokens';

/** No Android o blur precisa saber qual conteúdo desfocar (BlurTargetView). */
type ViewRef = React.ComponentRef<typeof View>;
const BlurTargetCtx = createContext<React.RefObject<ViewRef | null> | null>(null);

/**
 * Fundo vibrante (gradiente + manchas de cor) que dá profundidade ao vidro.
 * Estático de propósito: movimento contínuo no fundo cansa e atrapalha leitura.
 */
export function GlassBackground({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const target = useRef<ViewRef | null>(null);
  return (
    <View style={{ flex: 1, backgroundColor: c.bgGradient[0] }}>
      <BlurTargetView ref={target} style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={c.bgGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.blob, { backgroundColor: c.blobs[0], top: -80, left: -60, width: 280, height: 280 }]} />
        <View style={[styles.blob, { backgroundColor: c.blobs[1], top: 260, right: -90, width: 260, height: 260 }]} />
        <View style={[styles.blob, { backgroundColor: c.blobs[2], bottom: 60, left: -40, width: 220, height: 220, opacity: 0.45 }]} />
        <View style={[styles.blob, { backgroundColor: c.blobs[0], bottom: -100, right: 20, width: 240, height: 240, opacity: 0.35 }]} />
      </BlurTargetView>
      <BlurTargetCtx.Provider value={target}>{children}</BlurTargetCtx.Provider>
    </View>
  );
}

type GlassProps = ViewProps & {
  rounded?: number;
  /** Cor de preenchimento por cima do blur (ex.: tom de alerta). */
  fill?: string;
  borderColor?: string;
  intensity?: number;
  strong?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Superfície de vidro fosco: blur + preenchimento translúcido + borda clara + reflexo no topo. */
export function Glass({ rounded = radius.lg, fill, borderColor, intensity = 40, strong, style, contentStyle, children, ...rest }: GlassProps) {
  const { c, scheme } = useTheme();
  const target = useContext(BlurTargetCtx);
  return (
    <View
      style={[{ borderRadius: rounded, shadowColor: c.glassShadow, shadowOpacity: 1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 0 }, style]}
      {...rest}
    >
      <BlurView
        intensity={intensity}
        tint={scheme === 'dark' ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={target ?? undefined}
        style={[StyleSheet.absoluteFill, { borderRadius: rounded, overflow: 'hidden' }]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill ?? (strong ? c.glassFillStrong : c.glassFill) }]} />
        {/* Reflexo de luz só no vidro neutro: sobre cor sólida reduziria o contraste do texto. */}
        {!fill && <LinearGradient
          colors={[c.glassHighlight, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />}
      </BlurView>
      <View
        style={[{ borderRadius: rounded, borderWidth: 1, borderColor: borderColor ?? c.glassBorder }, contentStyle]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.55 },
});
