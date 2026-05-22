package com.chargelink.chargers.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TimeSlotDTO {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
