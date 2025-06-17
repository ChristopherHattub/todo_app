

## TASK-010: Testing Infrastructure Setup
**Priority:** P1  
**Category:** TESTING  
**Estimated Time:** 2 hours

**Description:** Create testing infrastructure that supports the new modular architecture with proper mocking and dependency injection.

### Implementation Steps:

#### 1. Create Test Service Container
**File:** `src/test/TestServiceContainer.ts`
**Purpose:** Specialized service container for testing with mock support
**Context:** Enables easy mocking of services in tests while maintaining dependency injection

**Key Functionality:**
- Extend base ServiceContainer with test-specific features
- Support easy mock registration and replacement
- Provide test data setup and teardown
- Enable isolated testing of individual services

**Integration Points:**
- Used by all service and component tests
- Integrates with Jest mocking capabilities
- Works with React Testing Library

```typescript
// src/test/TestServiceContainer.ts - Stub
export class TestServiceContainer extends ServiceContainer {
  private originalServices = new Map<symbol, any>();
  
  mockService<T>(token: ServiceToken<T>, mockImplementation: T): void {
    // Store original service if not already stored
    // Replace service with mock
  }
  
  restoreService<T>(token: ServiceToken<T>): void {
    // Restore original service implementation
  }
  
  restoreAllServices(): void {
    // Restore all mocked services to original implementations
  }
}
```

#### 2. Create Test Utilities
**File:** `src/test/testUtils.tsx`
**Purpose:** Utility functions for testing React components with new architecture
**Context:** Provides wrapper components and helpers for testing with DI and state

**Key Functionality:**
- Create test wrapper with service container and state provider
- Provide mock implementations of all services
- Support partial mocking (mock only specific services)
- Helper functions for common testing scenarios

```typescript
// src/test/testUtils.tsx - Stub
export function createTestWrapper(options?: TestWrapperOptions): React.FC<{ children: React.ReactNode }> {
  return ({ children }) => {
    const testContainer = new TestServiceContainer();
    const testStateManager = new StateManager();
    
    // Set up test services and state
    // Apply any custom mocks from options
    
    return (
      <ServiceProvider container={testContainer}>
        <StateProvider stateManager={testStateManager}>
          {children}
        </StateProvider>
      </ServiceProvider>
    );
  };
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  // Render component with test providers
  // Return enhanced render result with test utilities
}
```

#### 3. Create Service Mocks
**File:** `src/test/mocks/serviceMocks.ts`
**Purpose:** Mock implementations of all services for testing
**Context:** Provides realistic but controllable service behavior in tests

**Key Functionality:**
- Mock implementations for all service interfaces
- Configurable behavior for different test scenarios
- Proper async behavior simulation
- Integration with Jest mock functions

```typescript
// src/test/mocks/serviceMocks.ts - Stub
export const createMockTodoService = (): jest.Mocked<ITodoService> => ({
  createTodo: jest.fn().mockResolvedValue(/* mock response */),
  updateTodo: jest.fn().mockResolvedValue(/* mock response */),
  deleteTodo: jest.fn().mockResolvedValue(/* mock response */),
  completeTodo: jest.fn().mockResolvedValue(/* mock response */),
  // ... other methods
});

export const createMockStorageService = (): jest.Mocked<IStorageService> => ({
  saveYearSchedule: jest.fn().mockResolvedValue(/* mock response */),
  loadYearSchedule: jest.fn().mockResolvedValue(/* mock response */),
  // ... other methods
});

// ... other service mocks
```

#### 4. Create Component Test Helpers
**File:** `src/test/componentTestHelpers.ts`
**Purpose:** Specialized helpers for testing different types of components
**Context:** Provides testing patterns for container components, presentation components, and hooks

**Key Functionality:**
- Helpers for testing container components with service injection
- Utilities for testing presentation components in isolation
- Hook testing utilities with proper mocking
- Event simulation and assertion helpers

```typescript
// src/test/componentTestHelpers.ts - Stub
export function testContainerComponent(
  Component: React.ComponentType<any>,
  options: ContainerTestOptions
) {
  // Set up container component test with mocked services
  // Provide utilities for testing service interactions
  // Return enhanced testing interface
}

export function testPresentationComponent(
  Component: React.ComponentType<any>,
  props: any
) {
  // Test presentation component in isolation
  // Focus on prop handling and rendering
  // No service dependencies
}

export function testHookWithServices(
  hook: () => any,
  mockServices: ServiceMocks
) {
  // Test custom hooks with mocked services
  // Provide service mock controls
  // Return hook result and test utilities
}
```

#### 5. Create Integration Test Setup
**File:** `src/test/integrationTestSetup.ts`
**Purpose:** Setup for integration tests that test multiple components together
**Context:** Enables testing of complete user workflows and component interactions

**Key Functionality:**
- Set up realistic application state for integration tests
- Provide utilities for testing complete user workflows
- Support for testing with real services (non-mocked)
- Database and storage setup for integration scenarios

```typescript
// src/test/integrationTestSetup.ts - Stub
export class IntegrationTestSetup {
  private testContainer: TestServiceContainer;
  private testStateManager: StateManager;
  
  async setupRealServices(): Promise<void> {
    // Set up services with real implementations
    // Use memory storage for tests
    // Initialize test data
  }
  
  async setupTestData(scenario: TestDataScenario): Promise<void> {
    // Load predefined test data scenarios
    // Set up state for specific test cases
  }
  
  async cleanup(): Promise<void> {
    // Clean up test data and services
    // Reset all state to initial conditions
  }
}
```

### Files to Create:
- `src/test/TestServiceContainer.ts`
- `src/test/testUtils.tsx`
- `src/test/mocks/serviceMocks.ts`
- `src/test/componentTestHelpers.ts`
- `src/test/integrationTestSetup.ts`
- `src/test/setupTests.ts` (Jest setup)

### Files to Modify:
- `jest.config.js` (update for new test structure)
- `package.json` (add testing scripts)

### Acceptance Criteria:
- [ ] All services can be easily mocked in tests
- [ ] Components testable with dependency injection
- [ ] Integration tests can test complete workflows
- [ ] Test utilities reduce boilerplate in test files
- [ ] Mock implementations provide realistic behavior
- [ ] Tests isolated and don't affect each other
