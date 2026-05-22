package com.chargelink.subscriptions.entity;

import com.chargelink.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan extends BaseEntity {

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "price_monthly", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceMonthly;

    @Column(name = "max_reservations_per_month", nullable = false)
    private int maxReservationsPerMonth;

    @Column(name = "max_reservation_duration_minutes", nullable = false)
    private int maxReservationDurationMinutes;

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "priority_booking", nullable = false)
    @Builder.Default
    private boolean priorityBooking = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "plan_order", nullable = false)
    @Builder.Default
    private int planOrder = 0;
}
