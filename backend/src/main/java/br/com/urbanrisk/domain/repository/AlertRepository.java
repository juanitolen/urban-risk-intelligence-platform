package br.com.urbanrisk.domain.repository;

import br.com.urbanrisk.domain.model.Alert;
import br.com.urbanrisk.domain.model.AlertStatus;
import br.com.urbanrisk.domain.model.RiskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long>, JpaSpecificationExecutor<Alert> {

    Optional<Alert> findFirstByRegionAndRiskTypeAndStatus(String region, RiskType riskType, AlertStatus status);

    List<Alert> findByStatus(AlertStatus status);

    List<Alert> findByStatusAndUpdatedAtBefore(AlertStatus status, Instant cutoff);
}
