package com.chargelink.websocket.dto;

import com.chargelink.chargers.dto.ChargerDTO;
import com.chargelink.chargers.entity.ChargerStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class ChargerStatusUpdate {

    private UUID chargerId;
    private UUID stationId;
    private String chargerNumber;
    private ChargerStatus status;
    private LocalDateTime timestamp;

    public static ChargerStatusUpdate from(ChargerDTO charger) {
        return ChargerStatusUpdate.builder()
                .chargerId(charger.getId())
                .stationId(charger.getStationId())
                .chargerNumber(charger.getChargerNumber())
                .status(charger.getStatus())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
