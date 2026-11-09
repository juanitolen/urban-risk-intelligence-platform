package br.com.urbanrisk.web.dto;

import org.springframework.data.domain.Page;

import java.time.Instant;
import java.util.List;
import java.util.function.Function;

/** Página estável para o app (evita serializar o objeto Page do Spring). */
public record PageResponse<T>(List<T> items, int page, int size, long total, Instant serverTime) {
    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper, Instant now) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), now);
    }
}
