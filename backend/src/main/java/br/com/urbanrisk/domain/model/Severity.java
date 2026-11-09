package br.com.urbanrisk.domain.model;

public enum Severity {
    LOW, MODERATE, HIGH, CRITICAL;

    public static Severity fromScore(double score) {
        if (score >= 75) return CRITICAL;
        if (score >= 55) return HIGH;
        if (score >= 35) return MODERATE;
        return LOW;
    }
}
