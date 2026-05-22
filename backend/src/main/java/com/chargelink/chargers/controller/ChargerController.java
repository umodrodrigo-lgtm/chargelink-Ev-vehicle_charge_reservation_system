package com.chargelink.chargers.controller;

import com.chargelink.chargers.dto.*;
import com.chargelink.chargers.entity.ChargerStatus;
import com.chargelink.chargers.service.ChargerService;
import com.chargelink.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chargers")
@RequiredArgsConstructor
@Tag(name = "Chargers")
public class ChargerController {

    private final ChargerService chargerService;

    @GetMapping("/station/{stationId}")
    @Operation(summary = "Get all chargers for a station")
    public ResponseEntity<ApiResponse<List<ChargerDTO>>> getByStation(@PathVariable UUID stationId) {
        return ResponseEntity.ok(ApiResponse.success(chargerService.getChargersByStation(stationId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get charger by ID")
    public ResponseEntity<ApiResponse<ChargerDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(chargerService.getCharger(id)));
    }

    @PostMapping
    @Operation(summary = "Create charger (admin)")
    public ResponseEntity<ApiResponse<ChargerDTO>> create(@Valid @RequestBody CreateChargerRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Charger created", chargerService.createCharger(request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update charger status (admin)")
    public ResponseEntity<ApiResponse<ChargerDTO>> updateStatus(
            @PathVariable UUID id,
            @RequestParam ChargerStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Status updated", chargerService.updateStatus(id, status)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update charger details (admin)")
    public ResponseEntity<ApiResponse<ChargerDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateChargerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Charger updated", chargerService.updateCharger(id, request)));
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Get reserved time slots for a charger on a given date")
    public ResponseEntity<ApiResponse<ChargerAvailabilityDTO>> getAvailability(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(chargerService.getAvailability(id, date)));
    }

    @GetMapping("/{id}/check-slot")
    @Operation(summary = "Check if a specific time slot is available")
    public ResponseEntity<ApiResponse<SlotCheckDTO>> checkSlot(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(ApiResponse.success(chargerService.checkSlot(id, start, end)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete charger (admin)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        chargerService.deleteCharger(id);
        return ResponseEntity.ok(ApiResponse.success("Charger deleted"));
    }
}
