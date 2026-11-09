package br.com.urbanrisk.domain.repository;

import br.com.urbanrisk.domain.model.Observation;
import br.com.urbanrisk.domain.model.RiskType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ObservationRepository extends JpaRepository<Observation, Long> {

    @Query("select o from Observation o join fetch o.source "
            + "where o.region = :region and o.riskType = :type and o.observedAt >= :since "
            + "order by o.observedAt desc")
    List<Observation> findRecent(@Param("region") String region,
                                 @Param("type") RiskType type,
                                 @Param("since") Instant since);

    @Query(value = "select o from Observation o join fetch o.source order by o.receivedAt desc",
            countQuery = "select count(o) from Observation o")
    Page<Observation> findLatest(Pageable pageable);

    long countByReceivedAtAfter(Instant since);

    long deleteByReceivedAtBefore(Instant cutoff);
}
