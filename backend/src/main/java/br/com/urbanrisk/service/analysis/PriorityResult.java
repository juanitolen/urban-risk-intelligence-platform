package br.com.urbanrisk.service.analysis;

import br.com.urbanrisk.domain.model.Severity;

import java.util.List;

/** Resultado do motor de priorização, com os fatores que explicam a nota. */
public record PriorityResult(double score, Severity severity, double confidence, List<String> factors) {
    public String explanation() { return String.join(" · ", factors); }
}
