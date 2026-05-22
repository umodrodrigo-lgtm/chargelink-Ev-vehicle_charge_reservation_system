package com.chargelink.chargers.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SlotCheckDTO {
    private boolean available;
    private String reason;
    private LocalDateTime nextAvailableTime;
}
