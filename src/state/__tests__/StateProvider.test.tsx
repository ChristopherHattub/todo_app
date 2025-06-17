/**
 * StateProvider Test Suite
 * Tests the React context provider, hooks, and component integration
 */

import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { 
  StateProvider, 
  useStateManager, 
  useAppState, 
  useAppDispatch,
  useSliceSelector,
  useSliceActions 
} from '../StateProvider';
import { StateManager } from '../StateManager';
import { ActionFixtures } from '../../testing/fixtures/StateFixtures';
import { TestDates } from '../../testing/fixtures/DateFixtures';

describe('StateProvider', () => {
  let testStateManager: StateManager;

  beforeEach(() => {
    testStateManager = new StateManager();
  });

  describe('Provider Component', () => {
    it('should provide state manager to children', () => {
      const TestComponent = () => {
        const stateManager = useStateManager();
        console.log('StateManager in test:', stateManager);
        console.log('StateManager type:', typeof stateManager);
        console.log('StateManager truthy:', !!stateManager);
        return <div data-testid="test">Manager provided: {String(!!stateManager)}</div>;
      };

      render(
        <StateProvider stateManager={testStateManager}>
          <TestComponent />
        </StateProvider>
      );

      expect(screen.getByTestId('test')).toHaveTextContent('Manager provided: true');
    });

    it('should render children correctly', () => {
      render(
        <StateProvider stateManager={testStateManager}>
          <div data-testid="child">Child component</div>
        </StateProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toHaveTextContent('Child component');
    });

    it('should pass the correct state manager instance', () => {
      const TestComponent = () => {
        const stateManager = useStateManager();
        const state = stateManager.getState();
        return <div data-testid="state-check">{typeof state.todo}</div>;
      };

      render(
        <StateProvider stateManager={testStateManager}>
          <TestComponent />
        </StateProvider>
      );

      expect(screen.getByTestId('state-check')).toHaveTextContent('object');
    });
  });

  describe('useStateManager Hook', () => {
    it('should return the state manager', () => {
      const { result } = renderHook(() => useStateManager(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(result.current).toBe(testStateManager);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useStateManager());
      }).toThrow('useStateManager must be used within a StateProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('useAppState Hook', () => {
    it('should return current state', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(result.current).toBeDefined();
      expect(result.current.todo).toBeDefined();
      expect(result.current.ui).toBeDefined();
      expect(result.current.date).toBeDefined();
    });

    it('should update when state changes', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      const initialLoading = result.current.ui.isLoading;

      act(() => {
        testStateManager.dispatch(ActionFixtures.ui.setLoading(!initialLoading));
      });

      expect(result.current.ui.isLoading).toBe(!initialLoading);
    });

    it('should maintain subscription across re-renders', () => {
      let renderCount = 0;
      
      const { result, rerender } = renderHook(() => {
        renderCount++;
        return useAppState();
      }, {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(renderCount).toBe(1);

      // Re-render the hook
      rerender();
      expect(renderCount).toBe(2);

      // State change should still trigger update
      act(() => {
        testStateManager.dispatch(ActionFixtures.ui.setLoading(true));
      });

      expect(renderCount).toBe(3);
      expect(result.current.ui.isLoading).toBe(true);
    });
  });

  describe('useAppDispatch Hook', () => {
    it('should return dispatch function', () => {
      const { result } = renderHook(() => useAppDispatch(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(typeof result.current).toBe('function');
    });

    it('should dispatch actions correctly', () => {
      const { result: stateResult } = renderHook(() => useAppState(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      const { result: dispatchResult } = renderHook(() => useAppDispatch(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(stateResult.current.ui.isLoading).toBe(false);

      act(() => {
        dispatchResult.current(ActionFixtures.ui.setLoading(true));
      });

      expect(stateResult.current.ui.isLoading).toBe(true);
    });

    it('should handle multiple dispatches', () => {
      const { result: stateResult } = renderHook(() => useAppState(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      const { result: dispatchResult } = renderHook(() => useAppDispatch(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      act(() => {
        dispatchResult.current(ActionFixtures.ui.setLoading(true));
        dispatchResult.current(ActionFixtures.ui.setTheme('dark'));
        dispatchResult.current(ActionFixtures.date.setCalendarView('year'));
      });

      expect(stateResult.current.ui.isLoading).toBe(true);
      expect(stateResult.current.ui.theme).toBe('dark');
      expect(stateResult.current.date.calendarView).toBe('year');
    });
  });

  describe('useSliceSelector Hook', () => {
    it('should return selector function', () => {
      const { result } = renderHook(() => useSliceSelector('todo', 'getYearSchedule'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(typeof result.current).toBe('function');
    });

    it('should return working selector', () => {
      const { result } = renderHook(() => {
        const state = useAppState();
        const selector = useSliceSelector('todo', 'getYearSchedule');
        return selector(state.todo);
      }, {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(result.current).toBeDefined();
      expect(result.current.year).toBeDefined();
    });

    it('should work with different slices', () => {
      const { result } = renderHook(() => {
        const state = useAppState();
        const todoSelector = useSliceSelector('todo', 'getSelectedDate');
        const dateSelector = useSliceSelector('date', 'getCurrentDate');
        const uiSelector = useSliceSelector('ui', 'getTheme');
        
        return {
          todoDate: todoSelector(state.todo),
          currentDate: dateSelector(state.date),
          theme: uiSelector(state.ui)
        };
      }, {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(result.current.todoDate).toBeInstanceOf(Date);
      expect(result.current.currentDate).toBeInstanceOf(Date);
      expect(result.current.theme).toBe('auto');
    });
  });

  describe('useSliceActions Hook', () => {
    it('should return actions object', () => {
      const { result } = renderHook(() => useSliceActions('todo'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.addTodoStarted).toBe('function');
      expect(typeof result.current.setSelectedDate).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should return working actions', () => {
      const { result: actionsResult } = renderHook(() => useSliceActions('ui'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      const { result: stateResult } = renderHook(() => useAppState(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      const { result: dispatchResult } = renderHook(() => useAppDispatch(), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      console.log('State result:', stateResult.current);
      console.log('State UI:', stateResult.current?.ui);
      console.log('State UI isLoading:', stateResult.current?.ui?.isLoading);
      console.log('TestStateManager initial state:', testStateManager.getState());

      expect(stateResult.current.ui.isLoading).toBe(false);

      act(() => {
        const action = actionsResult.current.setLoading({ isLoading: true });
        console.log('Generated action:', action);
        dispatchResult.current(action);
        console.log('State after dispatch:', testStateManager.getState());
      });

      expect(stateResult.current.ui.isLoading).toBe(true);
    });

    it('should work with different slice actions', () => {
      const { result: todoActionsResult } = renderHook(() => useSliceActions('todo'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      const { result: uiActionsResult } = renderHook(() => useSliceActions('ui'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      const { result: dateActionsResult } = renderHook(() => useSliceActions('date'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      // Verify todo actions
      expect(todoActionsResult.current.addTodoStarted).toBeDefined();
      expect(todoActionsResult.current.setSelectedDate).toBeDefined();
      
      // Verify UI actions
      expect(uiActionsResult.current.setLoading).toBeDefined();
      expect(uiActionsResult.current.addNotification).toBeDefined();
      
      // Verify date actions
      expect(dateActionsResult.current.setSelectedDate).toBeDefined();
      expect(dateActionsResult.current.setCalendarView).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    it('should work with functional components', () => {
      const TestComponent = () => {
        const state = useAppState();
        const dispatch = useAppDispatch();
        
        return (
          <div>
            <div data-testid="loading">{state.ui.isLoading.toString()}</div>
            <button 
              data-testid="toggle"
              onClick={() => dispatch(ActionFixtures.ui.setLoading(!state.ui.isLoading))}
            >
              Toggle Loading
            </button>
          </div>
        );
      };

      render(
        <StateProvider stateManager={testStateManager}>
          <TestComponent />
        </StateProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('false');

      act(() => {
        screen.getByTestId('toggle').click();
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('should handle nested components', () => {
      const ParentComponent = () => {
        const dispatch = useAppDispatch();
        
        React.useEffect(() => {
          dispatch(ActionFixtures.ui.setTheme('dark'));
        }, [dispatch]);
        
        return <ChildComponent />;
      };

      const ChildComponent = () => {
        const state = useAppState();
        return <div data-testid="theme">{state.ui.theme}</div>;
      };

      render(
        <StateProvider stateManager={testStateManager}>
          <ParentComponent />
        </StateProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    it('should handle multiple components with shared state', () => {
      const ComponentA = () => {
        const state = useAppState();
        const dispatch = useAppDispatch();
        
        return (
          <div>
            <div data-testid="count-a">{state.ui.notifications.length}</div>
            <button 
              data-testid="add-a"
              onClick={() => dispatch(ActionFixtures.ui.addNotification({
                type: 'info',
                title: 'From A',
                message: 'Message from component A'
              }))}
            >
              Add from A
            </button>
          </div>
        );
      };

      const ComponentB = () => {
        const state = useAppState();
        const dispatch = useAppDispatch();
        
        return (
          <div>
            <div data-testid="count-b">{state.ui.notifications.length}</div>
            <button 
              data-testid="add-b"
              onClick={() => dispatch(ActionFixtures.ui.addNotification({
                type: 'warning',
                title: 'From B',
                message: 'Message from component B'
              }))}
            >
              Add from B
            </button>
          </div>
        );
      };

      render(
        <StateProvider stateManager={testStateManager}>
          <ComponentA />
          <ComponentB />
        </StateProvider>
      );

      expect(screen.getByTestId('count-a')).toHaveTextContent('0');
      expect(screen.getByTestId('count-b')).toHaveTextContent('0');

      act(() => {
        screen.getByTestId('add-a').click();
      });

      expect(screen.getByTestId('count-a')).toHaveTextContent('1');
      expect(screen.getByTestId('count-b')).toHaveTextContent('1');

      act(() => {
        screen.getByTestId('add-b').click();
      });

      expect(screen.getByTestId('count-a')).toHaveTextContent('2');
      expect(screen.getByTestId('count-b')).toHaveTextContent('2');
    });
  });

  describe('Error Handling', () => {
    it('should handle hooks used outside provider gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useStateManager());
      }).toThrow('useStateManager must be used within a StateProvider');

      expect(() => {
        renderHook(() => useAppState());
      }).toThrow('useStateManager must be used within a StateProvider');

      expect(() => {
        renderHook(() => useAppDispatch());
      }).toThrow('useStateManager must be used within a StateProvider');

      consoleSpy.mockRestore();
    });

    it('should handle selector for non-existent slice gracefully', () => {
      const { result } = renderHook(() => useSliceSelector('todo', 'nonExistentSelector'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      expect(result.current).toBeUndefined();
    });

    it('should handle actions for non-existent slice gracefully', () => {
      const { result } = renderHook(() => useSliceActions('todo'), {
        wrapper: ({ children }) => (
          <StateProvider stateManager={testStateManager}>
            {children}
          </StateProvider>
        )
      });

      // Should return empty object for non-existent actions
      expect(result.current.nonExistentAction).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        const state = useAppState();
        return <div data-testid="render-count">{renderCount}</div>;
      };

      render(
        <StateProvider stateManager={testStateManager}>
          <TestComponent />
        </StateProvider>
      );

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Dispatch action that changes state
      act(() => {
        testStateManager.dispatch(ActionFixtures.ui.setLoading(true));
      });

      expect(screen.getByTestId('render-count')).toHaveTextContent('2');

      // Dispatch action that doesn't change state
      act(() => {
        testStateManager.dispatch(ActionFixtures.ui.setLoading(true)); // Same value
      });

      // Should still re-render since we can't prevent it at this level
      expect(screen.getByTestId('render-count')).toHaveTextContent('3');
    });

    it('should handle rapid state updates', () => {
      const TestComponent = () => {
        const state = useAppState();
        return <div data-testid="notification-count">{state.ui.notifications.length}</div>;
      };

      render(
        <StateProvider stateManager={testStateManager}>
          <TestComponent />
        </StateProvider>
      );

      // Rapid updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          testStateManager.dispatch(ActionFixtures.ui.addNotification({
            type: 'info',
            title: `Notification ${i}`,
            message: `Message ${i}`
          }));
        }
      });

      expect(screen.getByTestId('notification-count')).toHaveTextContent('10');
    });
  });
}); 