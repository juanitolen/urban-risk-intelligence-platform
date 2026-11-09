package br.com.urbanrisk.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Protege a entrada de dados:
 * <ul>
 *   <li>sensores e bases públicas precisam do header {@code X-API-Key};</li>
 *   <li>relatos comunitários são limitados por IP (janela de 1 minuto).</li>
 * </ul>
 */
@Component
public class IngestProtectionFilter extends OncePerRequestFilter {

    private final SecurityProperties props;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public IngestProtectionFilter(SecurityProperties props) {
        this.props = props;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !request.getRequestURI().startsWith("/api/v1/ingest/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.startsWith("/api/v1/ingest/community")) {
            if (!allow(req.getRemoteAddr())) {
                reject(res, HttpStatus.TOO_MANY_REQUESTS, "Muitos relatos em pouco tempo. Tente de novo em instantes.");
                return;
            }
        } else if (!validKey(req.getHeader("X-API-Key"))) {
            reject(res, HttpStatus.UNAUTHORIZED, "X-API-Key ausente ou inválida.");
            return;
        }
        chain.doFilter(req, res);
    }

    private boolean validKey(String key) {
        if (key == null) return false;
        return MessageDigest.isEqual(key.getBytes(StandardCharsets.UTF_8),
                props.ingestApiKey().getBytes(StandardCharsets.UTF_8));
    }

    private boolean allow(String ip) {
        long minute = System.currentTimeMillis() / 60_000;
        Window w = windows.compute(ip, (k, old) -> old == null || old.minute != minute ? new Window(minute) : old);
        if (windows.size() > 10_000) windows.entrySet().removeIf(e -> e.getValue().minute != minute);
        return w.count.incrementAndGet() <= props.communityRatePerMinute();
    }

    private static void reject(HttpServletResponse res, HttpStatus status, String detail) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        res.getWriter().write("{\"status\":" + status.value() + ",\"title\":\"" + status.getReasonPhrase()
                + "\",\"detail\":\"" + detail + "\"}");
    }

    private static final class Window {
        final long minute;
        final java.util.concurrent.atomic.AtomicInteger count = new java.util.concurrent.atomic.AtomicInteger();
        Window(long minute) { this.minute = minute; }
    }
}
