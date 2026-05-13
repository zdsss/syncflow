package com.syncflow.common.controller.personal;

import com.syncflow.common.dto.personal.*;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import com.syncflow.common.service.personal.PersonalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Personal workspace controller (files + notes).
 */
@RestController
@RequestMapping("/api/personal")
public class PersonalController {

    private final PersonalService personalService;

    public PersonalController(PersonalService personalService) {
        this.personalService = personalService;
    }

    /**
     * Paginated personal files.
     */
    @GetMapping("/files")
    public Result<PageResult<PersonalFileVO>> getPersonalFiles(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<PersonalFileVO> result = personalService.getPersonalFiles(pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Create a personal file entry.
     */
    @PostMapping("/files")
    public Result<PersonalFileVO> createPersonalFile(@Valid @RequestBody CreatePersonalFileDTO dto) {
        PersonalFileVO vo = personalService.createPersonalFile(dto);
        return Result.success(vo);
    }

    /**
     * Delete a personal file.
     */
    @DeleteMapping("/files/{id}")
    public Result<Void> deletePersonalFile(@PathVariable Long id) {
        personalService.deletePersonalFile(id);
        return Result.success();
    }

    /**
     * Paginated notes.
     */
    @GetMapping("/notes")
    public Result<PageResult<NoteVO>> getNotes(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<NoteVO> result = personalService.getNotes(keyword, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Create a note.
     */
    @PostMapping("/notes")
    public Result<NoteVO> createNote(@Valid @RequestBody CreateNoteDTO dto) {
        NoteVO vo = personalService.createNote(dto);
        return Result.success(vo);
    }

    /**
     * Update a note.
     */
    @PatchMapping("/notes/{id}")
    public Result<NoteVO> updateNote(@PathVariable Long id,
                                     @Valid @RequestBody CreateNoteDTO dto) {
        NoteVO vo = personalService.updateNote(id, dto);
        return Result.success(vo);
    }

    /**
     * Delete a note.
     */
    @DeleteMapping("/notes/{id}")
    public Result<Void> deleteNote(@PathVariable Long id) {
        personalService.deleteNote(id);
        return Result.success();
    }
}
