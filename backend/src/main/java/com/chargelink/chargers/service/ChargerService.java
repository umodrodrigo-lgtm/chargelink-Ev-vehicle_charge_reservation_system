package com.chargelink.chargers.service;

import com.chargelink.chargers.dto.*;
import com.chargelink.chargers.entity.Charger;
import com.chargelink.chargers.entity.ChargerStatus;
import com.chargelink.chargers.repository.ChargerRepository;
import com.chargelink.common.AppException;
import com.chargelink.reservations.entity.Reservation;
import com.chargelink.reservations.entity.ReservationStatus;
import com.chargelink.reservations.repository.ReservationRepository;
import com.chargelink.stations.entity.ChargingStation;
import com.chargelink.stations.repository.ChargingStationRepository;
import com.chargelink.websocket.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChargerService {

    private final ChargerRepository chargerRepository;
    private final ChargingStationRepository stationRepository;
    private final ReservationRepository reservationRepository;
    private final StringRedisTemplate redisTemplate;
    private final WebSocketService webSocketService;

    private static final Logger chargerLog = LoggerFactory.getLogger("chargelink.events.charger");

    private static final String AVAILABILITY_KEY = "charger:availability:";

    @Transactional(readOnly = true)
    public List<ChargerDTO> getChargersByStation(UUID stationId) {
        return chargerRepository.findAllByStationId(stationId)
                .stream().map(ChargerDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public ChargerDTO getCharger(UUID id) {
        return ChargerDTO.from(findCharger(id));
    }

    public ChargerDTO createCharger(CreateChargerRequest request) {
        ChargingStation station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> AppException.notFound("Charging station not found"));

        if (chargerRepository.existsByStationIdAndChargerNumber(request.getStationId(), request.getChargerNumber())) {
            throw AppException.conflict("Charger number already exists at this station");
        }

        Charger charger = Charger.builder()
                .chargerNumber(request.getChargerNumber())
                .type(request.getType())
                .powerKw(request.getPowerKw())
                .pricePerKwh(request.getPricePerKwh())
                .station(station)
                .build();

        ChargerDTO dto = ChargerDTO.from(chargerRepository.save(charger));
        cacheAvailability(dto.getId(), ChargerStatus.AVAILABLE);
        chargerLog.info("[CREATED] id={} station={} number={} type={} power={}kW price={}/kWh",
                dto.getId(), request.getStationId(), request.getChargerNumber(),
                request.getType(), request.getPowerKw(), request.getPricePerKwh());
        return dto;
    }

    public ChargerDTO updateStatus(UUID id, ChargerStatus newStatus) {
        Charger charger = findCharger(id);
        ChargerStatus oldStatus = charger.getStatus();
        charger.setStatus(newStatus);
        ChargerDTO dto = ChargerDTO.from(chargerRepository.save(charger));
        cacheAvailability(id, newStatus);
        webSocketService.broadcastChargerStatus(dto);
        chargerLog.info("[STATUS_CHANGED] id={} from={} to={}", id, oldStatus, newStatus);
        return dto;
    }

    public ChargerDTO updateCharger(UUID id, UpdateChargerRequest request) {
        Charger charger = findCharger(id);
        charger.setChargerNumber(request.getChargerNumber());
        charger.setType(request.getType());
        charger.setPowerKw(request.getPowerKw());
        charger.setPricePerKwh(request.getPricePerKwh());
        charger.setStatus(request.getStatus());
        ChargerDTO dto = ChargerDTO.from(chargerRepository.save(charger));
        cacheAvailability(id, request.getStatus());
        webSocketService.broadcastChargerStatus(dto);
        return dto;
    }

    public void deleteCharger(UUID id) {
        if (!chargerRepository.existsById(id)) throw AppException.notFound("Charger not found");
        chargerRepository.deleteById(id);
        try { redisTemplate.delete(AVAILABILITY_KEY + id); } catch (Exception e) { /* Redis unavailable */ }
        chargerLog.info("[DELETED] id={}", id);
    }

    public ChargerStatus getCachedStatus(UUID id) {
        try {
            String val = redisTemplate.opsForValue().get(AVAILABILITY_KEY + id);
            if (val != null) return ChargerStatus.valueOf(val);
        } catch (Exception e) {
            log.warn("Redis unavailable, reading charger status from DB");
        }
        return findCharger(id).getStatus();
    }

    @Transactional(readOnly = true)
    public ChargerAvailabilityDTO getAvailability(UUID chargerId, LocalDate date) {
        findCharger(chargerId);
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();
        List<TimeSlotDTO> slots = reservationRepository
                .findByChargerAndDateRange(chargerId, from, to)
                .stream()
                .map(r -> TimeSlotDTO.builder()
                        .startTime(r.getStartTime())
                        .endTime(r.getEndTime())
                        .build())
                .toList();
        return ChargerAvailabilityDTO.builder()
                .chargerId(chargerId)
                .date(date)
                .reservedSlots(slots)
                .build();
    }

    @Transactional(readOnly = true)
    public SlotCheckDTO checkSlot(UUID chargerId, LocalDateTime start, LocalDateTime end) {
        Charger charger = findCharger(chargerId);

        if (charger.getStatus() == ChargerStatus.OFFLINE || charger.getStatus() == ChargerStatus.MAINTENANCE) {
            return SlotCheckDTO.builder()
                    .available(false)
                    .reason("Charger is offline or under maintenance")
                    .build();
        }

        List<Reservation> conflicts = reservationRepository.findConflicting(chargerId, start, end);
        if (conflicts.isEmpty()) {
            return SlotCheckDTO.builder().available(true).build();
        }

        LocalDateTime nextAvailable = conflicts.stream()
                .map(Reservation::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(end);

        return SlotCheckDTO.builder()
                .available(false)
                .reason("This time slot conflicts with an existing reservation")
                .nextAvailableTime(nextAvailable)
                .build();
    }

    private Charger findCharger(UUID id) {
        return chargerRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Charger not found"));
    }

    private void cacheAvailability(UUID id, ChargerStatus status) {
        try {
            redisTemplate.opsForValue().set(AVAILABILITY_KEY + id, status.name(), Duration.ofMinutes(10));
        } catch (Exception e) {
            log.warn("Redis unavailable, skipping availability cache for charger {}", id);
        }
    }
}
