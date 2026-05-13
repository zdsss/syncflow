package com.syncflow.task.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for a task comment.
 */
@Data
public class CommentVO {

    private Long id;

    private Long taskId;

    private String content;

    private Long userId;

    /** Display name of the comment author. */
    private String userName;

    private LocalDateTime createdAt;
}
