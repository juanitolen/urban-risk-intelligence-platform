package br.com.urbanrisk.web.dto;

public record BatchIngestionResponse(int accepted, int alertsTouched) {
}
