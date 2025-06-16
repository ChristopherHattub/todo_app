

## TASK-005: Integration and Migration
**Priority:** P0  
**Category:** INTEGRATION  
**Estimated Time:** 3 hours

**Description:** Integrate all the modular components and migrate the existing application to use the new architecture while preserving functionality.

### Implementation Steps:

#### 1. Create Application Bootstrap
```typescript
// src/core/ApplicationBootstrap.ts
import { ServiceContainer } from './di/ServiceContainer';
import { ServiceModule } from './services/ServiceModule';
import { StateManager } from '../state/StateManager';
import { IConfigService } from '../services/interfaces/IConfigService';
import { SERVICE_TOKENS } from './di/ServiceToken';

export class ApplicationBootstrap {
  private serviceModule: ServiceModule;
  private stateManager: StateManager;
  private isInitialized = false;

  constructor() {
    this.serviceModule = new ServiceModule();
    this.stateManager = new StateManager();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing application...');

      // Initialize configuration
      const configService = this.serviceModule.getContainer().resolve<IConfigService>(
        SERVICE_TOKENS.CONFIG_SERVICE
      );
      await this.loadConfiguration(configService);

      // Initialize services
      await this.initializeServices();

      // Initialize state
      await this.initializeState();

      this.isInitialized = true;
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  getServiceContainer(): ServiceContainer {
    return this.serviceModule.getContainer() as ServiceContainer;
  }

  getStateManager(): StateManager {
    return this.stateManager;
  }

  async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.serviceModule.dispose();
      this.isInitialized = false;
      console.log('Application disposed');
    } catch (error) {
      console.error('Error during application disposal:', error);
    }
  }

  private async loadConfiguration(configService: IConfigService): Promise<void> {
    // Load configuration based on environment
    const environment = configService.getEnvironment();
    console.log(`Loading configuration for environment: ${environment}`);
    
    // Configuration is already loaded by the service
    const config = configService.getConfig();
    console.log('Configuration loaded:', {
      animationEnabled: config.animation.enabled,
      storageProvider: config.storage.provider,
      theme: config.ui.theme
    });
  }

  private async initializeServices(): Promise<void> {
    const container = this.serviceModule.getContainer();
    
    // Verify all required services are registered
    const requiredServices = [
      SERVICE_TOKENS.CONFIG_SERVICE,
      SERVICE_TOKENS.STORAGE_SERVICE,
      SERVICE_TOKENS.TODO_SERVICE,
      SERVICE_TOKENS.DATE_SERVICE,
      SERVICE_TOKENS.VALIDATION_SERVICE,
      SERVICE_TOKENS.ANIMATION_SERVICE
    ];

    for (const token of requiredServices) {
      if (!container.isRegistered(token)) {
        throw new Error(`Required service not registered: ${token.name}`);
      }
    }

    console.log('All required services are registered');
  }

  private async initializeState(): Promise<void> {
    // State manager is already initialized with slices
    const initialState = this.stateManager.getState();
    console.log('Initial state created:', {
      todoYear: initialState.todo.currentYear,
      selectedDate: initialState.todo.selectedDate.toISOString().split('T')[0],
      uiTheme: initialState.ui.theme
    });
  }
}

// src/core/AppContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppContextValue {
  bootstrap: ApplicationBootstrap;
  isInitialized: boolean;
  initializationError: Error | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [bootstrap] = useState(() => new ApplicationBootstrap());
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await bootstrap.initialize();
        setIsInitialized(true);
      } catch (error) {
        setInitializationError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    initializeApp();

    return () => {
      bootstrap.dispose();
    };
  }, [bootstrap]);

  const contextValue: AppContextValue = {
    bootstrap,
    isInitialized,
    initializationError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;




```typescript
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
```

#### 2. Create Updated Main App Component
```typescript
// src/App.tsx - Updated
import React from 'react';
import { AppProvider, useAppContext } from './core/AppContext';
import { ServiceProvider } from './core/di/react';
import { StateProvider } from './state/StateProvider';
import { withErrorBoundary } from './components/hoc/withErrorBoundary';
import { LoadingSpinner } from './components/presentation/LoadingSpinner';
import { MainApplication } from './components/MainApplication';

const AppContent: React.FC = () => {
  const { bootstrap, isInitialized, initializationError } = useAppContext();

  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Application Failed to Start
          </h1>
          <p className="text-red-700 mb-4">
            {initializationError.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner
          size="large"
          message="Initializing application..."
        />
      </div>
    );
  }

  return (
    <ServiceProvider container={bootstrap.getServiceContainer()}>
      <StateProvider stateManager={bootstrap.getStateManager()}>
        <MainApplication />
      </StateProvider>
    </ServiceProvider>
  );
};

const App: React.FC = withErrorBoundary()(({ children }) => (
  <AppProvider>
    <AppContent />
  </AppProvider>
));

export default App;

// src/components/MainApplication.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TodoApp } from './TodoApp';
import { GlobalErrorHandler } from './GlobalErrorHandler';
import { NotificationContainer } from './containers/NotificationContainer';

export const MainApplication: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <GlobalErrorHandler />
        <NotificationContainer />
        
        <Routes>
          <Route path="/" element={<TodoApp />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </div>
    </Router>
  );
};
```

#### 3. Migrate Existing TodoApp Component
```typescript
// src/components/TodoApp.tsx - Migrated
import React from 'react';
import { TaskListContainer } from './containers/TaskListContainer';
import { TaskFormContainer } from './containers/TaskFormContainer';
import { DateNavigationContainer } from './containers/DateNavigationContainer';
import { StatsContainer } from './containers/StatsContainer';
import { AnimationContainer } from './containers/AnimationContainer';

export const TodoApp: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Daily Task Manager
        </h1>
        <DateNavigationContainer />
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Task Management */}
        <div className="lg:col-span-2 space-y-6">
          <TaskFormContainer />
          <TaskListContainer />
        </div>

        {/* Right Column - Stats and Animation */}
        <div className="space-y-6">
          <StatsContainer />
          <AnimationContainer />
        </div>
      </div>
    </div>
  );
};
```

#### 4. Create Migration Helper Components
```typescript
// src/components/containers/TaskFormContainer.tsx
import React, { useState } from 'react';
import { useTodoOperations } from '../../hooks/useTodoOperations';
import { TaskForm } from '../presentation/TaskForm';
import { withErrorBoundary } from '../hoc/withErrorBoundary';

export const TaskFormContainer: React.FC = withErrorBoundary()(() => {
  const { addTodo, isLoading } = useTodoOperations();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    pointValue: number;
  }) => {
    try {
      await addTodo(formData);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  return (
    <div>
      {!isFormOpen ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + Add New Task
        </button>
      ) : (
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
});

// src/components/containers/DateNavigationContainer.tsx
import React from 'react';
import { useDateNavigation } from '../../hooks/useDateNavigation';
import { DateNavigation } from '../presentation/DateNavigation';

export const DateNavigationContainer: React.FC = () => {
  const {
    selectedDate,
    isDateSelectorOpen,
    formattedSelectedDate,
    isToday,
    setSelectedDate,
    openDateSelector,
    closeDateSelector
  } = useDateNavigation();

  return (
    <DateNavigation
      selectedDate={selectedDate}
      formattedDate={formattedSelectedDate}
      isToday={isToday}
      isDateSelectorOpen={isDateSelectorOpen}
      onDateSelect={setSelectedDate}
      onOpenSelector={openDateSelector}
      onCloseSelector={closeDateSelector}
    />
  );
};

// src/components/containers/StatsContainer.tsx
import React from 'react';
import { useTodoOperations } from '../../hooks/useTodoOperations';
import { StatsDisplay } from '../presentation/StatsDisplay';

export const StatsContainer: React.FC = () => {
  const { dayStats, isLoading } = useTodoOperations();

  return (
    <StatsDisplay
      stats={dayStats}
      isLoading={isLoading}
    />
  );
};
```

#### 5. Create Presentation Components for Migration
```typescript
// src/components/presentation/TaskForm.tsx
import React, { useState } from 'react';
import { PresentationComponentProps } from '../core/ComponentTypes';

export interface TaskFormProps extends PresentationComponentProps {
  onSubmit: (formData: { title: string; description: string; pointValue: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  'data-testid': testId,
  ...props
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointValue: 10
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white p-6 rounded-lg border shadow-sm ${className || ''}`}
      data-testid={testId}
      {...props}
    >
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Task</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter task title..."
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional description..."
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="pointValue" className="block text-sm font-medium text-gray-700 mb-1">
            Point Value
          </label>
          <select
            id="pointValue"
            value={formData.pointValue}
            onChange={(e) => setFormData(prev => ({ ...prev, pointValue: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value={5}>5 Points - Quick Task</option>
            <option value={10}>10 Points - Standard Task</option>
            <option value={15}>15 Points - Medium Task</option>
            <option value={20}>20 Points - Large Task</option>
            <option value={30}>30 Points - Major Task</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !formData.title.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add Task'}
        </button>
      </div>
    </form>
  );
};

// src/components/presentation/DateNavigation.tsx
import React from 'react';
import { PresentationComponentProps } from '../core/ComponentTypes';

export interface DateNavigationProps extends PresentationComponentProps {
  selectedDate: Date;
  formattedDate: string;
  isToday: boolean;
  isDateSelectorOpen: boolean;
  onDateSelect: (date: Date) => void;
  onOpenSelector: () => void;
  onCloseSelector: () => void;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  formattedDate,
  isToday,
  isDateSelectorOpen,
  onDateSelect,
  onOpenSelector,
  onCloseSelector,
  className,
  'data-testid': testId,
  ...props
}) => {
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    onDateSelect(newDate);
  };

  return (
    <div
      className={`flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm ${className || ''}`}
      data-testid={testId}
      {...props}
    >
      <button
        onClick={() => navigateDate('prev')}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      <button
        onClick={onOpenSelector}
        className="flex items-center space-x-2 px-4 py-2 text-lg font-medium text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <span>{formattedDate}</span>
        {isToday && (
          <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
            Today
          </span>
        )}
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <button
        onClick={() => navigateDate('next')}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Next day"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Date Selector Modal - Placeholder for future implementation */}
      {isDateSelectorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Date selector coming soon...</p>
            <button
              onClick={onCloseSelector}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// src/components/presentation/StatsDisplay.tsx
import React from 'react';
import { PresentationComponentProps } from '../core/ComponentTypes';

export interface StatsDisplayProps extends PresentationComponentProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
    completedPoints: number;
  };
  isLoading?: boolean;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  isLoading = false,
  className,
  'data-testid': testId,
  ...props
}) => {
  const completionPercentage = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const pointsPercentage = stats.totalPoints > 0
    ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className={`bg-white p-6 rounded-lg border shadow-sm ${className || ''}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-6 rounded-lg border shadow-sm ${className || ''}`}
      data-testid={testId}
      {...props}
    >
      <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Progress</h3>
      
      <div className="space-y-4">
        {/* Task Completion */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Tasks Completed</span>
            <span>{stats.completedTasks} / {stats.totalTasks}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {completionPercentage}%
          </div>
        </div>

        {/* Points Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Points Earned</span>
            <span>{stats.completedPoints} / {stats.totalPoints}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pointsPercentage}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {pointsPercentage}%
          </div>
        </div>

        {/* Summary */}
        {stats.completedTasks === stats.totalTasks && stats.totalTasks > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium">
              🎉 All tasks completed! Great job!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Files to Create:
- `src/core/ApplicationBootstrap.ts`
- `src/core/AppContext.tsx`
- `src/App.tsx` (updated)
- `src/components/MainApplication.tsx`
- `src/components/TodoApp.tsx` (migrated)
- `src/components/containers/TaskFormContainer.tsx`
- `src/components/containers/DateNavigationContainer.tsx`
- `src/components/containers/StatsContainer.tsx`
- `src/components/containers/AnimationContainer.tsx`
- `src/components/presentation/TaskForm.tsx`
- `src/components/presentation/DateNavigation.tsx`
- `src/components/presentation/StatsDisplay.tsx`

### Files to Modify:
- `src/main.tsx` (update to use new App component)
- Remove old context files once migration is complete

### Acceptance Criteria:
- [ ] Application bootstraps correctly with new architecture
- [ ] All existing functionality works with new components
- [ ] Service injection working throughout application
- [ ] State management uses new slice architecture
- [ ] Error boundaries handle initialization failures
- [ ] Loading states displayed during bootstrap
- [ ] Existing data preserved during migration

---
