package com.chargelink.chargers.entity;

import com.chargelink.common.BaseEntity;
import com.chargelink.stations.entity.ChargingStation;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "chargers",
        indexes = {
                @Index(name = "idx_charger_station", columnList = "station_id"),
                @Index(name = "idx_charger_status", columnList = "status")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Charger extends BaseEntity {

    @Column(name = "charger_number", nullable = false, length = 20)
    private String chargerNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChargerType type;

    @Column(name = "power_kw", nullable = false, precision = 6, scale = 2)
    private BigDecimal powerKw;

    @Column(name = "price_per_kwh", nullable = false, precision = 8, scale = 4)
    private BigDecimal pricePerKwh;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ChargerStatus status = ChargerStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private ChargingStation station;
}
