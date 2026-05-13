package com.syncflow;

import com.syncflow.common.BaseTest;
import com.syncflow.config.TestFlowableConfig;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Smoke test to verify the test infrastructure works.
 * <p>
 * If this test passes, it means:
 * <ul>
 *   <li>H2 in-memory database is configured correctly</li>
 *   <li>Spring context loads with the test profile</li>
 *   <li>Redis is mocked successfully</li>
 *   <li>Security config is overridden for tests</li>
 *   <li>Flowable engine services are mocked</li>
 * </ul>
 */
@Import(TestFlowableConfig.class)
class TestInfrastructureSmokeTest extends BaseTest {

    @Test
    void contextLoads() {
        // If we reach this point, the Spring context loaded successfully
        assertTrue(true, "Test infrastructure is working");
    }
}
