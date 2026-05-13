package com.syncflow.message.service;

import com.syncflow.message.dto.NotificationVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service that pushes real-time messages to connected clients via STOMP.
 * <p>
 * Uses {@link SimpMessagingTemplate} to send messages to user-specific
 * destinations (via {@code /user/...}) or broadcast topics.
 * All push methods are {@code @Async} so they never block the caller.
 */
@Service
@Slf4j
public class NotificationPushService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationPushService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Send a payload to a specific user on a given destination.
     *
     * @param userId      target user id
     * @param destination destination suffix (e.g. {@code /queue/notifications})
     * @param payload     the message payload
     */
    @Async
    public void sendToUser(Long userId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId),
                destination,
                payload
        );
        log.debug("Sent STOMP message to user {} on destination {}", userId, destination);
    }

    /**
     * Broadcast a payload to all subscribers of a topic.
     *
     * @param topic   topic destination (e.g. {@code /topic/system})
     * @param payload the message payload
     */
    @Async
    public void sendToTopic(String topic, Object payload) {
        messagingTemplate.convertAndSend(topic, payload);
        log.debug("Sent STOMP broadcast to topic {}", topic);
    }

    /**
     * Push a notification to a specific user's notification queue.
     *
     * @param userId       target user id
     * @param notification the notification to push
     */
    public void pushNotification(Long userId, NotificationVO notification) {
        sendToUser(userId, "/queue/notifications", notification);
    }

    /**
     * Push an approval event to a specific user's approval queue.
     *
     * @param userId target user id
     * @param event  the approval event payload
     */
    public void pushApprovalEvent(Long userId, Object event) {
        sendToUser(userId, "/queue/approval", event);
    }
}
