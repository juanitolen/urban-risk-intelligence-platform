package br.com.urbanrisk.domain.model;

import jakarta.persistence.*;

import java.time.Instant;

/** Um emissor de dados: um sensor físico, uma base pública ou o canal comunitário. */
@Entity
@Table(name = "data_source", indexes = @Index(name = "idx_source_code", columnList = "code", unique = true))
public class DataSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SourceType type;

    /** Confiabilidade histórica da fonte (0..1). Ajustada conforme o desempenho. */
    @Column(nullable = false)
    private double reliability;

    private Instant lastSeenAt;

    protected DataSource() { }

    public DataSource(String code, String name, SourceType type) {
        this.code = code;
        this.name = name;
        this.type = type;
        this.reliability = type.baseReliability();
    }

    public void touch(Instant when) { this.lastSeenAt = when; }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public SourceType getType() { return type; }
    public double getReliability() { return reliability; }
    public void setReliability(double reliability) { this.reliability = Math.max(0.05, Math.min(0.99, reliability)); }
    public Instant getLastSeenAt() { return lastSeenAt; }
}
