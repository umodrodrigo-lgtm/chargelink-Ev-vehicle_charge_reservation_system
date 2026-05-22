package com.chargelink.stations.dto;

import com.chargelink.chargers.dto.ChargerDTO;
import com.chargelink.stations.entity.ChargingStation;
import com.chargelink.stations.entity.StationStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class ChargingStationDTO {

    private UUID id;
    private String name;
    private String description;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private StationStatus status;
    private String imageUrl;
    private String openingHours;
    private String phoneNumber;
    private List<ChargerDTO> chargers;
    private int totalChargers;
    private int availableChargers;
    private LocalDateTime createdAt;

    public static ChargingStationDTO from(ChargingStation s) {
        List<ChargerDTO> chargerDTOs = s.getChargers().stream()
                .map(ChargerDTO::from)
                .toList();
        long available = chargerDTOs.stream()
                .filter(c -> "AVAILABLE".equals(c.getStatus().name()))
                .count();
        return ChargingStationDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .address(s.getAddress())
                .city(s.getCity())
                .state(s.getState())
                .zipCode(s.getZipCode())
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .status(s.getStatus())
                .imageUrl(s.getImageUrl())
                .openingHours(s.getOpeningHours())
                .phoneNumber(s.getPhoneNumber())
                .chargers(chargerDTOs)
                .totalChargers(chargerDTOs.size())
                .availableChargers((int) available)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
