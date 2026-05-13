package com.syncflow.common.mapper.knowledge;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.common.entity.knowledge.Article;
import org.apache.ibatis.annotations.Mapper;

/**
 * MyBatis-Plus mapper for {@link Article}.
 */
@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
}
