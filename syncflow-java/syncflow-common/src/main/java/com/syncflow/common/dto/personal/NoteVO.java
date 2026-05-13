package com.syncflow.common.dto.personal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Personal note view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteVO {

    private Long id;
    private String title;
    private String content;
    private Long userId;
    private String tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
