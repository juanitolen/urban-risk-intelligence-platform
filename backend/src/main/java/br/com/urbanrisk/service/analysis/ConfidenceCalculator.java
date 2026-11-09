package br.com.urbanrisk.service.analysis;

import br.com.urbanrisk.domain.model.Observation;
import br.com.urbanrisk.domain.model.SourceType;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;

/**
 * Calcula o nível de confiança (0..1) de uma observação e de um conjunto de observações.
 *
 * <ul>
 *   <li><b>Confiabilidade da fonte</b>: sensores > bases públicas > comunidade.</li>
 *   <li><b>Frescor</b>: dados antigos perdem confiança (meia-vida de 30 min).</li>
 *   <li><b>Corroboração</b>: cada tipo de origem independente que confirma o mesmo evento
 *       aumenta a confiança; vários relatos comunitários distintos também.</li>
 *   <li><b>Plausibilidade</b>: leituras fisicamente improváveis são penalizadas.</li>
 * </ul>
 */
@Component
public class ConfidenceCalculator {

    static final Duration HALF_LIFE = Duration.ofMinutes(30);

    /** Confiança de uma observação isolada, antes de considerar corroboração. */
    public double single(Observation o, Instant now) {
        double base = o.getSource().getReliability();
        return clamp(base * freshness(o.getObservedAt(), now) * plausibility(o));
    }

    /**
     * Confiança agregada. Leituras repetidas do mesmo sensor (ou relatos da mesma pessoa) não são
     * evidências independentes: cada emissor conta uma vez, pela sua melhor leitura. Emissores
     * distintos se combinam como evidências parcialmente independentes, e origens de tipos
     * diferentes (sensor + base pública + comunidade) somam um pequeno bônus de diversidade.
     */
    public double aggregate(Collection<Observation> observations, Instant now) {
        if (observations.isEmpty()) return 0;
        java.util.Map<String, Double> bestPerEmitter = new java.util.HashMap<>();
        Set<SourceType> types = EnumSet.noneOf(SourceType.class);
        for (Observation o : observations) {
            types.add(o.getSource().getType());
            String emitter = o.getSource().getCode() + "|" + (o.getReporterHash() == null ? "" : o.getReporterHash());
            bestPerEmitter.merge(emitter, single(o, now), Math::max);
        }
        double disbelief = 1.0;
        double best = 0;
        for (double c : bestPerEmitter.values()) {
            disbelief *= (1 - c * 0.5); // 0.5 = emissores da mesma região não são totalmente independentes
            best = Math.max(best, c);
        }
        double combined = Math.max(1 - disbelief, best);
        return clamp(combined + (types.size() - 1) * 0.04);
    }

    static double freshness(Instant observedAt, Instant now) {
        long ageSec = Math.max(0, Duration.between(observedAt, now).getSeconds());
        return Math.pow(0.5, ageSec / (double) HALF_LIFE.getSeconds());
    }

    static double plausibility(Observation o) {
        double v = o.getValue();
        return switch (o.getRiskType()) {
            case FLOOD -> v < 0 || v > 300 ? 0.3 : 1.0;
            case HEAT_ISLAND -> v < -5 || v > 60 ? 0.3 : 1.0;
            case SERVICE_OUTAGE -> v < 0 || v > 60 * 24 * 7 ? 0.3 : 1.0;
        };
    }

    static double clamp(double v) { return Math.max(0, Math.min(0.97, v)); }
}
