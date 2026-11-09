package br.com.urbanrisk.realtime;

import br.com.urbanrisk.service.AlertChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Canal de tempo real via Server-Sent Events. Cada instância mantém só as suas conexões;
 * para escalar horizontalmente basta trocar o listener por um tópico (Redis/Kafka).
 */
@Component
public class AlertStreamBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(AlertStreamBroadcaster.class);
    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        send(emitter, "hello", Map.of("serverTime", Instant.now().toString()));
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAlertChanged(AlertChangedEvent event) {
        broadcast(event.created() ? "alert.created" : "alert.updated", event.alert());
    }

    @Scheduled(fixedRate = 15_000)
    public void heartbeat() {
        broadcast("heartbeat", Map.of("serverTime", Instant.now().toString()));
    }

    public int subscribers() { return emitters.size(); }

    private void broadcast(String name, Object data) {
        for (SseEmitter e : emitters) send(e, name, data);
    }

    private void send(SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data, MediaType.APPLICATION_JSON));
        } catch (IOException | IllegalStateException ex) {
            emitters.remove(emitter);
            log.debug("Cliente SSE desconectado: {}", ex.getMessage());
        }
    }
}
