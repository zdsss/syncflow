package com.syncflow.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cache configuration using Redis as the backing store.
 * <p>
 * Two TTL tiers:
 * <ul>
 *   <li>30 min — reference data (departments, roles, module categories)</li>
 *   <li>5 min  — volatile data (dashboard summaries)</li>
 * </ul>
 * <p>
 * The {@code cacheManager} bean is conditional on {@code spring.cache.type=redis}
 * (or absent).  When tests set {@code spring.cache.type=simple}, Spring Boot
 * auto-configures a {@code ConcurrentMapCacheManager} instead.
 */
@Configuration
public class CacheConfig {

    public static final String CACHE_DEPT_TREE = "dept:tree";
    public static final String CACHE_ROLES_LIST = "roles:list";
    public static final String CACHE_DASHBOARD_SUMMARY = "dashboard:summary";
    public static final String CACHE_MODULE_CATEGORIES = "config:module:categories";

    @Bean
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis", matchIfMissing = true)
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // ObjectMapper with JavaTimeModule for LocalDate/LocalDateTime serialization
        ObjectMapper cacheObjectMapper = new ObjectMapper();
        cacheObjectMapper.registerModule(new JavaTimeModule());
        cacheObjectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(cacheObjectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                jsonSerializer));

        // Reference data: 30 min TTL
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put(CACHE_DEPT_TREE, defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigs.put(CACHE_ROLES_LIST, defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigs.put(CACHE_MODULE_CATEGORIES, defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Volatile data: 5 min TTL (inherits default)

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}
