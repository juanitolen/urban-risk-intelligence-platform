package br.com.urbanrisk.web;

import br.com.urbanrisk.domain.repository.AlertRepository;
import br.com.urbanrisk.domain.repository.ObservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired AlertRepository alerts;
    @Autowired ObservationRepository observations;

    @BeforeEach
    void clean() {
        alerts.deleteAll();
        observations.deleteAll();
    }

    private String sensor(String region, double value) {
        return """
                {"sensorCode":"s-%s","sensorName":"Sensor %s","riskType":"FLOOD","value":%s,
                 "region":"%s","latitude":-23.67,"longitude":-46.77}
                """.formatted(region, region, value, region);
    }

    @Test
    void sensorIngestRequiresApiKey() throws Exception {
        mvc.perform(post("/api/v1/ingest/sensor").contentType(MediaType.APPLICATION_JSON).content(sensor("Sé", 50)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void criticalReadingOpensAlertWithSourceAndConfidence() throws Exception {
        for (double v : new double[]{40, 60, 85}) {
            mvc.perform(post("/api/v1/ingest/sensor").header("X-API-Key", "test-key")
                            .contentType(MediaType.APPLICATION_JSON).content(sensor("Capão Redondo", v)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.confidence", greaterThan(0.8)));
        }
        mvc.perform(get("/api/v1/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].region").value("Capão Redondo"))
                .andExpect(jsonPath("$.items[0].sources[0]").value("SENSOR"))
                .andExpect(jsonPath("$.items[0].primarySource").value("Sensor Capão Redondo"))
                .andExpect(jsonPath("$.items[0].confidence", greaterThan(0.8)))
                .andExpect(jsonPath("$.items[0].factors", not(empty())))
                .andExpect(jsonPath("$.items[0].severity", is(oneOf("HIGH", "CRITICAL"))));
    }

    @Test
    void alertsAreSortedByPriority() throws Exception {
        mvc.perform(post("/api/v1/ingest/sensor").header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON).content(sensor("Pinheiros", 40)));
        mvc.perform(post("/api/v1/ingest/sensor").header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON).content(sensor("Brasilândia", 90)));
        mvc.perform(get("/api/v1/alerts"))
                .andExpect(jsonPath("$.items[0].region").value("Brasilândia"));
    }

    @Test
    void communityReportIsAnonymizedBeforePersisting() throws Exception {
        mvc.perform(post("/api/v1/ingest/community").contentType(MediaType.APPLICATION_JSON).content("""
                        {"riskType":"FLOOD","level":"HIGH","latitude":-23.539712,"longitude":-46.456011,
                         "description":"Rua alagada, contato maria@ex.com","reporterId":"device-9"}
                        """))
                .andExpect(status().isCreated());
        var saved = observations.findAll().get(0);
        assertThat(saved.getReporterHash()).hasSize(64).isNotEqualTo("device-9");
        assertThat(saved.getDescription()).doesNotContain("maria@ex.com");
        assertThat(saved.getLatitude()).isEqualTo(-23.540);
        assertThat(saved.getRegion()).isEqualTo("Itaquera");
    }

    @Test
    void invalidReportReturnsProblemDetail() throws Exception {
        mvc.perform(post("/api/v1/ingest/community").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"riskType\":\"FLOOD\",\"latitude\":200}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.level").exists())
                .andExpect(jsonPath("$.fields.latitude").exists());
    }

    @Test
    void dashboardAndPingRespond() throws Exception {
        mvc.perform(get("/api/v1/dashboard")).andExpect(status().isOk())
                .andExpect(jsonPath("$.serverTime").exists())
                .andExpect(jsonPath("$.bySeverity.CRITICAL").exists());
        mvc.perform(get("/api/v1/ping")).andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void resolvingAlertRemovesItFromActiveList() throws Exception {
        mvc.perform(post("/api/v1/ingest/sensor").header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON).content(sensor("Mooca", 95)));
        long id = alerts.findAll().get(0).getId();
        mvc.perform(patch("/api/v1/alerts/{id}/resolve", id)).andExpect(jsonPath("$.status").value("RESOLVED"));
        mvc.perform(get("/api/v1/alerts")).andExpect(jsonPath("$.items", hasSize(0)));
    }
}
