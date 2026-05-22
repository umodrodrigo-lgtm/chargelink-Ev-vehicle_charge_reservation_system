package com.chargelink.subscriptions.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreatePlanRequest {

    @NotBlank(message = "Plan name is required")
    @Size(max = 80)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Monthly price is required")
    @DecimalMin(value = "0.0")
    private BigDecimal priceMonthly;

    @Min(value = 0, message = "Max reservations must be non-negative")
    private int maxReservationsPerMonth;

    @Min(value = 15, message = "Min reservation duration is 15 minutes")
    private int maxReservationDurationMinutes = 240;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    private boolean priorityBooking = false;

    private int planOrder = 0;
}
