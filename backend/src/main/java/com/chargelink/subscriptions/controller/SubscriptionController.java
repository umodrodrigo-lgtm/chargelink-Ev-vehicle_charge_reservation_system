package com.chargelink.subscriptions.controller;

import com.chargelink.common.ApiResponse;
import com.chargelink.subscriptions.dto.CreatePlanRequest;
import com.chargelink.subscriptions.dto.SubscribeRequest;
import com.chargelink.subscriptions.dto.SubscriptionPlanDTO;
import com.chargelink.subscriptions.dto.UserSubscriptionDTO;
import com.chargelink.subscriptions.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    @Operation(summary = "Get all active subscription plans (public)")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDTO>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getActivePlans()));
    }

    @GetMapping("/plans/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all plans including inactive (admin)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDTO>>> getAllPlans() {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getAllPlans()));
    }

    @PostMapping("/plans")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create subscription plan (admin)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SubscriptionPlanDTO>> createPlan(@Valid @RequestBody CreatePlanRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Plan created", subscriptionService.createPlan(request)));
    }

    @PostMapping("/subscribe")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Subscribe to a plan")
    public ResponseEntity<ApiResponse<UserSubscriptionDTO>> subscribe(@Valid @RequestBody SubscribeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Subscribed successfully", subscriptionService.subscribe(request)));
    }

    @GetMapping("/my")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my active subscription")
    public ResponseEntity<ApiResponse<Optional<UserSubscriptionDTO>>> getMy() {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getMyActiveSubscription()));
    }

    @DeleteMapping("/my")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cancel my subscription")
    public ResponseEntity<ApiResponse<Void>> cancel() {
        subscriptionService.cancelSubscription();
        return ResponseEntity.ok(ApiResponse.success("Subscription cancelled"));
    }
}
