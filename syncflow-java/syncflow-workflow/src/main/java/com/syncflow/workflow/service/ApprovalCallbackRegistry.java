package com.syncflow.workflow.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Central registry that dispatches approval lifecycle events to the
 * appropriate {@link ApprovalCallbackHandler} based on object type.
 * <p>
 * Handlers are auto-discovered via Spring injection and register themselves
 * for the object types they support (see {@link ApprovalCallbackHandler#supportedObjectTypes()}).
 */
@Slf4j
@Component
public class ApprovalCallbackRegistry {

    private final Map<String, ApprovalCallbackHandler> handlers = new HashMap<>();
    private final List<ApprovalCallbackHandler> allHandlers;

    @Autowired
    public ApprovalCallbackRegistry(List<ApprovalCallbackHandler> allHandlers) {
        this.allHandlers = allHandlers;
    }

    @PostConstruct
    void init() {
        for (ApprovalCallbackHandler handler : allHandlers) {
            Set<String> types = handler.supportedObjectTypes();
            for (String type : types) {
                if (handlers.containsKey(type)) {
                    log.warn("Duplicate ApprovalCallbackHandler for type '{}' — {} will replace {}",
                            type, handler.getClass().getSimpleName(),
                            handlers.get(type).getClass().getSimpleName());
                }
                handlers.put(type, handler);
            }
            log.info("Registered ApprovalCallbackHandler {} for types: {}",
                    handler.getClass().getSimpleName(), types);
        }
    }

    public void onApproved(String objectType, Long objectId, Long approverId) {
        ApprovalCallbackHandler handler = getHandler(objectType, objectId);
        if (handler != null) {
            handler.onApproved(objectId, approverId);
        }
    }

    public void onRejected(String objectType, Long objectId, String reason) {
        ApprovalCallbackHandler handler = getHandler(objectType, objectId);
        if (handler != null) {
            handler.onRejected(objectId, reason);
        }
    }

    public void onWithdrawn(String objectType, Long objectId) {
        ApprovalCallbackHandler handler = getHandler(objectType, objectId);
        if (handler != null) {
            handler.onWithdrawn(objectId);
        }
    }

    private ApprovalCallbackHandler getHandler(String objectType, Long objectId) {
        ApprovalCallbackHandler handler = handlers.get(objectType);
        if (handler == null) {
            log.error("No ApprovalCallbackHandler registered for type '{}', objectId={}. "
                    + "Business entity will NOT be updated. Registered types: {}",
                    objectType, objectId, handlers.keySet());
            return null;
        }
        return handler;
    }
}
