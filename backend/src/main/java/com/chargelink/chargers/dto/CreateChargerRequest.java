package com.chargelink.chargers.dto;

import com.chargelink.chargers.entity.ChargerType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class CreateChargerRequest {

    @NotNull(message = "Station ID is required")
    private UUID stationId;

    @NotBlank(message = "Charger number is required")
    @Size(max = 20)
    private String chargerNumber;

    @NotNull(message = "Charger type is required")
    private ChargerType type;

    @NotNull(message = "Power (kW) is required")
    @DecimalMin(value = "1.0", message = "Power must be at least 1 kW")
    @DecimalMax(value = "500.0", message = "Power cannot exceed 500 kW")
    private BigDecimal powerKw;

    @NotNull(message = "Price per kWh is required")
    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    private BigDecimal pricePerKwh;
}
