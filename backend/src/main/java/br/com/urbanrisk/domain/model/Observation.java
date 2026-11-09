package br.com.urbanrisk.domain.model;

import jakarta.persistence.*;

import java.time.Instant;

/** Uma medição ou relato individual, já normalizado e anonimizado. */
@Entity
@Table(name = "observation", indexes = {
        @Index(name = "idx_obs_region_type_time", columnList = "region,riskType,observedAt"),
        @Index(name = "idx_obs_received", columnList = "receivedAt")
})
public class Observation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private DataSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RiskType riskType;

    @Column(name = "reading_value", nullable = false)
    private double value;

    @Column(nullable = false, length = 80)
    private String region;

    /** Coordenadas arredondadas (~110 m) para não identificar endereços. */
    private double latitude;
    private double longitude;

    @Column(nullable = false)
    private Instant observedAt;

    @Column(nullable = false)
    private Instant receivedAt;

    /** Confiança calculada para este dado (0..1). */
    @Column(nullable = false)
    private double confidence;

    /** Hash irreversível do relator comunitário (nunca o identificador original). */
    @Column(length = 64)
    private String reporterHash;

    @Column(length = 280)
    private String description;

    protected Observation() { }

    public Observation(DataSource source, RiskType riskType, double value, String region,
                       double latitude, double longitude, Instant observedAt, Instant receivedAt) {
        this.source = source;
        this.riskType = riskType;
        this.value = value;
        this.region = region;
        this.latitude = latitude;
        this.longitude = longitude;
        this.observedAt = observedAt;
        this.receivedAt = receivedAt;
    }

    public Long getId() { return id; }
    public DataSource getSource() { return source; }
    public RiskType getRiskType() { return riskType; }
    public double getValue() { return value; }
    public String getRegion() { return region; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public Instant getObservedAt() { return observedAt; }
    public Instant getReceivedAt() { return receivedAt; }
    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    public String getReporterHash() { return reporterHash; }
    public void setReporterHash(String reporterHash) { this.reporterHash = reporterHash; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
