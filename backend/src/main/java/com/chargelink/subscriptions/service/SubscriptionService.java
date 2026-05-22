package com.chargelink.subscriptions.service;

import com.chargelink.common.AppException;
import com.chargelink.subscriptions.dto.CreatePlanRequest;
import com.chargelink.subscriptions.dto.SubscribeRequest;
import com.chargelink.subscriptions.dto.SubscriptionPlanDTO;
import com.chargelink.subscriptions.dto.UserSubscriptionDTO;
import com.chargelink.subscriptions.entity.SubscriptionPlan;
import com.chargelink.subscriptions.entity.UserSubscription;
import com.chargelink.subscriptions.repository.SubscriptionPlanRepository;
import com.chargelink.subscriptions.repository.UserSubscriptionRepository;
import com.chargelink.users.entity.User;
import com.chargelink.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SubscriptionPlanDTO> getActivePlans() {
        return planRepository.findAllByActiveOrderByPlanOrder(true)
                .stream().map(SubscriptionPlanDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlanDTO> getAllPlans() {
        return planRepository.findAll()
                .stream().map(SubscriptionPlanDTO::from).toList();
    }

    public SubscriptionPlanDTO createPlan(CreatePlanRequest request) {
        if (planRepository.existsByName(request.getName())) {
            throw AppException.conflict("Plan with this name already exists");
        }
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .name(request.getName())
                .description(request.getDescription())
                .priceMonthly(request.getPriceMonthly())
                .maxReservationsPerMonth(request.getMaxReservationsPerMonth())
                .maxReservationDurationMinutes(request.getMaxReservationDurationMinutes())
                .discountPercentage(request.getDiscountPercentage())
                .priorityBooking(request.isPriorityBooking())
                .planOrder(request.getPlanOrder())
                .build();
        return SubscriptionPlanDTO.from(planRepository.save(plan));
    }

    public UserSubscriptionDTO subscribe(SubscribeRequest request) {
        User user = resolveCurrentUser();
        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> AppException.notFound("Subscription plan not found"));

        if (!plan.isActive()) throw AppException.badRequest("This plan is not currently available");

        userSubscriptionRepository.deactivateAllForUser(user.getId());

        UserSubscription subscription = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(1))
                .build();

        return UserSubscriptionDTO.from(userSubscriptionRepository.save(subscription));
    }

    @Transactional(readOnly = true)
    public Optional<UserSubscriptionDTO> getMyActiveSubscription() {
        User user = resolveCurrentUser();
        return userSubscriptionRepository.findActiveSubscription(user.getId())
                .map(UserSubscriptionDTO::from);
    }

    public void cancelSubscription() {
        User user = resolveCurrentUser();
        userSubscriptionRepository.deactivateAllForUser(user.getId());
    }

    private User resolveCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }
}
