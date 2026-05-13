package com.syncflow.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.task.dto.TaskQueryDTO;
import com.syncflow.task.dto.TaskListVO;
import com.syncflow.task.entity.Task;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * Task mapper with custom pagination query.
 */
@Mapper
public interface TaskMapper extends BaseMapper<Task> {

    /**
     * Paginated query with dynamic filters.
     * <p>
     * Joins prj_project and sys_user for display fields.
     *
     * @param page  pagination context
     * @param query filter criteria
     * @return page of task list view objects
     */
    IPage<TaskListVO> selectTaskPage(Page<TaskListVO> page, @Param("query") TaskQueryDTO query);
}
