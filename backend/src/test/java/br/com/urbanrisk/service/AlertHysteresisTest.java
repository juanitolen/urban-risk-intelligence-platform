package br.com.urbanrisk.service;

import br.com.urbanrisk.domain.model.DataSource;
import br.com.urbanrisk.domain.model.Observation;
import br.com.urbanrisk.domain.model.SourceType;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static br.com.urbanrisk.domain.model.RiskType.FLOOD;
import static org.assertj.core.api.Assertions.assertThat;

class AlertHysteresisTest {

    static final Instant NOW = Instant.parse("2026-11-09T15:00:00Z");
    static final DataSource SENSOR = new DataSource("s", "Sensor", SourceType.SENSOR);

    static Observation obs(double v, int minutesAgo) {
        return new Observation(SENSOR, FLOOD, v, "Sé", 0, 0, NOW.minusSeconds(minutesAgo * 60L), NOW);
    }

    @Test
    void oneLowReadingDoesNotCloseAlertWhileRecentReadingsWereHigh() {
        assertThat(IngestionService.calm(List.of(obs(60, 4), obs(55, 2), obs(3, 0)), FLOOD, NOW)).isFalse();
    }

    @Test
    void closesOnlyAfterTenCalmMinutes() {
        assertThat(IngestionService.calm(List.of(obs(60, 15), obs(8, 8), obs(3, 0)), FLOOD, NOW)).isTrue();
    }
}
