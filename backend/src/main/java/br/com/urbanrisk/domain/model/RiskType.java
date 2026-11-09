package br.com.urbanrisk.domain.model;

/** Categorias de risco urbano monitoradas pela plataforma. */
public enum RiskType {
    /** Alagamento: nível de água em centímetros. */
    FLOOD("cm", 20, 60),
    /** Ilha de calor: temperatura de superfície em °C. */
    HEAT_ISLAND("°C", 34, 40),
    /** Interrupção de serviço essencial: minutos sem energia/água. */
    SERVICE_OUTAGE("min", 30, 180);

    private final String unit;
    /** Valor a partir do qual o fenômeno passa a ser relevante. */
    private final double attentionThreshold;
    /** Valor a partir do qual o fenômeno é considerado crítico. */
    private final double criticalThreshold;

    RiskType(String unit, double attentionThreshold, double criticalThreshold) {
        this.unit = unit;
        this.attentionThreshold = attentionThreshold;
        this.criticalThreshold = criticalThreshold;
    }

    public String unit() { return unit; }
    public double attentionThreshold() { return attentionThreshold; }
    public double criticalThreshold() { return criticalThreshold; }
}
