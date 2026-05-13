package com.syncflow.message.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.message.dto.NotificationVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler that pushes real-time notifications to connected clients.
 * <p>
 * Maintains a mapping of userId to their active WebSocket session. When a new
 * notification is created, the service layer calls {@link #sendNotification} to
 * push it to the connected client immediately.
 */
@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(NotificationWebSocketHandler.class);

    /** Active user sessions keyed by userId. */
    private final ConcurrentHashMap<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper;

    public NotificationWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = extractUserId(session);
        if (userId != null) {
            userSessions.put(userId, session);
            log.info("WebSocket connection established for user {}", userId);
        } else {
            log.warn("WebSocket connection without userId, closing session");
            session.close(CloseStatus.NOT_ACCEPTABLE);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = extractUserId(session);
        if (userId != null) {
            userSessions.remove(userId);
            log.info("WebSocket connection closed for user {}", userId);
        }
    }

    /**
     * Push a notification to a specific user via their WebSocket session.
     *
     * @param userId       target user id
     * @param notification the notification to push
     */
    public void sendNotification(Long userId, NotificationVO notification) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String payload = objectMapper.writeValueAsString(notification);
                session.sendMessage(new TextMessage(payload));
                log.debug("Pushed notification {} to user {}", notification.getId(), userId);
            } catch (IOException e) {
                log.error("Failed to send WebSocket notification to user {}", userId, e);
            }
        } else {
            log.debug("No active WebSocket session for user {}, notification stored in DB only", userId);
        }
    }

    /**
     * Extract userId from the WebSocket session URI query parameter.
     * <p>
     * Expects connection URL format: {@code /ws?userId=123}
     *
     * @param session the WebSocket session
     * @return userId or null if not present
     */
    private Long extractUserId(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null) {
            for (String param : query.split("&")) {
                String[] pair = param.split("=", 2);
                if (pair.length == 2 && "userId".equals(pair[0])) {
                    try {
                        return Long.parseLong(pair[1]);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid userId in WebSocket query: {}", pair[1]);
                    }
                }
            }
        }
        return null;
    }
}
