package com.chargelink.stations.service;

import com.chargelink.chargers.entity.Charger;
import com.chargelink.chargers.entity.ChargerType;
import com.chargelink.chargers.repository.ChargerRepository;
import com.chargelink.common.AppException;
import com.chargelink.common.PagedResponse;
import com.chargelink.stations.dto.ChargingStationDTO;
import com.chargelink.stations.dto.CreateStationRequest;
import com.chargelink.stations.entity.ChargingStation;
import com.chargelink.stations.entity.StationStatus;
import com.chargelink.stations.repository.ChargingStationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ChargingStationService {

    private static final Logger adminLog = LoggerFactory.getLogger("chargelink.events.admin");

    private final ChargingStationRepository stationRepository;
    private final ChargerRepository chargerRepository;

    private static final Object[][] DEFAULT_CHARGERS = {
        { "C1", ChargerType.CCS,     new BigDecimal("150"), new BigDecimal("0.35") },
        { "C2", ChargerType.TYPE_2,  new BigDecimal("22"),  new BigDecimal("0.25") },
        { "C3", ChargerType.CHADEMO, new BigDecimal("50"),  new BigDecimal("0.30") },
        { "C4", ChargerType.CCS,     new BigDecimal("350"), new BigDecimal("0.45") },
        { "C5", ChargerType.TESLA,   new BigDecimal("250"), new BigDecimal("0.40") },
    };

    @Transactional(readOnly = true)
    public PagedResponse<ChargingStationDTO> getAllStations(String query, StationStatus status, Pageable pageable) {
        var page = StringUtils.hasText(query)
                ? stationRepository.search(query, pageable)
                : (status != null
                        ? stationRepository.findAllByStatus(status, pageable)
                        : stationRepository.findAll(pageable));
        return PagedResponse.from(page.map(ChargingStationDTO::from));
    }

    @Transactional(readOnly = true)
    public ChargingStationDTO getStation(UUID id) {
        return stationRepository.findById(id)
                .map(ChargingStationDTO::from)
                .orElseThrow(() -> AppException.notFound("Charging station not found"));
    }

    @Transactional(readOnly = true)
    public List<ChargingStationDTO> getNearbyStations(BigDecimal lat, BigDecimal lng, double radiusKm) {
        return stationRepository.findNearby(lat, lng, radiusKm)
                .stream()
                .map(ChargingStationDTO::from)
                .toList();
    }

    public ChargingStationDTO createStation(CreateStationRequest request) {
        ChargingStation station = ChargingStation.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(request.getStatus() != null ? request.getStatus() : StationStatus.ACTIVE)
                .imageUrl(request.getImageUrl())
                .openingHours(request.getOpeningHours())
                .phoneNumber(request.getPhoneNumber())
                .build();
        ChargingStation saved = stationRepository.save(station);
        for (Object[] slot : DEFAULT_CHARGERS) {
            chargerRepository.save(Charger.builder()
                    .chargerNumber((String) slot[0])
                    .type((ChargerType) slot[1])
                    .powerKw((BigDecimal) slot[2])
                    .pricePerKwh((BigDecimal) slot[3])
                    .station(saved)
                    .build());
        }
        String admin = SecurityContextHolder.getContext().getAuthentication().getName();
        adminLog.info("[STATION_CREATED] admin={} id={} name=\"{}\" city={}", admin, saved.getId(), saved.getName(), saved.getCity());
        return ChargingStationDTO.from(saved);
    }

    public ChargingStationDTO updateStation(UUID id, CreateStationRequest request) {
        ChargingStation station = stationRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Charging station not found"));
        if (StringUtils.hasText(request.getName()))    station.setName(request.getName());
        if (StringUtils.hasText(request.getAddress())) station.setAddress(request.getAddress());
        if (StringUtils.hasText(request.getCity()))    station.setCity(request.getCity());
        if (request.getLatitude() != null)             station.setLatitude(request.getLatitude());
        if (request.getLongitude() != null)            station.setLongitude(request.getLongitude());
        if (request.getStatus() != null)               station.setStatus(request.getStatus());
        if (StringUtils.hasText(request.getDescription()))   station.setDescription(request.getDescription());
        if (StringUtils.hasText(request.getImageUrl()))       station.setImageUrl(request.getImageUrl());
        if (StringUtils.hasText(request.getOpeningHours()))   station.setOpeningHours(request.getOpeningHours());
        if (StringUtils.hasText(request.getPhoneNumber()))    station.setPhoneNumber(request.getPhoneNumber());
        ChargingStationDTO dto = ChargingStationDTO.from(stationRepository.save(station));
        String admin = SecurityContextHolder.getContext().getAuthentication().getName();
        adminLog.info("[STATION_UPDATED] admin={} id={} name=\"{}\"", admin, id, station.getName());
        return dto;
    }

    public void deleteStation(UUID id) {
        ChargingStation station = stationRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Charging station not found"));
        stationRepository.deleteById(id);
        String admin = SecurityContextHolder.getContext().getAuthentication().getName();
        adminLog.info("[STATION_DELETED] admin={} id={} name=\"{}\"", admin, id, station.getName());
    }
}
