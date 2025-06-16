import { ServiceModule } from '../../core/services/ServiceModule';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';
import type { ITodoService, IStorageService, IValidationService } from '../interfaces';
import type { TodoItem } from '../../types';

describe('Service Integration Tests', () => {
  let serviceModule: ServiceModule;
  let todoService: ITodoService;
  let storageService: IStorageService;
  let validationService: IValidationService;

  beforeEach(() => {
    serviceModule = new ServiceModule();
    const container = serviceModule.getContainer();
    
    todoService = container.resolve<ITodoService>(SERVICE_TOKENS.TODO_SERVICE);
    storageService = container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
    validationService = container.resolve<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE);

    // Mock localStorage for tests
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  afterEach(async () => {
    await serviceModule.dispose();
    jest.clearAllMocks();
  });

  describe('Todo CRUD Operations with DI', () => {
    it('should create a todo using injected services', async () => {
      const todoData = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 15,
        isCompleted: false
      };

      const result = await todoService.createTodo(todoData);

      expect(result).toBeDefined();
      expect(result.todo).toMatchObject({
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 15,
        isCompleted: false
      });
      expect(result.todo.id).toBeDefined();
      expect(result.todo.createdAt).toBeInstanceOf(Date);
      expect(result.daySchedule).toBeDefined();
      expect(result.monthSchedule).toBeDefined();
      expect(result.yearSchedule).toBeDefined();
    });

    it('should validate todo input through injected validation service', async () => {
      const invalidTodoData = {
        title: '',
        description: 'Test Description',
        pointValue: 150, // Invalid: too high
        isCompleted: false
      };

      await expect(todoService.createTodo(invalidTodoData))
        .rejects
        .toThrow('Validation failed');
    });

    it('should update todo using injected services', async () => {
      // First create a todo
      const todoData = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 15,
        isCompleted: false
      };

      const createResult = await todoService.createTodo(todoData);
      const todoId = createResult.todo.id;

      // Then update it
      const updateResult = await todoService.updateTodo(todoId, {
        title: 'Updated Todo',
        pointValue: 25
      });

      expect(updateResult.todo.title).toBe('Updated Todo');
      expect(updateResult.todo.pointValue).toBe(25);
      expect(updateResult.todo.id).toBe(todoId);
    });

    it('should complete todo using injected services', async () => {
      const todoData = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 15,
        isCompleted: false
      };

      const createResult = await todoService.createTodo(todoData);
      const todoId = createResult.todo.id;

      const completeResult = await todoService.completeTodo(todoId);

      expect(completeResult.todo.isCompleted).toBe(true);
      expect(completeResult.todo.completedAt).toBeInstanceOf(Date);
      expect(completeResult.daySchedule.totalCompletedPointValue).toBe(15);
    });

    it('should delete todo using injected services', async () => {
      const todoData = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 15,
        isCompleted: false
      };

      const createResult = await todoService.createTodo(todoData);
      const todoId = createResult.todo.id;

      const deleteResult = await todoService.deleteTodo(todoId);

      expect(deleteResult.todo.id).toBe(todoId);
      expect(deleteResult.daySchedule.todoItems).toHaveLength(0);
      expect(deleteResult.daySchedule.totalPointValue).toBe(0);
    });
  });

  describe('Service Dependencies', () => {
    it('should use validation service for input validation', () => {
      const validInput = {
        title: 'Valid Todo',
        description: 'Valid Description',
        pointValue: '25'
      };

      const result = validationService.validateTodoInput(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should use storage service for persistence', async () => {
      const testSchedule = {
        date: '2024-03-14',
        totalPointValue: 25,
        totalCompletedPointValue: 15,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const result = await storageService.saveDaySchedule(testSchedule);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testSchedule);
    });

    it('should integrate validation and storage in todo operations', async () => {
      const todoData = {
        title: 'Integration Test Todo',
        description: 'Testing service integration',
        pointValue: 30,
        isCompleted: false
      };

      // This should use validation service to validate input
      // and storage service to persist the data
      const result = await todoService.createTodo(todoData);

      expect(result.todo).toMatchObject(todoData);
      expect(result.daySchedule.todoItems).toHaveLength(1);
      expect(result.daySchedule.totalPointValue).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors properly', async () => {
      const invalidTodoData = {
        title: 'x'.repeat(101), // Too long
        description: 'Test Description',
        pointValue: 15,
        isCompleted: false
      };

      await expect(todoService.createTodo(invalidTodoData))
        .rejects
        .toThrow('Title must be 100 characters or less');
    });

    it('should handle missing todo errors', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(todoService.updateTodo(nonExistentId, { title: 'Updated' }))
        .rejects
        .toThrow('Todo with id non-existent-id not found');
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw an error
      const originalSetItem = localStorage.setItem;
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const todoData = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: 15,
        isCompleted: false
      };

      await expect(todoService.createTodo(todoData))
        .rejects
        .toThrow('Storage error');

      // Restore original implementation
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const todoData1 = {
        title: 'Todo 1',
        description: 'First todo',
        pointValue: 10,
        isCompleted: false
      };

      const todoData2 = {
        title: 'Todo 2',
        description: 'Second todo',
        pointValue: 20,
        isCompleted: false
      };

      // Create two todos
      const result1 = await todoService.createTodo(todoData1);
      const result2 = await todoService.createTodo(todoData2);

      expect(result2.daySchedule.todoItems).toHaveLength(2);
      expect(result2.daySchedule.totalPointValue).toBe(30);

      // Complete one todo
      const completeResult = await todoService.completeTodo(result1.todo.id);

      expect(completeResult.daySchedule.totalCompletedPointValue).toBe(10);
      expect(completeResult.daySchedule.totalPointValue).toBe(30);
      expect(completeResult.daySchedule.completedTodoItems).toHaveLength(1);
      expect(completeResult.daySchedule.incompleteTodoItems).toHaveLength(1);
    });

    it('should calculate totals correctly', () => {
      const todos: TodoItem[] = [
        {
          id: '1',
          title: 'Todo 1',
          description: '',
          pointValue: 15,
          isCompleted: true,
          createdAt: new Date(),
          completedAt: new Date()
        },
        {
          id: '2',
          title: 'Todo 2',
          description: '',
          pointValue: 25,
          isCompleted: false,
          createdAt: new Date()
        }
      ];

      const totals = todoService.calculateDayTotals(todos);

      expect(totals.total).toBe(40);
      expect(totals.completed).toBe(15);
    });
  });
}); 