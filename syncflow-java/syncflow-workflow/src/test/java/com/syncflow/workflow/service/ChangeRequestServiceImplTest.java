package com.syncflow.workflow.service;

import com.syncflow.common.exception.BusinessException;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import com.syncflow.workflow.service.impl.ChangeRequestServiceImpl;import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChangeRequestServiceImpl")
class ChangeRequestServiceImplTest {

    @Mock
    private ChangeRequestMapper changeRequestMapper;

    @Mock
    private ApprovalCallbackRegistry callbackRegistry;

    @InjectMocks
    private ChangeRequestServiceImpl changeRequestService;

    private ChangeRequest buildRequest(Long id, Integer status) {
        ChangeRequest cr = new ChangeRequest();
        cr.setId(id);
        cr.setObjectType("BOM_CHANGE");
        cr.setObjectId(100L);
        cr.setChangeType("ADD_ITEM");
        cr.setChangeData("{\"itemId\":1}");
        cr.setStatus(status);
        cr.setRequestedBy(1L);
        cr.setRequestedAt(LocalDateTime.now());
        return cr;
    }

    @Test
    @DisplayName("createRequest: inserts and returns id")
    void createRequest_insertsAndReturnsId() {
        when(changeRequestMapper.insert(any(ChangeRequest.class))).thenAnswer(invocation -> {
            ChangeRequest cr = invocation.getArgument(0);
            cr.setId(1L);
            return 1;
        });

        Long id = changeRequestService.createRequest(
                "BOM_CHANGE", 100L, "ADD_ITEM", "{\"item\":1}", "Add new part", 1L);

        assertEquals(1L, id);
        verify(changeRequestMapper).insert(any(ChangeRequest.class));
    }

    @Test
    @DisplayName("getRequest: delegates to mapper")
    void getRequest_delegatesToMapper() {
        ChangeRequest cr = buildRequest(1L, 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);

        ChangeRequest result = changeRequestService.getRequest(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    @DisplayName("getRequestsByObject: returns list by objectType and objectId")
    void getRequestsByObject_returnsList() {
        when(changeRequestMapper.selectList(any())).thenReturn(List.of(buildRequest(1L, 1)));

        List<ChangeRequest> results = changeRequestService.getRequestsByObject("BOM_CHANGE", 100L);

        assertEquals(1, results.size());
    }

    @Test
    @DisplayName("applyRequest: sets status=2 and resolvedAt")
    void applyRequest_setsApplied() {
        ChangeRequest cr = buildRequest(1L, 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);
        when(changeRequestMapper.updateById(any(ChangeRequest.class))).thenReturn(1);

        changeRequestService.applyRequest(1L, 2L);

        assertEquals(2, cr.getStatus());
        assertEquals(2L, cr.getResolvedBy());
        assertNotNull(cr.getResolvedAt());
    }

    @Test
    @DisplayName("rejectRequest: sets status=3 and resolvedAt")
    void rejectRequest_setsRejected() {
        ChangeRequest cr = buildRequest(1L, 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);
        when(changeRequestMapper.updateById(any(ChangeRequest.class))).thenReturn(1);

        changeRequestService.rejectRequest(1L, 2L);

        assertEquals(3, cr.getStatus());
        assertEquals(2L, cr.getResolvedBy());
    }

    @Test
    @DisplayName("applyRequest: throws when not pending")
    void applyRequest_notPending_throws() {
        ChangeRequest cr = buildRequest(1L, 2); // already applied
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);

        assertThrows(BusinessException.class, () -> changeRequestService.applyRequest(1L, 2L));
    }

    @Test
    @DisplayName("applyRequest: throws when not found")
    void applyRequest_notFound_throws() {
        when(changeRequestMapper.selectById(999L)).thenReturn(null);

        assertThrows(BusinessException.class, () -> changeRequestService.applyRequest(999L, 2L));
    }
}
