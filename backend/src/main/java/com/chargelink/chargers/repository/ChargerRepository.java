package com.chargelink.chargers.repository;

import com.chargelink.chargers.entity.Charger;
import com.chargelink.chargers.entity.ChargerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChargerRepository extends JpaRepository<Charger, UUID> {

    List<Charger> findAllByStationId(UUID stationId);

    List<Charger> findAllByStationIdAndStatus(UUID stationId, ChargerStatus status);

    long countByStationIdAndStatus(UUID stationId, ChargerStatus status);

    long countByStatus(ChargerStatus status);

    @Modifying
    @Query("UPDATE Charger c SET c.status = :status WHERE c.id = :id")
    void updateStatus(@Param("id") UUID id, @Param("status") ChargerStatus status);

    boolean existsByStationIdAndChargerNumber(UUID stationId, String chargerNumber);
}
