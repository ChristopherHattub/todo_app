import { TodoItem, YearSchedule } from '../../types';
import { AppConfig } from '../../types/config';
import { createTodoCollection, createCompletedTodos, createYearSchedule } from './TodoFixtures';
import { TestDates } from './DateFixtures';
import { createTestConfig, createProductionConfig } from './ConfigFixtures';

/**
 * Interface for test data scenarios
 */
export interface TestDataScenario {
  name: string;
  description: string;
  todos?: TodoItem[];
  selectedDate?: Date;
  yearSchedule?: YearSchedule;
  config?: AppConfig;
}

/**
 * Empty scenario - fresh start
 */
export const emptyScenario: TestDataScenario = {
  name: 'empty',
  description: 'Empty application state with no todos or data',
  todos: [],
  selectedDate: TestDates.JANUARY_1_2024,
  config: createTestConfig()
};

/**
 * Basic scenario - few todos for current day
 */
export const basicScenario: TestDataScenario = {
  name: 'basic',
  description: 'Basic scenario with a few todos for testing',
  todos: createTodoCollection(3),
  selectedDate: TestDates.JANUARY_1_2024,
  yearSchedule: createYearSchedule(),
  config: createTestConfig()
};

/**
 * Productive day scenario - many completed todos
 */
export const productiveDayScenario: TestDataScenario = {
  name: 'productive-day',
  description: 'A productive day with many completed todos',
  todos: [
    ...createCompletedTodos(),
    ...createTodoCollection(2)
  ],
  selectedDate: TestDates.JANUARY_1_2024,
  yearSchedule: createYearSchedule(),
  config: createTestConfig()
};

/**
 * Busy schedule scenario - many todos across multiple days
 */
export const busyScheduleScenario: TestDataScenario = {
  name: 'busy-schedule',
  description: 'Busy schedule with many todos across multiple days',
  todos: createTodoCollection(20),
  selectedDate: TestDates.JUNE_15_2024,
  yearSchedule: createYearSchedule(),
  config: createTestConfig()
};

/**
 * New user scenario - first time user experience
 */
export const newUserScenario: TestDataScenario = {
  name: 'new-user',
  description: 'New user with default settings and no todos',
  todos: [],
  selectedDate: new Date(), // Today
  config: createTestConfig({
    features: {
      enableAnimations: true,
      enableNotifications: true,
      enableOfflineMode: false,
      enableDataExport: false,
      enableAdvancedValidation: false
    }
  })
};

/**
 * Power user scenario - advanced features enabled
 */
export const powerUserScenario: TestDataScenario = {
  name: 'power-user',
  description: 'Power user with all features enabled and lots of data',
  todos: createTodoCollection(50),
  selectedDate: TestDates.JUNE_15_2024,
  yearSchedule: createYearSchedule(),
  config: createProductionConfig()
};

/**
 * Performance test scenario - large dataset
 */
export const performanceTestScenario: TestDataScenario = {
  name: 'performance-test',
  description: 'Large dataset for performance testing',
  todos: createTodoCollection(1000),
  selectedDate: TestDates.JANUARY_1_2024,
  yearSchedule: createYearSchedule(),
  config: createTestConfig({
    performance: {
      enableVirtualization: true,
      maxCacheSize: 2000,
      debounceDelay: 50,
      batchSize: 100
    }
  })
};

/**
 * Edge cases scenario - testing boundary conditions
 */
export const edgeCasesScenario: TestDataScenario = {
  name: 'edge-cases',
  description: 'Edge cases and boundary conditions for testing',
  todos: [
    {
      id: 'edge-1',
      title: '',
      description: '',
      pointValue: 0,
      isCompleted: false,
      createdAt: TestDates.JANUARY_1_2024
    },
    {
      id: 'edge-2',
      title: 'x'.repeat(1000),
      description: 'y'.repeat(5000),
      pointValue: 100,
      isCompleted: true,
      createdAt: TestDates.JANUARY_1_2024,
      completedAt: TestDates.JANUARY_1_2024
    }
  ],
  selectedDate: TestDates.LEAP_YEAR_FEB_29,
  config: createTestConfig()
};

/**
 * Offline scenario - testing offline capabilities
 */
export const offlineScenario: TestDataScenario = {
  name: 'offline',
  description: 'Testing offline functionality and data sync',
  todos: createTodoCollection(10),
  selectedDate: TestDates.JANUARY_1_2024,
  config: createTestConfig({
    features: {
      enableAnimations: false,
      enableNotifications: true,
      enableOfflineMode: true,
      enableDataExport: true,
      enableAdvancedValidation: false
    },
    storage: {
      provider: 'indexeddb',
      autoSave: true,
      compressionEnabled: true,
      encryptionEnabled: false
    }
  })
};

/**
 * Mobile scenario - mobile-optimized settings
 */
export const mobileScenario: TestDataScenario = {
  name: 'mobile',
  description: 'Mobile device optimizations and constraints',
  todos: createTodoCollection(5),
  selectedDate: TestDates.JANUARY_1_2024,
  config: createTestConfig({
    features: {
      enableAnimations: false, // Battery saving
      enableNotifications: true,
      enableOfflineMode: true,
      enableDataExport: false,
      enableAdvancedValidation: false
    },
    performance: {
      enableVirtualization: true,
      maxCacheSize: 100, // Lower memory usage
      debounceDelay: 500, // Less responsive but more efficient
      batchSize: 25
    },
    animations: {
      enableTaskCompletionAnimation: false,
      enableProgressAnimation: false,
      enablePageTransitions: false,
      animationDuration: 0,
      easingFunction: 'linear'
    }
  })
};

/**
 * All test scenarios mapped by name
 */
export const testScenarios: Record<string, TestDataScenario> = {
  empty: emptyScenario,
  basic: basicScenario,
  'productive-day': productiveDayScenario,
  'busy-schedule': busyScheduleScenario,
  'new-user': newUserScenario,
  'power-user': powerUserScenario,
  'performance-test': performanceTestScenario,
  'edge-cases': edgeCasesScenario,
  offline: offlineScenario,
  mobile: mobileScenario
};

/**
 * Get a test scenario by name
 */
export const getTestScenario = (name: string): TestDataScenario => {
  const scenario = testScenarios[name];
  if (!scenario) {
    throw new Error(`Unknown test scenario: ${name}`);
  }
  return scenario;
};

/**
 * Get all available scenario names
 */
export const getAvailableScenarios = (): string[] => {
  return Object.keys(testScenarios);
};

/**
 * Create a custom scenario by merging multiple scenarios
 */
export const createCustomScenario = (
  name: string,
  baseScenario: TestDataScenario,
  overrides: Partial<TestDataScenario>
): TestDataScenario => {
  return {
    ...baseScenario,
    ...overrides,
    name,
    description: overrides.description || `Custom scenario based on ${baseScenario.name}`
  };
}; 