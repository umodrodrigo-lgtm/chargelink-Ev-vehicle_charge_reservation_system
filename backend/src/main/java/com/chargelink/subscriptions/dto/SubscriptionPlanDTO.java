package com.chargelink.subscriptions.dto;

import com.chargelink.subscriptions.entity.SubscriptionPlan;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class SubscriptionPlanDTO {

    private UUID id;
    private String name;
    private String description;
    private BigDecimal priceMonthly;
    private int maxReservationsPerMonth;
    private int maxReservationDurationMinutes;
    private BigDecimal discountPercentage;
    private boolean priorityBooking;
    private boolean active;
    private int planOrder;

    public static SubscriptionPlanDTO from(SubscriptionPlan p) {
        return SubscriptionPlanDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .priceMonthly(p.getPriceMonthly())
                .maxReservationsPerMonth(p.getMaxReservationsPerMonth())
                .maxReservationDurationMinutes(p.getMaxReservationDurationMinutes())
                .discountPercentage(p.getDiscountPercentage())
                .priorityBooking(p.isPriorityBooking())
                .active(p.isActive())
                .planOrder(p.getPlanOrder())
                .build();
    }
}
