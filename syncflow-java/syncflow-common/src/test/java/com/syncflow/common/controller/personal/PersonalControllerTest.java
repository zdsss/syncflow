package com.syncflow.common.controller.personal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.dto.personal.*;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.service.personal.PersonalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PersonalController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("PersonalController")
class PersonalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PersonalService personalService;

    private PersonalFileVO buildFileVO(Long id) {
        return PersonalFileVO.builder()
                .id(id)
                .name("file-" + id + ".pdf")
                .filePath("/uploads/file-" + id + ".pdf")
                .size(1024L)
                .userId(1L)
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    private NoteVO buildNoteVO(Long id) {
        return NoteVO.builder()
                .id(id)
                .title("Note " + id)
                .content("Content for note " + id)
                .userId(1L)
                .tags("tag1")
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 2, 0, 0))
                .build();
    }

    // -----------------------------------------------------------------------
    //  GET /api/personal/files
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/personal/files")
    class GetPersonalFilesTests {

        @Test
        @DisplayName("should return paginated personal files")
        void getPersonalFiles_success() throws Exception {
            PageResult<PersonalFileVO> pageResult = new PageResult<>(
                    List.of(buildFileVO(1L), buildFileVO(2L)),
                    2, 10, 1);
            when(personalService.getPersonalFiles(1, 10)).thenReturn(pageResult);

            mockMvc.perform(get("/api/personal/files")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.total").value(2));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/personal/files
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/personal/files")
    class CreatePersonalFileTests {

        @Test
        @DisplayName("should create personal file entry")
        void createPersonalFile_success() throws Exception {
            CreatePersonalFileDTO dto = CreatePersonalFileDTO.builder()
                    .name("document.pdf")
                    .filePath("/uploads/document.pdf")
                    .size(2048L)
                    .build();
            when(personalService.createPersonalFile(any(CreatePersonalFileDTO.class)))
                    .thenReturn(buildFileVO(1L));

            mockMvc.perform(post("/api/personal/files")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/personal/files/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/personal/files/{id}")
    class DeletePersonalFileTests {

        @Test
        @DisplayName("should delete personal file")
        void deletePersonalFile_success() throws Exception {
            doNothing().when(personalService).deletePersonalFile(1L);

            mockMvc.perform(delete("/api/personal/files/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }

        @Test
        @DisplayName("should return error when file not found")
        void deletePersonalFile_notFound() throws Exception {
            doThrow(new BusinessException(ErrorCode.PERSONAL_FILE_NOT_FOUND))
                    .when(personalService).deletePersonalFile(99L);

            mockMvc.perform(delete("/api/personal/files/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PERSONAL_FILE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/personal/notes
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/personal/notes")
    class GetNotesTests {

        @Test
        @DisplayName("should return paginated notes")
        void getNotes_success() throws Exception {
            PageResult<NoteVO> pageResult = new PageResult<>(
                    List.of(buildNoteVO(1L), buildNoteVO(2L)),
                    2, 10, 1);
            when(personalService.getNotes(isNull(), eq(1), eq(10))).thenReturn(pageResult);

            mockMvc.perform(get("/api/personal/notes")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.total").value(2));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/personal/notes
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/personal/notes")
    class CreateNoteTests {

        @Test
        @DisplayName("should create note")
        void createNote_success() throws Exception {
            CreateNoteDTO dto = CreateNoteDTO.builder()
                    .title("My Note")
                    .content("Note content")
                    .tags("important")
                    .build();
            when(personalService.createNote(any(CreateNoteDTO.class)))
                    .thenReturn(buildNoteVO(1L));

            mockMvc.perform(post("/api/personal/notes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  PATCH /api/personal/notes/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PATCH /api/personal/notes/{id}")
    class UpdateNoteTests {

        @Test
        @DisplayName("should update note")
        void updateNote_success() throws Exception {
            CreateNoteDTO dto = CreateNoteDTO.builder()
                    .title("Updated Note")
                    .build();
            when(personalService.updateNote(eq(1L), any(CreateNoteDTO.class)))
                    .thenReturn(buildNoteVO(1L));

            mockMvc.perform(patch("/api/personal/notes/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }

        @Test
        @DisplayName("should return error when note not found")
        void updateNote_notFound() throws Exception {
            CreateNoteDTO dto = CreateNoteDTO.builder().title("X").build();
            when(personalService.updateNote(eq(99L), any(CreateNoteDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.NOTE_NOT_FOUND));

            mockMvc.perform(patch("/api/personal/notes/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.NOTE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/personal/notes/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/personal/notes/{id}")
    class DeleteNoteTests {

        @Test
        @DisplayName("should delete note")
        void deleteNote_success() throws Exception {
            doNothing().when(personalService).deleteNote(1L);

            mockMvc.perform(delete("/api/personal/notes/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }
}
