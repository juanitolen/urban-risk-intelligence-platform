package br.com.urbanrisk.simulation;

import br.com.urbanrisk.domain.model.Region;
import br.com.urbanrisk.domain.model.RiskType;
import br.com.urbanrisk.domain.model.SourceType;
import br.com.urbanrisk.service.IngestCommand;
import br.com.urbanrisk.service.IngestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;
import java.util.Random;

/**
 * Simula a cidade: uma rede de sensores (nível de rios/galerias, temperatura de superfície,
 * telemetria de energia), um feed de base pública e relatos de moradores.
 *
 * <p>Cada região tem um estado com passeio aleatório e "episódios" (uma tempestade, uma onda
 * de calor, uma queda de energia) que sobem e descem, gerando alertas que aparecem, pioram e
 * se resolvem sozinhos durante a demonstração.</p>
 */
@Component
@ConditionalOnProperty(prefix = "urbanrisk.simulation", name = "enabled", havingValue = "true")
public class CitySimulator {

    private static final Logger log = LoggerFactory.getLogger(CitySimulator.class);

    private final IngestionService ingestion;
    private final Random random;
    private final Map<Region, Map<RiskType, Episode>> state = new EnumMap<>(Region.class);

    public CitySimulator(IngestionService ingestion, SimulationProperties props) {
        this.ingestion = ingestion;
        this.random = new Random(props.seed());
        for (Region r : Region.values()) {
            Map<RiskType, Episode> m = new EnumMap<>(RiskType.class);
            m.put(RiskType.FLOOD, new Episode(2, 0, 120));
            m.put(RiskType.HEAT_ISLAND, new Episode(28 + random.nextDouble() * 3, 24, 46));
            m.put(RiskType.SERVICE_OUTAGE, new Episode(0, 0, 400));
            state.put(r, m);
        }
    }

    /** Começa a demo com dois episódios em andamento para o painel não abrir vazio. */
    @EventListener(ApplicationReadyEvent.class)
    public void warmUp() {
        state.get(Region.CAPAO_REDONDO).get(RiskType.FLOOD).start(85, 1.0);
        state.get(Region.ITAQUERA).get(RiskType.HEAT_ISLAND).start(41, 0.4);
        state.get(Region.SE).get(RiskType.SERVICE_OUTAGE).start(150, 1.0);
        log.info("Simulador urbano ativo: {} regiões, 3 tipos de risco", Region.values().length);
    }

    @Scheduled(fixedRateString = "${urbanrisk.simulation.sensor-interval-ms:5000}", initialDelay = 2000)
    public void sensorTick() {
        maybeStartEpisode();
        for (int i = 0; i < 4; i++) {
            Region region = pick(Region.values());
            RiskType type = pick(new RiskType[]{RiskType.FLOOD, RiskType.HEAT_ISLAND});
            Episode ep = state.get(region).get(type);
            double value = ep.step(random);
            String code = "sensor-" + type.name().toLowerCase() + "-" + region.name().toLowerCase();
            String name = (type == RiskType.FLOOD ? "Sensor de nível " : "Sensor térmico ") + region.label();
            send(code, name, SourceType.SENSOR, type, value, region, null);
        }
        // Telemetria da concessionária de energia (também é sensor).
        Region region = pick(Region.values());
        Episode outage = state.get(region).get(RiskType.SERVICE_OUTAGE);
        double minutes = outage.step(random);
        if (minutes > 0) {
            send("telemetry-energy-" + region.name().toLowerCase(), "Telemetria rede elétrica " + region.label(),
                    SourceType.SENSOR, RiskType.SERVICE_OUTAGE, minutes, region, null);
        }
    }

    @Scheduled(fixedRateString = "${urbanrisk.simulation.public-interval-ms:30000}", initialDelay = 4000)
    public void publicFeedTick() {
        for (Region region : Region.values()) {
            Episode heat = state.get(region).get(RiskType.HEAT_ISLAND);
            send("cge-sp", "CGE São Paulo (base pública)", SourceType.PUBLIC_DATASET, RiskType.HEAT_ISLAND,
                    heat.value + random.nextGaussian() * 0.4, region, null);
            Episode flood = state.get(region).get(RiskType.FLOOD);
            if (flood.value > 10) {
                send("cge-sp", "CGE São Paulo (base pública)", SourceType.PUBLIC_DATASET, RiskType.FLOOD,
                        flood.value + random.nextGaussian() * 3, region, null);
            }
        }
    }

    @Scheduled(fixedRateString = "${urbanrisk.simulation.community-interval-ms:20000}", initialDelay = 6000)
    public void communityTick() {
        // Moradores relatam onde já há algo acontecendo (com algum ruído).
        for (Region region : Region.values()) {
            for (RiskType type : RiskType.values()) {
                Episode ep = state.get(region).get(type);
                if (ep.active && random.nextDouble() < 0.5) {
                    String reporter = "device-" + random.nextInt(40);
                    String text = switch (type) {
                        case FLOOD -> "Água subindo na rua, carros parados";
                        case HEAT_ISLAND -> "Calor muito forte, sem sombra no ponto de ônibus";
                        case SERVICE_OUTAGE -> "Sem luz no quarteirão";
                    };
                    send("community-app", "Relatos da comunidade (app)", SourceType.COMMUNITY, type,
                            ep.value * (0.85 + random.nextDouble() * 0.3), region, new String[]{reporter, text});
                }
            }
        }
    }

    private void maybeStartEpisode() {
        if (random.nextDouble() > 0.06) return;
        Region region = pick(Region.values());
        RiskType type = pick(RiskType.values());
        Episode ep = state.get(region).get(type);
        if (ep.active) return;
        double peak = switch (type) {
            case FLOOD -> 40 + random.nextDouble() * 60;
            case HEAT_ISLAND -> 37 + random.nextDouble() * 6;
            case SERVICE_OUTAGE -> 60 + random.nextDouble() * 200;
        };
        ep.start(peak, type == RiskType.HEAT_ISLAND ? 0.3 : 0.8 + random.nextDouble());
        log.info("Novo episódio simulado: {} em {} (pico {})", type, region.label(), Math.round(peak));
    }

    private void send(String code, String name, SourceType sourceType, RiskType type, double value,
                      Region region, String[] community) {
        double jitterLat = region.lat() + random.nextGaussian() * 0.004;
        double jitterLng = region.lng() + random.nextGaussian() * 0.004;
        try {
            ingestion.ingest(new IngestCommand(code, name, sourceType, type, Math.max(0, round1(value)),
                    region.label(), jitterLat, jitterLng, Instant.now(),
                    community == null ? null : community[0], community == null ? null : community[1]));
        } catch (RuntimeException e) {
            log.warn("Falha ao ingerir dado simulado: {}", e.getMessage());
        }
    }

    private <T> T pick(T[] values) { return values[random.nextInt(values.length)]; }

    private static double round1(double v) { return Math.round(v * 10) / 10.0; }

    /** Estado de um fenômeno: sobe até o pico, permanece um pouco e volta à base. */
    static final class Episode {
        final double base, min, max;
        double value, peak, speed;
        boolean active, rising;

        Episode(double base, double min, double max) {
            this.base = base; this.min = min; this.max = max; this.value = base;
        }

        void start(double peak, double speed) {
            this.peak = Math.min(peak, max);
            this.speed = speed;
            this.active = true;
            this.rising = true;
        }

        double step(Random rnd) {
            if (active) {
                double delta = (peak - base) * 0.12 * speed;
                if (rising) {
                    value += delta * (0.6 + rnd.nextDouble() * 0.8);
                    if (value >= peak) { value = peak; rising = false; }
                } else {
                    value -= delta * 0.5 * (0.6 + rnd.nextDouble() * 0.8);
                    if (value <= base) { value = base; active = false; }
                }
            } else {
                value += (base - value) * 0.3 + rnd.nextGaussian() * (max - min) * 0.005;
            }
            value = Math.max(min, Math.min(max, value));
            return value;
        }
    }
}
