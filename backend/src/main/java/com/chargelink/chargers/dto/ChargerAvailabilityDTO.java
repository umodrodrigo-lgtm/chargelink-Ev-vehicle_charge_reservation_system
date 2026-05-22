package com.chargelink.chargers.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class ChargerAvailabilityDTO {
    private UUID chargerId;
    private LocalDate date;
    private List<TimeSlotDTO> reservedSlots;
}
