package br.com.urbanrisk.service.privacy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.regex.Pattern;

/**
 * Proteção de dados pessoais (LGPD) aplicada na entrada, antes de persistir:
 * <ul>
 *   <li>identificador do relator vira um hash SHA-256 com salt (pseudonimização);</li>
 *   <li>coordenadas são arredondadas a 3 casas (~110 m), sem expor o endereço exato;</li>
 *   <li>e-mails, telefones e CPFs digitados no texto livre são mascarados.</li>
 * </ul>
 */
@Component
public class PrivacyGuard {

    private static final Pattern EMAIL = Pattern.compile("[\\w.+-]+@[\\w-]+\\.[\\w.]+");
    private static final Pattern CPF = Pattern.compile("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b");
    private static final Pattern PHONE = Pattern.compile("(\\+?55\\s?)?\\(?\\d{2}\\)?\\s?9?\\d{4}[-\\s]?\\d{4}");

    private final String salt;

    public PrivacyGuard(@Value("${urbanrisk.privacy.salt}") String salt) {
        this.salt = salt;
    }

    public String pseudonymize(String reporterId) {
        if (reporterId == null || reporterId.isBlank()) return null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((salt + ":" + reporterId.trim().toLowerCase()).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public double coarsen(double coordinate) {
        return Math.round(coordinate * 1000) / 1000.0;
    }

    public String redact(String text) {
        if (text == null) return null;
        String out = EMAIL.matcher(text).replaceAll("[e-mail removido]");
        out = CPF.matcher(out).replaceAll("[documento removido]");
        out = PHONE.matcher(out).replaceAll("[telefone removido]");
        return out.length() > 280 ? out.substring(0, 280) : out;
    }
}
