package com.chargelink.stations.dto;

import com.chargelink.stations.entity.StationStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateStationRequest {

    @NotBlank(message = "Station name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @NotBlank(message = "Address is required")
    @Size(max = 300)
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 10)
    private String zipCode;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    private BigDecimal longitude;

    private StationStatus status = StationStatus.ACTIVE;

    @Size(max = 500)
    private String imageUrl;

    @Size(max = 200)
    private String openingHours;

    @Size(max = 30)
    private String phoneNumber;
}
