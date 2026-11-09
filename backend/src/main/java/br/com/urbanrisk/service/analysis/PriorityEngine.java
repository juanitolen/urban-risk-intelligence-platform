package br.com.urbanrisk.service.analysis;

import br.com.urbanrisk.domain.model.Observation;
import br.com.urbanrisk.domain.model.Region;
import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.domain.model.Severity;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Motor de análise que prioriza alertas (recurso de IA/analytics da plataforma).
 *
 * <p>Score final (0..100) = soma ponderada de cinco fatores explicáveis:</p>
 * <ol>
 *   <li><b>Intensidade</b> (35%): quanto o valor atual ultrapassa o limiar de atenção, normalizado
 *       entre o limiar de atenção e o crítico de cada tipo de risco.</li>
 *   <li><b>Anomalia</b> (20%): z-score do valor atual frente ao histórico recente da mesma
 *       região/risco — detecta mudanças bruscas mesmo abaixo do limiar.</li>
 *   <li><b>Tendência</b> (15%): inclinação (regressão linear) das últimas leituras — piora rápida
 *       antecipa o alerta.</li>
 *   <li><b>Vulnerabilidade</b> (15%): índice social da região.</li>
 *   <li><b>Confiança</b> (15%): confiança agregada das fontes.</li>
 * </ol>
 * <p>A nota é então multiplicada pela confiança (um alerta pouco confiável não pode ficar no topo
 * só porque um único relato exagerou).</p>
 */
@Component
public class PriorityEngine {

    static final double W_INTENSITY = 0.35;
    static final double W_ANOMALY = 0.20;
    static final double W_TREND = 0.15;
    static final double W_VULNERABILITY = 0.15;
    static final double W_CONFIDENCE = 0.15;

    private final ConfidenceCalculator confidenceCalculator;

    public PriorityEngine(ConfidenceCalculator confidenceCalculator) {
        this.confidenceCalculator = confidenceCalculator;
    }

    /**
     * @param recent observações recentes da mesma região e tipo (qualquer ordem), incluindo a atual
     * @param latest a observação que disparou a avaliação
     */
    public PriorityResult evaluate(RiskType type, String regionLabel, List<Observation> recent,
                                   Observation latest, Instant now) {
        List<String> factors = new ArrayList<>();
        double current = latest.getValue();

        double intensity = intensity(type, current);
        if (intensity > 0) {
            factors.add(String.format("Intensidade %.0f%s (%.0f%% do nível crítico)",
                    current, type.unit(), 100 * current / type.criticalThreshold()));
        }

        double z = zScore(recent, current);
        double anomaly = clamp01(z / 3.0);
        if (z >= 2) factors.add(String.format("Variação anômala (z=%.1f)", z));

        double slopePerMin = trendPerMinute(recent);
        double range = type.criticalThreshold() - type.attentionThreshold();
        double trend = clamp01(slopePerMin * 15 / range); // piora prevista em 15 min
        if (trend > 0.2) factors.add(String.format("Piorando %.1f%s/min", slopePerMin, type.unit()));

        double vulnerability = Region.byLabel(regionLabel).map(Region::vulnerability).orElse(0.5);
        if (vulnerability >= 0.7) factors.add("Região de alta vulnerabilidade social");

        double confidence = confidenceCalculator.aggregate(recent, now);
        factors.add(String.format("Confiança %.0f%% (%d registros)", confidence * 100, recent.size()));

        double raw = 100 * (W_INTENSITY * intensity + W_ANOMALY * anomaly + W_TREND * trend
                + W_VULNERABILITY * vulnerability + W_CONFIDENCE * confidence);
        // Sem intensidade nem anomalia relevantes, o risco é apenas informativo.
        if (intensity == 0 && anomaly < 0.5) raw = Math.min(raw, 30);
        double score = round1(raw * (0.5 + 0.5 * confidence));

        return new PriorityResult(score, Severity.fromScore(score), round3(confidence), factors);
    }

    static double intensity(RiskType type, double value) {
        if (value <= type.attentionThreshold()) return 0;
        double span = type.criticalThreshold() - type.attentionThreshold();
        return clamp01((value - type.attentionThreshold()) / span * 0.8 + 0.2);
    }

    /** z-score do valor atual frente às leituras anteriores (exclui a última). */
    static double zScore(List<Observation> recent, double current) {
        if (recent.size() < 4) return 0;
        List<Observation> history = recent.stream()
                .sorted(Comparator.comparing(Observation::getObservedAt))
                .toList();
        history = history.subList(0, history.size() - 1);
        double mean = history.stream().mapToDouble(Observation::getValue).average().orElse(current);
        double var = history.stream().mapToDouble(o -> Math.pow(o.getValue() - mean, 2)).sum() / history.size();
        double sd = Math.max(Math.sqrt(var), 1.0); // evita explosão com séries constantes
        return Math.max(0, (current - mean) / sd);
    }

    /** Inclinação (unidades por minuto) por mínimos quadrados. */
    static double trendPerMinute(List<Observation> recent) {
        if (recent.size() < 3) return 0;
        Instant t0 = recent.stream().map(Observation::getObservedAt).min(Instant::compareTo).orElseThrow();
        double n = recent.size(), sx = 0, sy = 0, sxx = 0, sxy = 0;
        for (Observation o : recent) {
            double x = Duration.between(t0, o.getObservedAt()).toMillis() / 60000.0;
            double y = o.getValue();
            sx += x; sy += y; sxx += x * x; sxy += x * y;
        }
        double den = n * sxx - sx * sx;
        if (Math.abs(den) < 1e-9) return 0;
        return (n * sxy - sx * sy) / den;
    }

    static double clamp01(double v) { return Math.max(0, Math.min(1, v)); }
    static double round1(double v) { return Math.round(v * 10) / 10.0; }
    static double round3(double v) { return Math.round(v * 1000) / 1000.0; }
}
