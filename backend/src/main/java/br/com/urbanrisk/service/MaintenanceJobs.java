package br.com.urbanrisk.service;

import br.com.urbanrisk.domain.repository.ObservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;

/** Rotinas de manutenção: encerra alertas parados e aplica a política de retenção (LGPD). */
@Component
public class MaintenanceJobs {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceJobs.class);

    private final AlertService alertService;
    private final ObservationRepository observations;
    private final Clock clock;
    private final Duration retention;

    public MaintenanceJobs(AlertService alertService, ObservationRepository observations, Clock clock,
                           @Value("${urbanrisk.privacy.retention-days:30}") long retentionDays) {
        this.alertService = alertService;
        this.observations = observations;
        this.clock = clock;
        this.retention = Duration.ofDays(retentionDays);
    }

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
    public void closeStaleAlerts() {
        int closed = alertService.closeStale();
        if (closed > 0) log.info("{} alerta(s) sem dados novos encerrado(s)", closed);
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeOldObservations() {
        long removed = observations.deleteByReceivedAtBefore(clock.instant().minus(retention));
        log.info("Retenção: {} observação(ões) antiga(s) removida(s)", removed);
    }
}
