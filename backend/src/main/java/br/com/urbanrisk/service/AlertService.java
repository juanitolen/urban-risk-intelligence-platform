package br.com.urbanrisk.service;

import br.com.urbanrisk.domain.model.Alert;
import br.com.urbanrisk.domain.model.AlertStatus;
import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.domain.model.Severity;
import br.com.urbanrisk.domain.model.SourceType;
import br.com.urbanrisk.domain.repository.AlertRepository;
import br.com.urbanrisk.domain.repository.DataSourceRepository;
import br.com.urbanrisk.domain.repository.ObservationRepository;
import br.com.urbanrisk.web.dto.AlertResponse;
import br.com.urbanrisk.web.dto.DashboardResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class AlertService {

    /** Alertas sem dados novos por este período são encerrados. */
    static final Duration STALE_AFTER = Duration.ofMinutes(15);

    private final AlertRepository alerts;
    private final ObservationRepository observations;
    private final DataSourceRepository sources;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public AlertService(AlertRepository alerts, ObservationRepository observations, DataSourceRepository sources,
                        ApplicationEventPublisher events, Clock clock) {
        this.alerts = alerts;
        this.observations = observations;
        this.sources = sources;
        this.events = events;
        this.clock = clock;
    }

    /** Lista priorizada: maior nota primeiro; em empate, o mais recente. */
    @Transactional(readOnly = true)
    public Page<Alert> search(AlertStatus status, RiskType type, double minPriority, Instant since, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Order.desc("priorityScore"), Sort.Order.desc("updatedAt")));
        // Specification monta só os filtros informados (evita parâmetros nulos no SQL, que o Postgres rejeita).
        Specification<Alert> spec = (root, q, cb) -> cb.greaterThanOrEqualTo(root.get("priorityScore"), minPriority);
        if (status != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        if (type != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("riskType"), type));
        if (since != null) spec = spec.and((root, q, cb) -> cb.greaterThan(root.get("updatedAt"), since));
        return alerts.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Alert get(long id) {
        return alerts.findById(id).orElseThrow(() -> new NoSuchElementException("Alerta " + id + " não encontrado"));
    }

    @Transactional
    public Alert resolve(long id) {
        Alert alert = get(id);
        if (alert.getStatus() == AlertStatus.ACTIVE) {
            alert.resolve(clock.instant());
            events.publishEvent(new AlertChangedEvent(AlertResponse.of(alert), false));
        }
        return alert;
    }

    @Transactional
    public int closeStale() {
        Instant now = clock.instant();
        List<Alert> stale = alerts.findByStatusAndUpdatedAtBefore(AlertStatus.ACTIVE, now.minus(STALE_AFTER));
        stale.forEach(a -> {
            a.resolve(now);
            events.publishEvent(new AlertChangedEvent(AlertResponse.of(a), false));
        });
        return stale.size();
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        Instant now = clock.instant();
        List<Alert> active = alerts.findByStatus(AlertStatus.ACTIVE);

        Map<Severity, Long> bySeverity = new EnumMap<>(Severity.class);
        for (Severity s : Severity.values()) bySeverity.put(s, 0L);
        Map<RiskType, Long> byType = new EnumMap<>(RiskType.class);
        for (RiskType t : RiskType.values()) byType.put(t, 0L);
        active.forEach(a -> {
            bySeverity.merge(a.getSeverity(), 1L, Long::sum);
            byType.merge(a.getRiskType(), 1L, Long::sum);
        });

        Map<SourceType, Long> sourcesByType = new EnumMap<>(SourceType.class);
        for (SourceType t : SourceType.values()) sourcesByType.put(t, 0L);
        sources.findAll().forEach(s -> sourcesByType.merge(s.getType(), 1L, Long::sum));

        double avgConfidence = active.stream().mapToDouble(Alert::getConfidence).average().orElse(0);
        AlertResponse top = active.stream().max(Comparator.comparingDouble(Alert::getPriorityScore))
                .map(AlertResponse::of).orElse(null);
        Instant lastObs = observations.findLatest(PageRequest.of(0, 1)).stream()
                .findFirst().map(o -> o.getReceivedAt()).orElse(null);

        return new DashboardResponse(active.size(), bySeverity, byType, sourcesByType,
                Math.round(avgConfidence * 1000) / 1000.0,
                observations.countByReceivedAtAfter(now.minus(Duration.ofHours(1))),
                lastObs, top, now);
    }
}
