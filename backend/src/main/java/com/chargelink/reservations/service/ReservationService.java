package com.chargelink.reservations.service;

import com.chargelink.chargers.entity.Charger;
import com.chargelink.chargers.entity.ChargerStatus;
import com.chargelink.chargers.repository.ChargerRepository;
import com.chargelink.common.AppException;
import com.chargelink.common.PagedResponse;
import com.chargelink.reservations.dto.CreateReservationRequest;
import com.chargelink.reservations.dto.ReservationDTO;
import com.chargelink.reservations.entity.Reservation;
import com.chargelink.reservations.entity.ReservationStatus;
import com.chargelink.reservations.repository.ReservationRepository;
import com.chargelink.users.entity.User;
import com.chargelink.users.repository.UserRepository;
import com.chargelink.websocket.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ChargerRepository chargerRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final WebSocketService webSocketService;

    @Value("${app.reservation.lock-timeout-seconds:30}")
    private int lockTimeoutSeconds;

    @Value("${app.reservation.max-duration-minutes:240}")
    private int maxDurationMinutes;

    private static final Logger reservationLog = LoggerFactory.getLogger("chargelink.events.reservation");

    private static final String RESERVATION_LOCK = "reservation:lock:charger:";

    public ReservationDTO createReservation(CreateReservationRequest request) {
        validateTimeWindow(request.getStartTime(), request.getEndTime());

        String lockKey = RESERVATION_LOCK + request.getChargerId();
        boolean usingLock = false;
        try {
            Boolean locked = redisTemplate.opsForValue()
                    .setIfAbsent(lockKey, "locked", Duration.ofSeconds(lockTimeoutSeconds));
            if (!Boolean.TRUE.equals(locked)) {
                throw AppException.reservationConflict("Charger is temporarily locked — another booking is in progress");
            }
            usingLock = true;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis unavailable, proceeding without distributed lock — relying on DB conflict check");
        }

        try {
            return doCreateReservation(request);
        } finally {
            if (usingLock) {
                try { redisTemplate.delete(lockKey); } catch (Exception ignored) {}
            }
        }
    }

    private ReservationDTO doCreateReservation(CreateReservationRequest request) {
        Charger charger = chargerRepository.findById(request.getChargerId())
                .orElseThrow(() -> AppException.notFound("Charger not found"));

        if (charger.getStatus() == ChargerStatus.OFFLINE || charger.getStatus() == ChargerStatus.MAINTENANCE) {
            throw AppException.badRequest("Charger is not available for reservation");
        }

        boolean hasConflict = !reservationRepository.findConflicting(
                request.getChargerId(), request.getStartTime(), request.getEndTime()).isEmpty();

        if (hasConflict) {
            throw AppException.reservationConflict("Charger already has a reservation for this time slot");
        }

        User user = resolveCurrentUser();

        long durationMinutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(durationMinutes).divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal estimatedKwh = charger.getPowerKw().multiply(hours);
        BigDecimal estimatedCost = estimatedKwh.multiply(charger.getPricePerKwh()).setScale(2, RoundingMode.HALF_UP);

        Reservation reservation = Reservation.builder()
                .user(user)
                .charger(charger)
                .station(charger.getStation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .estimatedCost(estimatedCost)
                .notes(request.getNotes())
                .build();

        ReservationDTO dto = ReservationDTO.from(reservationRepository.save(reservation));
        webSocketService.broadcastReservationUpdate(dto);
        reservationLog.info("[CREATED] id={} user={} charger={} station=\"{}\" start={} end={} cost={}",
                dto.getId(), user.getEmail(), charger.getId(), charger.getStation().getName(),
                request.getStartTime(), request.getEndTime(), estimatedCost);
        return dto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReservationDTO> getMyReservations(Pageable pageable) {
        User user = resolveCurrentUser();
        return PagedResponse.from(
                reservationRepository.findAllByUserId(user.getId(), pageable).map(ReservationDTO::from));
    }

    @Transactional(readOnly = true)
    public ReservationDTO getMyReservation(UUID id) {
        User user = resolveCurrentUser();
        return reservationRepository.findByIdAndUserId(id, user.getId())
                .map(ReservationDTO::from)
                .orElseThrow(() -> AppException.notFound("Reservation not found"));
    }

    public ReservationDTO cancelReservation(UUID id, String reason) {
        User user = resolveCurrentUser();
        Reservation reservation = reservationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> AppException.notFound("Reservation not found"));

        if (reservation.getStatus() == ReservationStatus.COMPLETED ||
            reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw AppException.badRequest("Cannot cancel a " + reservation.getStatus().name().toLowerCase() + " reservation");
        }

        if (reservation.getStartTime().isBefore(LocalDateTime.now().plusMinutes(15))) {
            throw AppException.badRequest("Cannot cancel a reservation starting in less than 15 minutes");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setCancellationReason(reason);

        ReservationDTO dto = ReservationDTO.from(reservationRepository.save(reservation));
        webSocketService.broadcastReservationUpdate(dto);
        reservationLog.info("[CANCELLED] id={} user={} reason=\"{}\"", id, user.getEmail(), reason);
        return dto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReservationDTO> getAllReservations(ReservationStatus status, Pageable pageable) {
        var page = status != null
                ? reservationRepository.findAllByStatus(status, pageable)
                : reservationRepository.findAll(pageable);
        return PagedResponse.from(page.map(ReservationDTO::from));
    }

    @Scheduled(fixedDelay = 60_000)
    public void processReservationLifecycle() {
        LocalDateTime now = LocalDateTime.now();

        reservationRepository.findDueToStart(now).forEach(r -> {
            r.setStatus(ReservationStatus.ACTIVE);
            chargerRepository.updateStatus(r.getCharger().getId(), ChargerStatus.IN_USE);
            reservationRepository.save(r);
            reservationLog.info("[ACTIVATED] id={} user={} charger={}", r.getId(), r.getUser().getEmail(), r.getCharger().getId());
        });

        reservationRepository.findDueToComplete(now).forEach(r -> {
            r.setStatus(ReservationStatus.COMPLETED);
            chargerRepository.updateStatus(r.getCharger().getId(), ChargerStatus.AVAILABLE);
            reservationRepository.save(r);
            webSocketService.broadcastReservationUpdate(ReservationDTO.from(r));
            reservationLog.info("[COMPLETED] id={} user={} charger={}", r.getId(), r.getUser().getEmail(), r.getCharger().getId());
        });
    }

    private void validateTimeWindow(LocalDateTime start, LocalDateTime end) {
        if (!start.isAfter(LocalDateTime.now())) {
            throw AppException.badRequest("Start time must be in the future");
        }
        if (!end.isAfter(start)) {
            throw AppException.badRequest("End time must be after start time");
        }
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes < 15) {
            throw AppException.badRequest("Reservation must be at least 15 minutes");
        }
        if (minutes > maxDurationMinutes) {
            throw AppException.badRequest("Reservation duration cannot exceed " + maxDurationMinutes + " minutes");
        }
    }

    private User resolveCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }
}
