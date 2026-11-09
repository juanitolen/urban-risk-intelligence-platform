package br.com.urbanrisk.service.analysis;

import org.junit.jupiter.api.Test;

import java.util.List;

import static br.com.urbanrisk.domain.model.RiskType.FLOOD;
import static br.com.urbanrisk.service.analysis.TestData.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class ConfidenceCalculatorTest {

    private final ConfidenceCalculator calc = new ConfidenceCalculator();

    @Test
    void sensorIsMoreReliableThanCommunity() {
        assertThat(calc.single(obs(SENSOR, FLOOD, 40, 0), NOW))
                .isGreaterThan(calc.single(obs(COMMUNITY, FLOOD, 40, 0), NOW));
    }

    @Test
    void confidenceHalvesAfterThirtyMinutes() {
        double fresh = calc.single(obs(SENSOR, FLOOD, 40, 0), NOW);
        double old = calc.single(obs(SENSOR, FLOOD, 40, 30), NOW);
        assertThat(old).isCloseTo(fresh / 2, within(0.01));
    }

    @Test
    void implausibleReadingIsPenalized() {
        assertThat(calc.single(obs(SENSOR, FLOOD, 900, 0), NOW)).isLessThan(0.3);
    }

    @Test
    void independentSourcesCorroborateEachOther() {
        double alone = calc.aggregate(List.of(obs(COMMUNITY, FLOOD, 50, 0)), NOW);
        double corroborated = calc.aggregate(List.of(obs(COMMUNITY, FLOOD, 50, 0),
                obs(SENSOR, FLOOD, 48, 1), obs(PUBLIC, FLOOD, 52, 2)), NOW);
        assertThat(corroborated).isGreaterThan(alone + 0.2);
    }

    @Test
    void repeatedReportsFromSamePersonDoNotInflateConfidence() {
        double distinct = calc.aggregate(List.of(report("a", 50, 0), report("b", 50, 0), report("c", 50, 0)), NOW);
        double spam = calc.aggregate(List.of(report("a", 50, 0), report("a", 50, 0), report("a", 50, 0)), NOW);
        assertThat(spam).isLessThan(distinct);
    }

    @Test
    void confidenceNeverReachesCertainty() {
        List<br.com.urbanrisk.domain.model.Observation> many = java.util.stream.IntStream.range(0, 50)
                .mapToObj(i -> obs(SENSOR, FLOOD, 50, 0)).toList();
        assertThat(calc.aggregate(many, NOW)).isLessThan(1.0);
    }
}
