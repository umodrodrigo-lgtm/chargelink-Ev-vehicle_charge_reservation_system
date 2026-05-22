package com.chargelink.reservations.controller;

import com.chargelink.common.ApiResponse;
import com.chargelink.common.PagedResponse;
import com.chargelink.reservations.dto.CreateReservationRequest;
import com.chargelink.reservations.dto.ReservationDTO;
import com.chargelink.reservations.entity.ReservationStatus;
import com.chargelink.reservations.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservations")
@SecurityRequirement(name = "bearerAuth")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @Operation(summary = "Create a reservation")
    public ResponseEntity<ApiResponse<ReservationDTO>> create(@Valid @RequestBody CreateReservationRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reservation created", reservationService.createReservation(request)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my reservations")
    public ResponseEntity<ApiResponse<PagedResponse<ReservationDTO>>> getMyReservations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        return ResponseEntity.ok(ApiResponse.success(reservationService.getMyReservations(pageable)));
    }

    @GetMapping("/my/{id}")
    @Operation(summary = "Get a specific reservation")
    public ResponseEntity<ApiResponse<ReservationDTO>> getMyReservation(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(reservationService.getMyReservation(id)));
    }

    @PatchMapping("/my/{id}/cancel")
    @Operation(summary = "Cancel a reservation")
    public ResponseEntity<ApiResponse<ReservationDTO>> cancel(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "Cancelled by user") String reason) {
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled", reservationService.cancelReservation(id, reason)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all reservations (admin)")
    public ResponseEntity<ApiResponse<PagedResponse<ReservationDTO>>> getAll(
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(reservationService.getAllReservations(status, pageable)));
    }
}
