package com.syncflow.task.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * DTO for adding a comment to a task.
 */
@Data
public class CreateCommentDTO {

    @NotBlank(message = "评论内容不能为空")
    private String content;

    /** User IDs mentioned / @'d in the comment. */
    private List<Long> mentionedUsers;
}
