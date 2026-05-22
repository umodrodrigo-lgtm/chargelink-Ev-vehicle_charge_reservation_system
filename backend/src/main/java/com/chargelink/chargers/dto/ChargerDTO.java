package com.chargelink.chargers.dto;

import com.chargelink.chargers.entity.Charger;
import com.chargelink.chargers.entity.ChargerStatus;
import com.chargelink.chargers.entity.ChargerType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class ChargerDTO {

    private UUID id;
    private String chargerNumber;
    private ChargerType type;
    private BigDecimal powerKw;
    private BigDecimal pricePerKwh;
    private ChargerStatus status;
    private UUID stationId;
    private String stationName;
    private LocalDateTime createdAt;

    public static ChargerDTO from(Charger c) {
        return ChargerDTO.builder()
                .id(c.getId())
                .chargerNumber(c.getChargerNumber())
                .type(c.getType())
                .powerKw(c.getPowerKw())
                .pricePerKwh(c.getPricePerKwh())
                .status(c.getStatus())
                .stationId(c.getStation().getId())
                .stationName(c.getStation().getName())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
