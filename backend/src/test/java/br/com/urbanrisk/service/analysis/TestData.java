package br.com.urbanrisk.service.analysis;

import br.com.urbanrisk.domain.model.DataSource;
import br.com.urbanrisk.domain.model.Observation;
import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.domain.model.SourceType;

import java.time.Instant;

final class TestData {
    static final Instant NOW = Instant.parse("2026-11-09T15:00:00Z");
    static final DataSource SENSOR = new DataSource("s1", "Sensor", SourceType.SENSOR);
    static final DataSource PUBLIC = new DataSource("p1", "CGE", SourceType.PUBLIC_DATASET);
    static final DataSource COMMUNITY = new DataSource("c1", "App", SourceType.COMMUNITY);

    static Observation obs(DataSource src, RiskType type, double value, int minutesAgo) {
        return new Observation(src, type, value, "Itaquera", -23.54, -46.45,
                NOW.minusSeconds(minutesAgo * 60L), NOW);
    }

    static Observation report(String reporter, double value, int minutesAgo) {
        Observation o = obs(COMMUNITY, RiskType.FLOOD, value, minutesAgo);
        o.setReporterHash(reporter);
        return o;
    }

    private TestData() { }
}
