import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { StateManager, StateProvider, RootState, RootActions } from '../../state';
import { ServiceProvider } from '../../core/di/react';
import { ComponentTestContainer } from '../containers/ComponentTestContainer';
import { ServiceTestContainer } from '../containers/ServiceTestContainer';
import { IntegrationTestContainer } from '../containers/IntegrationTestContainer';

/**
 * Test-specific StateManager that allows direct state manipulation
 */
export class TestStateManager extends StateManager {
  /**
   * Set state directly for testing purposes
   */
  setState(state: Partial<RootState>): void {
    const currentState = this.getState();
    const newState = { ...currentState, ...state };
    
    // Use private property access to set state directly
    (this as any).currentState = newState;
    
    // Notify listeners
    (this as any).notifyListeners();
  }

  /**
   * Reset to initial state
   */
  resetState(): void {
    (this as any).currentState = (this as any).createInitialState();
    (this as any).notifyListeners();
  }
}

export interface TestWrapperOptions {
  withState?: boolean;
  withServices?: boolean;
  mockServices?: Record<string, any>;
  initialState?: Partial<RootState>;
  container?: ComponentTestContainer | ServiceTestContainer | IntegrationTestContainer;
}

export interface EnhancedRenderResult extends Omit<RenderResult, 'container'> {
  testContainer: ComponentTestContainer | ServiceTestContainer | IntegrationTestContainer;
  stateManager?: TestStateManager;
  rerender: (ui: React.ReactNode) => void;
}

/**
 * Creates a test wrapper component with service container and state provider
 */
export function createTestWrapper(options: TestWrapperOptions = {}): React.FC<{ children: React.ReactNode }> {
  const {
    withState = true,
    withServices = true,
    mockServices = {},
    initialState,
    container: customContainer
  } = options;

  return ({ children }) => {
    // Create or use provided container
    const testContainer = customContainer || new ComponentTestContainer();
    
    // Apply mock services
    Object.entries(mockServices).forEach(([tokenName, mockImplementation]) => {
      testContainer.mockService(tokenName, mockImplementation);
    });

    // Create state manager if needed
    const testStateManager = withState ? new TestStateManager() : undefined;
    
    // Apply initial state if provided
    if (testStateManager && initialState) {
      testStateManager.setState(initialState);
    }

    let content = children;

    // Wrap with state provider if needed
    if (withState && testStateManager) {
      content = (
        <StateProvider stateManager={testStateManager}>
          {content}
        </StateProvider>
      );
    }

    // Wrap with service provider if needed
    if (withServices) {
      content = (
        <ServiceProvider container={testContainer}>
          {content}
        </ServiceProvider>
      );
    }

    return content as React.ReactElement;
  };
}

/**
 * Enhanced render function with providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: TestWrapperOptions & RenderOptions = {}
): EnhancedRenderResult {
  const { 
    withState = true,
    withServices = true,
    mockServices = {},
    initialState,
    container: customContainer,
    ...renderOptions 
  } = options;

  const testContainer = customContainer || new ComponentTestContainer();
  const testStateManager = withState ? new TestStateManager() : undefined;

  // Apply mock services
  Object.entries(mockServices).forEach(([tokenName, mockImplementation]) => {
    testContainer.mockService(tokenName, mockImplementation);
  });

  // Apply initial state
  if (testStateManager && initialState) {
    testStateManager.setState(initialState);
  }

  const Wrapper = createTestWrapper({
    withState,
    withServices,
    mockServices,
    initialState,
    container: testContainer
  });

  const renderResult = render(ui, {
    wrapper: Wrapper,
    ...renderOptions
  });

  return {
    ...renderResult,
    testContainer,
    stateManager: testStateManager,
    rerender: (newUi: React.ReactNode) => {
      renderResult.rerender(newUi);
    }
  };
}

/**
 * Waits for async operations to complete
 */
export async function waitForAsyncOperations(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Creates a mock event object for testing
 */
export function createMockEvent<T extends Event = Event>(
  type: string,
  eventInit: Partial<T> = {}
): T {
  const event = new Event(type, { bubbles: true, cancelable: true });
  return Object.assign(event, eventInit) as T;
}

/**
 * Creates a mock React change event
 */
export function createMockChangeEvent(value: string): React.ChangeEvent<HTMLInputElement> {
  const target = { value } as HTMLInputElement;
  const event = createMockEvent('change') as any;
  event.target = target;
  event.currentTarget = target;
  return event;
}

/**
 * Utility to simulate user input
 */
export function simulateUserInput(element: HTMLElement, value: string): void {
  const inputElement = element as HTMLInputElement;
  inputElement.focus();
  inputElement.value = value;
  
  // Create and dispatch the change event
  const changeEvent = new Event('change', { bubbles: true });
  Object.defineProperty(changeEvent, 'target', {
    writable: false,
    value: inputElement
  });
  Object.defineProperty(changeEvent, 'currentTarget', {
    writable: false,
    value: inputElement
  });
  
  inputElement.dispatchEvent(changeEvent);
  inputElement.blur();
}

/**
 * Waits for a condition to be true with timeout
 */
export function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkCondition = () => {
      if (condition()) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
        return;
      }
      
      setTimeout(checkCondition, interval);
    };
    
    checkCondition();
  });
}

/**
 * Assertion helpers for testing
 */
export const TestAssertions = {
  /**
   * Assert that an element is visible
   */
  toBeVisible: (element: HTMLElement | null): void => {
    if (!element) {
      throw new Error('Element is null or undefined');
    }
    if (element.style.display === 'none' || element.hidden) {
      throw new Error('Element is not visible');
    }
  },

  /**
   * Assert that an element has text content
   */
  toHaveTextContent: (element: HTMLElement | null, expectedText: string): void => {
    if (!element) {
      throw new Error('Element is null or undefined');
    }
    if (!element.textContent?.includes(expectedText)) {
      throw new Error(`Expected element to contain text "${expectedText}", but got "${element.textContent}"`);
    }
  },

  /**
   * Assert that an element has a specific class
   */
  toHaveClass: (element: HTMLElement | null, className: string): void => {
    if (!element) {
      throw new Error('Element is null or undefined');
    }
    if (!element.classList.contains(className)) {
      throw new Error(`Expected element to have class "${className}"`);
    }
  }
};

/**
 * Test cleanup utilities
 */
export function cleanupTests(): void {
  // Clear any timers
  jest.clearAllTimers();
  
  // Clear local storage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
  
  // Reset any global state if needed
  // This can be extended based on application needs
}

/**
 * Mock implementations for common services
 */
export const MockServices = {
  /**
   * Mock storage service
   */
  createMockStorageService: () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    keys: jest.fn().mockResolvedValue([])
  }),

  /**
   * Mock validation service
   */
  createMockValidationService: () => ({
    validateTodo: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    validateRequired: jest.fn().mockReturnValue(true),
    validateLength: jest.fn().mockReturnValue(true)
  }),

  /**
   * Mock date service
   */
  createMockDateService: () => ({
    now: jest.fn().mockReturnValue(new Date()),
    format: jest.fn().mockReturnValue('2024-01-01'),
    parse: jest.fn().mockReturnValue(new Date()),
    addDays: jest.fn().mockReturnValue(new Date()),
    isSameDay: jest.fn().mockReturnValue(true)
  })
}; 