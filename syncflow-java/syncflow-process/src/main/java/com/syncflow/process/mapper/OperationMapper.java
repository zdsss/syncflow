package com.syncflow.process.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.process.entity.Operation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * Operation mapper with custom queries.
 */
@Mapper
public interface OperationMapper extends BaseMapper<Operation> {

    /**
     * Select all operations for a route, ordered by sequence number.
     *
     * @param routeId the route id
     * @return ordered list of operations
     */
    @Select("SELECT * FROM prc_operation WHERE route_id = #{routeId} ORDER BY seq_no ASC")
    List<Operation> selectByRouteId(@Param("routeId") Long routeId);
}
