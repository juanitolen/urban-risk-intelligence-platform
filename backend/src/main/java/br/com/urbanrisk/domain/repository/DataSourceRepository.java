package br.com.urbanrisk.domain.repository;

import br.com.urbanrisk.domain.model.DataSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DataSourceRepository extends JpaRepository<DataSource, Long> {
    Optional<DataSource> findByCode(String code);
}
