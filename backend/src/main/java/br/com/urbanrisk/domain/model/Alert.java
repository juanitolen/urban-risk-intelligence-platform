package br.com.urbanrisk.domain.model;

import jakarta.persistence.*;

import java.time.Instant;

/** Alerta consolidado: agrega observações de um mesmo risco numa mesma região. */
@Entity
@Table(name = "alert", indexes = {
        @Index(name = "idx_alert_status_priority", columnList = "status,priorityScore"),
        @Index(name = "idx_alert_region_type", columnList = "region,riskType")
})
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RiskType riskType;

    @Column(nullable = false, length = 80)
    private String region;

    private double latitude;
    private double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Severity severity;

    /** Prioridade 0..100 calculada pelo motor de análise. */
    @Column(nullable = false)
    private double priorityScore;

    /** Confiança agregada 0..1. */
    @Column(nullable = false)
    private double confidence;

    @Column(name = "peak_value", nullable = false)
    private double peakValue;

    @Column(name = "latest_value", nullable = false)
    private double latestValue;

    @Column(nullable = false)
    private int observationCount;

    /** Origens que sustentam o alerta, ex.: "SENSOR,COMMUNITY". */
    @Column(nullable = false, length = 60)
    private String sourceTypes;

    /** Fonte primária (maior confiabilidade) que sustenta o alerta. */
    @Column(length = 160)
    private String primarySource;

    /** Explicação legível de por que este alerta tem esta prioridade. */
    @Column(length = 600)
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AlertStatus status = AlertStatus.ACTIVE;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant resolvedAt;

    @Version
    private long version;

    protected Alert() { }

    public Alert(RiskType riskType, String region, double latitude, double longitude, Instant now) {
        this.riskType = riskType;
        this.region = region;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void resolve(Instant now) {
        this.status = AlertStatus.RESOLVED;
        this.resolvedAt = now;
        this.updatedAt = now;
    }

    public Long getId() { return id; }
    public RiskType getRiskType() { return riskType; }
    public String getRegion() { return region; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public double getPriorityScore() { return priorityScore; }
    public void setPriorityScore(double priorityScore) { this.priorityScore = priorityScore; }
    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    public double getPeakValue() { return peakValue; }
    public void setPeakValue(double peakValue) { this.peakValue = peakValue; }
    public double getLatestValue() { return latestValue; }
    public void setLatestValue(double latestValue) { this.latestValue = latestValue; }
    public int getObservationCount() { return observationCount; }
    public void setObservationCount(int observationCount) { this.observationCount = observationCount; }
    public String getSourceTypes() { return sourceTypes; }
    public void setSourceTypes(String sourceTypes) { this.sourceTypes = sourceTypes; }
    public String getPrimarySource() { return primarySource; }
    public void setPrimarySource(String primarySource) { this.primarySource = primarySource; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public AlertStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
}
