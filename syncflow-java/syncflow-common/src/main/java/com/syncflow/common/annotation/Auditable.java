package com.syncflow.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method for audit logging.
 * <p>
 * Used by {@link com.syncflow.common.aspect.AuditLogAspect} to capture
 * who did what to which entity.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    /** The action being performed (e.g. "CREATE_PROJECT", "DELETE_TASK"). */
    String action();

    /** The target entity type (e.g. "Project", "Task", "Bom"). */
    String targetType();
}
