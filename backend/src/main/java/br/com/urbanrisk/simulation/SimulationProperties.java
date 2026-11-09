package br.com.urbanrisk.simulation;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "urbanrisk.simulation")
public record SimulationProperties(boolean enabled, long sensorIntervalMs, long publicIntervalMs,
                                   long communityIntervalMs, long seed) {
}
