package br.com.urbanrisk.domain.model;

import java.util.Arrays;
import java.util.Optional;

/**
 * Regiões monitoradas (bairros de São Paulo) com um índice de vulnerabilidade social
 * (0..1) usado como peso na priorização: o mesmo alagamento pesa mais onde a população
 * tem menos capacidade de resposta.
 */
public enum Region {
    SE("Sé", -23.5503, -46.6339, 0.55),
    MOOCA("Mooca", -23.5614, -46.5996, 0.45),
    PINHEIROS("Pinheiros", -23.5670, -46.6920, 0.25),
    ITAQUERA("Itaquera", -23.5397, -46.4560, 0.75),
    CAPAO_REDONDO("Capão Redondo", -23.6722, -46.7794, 0.85),
    SANTANA("Santana", -23.5022, -46.6253, 0.40),
    VILA_PRUDENTE("Vila Prudente", -23.5822, -46.5822, 0.60),
    BRASILANDIA("Brasilândia", -23.4697, -46.6880, 0.80);

    private final String label;
    private final double lat;
    private final double lng;
    private final double vulnerability;

    Region(String label, double lat, double lng, double vulnerability) {
        this.label = label;
        this.lat = lat;
        this.lng = lng;
        this.vulnerability = vulnerability;
    }

    public String label() { return label; }
    public double lat() { return lat; }
    public double lng() { return lng; }
    public double vulnerability() { return vulnerability; }

    public static Optional<Region> byLabel(String label) {
        return Arrays.stream(values()).filter(r -> r.label.equalsIgnoreCase(label)).findFirst();
    }

    /** Região conhecida mais próxima de um ponto (para relatos sem bairro informado). */
    public static Region nearest(double lat, double lng) {
        Region best = SE;
        double bestDist = Double.MAX_VALUE;
        for (Region r : values()) {
            double d = Math.pow(r.lat - lat, 2) + Math.pow(r.lng - lng, 2);
            if (d < bestDist) { bestDist = d; best = r; }
        }
        return best;
    }
}
