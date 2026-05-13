package com.syncflow.common.service.personal.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.common.dto.personal.*;
import com.syncflow.common.entity.personal.Note;
import com.syncflow.common.entity.personal.PersonalFile;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.mapper.personal.NoteMapper;
import com.syncflow.common.mapper.personal.PersonalFileMapper;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.service.personal.PersonalService;
import com.syncflow.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Personal workspace service implementation.
 */
@Service
@RequiredArgsConstructor
public class PersonalServiceImpl implements PersonalService {

    private final PersonalFileMapper personalFileMapper;
    private final NoteMapper noteMapper;

    // -----------------------------------------------------------------------
    //  Personal Files
    // -----------------------------------------------------------------------

    @Override
    public PageResult<PersonalFileVO> getPersonalFiles(int pageNum, int pageSize) {
        Long userId = SecurityUtils.getUserId();

        Page<PersonalFile> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<PersonalFile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PersonalFile::getUserId, userId)
               .orderByDesc(PersonalFile::getCreatedAt);

        IPage<PersonalFile> result = personalFileMapper.selectPage(page, wrapper);
        List<PersonalFileVO> voList = result.getRecords().stream()
                .map(this::toFileVO)
                .collect(Collectors.toList());
        return new PageResult<>(voList, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    @Transactional
    public PersonalFileVO createPersonalFile(CreatePersonalFileDTO dto) {
        Long userId = SecurityUtils.getUserId();

        PersonalFile file = new PersonalFile();
        file.setName(dto.getName());
        file.setFilePath(dto.getFilePath());
        file.setSize(dto.getSize());
        file.setUserId(userId);

        personalFileMapper.insert(file);
        return toFileVO(file);
    }

    @Override
    @Transactional
    public void deletePersonalFile(Long id) {
        PersonalFile file = personalFileMapper.selectById(id);
        if (file == null) {
            throw new BusinessException(ErrorCode.PERSONAL_FILE_NOT_FOUND);
        }
        // Verify ownership
        Long userId = SecurityUtils.getUserId();
        if (!file.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot delete another user's file");
        }
        personalFileMapper.deleteById(id);
    }

    // -----------------------------------------------------------------------
    //  Notes
    // -----------------------------------------------------------------------

    @Override
    public PageResult<NoteVO> getNotes(String keyword, int pageNum, int pageSize) {
        Long userId = SecurityUtils.getUserId();

        Page<Note> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Note> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Note::getUserId, userId);

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(Note::getTitle, keyword)
                              .or()
                              .like(Note::getContent, keyword));
        }
        wrapper.orderByDesc(Note::getUpdatedAt);

        IPage<Note> result = noteMapper.selectPage(page, wrapper);
        List<NoteVO> voList = result.getRecords().stream()
                .map(this::toNoteVO)
                .collect(Collectors.toList());
        return new PageResult<>(voList, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    @Transactional
    public NoteVO createNote(CreateNoteDTO dto) {
        Long userId = SecurityUtils.getUserId();

        Note note = new Note();
        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        note.setTags(dto.getTags());
        note.setUserId(userId);

        noteMapper.insert(note);
        return toNoteVO(note);
    }

    @Override
    @Transactional
    public NoteVO updateNote(Long id, CreateNoteDTO dto) {
        Note note = noteMapper.selectById(id);
        if (note == null) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        Long userId = SecurityUtils.getUserId();
        if (!note.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot edit another user's note");
        }

        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        note.setTags(dto.getTags());

        noteMapper.updateById(note);
        return toNoteVO(note);
    }

    @Override
    @Transactional
    public void deleteNote(Long id) {
        Note note = noteMapper.selectById(id);
        if (note == null) {
            throw new BusinessException(ErrorCode.NOTE_NOT_FOUND);
        }
        Long userId = SecurityUtils.getUserId();
        if (!note.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot delete another user's note");
        }
        noteMapper.deleteById(id);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private PersonalFileVO toFileVO(PersonalFile file) {
        return PersonalFileVO.builder()
                .id(file.getId())
                .name(file.getName())
                .filePath(file.getFilePath())
                .size(file.getSize())
                .userId(file.getUserId())
                .createdAt(file.getCreatedAt())
                .build();
    }

    private NoteVO toNoteVO(Note note) {
        return NoteVO.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .userId(note.getUserId())
                .tags(note.getTags())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
