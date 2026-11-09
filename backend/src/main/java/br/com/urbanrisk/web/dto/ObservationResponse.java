package br.com.urbanrisk.web.dto;

import br.com.urbanrisk.domain.model.Observation;
import br.com.urbanrisk.domain.model.RiskType;

import java.time.Instant;

public record ObservationResponse(Long id, RiskType riskType, double value, String unit, String region,
                                  double latitude, double longitude, Instant observedAt, Instant receivedAt,
                                  double confidence, SourceResponse source, String description) {
    public static ObservationResponse of(Observation o) {
        return new ObservationResponse(o.getId(), o.getRiskType(), o.getValue(), o.getRiskType().unit(), o.getRegion(),
                o.getLatitude(), o.getLongitude(), o.getObservedAt(), o.getReceivedAt(), o.getConfidence(),
                SourceResponse.of(o.getSource()), o.getDescription());
    }
}
