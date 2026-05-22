package com.chargelink.reservations.repository;

import com.chargelink.reservations.entity.Reservation;
import com.chargelink.reservations.entity.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    Page<Reservation> findAllByUserId(UUID userId, Pageable pageable);

    Page<Reservation> findAllByStatus(ReservationStatus status, Pageable pageable);

    Optional<Reservation> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            SELECT r FROM Reservation r
            WHERE r.charger.id = :chargerId
            AND r.status IN ('CONFIRMED', 'ACTIVE')
            AND r.startTime < :endTime
            AND r.endTime > :startTime
            """)
    List<Reservation> findConflicting(
            @Param("chargerId") UUID chargerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("""
            SELECT r FROM Reservation r
            WHERE r.status = 'CONFIRMED'
            AND r.startTime <= :now
            AND r.endTime > :now
            """)
    List<Reservation> findDueToStart(@Param("now") LocalDateTime now);

    @Query("""
            SELECT r FROM Reservation r
            WHERE r.status IN ('CONFIRMED', 'ACTIVE')
            AND r.endTime <= :now
            """)
    List<Reservation> findDueToComplete(@Param("now") LocalDateTime now);

    long countByUserIdAndStatus(UUID userId, ReservationStatus status);

    long countByStatus(ReservationStatus status);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.user.id = :userId AND r.status IN ('CONFIRMED', 'ACTIVE')")
    long countActiveReservationsByUser(@Param("userId") UUID userId);

    @Query("""
            SELECT r FROM Reservation r
            WHERE r.charger.id = :chargerId
            AND r.status IN ('CONFIRMED', 'ACTIVE')
            AND r.endTime > :from
            AND r.startTime < :to
            ORDER BY r.startTime
            """)
    List<Reservation> findByChargerAndDateRange(
            @Param("chargerId") UUID chargerId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
