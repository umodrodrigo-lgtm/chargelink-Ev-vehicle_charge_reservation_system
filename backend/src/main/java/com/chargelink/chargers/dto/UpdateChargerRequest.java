package com.chargelink.chargers.dto;

import com.chargelink.chargers.entity.ChargerStatus;
import com.chargelink.chargers.entity.ChargerType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateChargerRequest {

    @NotBlank
    private String chargerNumber;

    @NotNull
    private ChargerType type;

    @NotNull
    @DecimalMin("1.0")
    private BigDecimal powerKw;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal pricePerKwh;

    @NotNull
    private ChargerStatus status;
}
