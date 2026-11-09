package br.com.urbanrisk.web.dto;

import br.com.urbanrisk.domain.model.DataSource;
import br.com.urbanrisk.domain.model.SourceType;

import java.time.Instant;

public record SourceResponse(Long id, String code, String name, SourceType type, double reliability, Instant lastSeenAt) {
    public static SourceResponse of(DataSource s) {
        return new SourceResponse(s.getId(), s.getCode(), s.getName(), s.getType(), s.getReliability(), s.getLastSeenAt());
    }
}
