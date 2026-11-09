package br.com.urbanrisk.web.controller;

import br.com.urbanrisk.domain.model.SourceType;
import br.com.urbanrisk.service.IngestCommand;
import br.com.urbanrisk.service.IngestionService;
import br.com.urbanrisk.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/** Entrada de dados das três origens. */
@RestController
@RequestMapping("/api/v1/ingest")
public class IngestionController {

    private final IngestionService ingestion;

    public IngestionController(IngestionService ingestion) {
        this.ingestion = ingestion;
    }

    @PostMapping("/sensor")
    @ResponseStatus(HttpStatus.CREATED)
    public IngestionResponse sensor(@Valid @RequestBody SensorReadingRequest r) {
        return ingestion.ingest(new IngestCommand(r.sensorCode(), r.sensorName(), SourceType.SENSOR, r.riskType(),
                r.value(), r.region(), r.latitude(), r.longitude(), r.observedAt(), null, null));
    }

    @PostMapping("/public")
    @ResponseStatus(HttpStatus.CREATED)
    public BatchIngestionResponse publicDataset(@Valid @RequestBody PublicDataRequest r) {
        int touched = 0;
        for (PublicDataRequest.Record rec : r.records()) {
            IngestionResponse res = ingestion.ingest(new IngestCommand(r.datasetCode(), r.datasetName(),
                    SourceType.PUBLIC_DATASET, rec.riskType(), rec.value(), rec.region(), rec.latitude(),
                    rec.longitude(), rec.observedAt(), null, null));
            if (res.alert() != null) touched++;
        }
        return new BatchIngestionResponse(r.records().size(), touched);
    }

    @PostMapping("/community")
    @ResponseStatus(HttpStatus.CREATED)
    public IngestionResponse community(@Valid @RequestBody CommunityReportRequest r) {
        return ingestion.ingest(new IngestCommand("community-app", "Relatos da comunidade (app)", SourceType.COMMUNITY,
                r.riskType(), r.estimatedValue(), r.region(), r.latitude(), r.longitude(), null,
                r.reporterId(), r.description()));
    }
}
