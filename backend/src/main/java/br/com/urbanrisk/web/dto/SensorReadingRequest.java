package br.com.urbanrisk.web.dto;

import br.com.urbanrisk.domain.model.RiskType;
import jakarta.validation.constraints.*;

import java.time.Instant;

/** Leitura enviada por um sensor IoT (real ou simulado). */
public record SensorReadingRequest(
        @NotBlank @Size(max = 80) String sensorCode,
        @Size(max = 160) String sensorName,
        @NotNull RiskType riskType,
        @NotNull Double value,
        @Size(max = 80) String region,
        @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
        @PastOrPresent Instant observedAt) {
}
