package br.com.urbanrisk.service;

import br.com.urbanrisk.web.dto.AlertResponse;

/** Publicado após o commit sempre que um alerta é criado, atualizado ou encerrado. */
public record AlertChangedEvent(AlertResponse alert, boolean created) {
}
