package com.syncflow.common.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface BizCodeSequenceMapper {

    @Select("INSERT INTO biz_code_sequence (code_prefix, biz_date, last_seq, created_at, updated_at) " +
            "VALUES (#{prefix}, #{bizDate}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
            "ON CONFLICT (code_prefix, biz_date) " +
            "DO UPDATE SET last_seq = biz_code_sequence.last_seq + 1, updated_at = CURRENT_TIMESTAMP " +
            "RETURNING last_seq")
    int nextSequence(@Param("prefix") String prefix, @Param("bizDate") java.time.LocalDate bizDate);
}
