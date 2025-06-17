import { ComponentTestContainer } from './ComponentTestContainer';
import { StateManager } from '../../state';
import { TestDataScenario } from '../fixtures/TestData';

export interface IntegrationTestOptions {
  useRealServices?: string[];
  mockServices?: Record<string, any>;
  testDataScenario?: TestDataScenario;
  enablePersistence?: boolean;
  enableEventBus?: boolean;
}

export interface IntegrationTestEnvironment {
  container: IntegrationTestContainer;
  stateManager: StateManager;
  cleanup: () => Promise<void>;
  scenario: TestDataScenario | null;
}

export class IntegrationTestContainer extends ComponentTestContainer {
  private realServices = new Set<string>();
  private testDataScenario: TestDataScenario | null = null;
  private persistenceEnabled = false;
  private eventBusEnabled = false;

  constructor() {
    super();
  }

  /**
   * Setup integration test environment
   */
  async setupIntegrationTest(options: IntegrationTestOptions = {}): Promise<IntegrationTestEnvironment> {
    const {
      useRealServices = [],
      mockServices = {},
      testDataScenario,
      enablePersistence = false,
      enableEventBus = true
    } = options;

    // Configure which services to use real implementations for
    this.realServices = new Set(useRealServices);
    this.persistenceEnabled = enablePersistence;
    this.eventBusEnabled = enableEventBus;

    // Setup real services
    await this.setupRealServices();

    // Apply mock services (only for services not in real services list)
    Object.entries(mockServices).forEach(([tokenName, mockImplementation]) => {
      if (!this.realServices.has(tokenName)) {
        this.mockService(tokenName, mockImplementation);
      }
    });

    // Setup test data scenario
    if (testDataScenario) {
      this.testDataScenario = testDataScenario;
      await this.loadTestDataScenario(testDataScenario);
    }

    // Setup event bus if enabled
    if (this.eventBusEnabled) {
      await this.setupEventBus();
    }

    return {
      container: this,
      stateManager: this.stateManager!,
      cleanup: () => this.cleanup(),
      scenario: this.testDataScenario
    };
  }

  /**
   * Setup real service implementations
   */
  private async setupRealServices(): Promise<void> {
    for (const serviceName of this.realServices) {
      try {
        await this.configureRealService(serviceName);
      } catch (error) {
        console.warn(`Failed to setup real service ${serviceName}:`, error);
        // Fall back to mock if real service setup fails
        this.realServices.delete(serviceName);
      }
    }
  }

  /**
   * Configure a specific real service
   */
  private async configureRealService(serviceName: string): Promise<void> {
    switch (serviceName) {
      case 'IStorageService':
        await this.setupRealStorageService();
        break;
      case 'ITodoService':
        await this.setupRealTodoService();
        break;
      case 'IValidationService':
        await this.setupRealValidationService();
        break;
      case 'IDateService':
        await this.setupRealDateService();
        break;
      case 'IConfigService':
        await this.setupRealConfigService();
        break;
      case 'IAnimationService':
        await this.setupRealAnimationService();
        break;
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  /**
   * Setup real storage service (using memory storage for tests)
   */
  private async setupRealStorageService(): Promise<void> {
    const { MemoryStorageService } = await import('../../services/MemoryStorageService');
    const storageService = new MemoryStorageService();
    
    // Register the real service
    // Note: You'll need to import and use the actual service token
    // this.registerInstance(storageServiceToken, storageService);
  }

  /**
   * Setup real todo service
   */
  private async setupRealTodoService(): Promise<void> {
    const { TodoService } = await import('../../services/TodoService');
    
    // Get dependencies
    const storageService = this.realServices.has('IStorageService') 
      ? this.resolveByName('IStorageService')
      : this.createMockStorageService();
    
    const validationService = this.realServices.has('IValidationService')
      ? this.resolveByName('IValidationService')
      : this.createMockValidationService();

    const todoService = new TodoService(storageService, validationService);
    
    // Register the real service
    // this.registerInstance(todoServiceToken, todoService);
  }

  /**
   * Setup real validation service
   */
  private async setupRealValidationService(): Promise<void> {
    const { ValidationService } = await import('../../services/ValidationService');
    const validationService = new ValidationService();
    
    // Register the real service
    // this.registerInstance(validationServiceToken, validationService);
  }

  /**
   * Setup real date service
   */
  private async setupRealDateService(): Promise<void> {
    const { DateService } = await import('../../services/DateService');
    const dateService = new DateService();
    
    // Register the real service
    // this.registerInstance(dateServiceToken, dateService);
  }

  /**
   * Setup real config service
   */
  private async setupRealConfigService(): Promise<void> {
    const { ConfigService } = await import('../../services/ConfigService');
    const configService = new ConfigService();
    
    // Register the real service
    // this.registerInstance(configServiceToken, configService);
  }

  /**
   * Setup real animation service
   */
  private async setupRealAnimationService(): Promise<void> {
    const { AnimationHandler } = await import('../../services/AnimationHandler');
    const animationService = new AnimationHandler();
    
    // Register the real service
    // this.registerInstance(animationServiceToken, animationService);
  }

  /**
   * Setup event bus for integration testing
   */
  private async setupEventBus(): Promise<void> {
    // Setup event bus if your application uses one
    // This would integrate with your actual event bus implementation
  }

  /**
   * Load test data scenario
   */
  private async loadTestDataScenario(scenario: TestDataScenario): Promise<void> {
    if (!this.stateManager) {
      this.stateManager = new StateManager();
    }

    // Apply scenario data to state
    if (scenario.todos) {
      this.stateManager.dispatch({
        type: 'todo/setTodos',
        payload: scenario.todos
      });
    }

    if (scenario.selectedDate) {
      this.stateManager.dispatch({
        type: 'date/setSelectedDate',
        payload: { date: scenario.selectedDate }
      });
    }

    if (scenario.config) {
      this.stateManager.dispatch({
        type: 'ui/setConfig',
        payload: scenario.config
      });
    }

    // Load data into storage services if they're real services
    if (this.realServices.has('IStorageService') && scenario.yearSchedule) {
      const storageService = this.resolveByName('IStorageService');
      if (storageService) {
        await storageService.saveYearSchedule(scenario.yearSchedule);
      }
    }
  }

  /**
   * Execute a complete user workflow
   */
  async executeWorkflow(workflowName: string, ...args: any[]): Promise<any> {
    switch (workflowName) {
      case 'createTodo':
        return this.executeCreateTodoWorkflow(args[0]);
      case 'completeTodo':
        return this.executeCompleteTodoWorkflow(args[0]);
      case 'deleteTodo':
        return this.executeDeleteTodoWorkflow(args[0]);
      case 'navigateDate':
        return this.executeNavigateDateWorkflow(args[0]);
      default:
        throw new Error(`Unknown workflow: ${workflowName}`);
    }
  }

  /**
   * Execute create todo workflow
   */
  private async executeCreateTodoWorkflow(todoData: any): Promise<any> {
    const todoService = this.resolveByName('ITodoService');
    if (!todoService) {
      throw new Error('TodoService not available');
    }

    // Execute the complete workflow
    const result = await todoService.createTodo(todoData);
    
    // Update state if state manager is available
    if (this.stateManager) {
      this.stateManager.dispatch({
        type: 'todo/addTodoSuccess',
        payload: result
      });
    }

    return result;
  }

  /**
   * Execute complete todo workflow
   */
  private async executeCompleteTodoWorkflow(todoId: string): Promise<any> {
    const todoService = this.resolveByName('ITodoService');
    if (!todoService) {
      throw new Error('TodoService not available');
    }

    const result = await todoService.completeTodo(todoId);
    
    if (this.stateManager) {
      this.stateManager.dispatch({
        type: 'todo/completeTodoSuccess',
        payload: result
      });
    }

    return result;
  }

  /**
   * Execute delete todo workflow
   */
  private async executeDeleteTodoWorkflow(todoId: string): Promise<any> {
    const todoService = this.resolveByName('ITodoService');
    if (!todoService) {
      throw new Error('TodoService not available');
    }

    const result = await todoService.deleteTodo(todoId);
    
    if (this.stateManager) {
      this.stateManager.dispatch({
        type: 'todo/deleteTodoSuccess',
        payload: result
      });
    }

    return result;
  }

  /**
   * Execute navigate date workflow
   */
  private async executeNavigateDateWorkflow(date: Date): Promise<any> {
    if (this.stateManager) {
      this.stateManager.dispatch({
        type: 'date/setSelectedDate',
        payload: { date }
      });
    }

    // Load todos for the new date if todo service is available
    const todoService = this.resolveByName('ITodoService');
    if (todoService) {
      const todos = await todoService.getTodosForDate(date);
      
      if (this.stateManager) {
        this.stateManager.dispatch({
          type: 'todo/setTodosForDate',
          payload: { date, todos }
        });
      }

      return todos;
    }

    return [];
  }

  /**
   * Get integration test metrics and state
   */
  getTestMetrics(): any {
    return {
      realServices: Array.from(this.realServices),
      mockedServices: this.getMockedServices(),
      currentScenario: this.testDataScenario?.name || null,
      persistenceEnabled: this.persistenceEnabled,
      eventBusEnabled: this.eventBusEnabled,
      state: this.getState()
    };
  }

  /**
   * Cleanup integration test environment
   */
  async cleanup(): Promise<void> {
    // Clean up real services
    for (const serviceName of this.realServices) {
      try {
        const service = this.resolveByName(serviceName);
        if (service && typeof service.dispose === 'function') {
          await service.dispose();
        }
      } catch (error) {
        console.warn(`Failed to dispose service ${serviceName}:`, error);
      }
    }

    // Reset container
    this.resetForTest();
    
    // Clear test data
    this.testDataScenario = null;
    this.realServices.clear();
    this.persistenceEnabled = false;
    this.eventBusEnabled = false;
  }

  /**
   * Helper methods for creating mock services when real services are not available
   */
  private createMockStorageService(): any {
    const { createMockStorageService } = require('../mocks/ServiceMocks');
    return createMockStorageService();
  }

  private createMockValidationService(): any {
    const { createMockValidationService } = require('../mocks/ServiceMocks');
    return createMockValidationService();
  }

  /**
   * Resolve service by name helper
   */
  private resolveByName(serviceName: string): any {
    try {
      // This would use your actual token resolution logic
      return null; // Placeholder
    } catch {
      return null;
    }
  }

  /**
   * Dispose of the container
   */
  override async dispose(): Promise<void> {
    await this.cleanup();
    await super.dispose();
  }
} 