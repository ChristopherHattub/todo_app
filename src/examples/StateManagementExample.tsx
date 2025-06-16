import React, { useEffect } from 'react';
import {
  StateManager,
  StateProvider,
  useAppState,
  useAppDispatch,
  useSliceActions,
  useSliceSelector,
  RootState
} from '../state';
import { TodoItem } from '../types';

// Example: How to use the new state management system

/**
 * Component that demonstrates using the Todo slice
 */
const TodoExample: React.FC = () => {
  const dispatch = useAppDispatch();
  const state = useAppState();
  
  // Get todo actions from the slice
  const todoActions = useSliceActions('todo');
  
  // Use specific selectors
  const getIncompleteTasks = useSliceSelector('todo', 'getIncompleteTasks');
  const getCurrentDayStats = useSliceSelector('todo', 'getCurrentDayStats');
  
  const incompleteTasks = getIncompleteTasks(state.todo);
  const dayStats = getCurrentDayStats(state.todo);

  const handleAddTodo = async () => {
    // Start the add todo process
    dispatch(todoActions.addTodoStarted({
      todo: {
        title: 'Example Todo',
        description: 'This is an example todo item',
        pointValue: 10
      },
      targetDate: new Date()
    }));

    // Simulate async operation - normally this would be handled by middleware or thunks
    try {
      // Simulate creating a todo item
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: 'Example Todo',
        description: 'This is an example todo item',
        pointValue: 10,
        isCompleted: false,
        createdAt: new Date()
      };

      // Create updated day schedule
      const daySchedule = {
        date: new Date().toISOString().slice(0, 10),
        totalPointValue: 10,
        totalCompletedPointValue: 0,
        todoItems: [newTodo],
        completedTodoItems: [],
        incompleteTodoItems: [newTodo]
      };

      // Dispatch success action
      dispatch(todoActions.addTodoSuccess({
        todo: newTodo,
        daySchedule,
        targetDate: new Date()
      }));
    } catch (error) {
      dispatch(todoActions.addTodoFailure({
        error: error instanceof Error ? error.message : 'Failed to add todo'
      }));
    }
  };

  const handleCompleteTodo = (todoId: string) => {
    dispatch(todoActions.completeTodoStarted({ todoId }));
    // Similar async handling would go here...
  };

  return (
    <div>
      <h3>Todo Management Example</h3>
      <div>
        <p>Loading: {state.todo.isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {state.todo.error || 'None'}</p>
        <p>Selected Date: {state.todo.selectedDate.toDateString()}</p>
      </div>
      
      <div>
        <h4>Day Statistics</h4>
        <p>Total Tasks: {dayStats.totalTasks}</p>
        <p>Completed Tasks: {dayStats.completedTasks}</p>
        <p>Total Points: {dayStats.totalPoints}</p>
        <p>Completed Points: {dayStats.completedPoints}</p>
      </div>

      <div>
        <h4>Incomplete Tasks ({incompleteTasks.length})</h4>
        {incompleteTasks.map((task: TodoItem) => (
          <div key={task.id} style={{ border: '1px solid #ccc', padding: '8px', margin: '4px' }}>
            <h5>{task.title}</h5>
            <p>{task.description}</p>
            <p>Points: {task.pointValue}</p>
            <button onClick={() => handleCompleteTodo(task.id)}>
              Complete
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleAddTodo} disabled={state.todo.isLoading}>
        Add Example Todo
      </button>
    </div>
  );
};

/**
 * Component that demonstrates using the Date slice
 */
const DateExample: React.FC = () => {
  const dispatch = useAppDispatch();
  const state = useAppState();
  
  const dateActions = useSliceActions('date');
  const getIsToday = useSliceSelector('date', 'getIsToday');
  const getSelectedDateFormatted = useSliceSelector('date', 'getSelectedDateFormatted');
  
  const isToday = getIsToday(state.date);
  const formattedDate = getSelectedDateFormatted(state.date);

  const handleDateChange = (days: number) => {
    const newDate = new Date(state.date.selectedDate);
    newDate.setDate(newDate.getDate() + days);
    dispatch(dateActions.setSelectedDate({ date: newDate }));
  };

  const handleToggleSelector = () => {
    dispatch(dateActions.toggleSelector({}));
  };

  return (
    <div>
      <h3>Date Management Example</h3>
      <div>
        <p>Selected Date: {formattedDate}</p>
        <p>Is Today: {isToday ? 'Yes' : 'No'}</p>
        <p>Date Selector Open: {state.date.isDateSelectorOpen ? 'Yes' : 'No'}</p>
        <p>Calendar View: {state.date.calendarView}</p>
        <p>Timezone: {state.date.timezone}</p>
      </div>

      <div>
        <button onClick={() => handleDateChange(-1)}>Previous Day</button>
        <button onClick={() => handleDateChange(1)}>Next Day</button>
        <button onClick={handleToggleSelector}>Toggle Date Selector</button>
      </div>
    </div>
  );
};

/**
 * Component that demonstrates using the UI slice
 */
const UIExample: React.FC = () => {
  const dispatch = useAppDispatch();
  const state = useAppState();
  
  const uiActions = useSliceActions('ui');
  const getActiveNotifications = useSliceSelector('ui', 'getActiveNotifications');
  
  const activeNotifications = getActiveNotifications(state.ui);

  const handleAddNotification = () => {
    dispatch(uiActions.addNotification({
      notification: {
        type: 'info',
        title: 'Example Notification',
        message: 'This is an example notification message',
        autoHide: true,
        duration: 5000
      }
    }));
  };

  const handleToggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(state.ui.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    dispatch(uiActions.setTheme({ theme: nextTheme }));
  };

  const handleToggleSidebar = () => {
    dispatch(uiActions.toggleSidebar());
  };

  const handleSetModal = (modal: keyof RootState['ui']['modals'], isOpen: boolean) => {
    dispatch(uiActions.setModal({ modal, isOpen }));
  };

  return (
    <div>
      <h3>UI Management Example</h3>
      <div>
        <p>Loading: {state.ui.isLoading ? 'Yes' : 'No'}</p>
        <p>Global Error: {state.ui.globalError || 'None'}</p>
        <p>Theme: {state.ui.theme}</p>
        <p>Sidebar Collapsed: {state.ui.sidebarCollapsed ? 'Yes' : 'No'}</p>
        <p>Active Notifications: {activeNotifications.length}</p>
      </div>

      <div>
        <h4>Modal States</h4>
        <p>Date Selector: {state.ui.modals.isDateSelectorOpen ? 'Open' : 'Closed'}</p>
        <p>Settings: {state.ui.modals.isSettingsOpen ? 'Open' : 'Closed'}</p>
        <p>Confirm Delete: {state.ui.modals.isConfirmDeleteOpen ? 'Open' : 'Closed'}</p>
      </div>

      <div>
        <h4>Notifications</h4>
        {state.ui.notifications.map((notification) => (
          <div key={notification.id} style={{ 
            border: '1px solid #ccc', 
            padding: '8px', 
            margin: '4px',
            backgroundColor: notification.type === 'error' ? '#ffebee' : '#e8f5e8'
          }}>
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
            <small>{notification.timestamp.toLocaleTimeString()}</small>
            <button 
              onClick={() => dispatch(uiActions.removeNotification({ id: notification.id }))}
              style={{ marginLeft: '8px' }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div>
        <button onClick={handleAddNotification}>Add Notification</button>
        <button onClick={handleToggleTheme}>Toggle Theme</button>
        <button onClick={handleToggleSidebar}>Toggle Sidebar</button>
        <button onClick={() => handleSetModal('isSettingsOpen', !state.ui.modals.isSettingsOpen)}>
          Toggle Settings Modal
        </button>
      </div>
    </div>
  );
};

/**
 * Main example component that sets up the state management system
 */
const StateManagementExample: React.FC = () => {
  // Create the state manager instance
  const stateManager = new StateManager();

  return (
    <StateProvider stateManager={stateManager}>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Domain-Driven State Management Example</h1>
        <p>This example demonstrates the new slice-based state management system.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
            <TodoExample />
          </div>
          
          <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
            <DateExample />
          </div>
          
          <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
            <UIExample />
          </div>
        </div>
        
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Key Features Demonstrated:</h3>
          <ul>
            <li><strong>Domain Separation:</strong> Todo, Date, and UI concerns are isolated in separate slices</li>
            <li><strong>Type Safety:</strong> All actions and state are strongly typed</li>
            <li><strong>Immutable Updates:</strong> State changes are handled immutably in reducers</li>
            <li><strong>Computed Selectors:</strong> Derived state is calculated efficiently</li>
            <li><strong>React Integration:</strong> Custom hooks provide easy access to state and actions</li>
            <li><strong>Predictable Updates:</strong> All state changes go through the dispatch system</li>
          </ul>
        </div>
      </div>
    </StateProvider>
  );
};

export default StateManagementExample; 