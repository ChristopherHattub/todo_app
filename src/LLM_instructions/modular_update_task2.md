
Overview
This document provides detailed implementation steps for Phase 1 of the modular architecture transformation. Phase 1 focuses on three foundational patterns that will enable all subsequent modular improvements:

Service Layer Dependency Injection - Replace singleton services with a DI container
State Management Slices - Break monolithic TodoContext into domain slices
Component Architecture - Separate presentation components from business logic

These changes will create the foundation for a scalable, testable, and maintainable architecture while preserving all existing functionality.

## TASK-002: Create Service Interfaces for Existing Services
**Priority:** P0  
**Category:** REFACTORING  
**Estimated Time:** 3 hours

**Description:** Extract interfaces from existing services and create abstractions that will enable dependency injection and testing.

### Implementation Steps:

#### 1. Create Service Interfaces
```typescript
// src/services/interfaces/ITodoService.ts
import { TodoItem, DaySchedule, MonthSchedule, YearSchedule } from '../../types';

export interface TodoServiceResponse {
  todo: TodoItem;
  daySchedule: DaySchedule;
  monthSchedule: MonthSchedule;
  yearSchedule: YearSchedule;
}

export interface ITodoService {
  // CRUD Operations
  createTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>, forDate?: Date): Promise<TodoServiceResponse>;
  updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<TodoServiceResponse>;
  deleteTodo(todoId: string): Promise<TodoServiceResponse>;
  completeTodo(todoId: string): Promise<TodoServiceResponse>;

  // Query Operations
  getTodosForDate(date: Date): Promise<TodoItem[]>;
  getDaySchedule(date: Date): Promise<DaySchedule>;
  getMonthSchedule(year: number, month: number): Promise<MonthSchedule>;
  getYearSchedule(year: number): Promise<YearSchedule>;

  // Calculation Operations
  calculateDayTotals(todos: TodoItem[]): { total: number; completed: number };
  calculateMonthTotals(monthSchedule: MonthSchedule): { total: number; completed: number };

  // Lifecycle
  dispose?(): Promise<void>;
}

// src/services/interfaces/IStorageService.ts
import { YearSchedule, DaySchedule, StorageResponse } from '../../types';

export interface IStorageService {
  // Year Operations
  saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>>;
  loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>>;

  // Day Operations
  saveDaySchedule(daySchedule: DaySchedule): Promise<StorageResponse<DaySchedule>>;
  loadDaySchedule(date: Date): Promise<StorageResponse<DaySchedule | null>>;

  // Bulk Operations
  exportData(): Promise<StorageResponse<string>>;
  importData(data: string): Promise<StorageResponse<void>>;
  clearAllData(): Promise<StorageResponse<void>>;

  // Utility
  isStorageAvailable(): boolean;
  getStorageInfo(): { used: number; available: number; type: string };

  // Lifecycle
  dispose?(): Promise<void>;
}

// src/services/interfaces/IDateService.ts
export interface IDateService {
  // Formatting
  formatDisplayDate(date: Date): string;
  formatISODate(date: Date): string;
  formatISOMonth(date: Date): string;

  // Navigation
  getMonthStart(date: Date): Date;
  getMonthEnd(date: Date): Date;
  addMonths(date: Date, months: number): Date;

  // Comparison
  isToday(date: Date): boolean;
  isSameDay(date1: Date, date2: Date): boolean;

  // Calendar
  generateCalendarDays(year: number, month: number): Date[];
  getWeekdays(): string[];
  getDaysInMonth(year: number, month: number): number;

  // Timezone
  getTimezoneOffset(): number;
  toUTC(date: Date): Date;
  fromUTC(date: Date): Date;
}

// src/services/interfaces/IValidationService.ts
import { ValidationResult, TodoItem, EntryFormData, DaySchedule, YearSchedule } from '../../types';

export interface IValidationService {
  // Input Validation
  validateTodoInput(input: EntryFormData): ValidationResult;
  validateTodoItem(todo: TodoItem): ValidationResult;
  sanitizeTodoInput(input: EntryFormData): EntryFormData;

  // Data Structure Validation
  validateDaySchedule(schedule: DaySchedule): ValidationResult;
  validateYearSchedule(schedule: YearSchedule): ValidationResult;

  // Utility
  isValidDate(date: string): boolean;
  isValidMonth(month: string): boolean;
  containsXSS(input: string): boolean;
  sanitizeString(input: string): string;
}

// src/services/interfaces/IAnimationService.ts
import { AnimationParams } from '../../types/ui';

export interface IAnimationService {
  // Animation Management
  queueAnimation(points: number, onComplete?: () => void): void;
  queueAnimationWithTaskMovement(points: number, todoId: string, onComplete?: () => void): void;
  clearQueue(): void;

  // Animation State
  isPlaying(): boolean;
  getQueueLength(): number;

  // Configuration
  setAnimationParams(params: Partial<AnimationParams>): void;
  getAnimationParams(points: number): AnimationParams;

  // Lifecycle
  dispose?(): void;
}

// src/services/interfaces/IConfigService.ts
export interface AppConfig {
  animation: {
    enabled: boolean;
    duration: number;
    ballColors: string[];
    physics: {
      gravity: number;
      bounce: number;
      damping: number;
    };
  };
  storage: {
    provider: 'localStorage' | 'indexedDB' | 'memory';
    maxBackups: number;
    compressionEnabled: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    pointColorRanges: Array<{
      min: number;
      max: number;
      color: string;
    }>;
    dateFormat: string;
  };
  features: {
    enableAnimations: boolean;
    enableBackups: boolean;
    enableAnalytics: boolean;
  };
}

export interface IConfigService {
  // Configuration Access
  getConfig(): AppConfig;
  getConfigValue<T>(path: string): T;
  setConfigValue<T>(path: string, value: T): void;

  // Environment
  getEnvironment(): 'development' | 'production' | 'test';
  isFeatureEnabled(feature: string): boolean;

  // Persistence
  saveConfig(): Promise<void>;
  resetToDefaults(): Promise<void>;

  // Events
  onConfigChange(callback: (path: string, newValue: any, oldValue: any) => void): () => void;
}
```

#### 2. Create Service Factory Implementations
```typescript
// src/services/factories/TodoServiceFactory.ts
import { IServiceContainer, ServiceFactory } from '../../core/di';
import { ITodoService } from '../interfaces/ITodoService';
import { TodoService } from '../TodoService';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';

export class TodoServiceFactory implements ServiceFactory<ITodoService> {
  dependencies = [SERVICE_TOKENS.STORAGE_SERVICE, SERVICE_TOKENS.VALIDATION_SERVICE];

  create(container: IServiceContainer): ITodoService {
    const storageService = container.resolve(SERVICE_TOKENS.STORAGE_SERVICE);
    const validationService = container.resolve(SERVICE_TOKENS.VALIDATION_SERVICE);
    
    return new TodoService(storageService, validationService);
  }

  dispose(instance: ITodoService): void {
    if (instance.dispose) {
      instance.dispose();
    }
  }
}

// src/services/factories/StorageServiceFactory.ts
export class StorageServiceFactory implements ServiceFactory<IStorageService> {
  dependencies = [SERVICE_TOKENS.CONFIG_SERVICE];

  create(container: IServiceContainer): IStorageService {
    const configService = container.resolve(SERVICE_TOKENS.CONFIG_SERVICE);
    const config = configService.getConfig();
    
    switch (config.storage.provider) {
      case 'localStorage':
        return new LocalStorageService();
      case 'indexedDB':
        return new IndexedDBStorageService();
      case 'memory':
        return new MemoryStorageService();
      default:
        throw new Error(`Unknown storage provider: ${config.storage.provider}`);
    }
  }
}

// src/services/factories/ConfigServiceFactory.ts
export class ConfigServiceFactory implements ServiceFactory<IConfigService> {
  create(container: IServiceContainer): IConfigService {
    const environment = process.env.NODE_ENV || 'development';
    return new ConfigService(environment);
  }
}

// Continue for other services...
```

#### 3. Update Existing Services to Implement Interfaces
```typescript
// src/services/TodoService.ts - Updated
import { ITodoService, TodoServiceResponse } from './interfaces/ITodoService';
import { IStorageService } from './interfaces/IStorageService';
import { IValidationService } from './interfaces/IValidationService';

export class TodoService implements ITodoService {
  constructor(
    private storageService: IStorageService,
    private validationService: IValidationService
  ) {}

  async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>, forDate?: Date): Promise<TodoServiceResponse> {
    // Validate input
    const validation = this.validationService.validateTodoInput({
      title: todo.title,
      description: todo.description,
      pointValue: todo.pointValue.toString()
    });

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Rest of existing implementation...
    // But now using injected services instead of static calls
  }

  // Implement all other interface methods...
  // Update to use injected services instead of imports

  dispose(): void {
    // Cleanup if needed
  }
}
```

#### 4. Create Service Registration Configuration
```typescript
// src/core/services/ServiceRegistration.ts
import { IServiceContainer, ServiceLifetime } from '../di';
import { SERVICE_TOKENS } from '../di/ServiceToken';
import {
  TodoServiceFactory,
  StorageServiceFactory,
  DateServiceFactory,
  ValidationServiceFactory,
  AnimationServiceFactory,
  ConfigServiceFactory
} from '../../services/factories';

export function registerServices(container: IServiceContainer): void {
  // Configuration Service (needed first)
  container.register(
    SERVICE_TOKENS.CONFIG_SERVICE,
    new ConfigServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Storage Service
  container.register(
    SERVICE_TOKENS.STORAGE_SERVICE,
    new StorageServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Validation Service
  container.register(
    SERVICE_TOKENS.VALIDATION_SERVICE,
    new ValidationServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Date Service
  container.register(
    SERVICE_TOKENS.DATE_SERVICE,
    new DateServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Animation Service
  container.register(
    SERVICE_TOKENS.ANIMATION_SERVICE,
    new AnimationServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Todo Service (depends on others)
  container.register(
    SERVICE_TOKENS.TODO_SERVICE,
    new TodoServiceFactory(),
    ServiceLifetime.SINGLETON
  );
}

// src/core/services/ServiceModule.ts
export class ServiceModule {
  private container: IServiceContainer;

  constructor() {
    this.container = new ServiceContainer();
    this.initialize();
  }

  private initialize(): void {
    registerServices(this.container);
  }

  getContainer(): IServiceContainer {
    return this.container;
  }

  async dispose(): Promise<void> {
    await this.container.dispose();
  }
}
```

### Files to Create:
- `src/services/interfaces/ITodoService.ts`
- `src/services/interfaces/IStorageService.ts`
- `src/services/interfaces/IDateService.ts`
- `src/services/interfaces/IValidationService.ts`
- `src/services/interfaces/IAnimationService.ts`
- `src/services/interfaces/IConfigService.ts`
- `src/services/factories/TodoServiceFactory.ts`
- `src/services/factories/StorageServiceFactory.ts`
- `src/services/factories/DateServiceFactory.ts`
- `src/services/factories/ValidationServiceFactory.ts`
- `src/services/factories/AnimationServiceFactory.ts`
- `src/services/factories/ConfigServiceFactory.ts`
- `src/core/services/ServiceRegistration.ts`
- `src/core/services/ServiceModule.ts`

### Files to Modify:
- `src/services/TodoService.ts`
- `src/services/LocalStorageService.ts`
- `src/services/DateService.ts`
- `src/services/ValidationService.ts`
- `src/services/AnimationHandler.ts`

### Acceptance Criteria:
- [ ] All existing services implement their corresponding interfaces
- [ ] Service factories create services with proper dependencies
- [ ] Services can be registered and resolved through DI container
- [ ] Existing functionality preserved during refactoring
- [ ] Constructor injection works for all services
- [ ] Service disposal implemented where needed

---
