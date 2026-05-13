package com.syncflow.common.dto.personal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Personal file view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalFileVO {

    private Long id;
    private String name;
    private String filePath;
    private Long size;
    private Long userId;
    private LocalDateTime createdAt;
}
