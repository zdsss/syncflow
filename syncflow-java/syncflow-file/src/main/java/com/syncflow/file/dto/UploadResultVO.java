package com.syncflow.file.dto;

import lombok.Data;

/**
 * Result returned after a successful file upload.
 */
@Data
public class UploadResultVO {

    private Long fileId;

    private String fileNo;

    /** Stored file name. */
    private String name;

    /** File size in bytes. */
    private Long size;

    /** Accessible URL for the uploaded file. */
    private String url;
}
