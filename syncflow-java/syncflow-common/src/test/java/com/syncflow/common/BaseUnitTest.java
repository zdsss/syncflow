package com.syncflow.common;

import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Base test class for unit tests (no Spring context).
 * <p>
 * Uses Mockito extension for mocking.  Tests extending this class run fast
 * because no Spring application context is started.
 * <p>
 * Typical usage:
 * <pre>{@code
 * class MyServiceTest extends BaseUnitTest {
 *
 *     @Mock
 *     private SomeDependency dependency;
 *
 *     @InjectMocks
 *     private MyService service;
 *
 *     @Test
 *     void shouldDoSomething() {
 *         given(dependency.find(any())).willReturn(...);
 *         // ...
 *     }
 * }
 * }</pre>
 */
@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseUnitTest {
}
