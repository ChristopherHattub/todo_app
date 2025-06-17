import React from 'react';
import { ComponentType } from 'react';
import { render, RenderResult } from '@testing-library/react';
import { ServiceTestContainer } from './ServiceTestContainer';
import { ServiceProvider } from '../../core/di/react';
import { StateProvider, StateManager } from '../../state';

export interface ComponentTestOptions {
  withState?: boolean;
  withServices?: boolean;
  mockServices?: Record<string, any>;
  initialState?: any;
  props?: any;
}

export interface ComponentTestResult extends RenderResult {
  container: ComponentTestContainer;
  stateManager?: StateManager;
  mockService: <T>(tokenName: string, mockImplementation: T) => void;
  spyOnService: <T, K extends keyof T>(tokenName: string, methodName: K) => jest.SpyInstance;
  getService: <T>(tokenName: string) => T | null;
  updateProps: (newProps: any) => void;
}

export class ComponentTestContainer extends ServiceTestContainer {
  private stateManager?: StateManager;
  private renderResult?: RenderResult;
  private currentComponent?: React.ReactElement;

  constructor() {
    super();
  }

  /**
   * Render a component with all necessary providers
   */
  render<P = {}>(
    Component: ComponentType<P>,
    options: ComponentTestOptions = {}
  ): ComponentTestResult {
    const {
      withState = true,
      withServices = true,
      mockServices = {},
      initialState,
      props = {} as P
    } = options;

    // Apply mock services
    Object.entries(mockServices).forEach(([tokenName, mockImplementation]) => {
      this.mockService(tokenName, mockImplementation);
    });

    // Create state manager if needed
    if (withState) {
      this.stateManager = new StateManager();
      
      // Apply initial state if provided
      if (initialState) {
        this.applyInitialState(initialState);
      }
    }

    // Create the component element
    this.currentComponent = React.createElement(Component, props);

    // Wrap with providers
    let wrappedComponent = this.currentComponent;

    if (withState && this.stateManager) {
      wrappedComponent = React.createElement(
        StateProvider,
        { stateManager: this.stateManager },
        wrappedComponent
      );
    }

    if (withServices) {
      wrappedComponent = React.createElement(
        ServiceProvider,
        { container: this },
        wrappedComponent
      );
    }

    // Render the component
    this.renderResult = render(wrappedComponent);

    // Return enhanced result
    return {
      ...this.renderResult,
      container: this,
      stateManager: this.stateManager,
      mockService: <T>(tokenName: string, mockImplementation: T) => {
        this.mockService(tokenName, mockImplementation);
      },
      spyOnService: <T, K extends keyof T>(tokenName: string, methodName: K) => {
        return this.spyOnService<T, K>(tokenName, methodName);
      },
      getService: <T>(tokenName: string) => {
        return this.resolveByName<T>(tokenName);
      },
      updateProps: (newProps: any) => {
        if (this.currentComponent && this.renderResult) {
          const updatedComponent = React.cloneElement(this.currentComponent, newProps);
          this.currentComponent = updatedComponent;
          
          // Re-wrap with providers
          let wrappedComponent = updatedComponent;
          
          if (withState && this.stateManager) {
            wrappedComponent = React.createElement(
              StateProvider,
              { stateManager: this.stateManager },
              wrappedComponent
            );
          }

          if (withServices) {
            wrappedComponent = React.createElement(
              ServiceProvider,
              { container: this },
              wrappedComponent
            );
          }

          this.renderResult.rerender(wrappedComponent);
        }
      }
    };
  }

  /**
   * Test a component in isolation without any providers
   */
  renderIsolated<P = {}>(
    Component: ComponentType<P>,
    props: P = {} as P
  ): RenderResult {
    const component = React.createElement(Component, props);
    return render(component);
  }

  /**
   * Create a wrapper component for testing multiple renders
   */
  createWrapper(options: ComponentTestOptions = {}): React.FC<{ children: React.ReactNode }> {
    const {
      withState = true,
      withServices = true,
      mockServices = {},
      initialState
    } = options;

    // Apply mock services
    Object.entries(mockServices).forEach(([tokenName, mockImplementation]) => {
      this.mockService(tokenName, mockImplementation);
    });

    // Create state manager if needed
    if (withState && !this.stateManager) {
      this.stateManager = new StateManager();
      
      if (initialState) {
        this.applyInitialState(initialState);
      }
    }

    return ({ children }) => {
      let content = children;

      if (withState && this.stateManager) {
        content = React.createElement(
          StateProvider,
          { stateManager: this.stateManager },
          content
        );
      }

      if (withServices) {
        content = React.createElement(
          ServiceProvider,
          { container: this },
          content
        );
      }

      return content as React.ReactElement;
    };
  }

  /**
   * Get the current state from the state manager
   */
  getState(): any {
    return this.stateManager?.getState() || {};
  }

  /**
   * Dispatch an action to the state manager
   */
  dispatch(action: any): void {
    if (this.stateManager) {
      this.stateManager.dispatch(action);
    }
  }

  /**
   * Reset the container for the next test
   */
  override resetForTest(): void {
    super.resetForTest();
    this.stateManager = undefined;
    this.renderResult = undefined;
    this.currentComponent = undefined;
  }

  /**
   * Apply initial state to the state manager
   */
  private applyInitialState(initialState: any): void {
    if (!this.stateManager) return;

    Object.entries(initialState).forEach(([sliceName, sliceState]) => {
      if (this.stateManager?.hasSlice(sliceName)) {
        this.stateManager.dispatch({ 
          type: `${sliceName}/setState`, 
          payload: sliceState 
        });
      }
    });
  }

  /**
   * Resolve a service by its token name (private method made accessible for testing)
   */
  private resolveByName<T>(tokenName: string): T | null {
    // Implementation would be similar to ServiceTestContainer
    try {
      // This would use your actual token resolution logic
      return null; // Placeholder
    } catch {
      return null;
    }
  }

  /**
   * Dispose of the container and clean up
   */
  override async dispose(): Promise<void> {
    this.resetForTest();
    await super.dispose();
  }
} 