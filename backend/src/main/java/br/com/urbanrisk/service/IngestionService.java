package br.com.urbanrisk.service;

import br.com.urbanrisk.domain.model.*;
import br.com.urbanrisk.domain.repository.AlertRepository;
import br.com.urbanrisk.domain.repository.DataSourceRepository;
import br.com.urbanrisk.domain.repository.ObservationRepository;
import br.com.urbanrisk.service.analysis.ConfidenceCalculator;
import br.com.urbanrisk.service.analysis.PriorityEngine;
import br.com.urbanrisk.service.analysis.PriorityResult;
import br.com.urbanrisk.service.privacy.PrivacyGuard;
import br.com.urbanrisk.web.dto.AlertResponse;
import br.com.urbanrisk.web.dto.IngestionResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Recebe dados de qualquer origem, normaliza, anonimiza, persiste e reavalia o alerta
 * da região/risco correspondente.
 */
@Service
public class IngestionService {

    /** Janela de análise usada pelo motor de priorização. */
    static final Duration WINDOW = Duration.ofMinutes(60);
    /** Nota mínima para abrir um alerta novo. */
    static final double OPEN_THRESHOLD = 35;
    /** Abaixo desta nota, um alerta ativo é encerrado automaticamente. */
    static final double CLOSE_THRESHOLD = 20;

    private final DataSourceRepository sources;
    private final ObservationRepository observations;
    private final AlertRepository alerts;
    private final ConfidenceCalculator confidence;
    private final PriorityEngine priority;
    private final PrivacyGuard privacy;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public IngestionService(DataSourceRepository sources, ObservationRepository observations, AlertRepository alerts,
                            ConfidenceCalculator confidence, PriorityEngine priority, PrivacyGuard privacy,
                            ApplicationEventPublisher events, Clock clock) {
        this.sources = sources;
        this.observations = observations;
        this.alerts = alerts;
        this.confidence = confidence;
        this.priority = priority;
        this.privacy = privacy;
        this.events = events;
        this.clock = clock;
    }

    @Transactional
    public IngestionResponse ingest(IngestCommand cmd) {
        Instant now = clock.instant();
        DataSource source = sources.findByCode(cmd.sourceCode())
                .orElseGet(() -> sources.save(new DataSource(cmd.sourceCode(),
                        cmd.sourceName() == null ? cmd.sourceCode() : cmd.sourceName(), cmd.sourceType())));
        source.touch(now);

        double lat = privacy.coarsen(cmd.latitude());
        double lng = privacy.coarsen(cmd.longitude());
        String region = resolveRegion(cmd.region(), lat, lng);
        Instant observedAt = cmd.observedAt() == null || cmd.observedAt().isAfter(now) ? now : cmd.observedAt();

        Observation obs = new Observation(source, cmd.riskType(), cmd.value(), region, lat, lng, observedAt, now);
        obs.setReporterHash(privacy.pseudonymize(cmd.reporterId()));
        obs.setDescription(privacy.redact(cmd.description()));
        obs.setConfidence(round3(confidence.single(obs, now)));
        observations.save(obs);

        AlertResponse alert = reevaluate(cmd.riskType(), region, obs, now);
        return new IngestionResponse(obs.getId(), obs.getConfidence(), alert);
    }

    private AlertResponse reevaluate(RiskType type, String region, Observation latest, Instant now) {
        List<Observation> recent = observations.findRecent(region, type, now.minus(WINDOW));
        if (recent.stream().noneMatch(o -> o == latest || o.getId().equals(latest.getId()))) {
            recent = new java.util.ArrayList<>(recent);
            recent.add(latest);
        }
        PriorityResult result = priority.evaluate(type, region, recent, latest, now);

        Alert alert = alerts.findFirstByRegionAndRiskTypeAndStatus(region, type, AlertStatus.ACTIVE).orElse(null);
        boolean created = false;
        if (alert == null) {
            if (result.score() < OPEN_THRESHOLD) return null;
            alert = new Alert(type, region, latest.getLatitude(), latest.getLongitude(), now);
            alert.setPeakValue(latest.getValue());
            created = true;
        }

        apply(alert, result, recent, latest, now);
        if (!created && result.score() < CLOSE_THRESHOLD) {
            alert.resolve(now);
        }
        alerts.save(alert);
        AlertResponse response = AlertResponse.of(alert);
        events.publishEvent(new AlertChangedEvent(response, created));
        return response;
    }

    private void apply(Alert alert, PriorityResult r, List<Observation> recent, Observation latest, Instant now) {
        alert.setPriorityScore(r.score());
        alert.setSeverity(r.severity());
        alert.setConfidence(r.confidence());
        alert.setLatestValue(latest.getValue());
        alert.setPeakValue(Math.max(alert.getPeakValue(), latest.getValue()));
        alert.setObservationCount(recent.size());
        alert.setExplanation(r.explanation());
        Set<SourceType> types = recent.stream().map(o -> o.getSource().getType())
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(SourceType.class)));
        alert.setSourceTypes(types.stream().map(Enum::name).collect(Collectors.joining(",")));
        recent.stream().map(Observation::getSource)
                .max(Comparator.comparingDouble(DataSource::getReliability))
                .ifPresent(s -> alert.setPrimarySource(s.getName()));
        alert.setLatitude(round4(recent.stream().mapToDouble(Observation::getLatitude).average().orElse(alert.getLatitude())));
        alert.setLongitude(round4(recent.stream().mapToDouble(Observation::getLongitude).average().orElse(alert.getLongitude())));
        alert.setUpdatedAt(now);
    }

    static String resolveRegion(String informed, double lat, double lng) {
        if (informed != null && !informed.isBlank()) {
            return Region.byLabel(informed.trim()).map(Region::label).orElse(informed.trim());
        }
        return Region.nearest(lat, lng).label();
    }

    private static double round3(double v) { return Math.round(v * 1000) / 1000.0; }
    private static double round4(double v) { return Math.round(v * 10000) / 10000.0; }
}
