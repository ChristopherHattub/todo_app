import { 
  ITodoService, 
  TodoServiceResponse,
  IStorageService,
  IValidationService,
  IDateService,
  IAnimationService,
  IConfigService,
  AppConfig
} from '../../services/interfaces';
import { TodoItem, DaySchedule, MonthSchedule, YearSchedule, StorageResponse } from '../../types';

/**
 * Mock TodoService implementation
 */
export const createMockTodoService = (): jest.Mocked<ITodoService> => ({
  createTodo: jest.fn().mockResolvedValue({
    todo: {
      id: 'mock-todo-1',
      title: 'Mock Todo',
      description: 'Mock description',
      pointValue: 10,
      isCompleted: false,
      createdAt: new Date()
    },
    daySchedule: {} as DaySchedule,
    monthSchedule: {} as MonthSchedule,
    yearSchedule: {} as YearSchedule
  } as TodoServiceResponse),

  updateTodo: jest.fn().mockResolvedValue({
    todo: {
      id: 'mock-todo-1',
      title: 'Updated Mock Todo',
      description: 'Updated description',
      pointValue: 15,
      isCompleted: false,
      createdAt: new Date()
    },
    daySchedule: {} as DaySchedule,
    monthSchedule: {} as MonthSchedule,
    yearSchedule: {} as YearSchedule
  } as TodoServiceResponse),

  deleteTodo: jest.fn().mockResolvedValue({
    todo: {
      id: 'mock-todo-1',
      title: 'Deleted Todo',
      description: '',
      pointValue: 0,
      isCompleted: false,
      createdAt: new Date()
    },
    daySchedule: {} as DaySchedule,
    monthSchedule: {} as MonthSchedule,
    yearSchedule: {} as YearSchedule
  } as TodoServiceResponse),

  completeTodo: jest.fn().mockResolvedValue({
    todo: {
      id: 'mock-todo-1',
      title: 'Mock Todo',
      description: 'Mock description',
      pointValue: 10,
      isCompleted: true,
      createdAt: new Date(),
      completedAt: new Date()
    },
    daySchedule: {} as DaySchedule,
    monthSchedule: {} as MonthSchedule,
    yearSchedule: {} as YearSchedule
  } as TodoServiceResponse),

  getTodosForDate: jest.fn().mockResolvedValue([
    {
      id: 'mock-todo-1',
      title: 'Mock Todo',
      description: 'Mock description',
      pointValue: 10,
      isCompleted: false,
      createdAt: new Date()
    }
  ] as TodoItem[]),

  getDaySchedule: jest.fn().mockResolvedValue({
    date: '2024-01-01',
    totalPointValue: 100,
    totalCompletedPointValue: 50,
    todoItems: [],
    completedTodoItems: [],
    incompleteTodoItems: []
  } as DaySchedule),

  getMonthSchedule: jest.fn().mockResolvedValue({
    date: '2024-01',
    daySchedules: new Map(),
    totalMonthPoints: 1000,
    totalCompletedMonthPoints: 500
  } as MonthSchedule),

  getYearSchedule: jest.fn().mockResolvedValue({
    year: 2024,
    monthSchedules: new Map(),
    totalYearPoints: 12000,
    totalCompletedYearPoints: 6000
  } as YearSchedule),

  calculateDayTotals: jest.fn().mockReturnValue({
    total: 100,
    completed: 50
  }),

  calculateMonthTotals: jest.fn().mockReturnValue({
    total: 1000,
    completed: 500
  }),

  dispose: jest.fn().mockResolvedValue(undefined)
});

/**
 * Mock StorageService implementation
 */
export const createMockStorageService = (): jest.Mocked<IStorageService> => ({
  saveYearSchedule: jest.fn().mockResolvedValue({
    success: true,
    data: {} as YearSchedule,
    timestamp: new Date()
  } as StorageResponse<YearSchedule>),

  loadYearSchedule: jest.fn().mockResolvedValue({
    success: true,
    data: {
      year: 2024,
      monthSchedules: new Map(),
      totalYearPoints: 0,
      totalCompletedYearPoints: 0
    },
    timestamp: new Date()
  } as StorageResponse<YearSchedule>),

  saveDaySchedule: jest.fn().mockResolvedValue({
    success: true,
    data: {} as DaySchedule,
    timestamp: new Date()
  } as StorageResponse<DaySchedule>),

  loadDaySchedule: jest.fn().mockResolvedValue({
    success: true,
    data: null,
    timestamp: new Date()
  } as StorageResponse<DaySchedule | null>),

  exportData: jest.fn().mockResolvedValue({
    success: true,
    data: '{"mock": "export"}',
    timestamp: new Date()
  } as StorageResponse<string>),

  importData: jest.fn().mockResolvedValue({
    success: true,
    data: undefined,
    timestamp: new Date()
  } as StorageResponse<void>),

  clearAllData: jest.fn().mockResolvedValue({
    success: true,
    data: undefined,
    timestamp: new Date()
  } as StorageResponse<void>),

  isStorageAvailable: jest.fn().mockReturnValue(true),

  getStorageInfo: jest.fn().mockReturnValue({
    used: 1024,
    available: 999999,
    type: 'memory'
  }),

  dispose: jest.fn().mockResolvedValue(undefined)
});

/**
 * Mock ValidationService implementation
 */
export const createMockValidationService = (): jest.Mocked<IValidationService> => ({
  validateTodoTitle: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),

  validateTodoDescription: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),

  validatePointValue: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),

  validateTodoItem: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),

  validateDate: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),

  validateFormData: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),

  dispose: jest.fn().mockResolvedValue(undefined)
});

/**
 * Mock DateService implementation
 */
export const createMockDateService = (): jest.Mocked<IDateService> => ({
  formatDate: jest.fn().mockReturnValue('2024-01-01'),
  
  formatDateLong: jest.fn().mockReturnValue('January 1, 2024'),
  
  parseDate: jest.fn().mockReturnValue(new Date('2024-01-01')),
  
  isToday: jest.fn().mockReturnValue(true),
  
  isSameDay: jest.fn().mockReturnValue(true),
  
  addDays: jest.fn().mockImplementation((date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }),
  
  getStartOfWeek: jest.fn().mockImplementation((date: Date) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - newDate.getDay());
    return newDate;
  }),
  
  getStartOfMonth: jest.fn().mockImplementation((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }),
  
  getEndOfMonth: jest.fn().mockImplementation((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }),
  
  getDaysInMonth: jest.fn().mockReturnValue(31),
  
  getWeekNumber: jest.fn().mockReturnValue(1),
  
  dispose: jest.fn().mockResolvedValue(undefined)
});

/**
 * Mock AnimationService implementation
 */
export const createMockAnimationService = (): jest.Mocked<IAnimationService> => ({
  animateTaskCompletion: jest.fn().mockResolvedValue(undefined),
  
  animateTaskAddition: jest.fn().mockResolvedValue(undefined),
  
  animateTaskDeletion: jest.fn().mockResolvedValue(undefined),
  
  animateProgressUpdate: jest.fn().mockResolvedValue(undefined),
  
  animatePageTransition: jest.fn().mockResolvedValue(undefined),
  
  dispose: jest.fn().mockResolvedValue(undefined)
});

/**
 * Mock ConfigService implementation
 */
export const createMockConfigService = (): jest.Mocked<IConfigService> => ({
  getConfig: jest.fn().mockReturnValue({
    environment: 'test' as const,
    features: {
      enableAnimations: true,
      enableNotifications: true,
      enableOfflineMode: false,
      enableDataExport: true,
      enableAdvancedValidation: false
    },
    ui: {
      theme: 'light' as const,
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h' as const
    },
    storage: {
      provider: 'memory' as const,
      autoSave: true,
      compressionEnabled: false,
      encryptionEnabled: false
    },
    performance: {
      enableVirtualization: false,
      maxCacheSize: 100,
      debounceDelay: 300,
      batchSize: 50
    },
    animations: {
      enableTaskCompletionAnimation: true,
      enableProgressAnimation: true,
      enablePageTransitions: true,
      animationDuration: 300,
      easingFunction: 'ease-in-out'
    },
    physics: {
      gravity: 9.81,
      friction: 0.8,
      restitution: 0.6,
      airDensity: 1.2
    }
  } as AppConfig),

  updateConfig: jest.fn().mockResolvedValue(undefined),
  
  resetConfig: jest.fn().mockResolvedValue(undefined),
  
  validateConfig: jest.fn().mockReturnValue({
    isValid: true,
    errors: []
  }),
  
  getEnvironmentConfig: jest.fn().mockReturnValue({
    apiUrl: 'http://localhost:3000',
    enableLogging: true,
    logLevel: 'info' as const,
    enableDebugMode: true
  }),
  
  onConfigChange: jest.fn().mockImplementation(() => {
    return () => {}; // Return unsubscribe function
  }),
  
  dispose: jest.fn().mockResolvedValue(undefined)
});

/**
 * Factory function to create all mock services
 */
export const createMockServiceFactories = (): Record<string, () => any> => ({
  'ITodoService': createMockTodoService,
  'IStorageService': createMockStorageService,
  'IValidationService': createMockValidationService,
  'IDateService': createMockDateService,
  'IAnimationService': createMockAnimationService,
  'IConfigService': createMockConfigService
});

/**
 * Create a complete set of mock services
 */
export const createAllMockServices = (): Record<string, any> => {
  const factories = createMockServiceFactories();
  const mocks: Record<string, any> = {};
  
  Object.entries(factories).forEach(([serviceName, factory]) => {
    mocks[serviceName] = factory();
  });
  
  return mocks;
};

/**
 * Reset all mocks to their default state
 */
export const resetAllMocks = (): void => {
  jest.clearAllMocks();
};

/**
 * Create a mock with specific behavior for a service method
 */
export const createMockWithBehavior = <T>(
  serviceName: string,
  methodName: keyof T,
  behavior: 'success' | 'failure' | 'loading',
  customValue?: any
): jest.Mock => {
  const mock = jest.fn();
  
  switch (behavior) {
    case 'success':
      mock.mockResolvedValue(customValue || { success: true });
      break;
    case 'failure':
      mock.mockRejectedValue(customValue || new Error(`Mock ${serviceName}.${String(methodName)} failure`));
      break;
    case 'loading':
      mock.mockImplementation(() => new Promise(() => {})); // Never resolves
      break;
  }
  
  return mock;
}; 