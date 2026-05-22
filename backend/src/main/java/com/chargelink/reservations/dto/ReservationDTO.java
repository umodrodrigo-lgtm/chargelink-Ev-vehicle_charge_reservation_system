package com.chargelink.reservations.dto;

import com.chargelink.chargers.entity.ChargerStatus;
import com.chargelink.chargers.entity.ChargerType;
import com.chargelink.reservations.entity.Reservation;
import com.chargelink.reservations.entity.ReservationStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class ReservationDTO {

    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userEmail;
    private UUID chargerId;
    private String chargerNumber;
    private ChargerType chargerType;
    private BigDecimal chargerPowerKw;
    private BigDecimal pricePerKwh;
    private UUID stationId;
    private String stationName;
    private String stationAddress;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ReservationStatus status;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private BigDecimal energyDeliveredKwh;
    private String notes;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime createdAt;

    public static ReservationDTO from(Reservation r) {
        return ReservationDTO.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userFullName(r.getUser().getFullName())
                .userEmail(r.getUser().getEmail())
                .chargerId(r.getCharger().getId())
                .chargerNumber(r.getCharger().getChargerNumber())
                .chargerType(r.getCharger().getType())
                .chargerPowerKw(r.getCharger().getPowerKw())
                .pricePerKwh(r.getCharger().getPricePerKwh())
                .stationId(r.getStation().getId())
                .stationName(r.getStation().getName())
                .stationAddress(r.getStation().getAddress())
                .startTime(r.getStartTime())
                .endTime(r.getEndTime())
                .status(r.getStatus())
                .estimatedCost(r.getEstimatedCost())
                .actualCost(r.getActualCost())
                .energyDeliveredKwh(r.getEnergyDeliveredKwh())
                .notes(r.getNotes())
                .cancelledAt(r.getCancelledAt())
                .cancellationReason(r.getCancellationReason())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
