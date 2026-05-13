package com.syncflow.common.dto.personal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating or updating a personal note.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNoteDTO {

    private String title;
    private String content;
    private String tags;
}
