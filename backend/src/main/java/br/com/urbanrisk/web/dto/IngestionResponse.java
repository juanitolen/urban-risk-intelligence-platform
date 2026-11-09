package br.com.urbanrisk.web.dto;

public record IngestionResponse(Long observationId, double confidence, AlertResponse alert) {
}
