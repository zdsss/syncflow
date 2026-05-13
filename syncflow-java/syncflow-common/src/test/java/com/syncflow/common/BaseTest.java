package com.syncflow.common;

import org.junit.jupiter.api.TestInstance;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base test class for integration tests.
 * <p>
 * Boots the full Spring application context with:
 * <ul>
 *   <li>H2 in-memory database (PostgreSQL compatibility mode)</li>
 *   <li>Redis auto-configuration excluded; a mock {@link RedisConnectionFactory}
 *       is injected so that {@code RedisConfig} can still create its template bean</li>
 *   <li>JWT configured with test secret</li>
 * </ul>
 * <p>
 * Subclasses inherit the application context and can add {@code @MockBean}
 * declarations or {@code @Transactional} as needed.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseTest {

    /**
     * Mock Redis connection factory.
     * <p>
     * Redis auto-configuration is excluded in the test profile, so no real
     * {@code RedisConnectionFactory} is created.  This mock satisfies the
     * {@code RedisConfig#redisTemplate(RedisConnectionFactory)} bean method
     * without requiring a running Redis server.
     */
    @MockBean
    protected RedisConnectionFactory redisConnectionFactory;
}
