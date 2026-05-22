package com.chargelink.stations.controller;

import com.chargelink.common.ApiResponse;
import com.chargelink.common.PagedResponse;
import com.chargelink.stations.dto.ChargingStationDTO;
import com.chargelink.stations.dto.CreateStationRequest;
import com.chargelink.stations.entity.StationStatus;
import com.chargelink.stations.service.ChargingStationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/stations")
@RequiredArgsConstructor
@Tag(name = "Charging Stations")
public class ChargingStationController {

    private final ChargingStationService service;

    @GetMapping
    @Operation(summary = "Get all stations with optional search and status filter")
    public ResponseEntity<ApiResponse<PagedResponse<ChargingStationDTO>>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) StationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(service.getAllStations(query, status, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get station by ID")
    public ResponseEntity<ApiResponse<ChargingStationDTO>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getStation(id)));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Get nearby stations by coordinates")
    public ResponseEntity<ApiResponse<List<ChargingStationDTO>>> getNearby(
            @RequestParam BigDecimal lat,
            @RequestParam BigDecimal lng,
            @RequestParam(defaultValue = "10.0") double radiusKm) {
        return ResponseEntity.ok(ApiResponse.success(service.getNearbyStations(lat, lng, radiusKm)));
    }

    @PostMapping
    @Operation(summary = "Create charging station (admin)")
    public ResponseEntity<ApiResponse<ChargingStationDTO>> create(@Valid @RequestBody CreateStationRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Station created", service.createStation(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update charging station (admin)")
    public ResponseEntity<ApiResponse<ChargingStationDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateStationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Station updated", service.updateStation(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete charging station (admin)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.ok(ApiResponse.success("Station deleted"));
    }
}
