package br.com.urbanrisk.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param ingestApiKey chave exigida de sensores e integrações de bases públicas
 * @param communityRatePerMinute relatos comunitários aceitos por IP por minuto (anti-spam)
 */
@ConfigurationProperties(prefix = "urbanrisk.security")
public record SecurityProperties(String ingestApiKey, int communityRatePerMinute) {
}
