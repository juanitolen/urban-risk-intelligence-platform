package br.com.urbanrisk.web.dto;

import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.domain.model.Severity;
import br.com.urbanrisk.domain.model.SourceType;

import java.time.Instant;
import java.util.Map;

public record DashboardResponse(
        int activeAlerts,
        Map<Severity, Long> bySeverity,
        Map<RiskType, Long> byRiskType,
        Map<SourceType, Long> sourcesByType,
        double averageConfidence,
        long observationsLastHour,
        Instant lastObservationAt,
        AlertResponse topAlert,
        Instant serverTime) {
}
