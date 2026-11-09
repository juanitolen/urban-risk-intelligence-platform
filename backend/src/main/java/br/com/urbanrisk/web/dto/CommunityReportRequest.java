package br.com.urbanrisk.web.dto;

import br.com.urbanrisk.domain.model.RiskType;
import jakarta.validation.constraints.*;

/**
 * Relato de um morador ou agente local. O {@code reporterId} (ex.: id anônimo do aparelho)
 * nunca é salvo: vira um hash antes de persistir.
 */
public record CommunityReportRequest(
        @NotNull RiskType riskType,
        @NotNull Level level,
        Double value,
        @Size(max = 80) String region,
        @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
        @Size(max = 500) String description,
        @Size(max = 120) String reporterId) {

    public enum Level { LOW, MEDIUM, HIGH }

    /** Converte o nível percebido em valor da escala do risco quando não há medição. */
    public double estimatedValue() {
        if (value != null) return value;
        double attention = riskType.attentionThreshold();
        double critical = riskType.criticalThreshold();
        return switch (level) {
            case LOW -> attention * 0.8;
            case MEDIUM -> (attention + critical) / 2;
            case HIGH -> critical * 1.05;
        };
    }
}
