package br.com.urbanrisk.web.dto;

import br.com.urbanrisk.domain.model.Alert;
import br.com.urbanrisk.domain.model.AlertStatus;
import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.domain.model.Severity;
import br.com.urbanrisk.domain.model.SourceType;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public record AlertResponse(Long id, RiskType riskType, String title, String region, double latitude, double longitude,
                            Severity severity, double priorityScore, double confidence, double latestValue,
                            double peakValue, String unit, int observationCount, List<SourceType> sources,
                            String primarySource, List<String> factors, AlertStatus status,
                            Instant createdAt, Instant updatedAt, Instant resolvedAt) {

    public static AlertResponse of(Alert a) {
        List<SourceType> sources = a.getSourceTypes() == null || a.getSourceTypes().isBlank() ? List.of()
                : Arrays.stream(a.getSourceTypes().split(",")).map(SourceType::valueOf).toList();
        List<String> factors = a.getExplanation() == null ? List.of() : List.of(a.getExplanation().split(" · "));
        return new AlertResponse(a.getId(), a.getRiskType(), title(a), a.getRegion(), a.getLatitude(), a.getLongitude(),
                a.getSeverity(), a.getPriorityScore(), a.getConfidence(), a.getLatestValue(), a.getPeakValue(),
                a.getRiskType().unit(), a.getObservationCount(), sources, a.getPrimarySource(), factors,
                a.getStatus(), a.getCreatedAt(), a.getUpdatedAt(), a.getResolvedAt());
    }

    static String title(Alert a) {
        String what = switch (a.getRiskType()) {
            case FLOOD -> "Alagamento";
            case HEAT_ISLAND -> "Calor extremo";
            case SERVICE_OUTAGE -> "Falta de serviço essencial";
        };
        return what + " em " + a.getRegion();
    }
}
