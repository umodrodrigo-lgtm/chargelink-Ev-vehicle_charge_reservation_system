package com.chargelink.stations.repository;

import com.chargelink.stations.entity.ChargingStation;
import com.chargelink.stations.entity.StationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, UUID> {

    Page<ChargingStation> findAllByStatus(StationStatus status, Pageable pageable);

    @Query("SELECT s FROM ChargingStation s WHERE " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.city) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.address) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<ChargingStation> search(@Param("query") String query, Pageable pageable);

    @Query(value = """
            SELECT * FROM charging_stations s
            WHERE s.status = 'ACTIVE'
            AND (6371 * acos(cos(radians(:lat)) * cos(radians(s.latitude))
                 * cos(radians(s.longitude) - radians(:lng))
                 + sin(radians(:lat)) * sin(radians(s.latitude)))) < :radiusKm
            ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(s.latitude))
                 * cos(radians(s.longitude) - radians(:lng))
                 + sin(radians(:lat)) * sin(radians(s.latitude))))
            """, nativeQuery = true)
    List<ChargingStation> findNearby(
            @Param("lat") BigDecimal lat,
            @Param("lng") BigDecimal lng,
            @Param("radiusKm") double radiusKm);

    long countByStatus(StationStatus status);
}
