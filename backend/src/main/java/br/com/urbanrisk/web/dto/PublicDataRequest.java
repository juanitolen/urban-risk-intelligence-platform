package br.com.urbanrisk.web.dto;

import br.com.urbanrisk.domain.model.RiskType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;

/** Lote de registros vindos de uma base pública (ex.: CGE, INMET, concessionárias). */
public record PublicDataRequest(
        @NotBlank @Size(max = 80) String datasetCode,
        @NotBlank @Size(max = 160) String datasetName,
        @NotEmpty @Size(max = 500) List<@Valid Record> records) {

    public record Record(
            @NotNull RiskType riskType,
            @NotNull Double value,
            @Size(max = 80) String region,
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @PastOrPresent Instant observedAt) {
    }
}
