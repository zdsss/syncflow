package com.syncflow.common.service.personal;

import com.syncflow.common.dto.personal.*;
import com.syncflow.common.result.PageResult;

import java.util.List;

/**
 * Personal workspace service interface (files + notes).
 */
public interface PersonalService {

    /**
     * Get personal files for the current user.
     */
    PageResult<PersonalFileVO> getPersonalFiles(int pageNum, int pageSize);

    /**
     * Create a personal file entry.
     */
    PersonalFileVO createPersonalFile(CreatePersonalFileDTO dto);

    /**
     * Delete a personal file.
     */
    void deletePersonalFile(Long id);

    /**
     * Get notes for the current user.
     */
    PageResult<NoteVO> getNotes(String keyword, int pageNum, int pageSize);

    /**
     * Create a note.
     */
    NoteVO createNote(CreateNoteDTO dto);

    /**
     * Update a note.
     */
    NoteVO updateNote(Long id, CreateNoteDTO dto);

    /**
     * Delete a note.
     */
    void deleteNote(Long id);
}
