package br.com.urbanrisk.domain.model;

/** Origem de um dado. Cada origem tem uma confiabilidade-base diferente. */
public enum SourceType {
    SENSOR(0.90),
    PUBLIC_DATASET(0.80),
    COMMUNITY(0.55);

    private final double baseReliability;

    SourceType(double baseReliability) { this.baseReliability = baseReliability; }

    public double baseReliability() { return baseReliability; }
}
