package br.com.urbanrisk.web.controller;

import br.com.urbanrisk.domain.model.AlertStatus;
import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.service.AlertService;
import br.com.urbanrisk.web.dto.AlertResponse;
import br.com.urbanrisk.web.dto.PageResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Clock;
import java.time.Instant;

/** Alertas ordenados por prioridade (maior primeiro). */
@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final AlertService alerts;
    private final Clock clock;

    public AlertController(AlertService alerts, Clock clock) {
        this.alerts = alerts;
        this.clock = clock;
    }

    /**
     * @param since devolve apenas alertas alterados depois deste instante (sincronização incremental do app)
     */
    @GetMapping
    public PageResponse<AlertResponse> list(@RequestParam(defaultValue = "ACTIVE") AlertStatus status,
                                            @RequestParam(required = false) RiskType riskType,
                                            @RequestParam(defaultValue = "0") double minPriority,
                                            @RequestParam(required = false)
                                            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "50") int size) {
        return PageResponse.of(alerts.search(status, riskType, minPriority, since, page, size),
                AlertResponse::of, clock.instant());
    }

    @GetMapping("/{id}")
    public AlertResponse get(@PathVariable long id) {
        return AlertResponse.of(alerts.get(id));
    }

    @PatchMapping("/{id}/resolve")
    public AlertResponse resolve(@PathVariable long id) {
        return AlertResponse.of(alerts.resolve(id));
    }
}
