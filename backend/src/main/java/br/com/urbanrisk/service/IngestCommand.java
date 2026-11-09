package br.com.urbanrisk.service;

import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.domain.model.SourceType;

import java.time.Instant;

/** Comando interno, independente da origem, usado pela camada de serviço. */
public record IngestCommand(String sourceCode, String sourceName, SourceType sourceType, RiskType riskType,
                            double value, String region, double latitude, double longitude, Instant observedAt,
                            String reporterId, String description) {
}
