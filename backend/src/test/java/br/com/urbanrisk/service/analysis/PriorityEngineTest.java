package br.com.urbanrisk.service.analysis;

import br.com.urbanrisk.domain.model.Observation;
import br.com.urbanrisk.domain.model.Severity;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static br.com.urbanrisk.domain.model.RiskType.FLOOD;
import static br.com.urbanrisk.domain.model.RiskType.HEAT_ISLAND;
import static br.com.urbanrisk.service.analysis.TestData.*;
import static org.assertj.core.api.Assertions.assertThat;

class PriorityEngineTest {

    private final PriorityEngine engine = new PriorityEngine(new ConfidenceCalculator());

    private PriorityResult eval(List<Observation> recent, String region) {
        return engine.evaluate(recent.get(recent.size() - 1).getRiskType(), region, recent,
                recent.get(recent.size() - 1), NOW);
    }

    @Test
    void normalReadingsStayLowPriority() {
        List<Observation> recent = List.of(obs(SENSOR, FLOOD, 3, 20), obs(SENSOR, FLOOD, 2, 10), obs(SENSOR, FLOOD, 3, 0));
        PriorityResult r = eval(recent, "Pinheiros");
        assertThat(r.score()).isLessThan(35);
        assertThat(r.severity()).isEqualTo(Severity.LOW);
    }

    @Test
    void corroboratedCriticalFloodIsCritical() {
        List<Observation> recent = List.of(obs(SENSOR, FLOOD, 40, 15), obs(SENSOR, FLOOD, 55, 10),
                obs(PUBLIC, FLOOD, 65, 5), obs(COMMUNITY, FLOOD, 70, 1), obs(SENSOR, FLOOD, 80, 0));
        PriorityResult r = eval(recent, "Capão Redondo");
        assertThat(r.severity()).isEqualTo(Severity.CRITICAL);
        assertThat(r.factors()).anyMatch(f -> f.startsWith("Piorando"));
        assertThat(r.factors()).anyMatch(f -> f.contains("vulnerabilidade"));
    }

    @Test
    void sameEventRanksHigherInMoreVulnerableRegion() {
        List<Observation> recent = List.of(obs(SENSOR, FLOOD, 45, 5), obs(SENSOR, FLOOD, 50, 0));
        assertThat(eval(recent, "Brasilândia").score()).isGreaterThan(eval(recent, "Pinheiros").score());
    }

    @Test
    void singleCommunityReportRanksBelowConfirmedSensorReading() {
        PriorityResult rumor = eval(List.of(obs(COMMUNITY, FLOOD, 70, 0)), "Mooca");
        PriorityResult confirmed = eval(List.of(obs(SENSOR, FLOOD, 70, 0)), "Mooca");
        assertThat(confirmed.score()).isGreaterThan(rumor.score());
    }

    @Test
    void suddenJumpIsFlaggedAsAnomaly() {
        List<Observation> recent = new ArrayList<>();
        for (int i = 10; i > 0; i--) recent.add(obs(SENSOR, HEAT_ISLAND, 29 + (i % 2) * 0.5, i * 3));
        recent.add(obs(SENSOR, HEAT_ISLAND, 38, 0));
        PriorityResult r = eval(recent, "Santana");
        assertThat(r.factors()).anyMatch(f -> f.startsWith("Variação anômala"));
    }

    @Test
    void intensityIsZeroBelowAttentionAndCappedAtOne() {
        assertThat(PriorityEngine.intensity(FLOOD, 10)).isZero();
        assertThat(PriorityEngine.intensity(FLOOD, 500)).isEqualTo(1.0);
    }

    @Test
    void trendIsPositiveWhenRising() {
        List<Observation> rising = List.of(obs(SENSOR, FLOOD, 10, 10), obs(SENSOR, FLOOD, 20, 5), obs(SENSOR, FLOOD, 30, 0));
        assertThat(PriorityEngine.trendPerMinute(rising)).isEqualTo(2.0, org.assertj.core.api.Assertions.within(0.01));
    }
}
