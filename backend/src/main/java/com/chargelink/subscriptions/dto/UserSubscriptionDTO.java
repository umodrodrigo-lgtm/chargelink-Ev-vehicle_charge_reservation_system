package com.chargelink.subscriptions.dto;

import com.chargelink.subscriptions.entity.UserSubscription;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class UserSubscriptionDTO {

    private UUID id;
    private UUID userId;
    private SubscriptionPlanDTO plan;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private boolean currentlyActive;
    private LocalDateTime createdAt;

    public static UserSubscriptionDTO from(UserSubscription us) {
        return UserSubscriptionDTO.builder()
                .id(us.getId())
                .userId(us.getUser().getId())
                .plan(SubscriptionPlanDTO.from(us.getPlan()))
                .startDate(us.getStartDate())
                .endDate(us.getEndDate())
                .active(us.isActive())
                .currentlyActive(us.isCurrentlyActive())
                .createdAt(us.getCreatedAt())
                .build();
    }
}
