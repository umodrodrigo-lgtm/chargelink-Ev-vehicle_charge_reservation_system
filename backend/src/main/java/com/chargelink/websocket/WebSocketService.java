package com.chargelink.websocket;

import com.chargelink.chargers.dto.ChargerDTO;
import com.chargelink.reservations.dto.ReservationDTO;
import com.chargelink.websocket.dto.ChargerStatusUpdate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastChargerStatus(ChargerDTO charger) {
        ChargerStatusUpdate update = ChargerStatusUpdate.from(charger);
        messagingTemplate.convertAndSend("/topic/chargers/" + charger.getId(), update);
        messagingTemplate.convertAndSend("/topic/stations/" + charger.getStationId() + "/chargers", update);
        log.debug("Broadcast charger status: {} -> {}", charger.getId(), charger.getStatus());
    }

    public void broadcastReservationUpdate(ReservationDTO reservation) {
        messagingTemplate.convertAndSend("/topic/reservations", reservation);
        messagingTemplate.convertAndSend("/topic/users/" + reservation.getUserId() + "/reservations", reservation);
        log.debug("Broadcast reservation update: {} -> {}", reservation.getId(), reservation.getStatus());
    }

    public void sendNotificationToUser(String userId, Object message) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", message);
    }
}
