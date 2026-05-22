package com.chargelink.config;

import com.chargelink.chargers.entity.Charger;
import com.chargelink.chargers.entity.ChargerType;
import com.chargelink.chargers.repository.ChargerRepository;
import com.chargelink.stations.entity.ChargingStation;
import com.chargelink.stations.repository.ChargingStationRepository;
import com.chargelink.subscriptions.entity.SubscriptionPlan;
import com.chargelink.subscriptions.repository.SubscriptionPlanRepository;
import com.chargelink.users.entity.User;
import com.chargelink.users.entity.UserRole;
import com.chargelink.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ChargingStationRepository stationRepository;
    private final ChargerRepository chargerRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedSubscriptionPlans();
        seedStationsAndChargers();
    }

    private void seedAdminUser() {
        if (userRepository.existsByEmail("admin@chargelink.com")) return;
        User admin = User.builder()
                .email("admin@chargelink.com")
                .password(passwordEncoder.encode("Admin@1234"))
                .firstName("System")
                .lastName("Admin")
                .role(UserRole.ADMIN)
                .build();
        userRepository.save(admin);
        log.info("Admin user created: admin@chargelink.com / Admin@1234");

        User demo = User.builder()
                .email("user@chargelink.com")
                .password(passwordEncoder.encode("User@1234"))
                .firstName("Demo")
                .lastName("User")
                .role(UserRole.USER)
                .build();
        userRepository.save(demo);
        log.info("Demo user created: user@chargelink.com / User@1234");
    }

    private void seedSubscriptionPlans() {
        if (planRepository.existsByName("Free")) return;

        planRepository.save(SubscriptionPlan.builder()
                .name("Free")
                .description("Basic access — 3 reservations/month, up to 60 minutes each")
                .priceMonthly(BigDecimal.ZERO)
                .maxReservationsPerMonth(3)
                .maxReservationDurationMinutes(60)
                .discountPercentage(BigDecimal.ZERO)
                .priorityBooking(false)
                .planOrder(0)
                .build());

        planRepository.save(SubscriptionPlan.builder()
                .name("Basic")
                .description("10 reservations/month, up to 120 minutes each, 5% discount")
                .priceMonthly(new BigDecimal("9.99"))
                .maxReservationsPerMonth(10)
                .maxReservationDurationMinutes(120)
                .discountPercentage(new BigDecimal("5.00"))
                .priorityBooking(false)
                .planOrder(1)
                .build());

        planRepository.save(SubscriptionPlan.builder()
                .name("Premium")
                .description("Unlimited reservations, up to 240 minutes, 15% discount, priority booking")
                .priceMonthly(new BigDecimal("24.99"))
                .maxReservationsPerMonth(Integer.MAX_VALUE)
                .maxReservationDurationMinutes(240)
                .discountPercentage(new BigDecimal("15.00"))
                .priorityBooking(true)
                .planOrder(2)
                .build());

        log.info("Subscription plans seeded");
    }

    private void seedStationsAndChargers() {
        if (stationRepository.count() > 0) return;

        ChargingStation s1 = stationRepository.save(ChargingStation.builder()
                .name("Downtown Charging Hub")
                .description("Central fast-charging station in the city core")
                .address("123 Main Street")
                .city("San Francisco")
                .state("CA")
                .zipCode("94105")
                .latitude(new BigDecimal("37.7749"))
                .longitude(new BigDecimal("-122.4194"))
                .openingHours("24/7")
                .phoneNumber("+1-415-555-0100")
                .build());

        chargerRepository.save(Charger.builder().chargerNumber("C01").type(ChargerType.CCS)
                .powerKw(new BigDecimal("150")).pricePerKwh(new BigDecimal("0.35")).station(s1).build());
        chargerRepository.save(Charger.builder().chargerNumber("C02").type(ChargerType.CCS)
                .powerKw(new BigDecimal("150")).pricePerKwh(new BigDecimal("0.35")).station(s1).build());
        chargerRepository.save(Charger.builder().chargerNumber("C03").type(ChargerType.TYPE_2)
                .powerKw(new BigDecimal("22")).pricePerKwh(new BigDecimal("0.28")).station(s1).build());

        ChargingStation s2 = stationRepository.save(ChargingStation.builder()
                .name("Westside EV Center")
                .description("Convenient charging near shopping district")
                .address("456 Oak Avenue")
                .city("San Francisco")
                .state("CA")
                .zipCode("94117")
                .latitude(new BigDecimal("37.7695"))
                .longitude(new BigDecimal("-122.4529"))
                .openingHours("6:00 AM - 11:00 PM")
                .phoneNumber("+1-415-555-0200")
                .build());

        chargerRepository.save(Charger.builder().chargerNumber("C01").type(ChargerType.CHADEMO)
                .powerKw(new BigDecimal("50")).pricePerKwh(new BigDecimal("0.30")).station(s2).build());
        chargerRepository.save(Charger.builder().chargerNumber("C02").type(ChargerType.TYPE_2)
                .powerKw(new BigDecimal("22")).pricePerKwh(new BigDecimal("0.25")).station(s2).build());

        ChargingStation s3 = stationRepository.save(ChargingStation.builder()
                .name("Airport Quick Charge")
                .description("Fast charging before or after your flight")
                .address("789 Airport Blvd")
                .city("San Francisco")
                .state("CA")
                .zipCode("94128")
                .latitude(new BigDecimal("37.6213"))
                .longitude(new BigDecimal("-122.3790"))
                .openingHours("24/7")
                .phoneNumber("+1-415-555-0300")
                .build());

        chargerRepository.save(Charger.builder().chargerNumber("C01").type(ChargerType.CCS)
                .powerKw(new BigDecimal("350")).pricePerKwh(new BigDecimal("0.42")).station(s3).build());
        chargerRepository.save(Charger.builder().chargerNumber("C02").type(ChargerType.TESLA)
                .powerKw(new BigDecimal("250")).pricePerKwh(new BigDecimal("0.38")).station(s3).build());

        log.info("Sample stations and chargers seeded");
    }
}
