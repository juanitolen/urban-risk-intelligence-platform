package br.com.urbanrisk.web.controller;

import br.com.urbanrisk.domain.repository.DataSourceRepository;
import br.com.urbanrisk.domain.repository.ObservationRepository;
import br.com.urbanrisk.realtime.AlertStreamBroadcaster;
import br.com.urbanrisk.service.AlertService;
import br.com.urbanrisk.web.dto.DashboardResponse;
import br.com.urbanrisk.web.dto.ObservationResponse;
import br.com.urbanrisk.web.dto.PageResponse;
import br.com.urbanrisk.web.dto.SourceResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Clock;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class QueryController {

    private final AlertService alerts;
    private final ObservationRepository observations;
    private final DataSourceRepository sources;
    private final AlertStreamBroadcaster stream;
    private final Clock clock;

    public QueryController(AlertService alerts, ObservationRepository observations, DataSourceRepository sources,
                           AlertStreamBroadcaster stream, Clock clock) {
        this.alerts = alerts;
        this.observations = observations;
        this.sources = sources;
        this.stream = stream;
        this.clock = clock;
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return alerts.dashboard();
    }

    @GetMapping("/observations")
    @Transactional(readOnly = true)
    public PageResponse<ObservationResponse> observations(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "30") int size) {
        return PageResponse.of(observations.findLatest(PageRequest.of(page, Math.min(Math.max(size, 1), 100))),
                ObservationResponse::of, clock.instant());
    }

    @GetMapping("/sources")
    public List<SourceResponse> sources() {
        return sources.findAll().stream().map(SourceResponse::of).toList();
    }

    /** Usado pelo app para medir latência e detectar desconexão. */
    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of("status", "UP", "serverTime", clock.instant().toString(), "streamSubscribers", stream.subscribers());
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return stream.subscribe();
    }
}
