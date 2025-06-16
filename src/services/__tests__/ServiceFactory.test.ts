import { ServiceContainer } from '../../core/di/ServiceContainer';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';
import {
  TodoServiceFactory,
  StorageServiceFactory,
  DateServiceFactory,
  ValidationServiceFactory,
  AnimationServiceFactory,
  ConfigServiceFactory
} from '../factories';

describe('Service Factories', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(async () => {
    await container.dispose();
  });

  describe('ConfigServiceFactory', () => {
    it('should create a config service instance', () => {
      const factory = new ConfigServiceFactory();
      const service = factory.create(container);

      expect(service).toBeDefined();
      expect(service.getConfig).toBeDefined();
      expect(service.getEnvironment).toBeDefined();
      expect(service.isFeatureEnabled).toBeDefined();
    });

    it('should return valid config data', () => {
      const factory = new ConfigServiceFactory();
      const service = factory.create(container);
      const config = service.getConfig();

      expect(config).toHaveProperty('animation');
      expect(config).toHaveProperty('storage');
      expect(config).toHaveProperty('ui');
      expect(config).toHaveProperty('features');
      expect(config.storage.provider).toBe('localStorage');
    });
  });

  describe('StorageServiceFactory', () => {
    it('should create a storage service instance', () => {
      const factory = new StorageServiceFactory();
      const service = factory.create(container);

      expect(service).toBeDefined();
      expect(service.saveYearSchedule).toBeDefined();
      expect(service.loadYearSchedule).toBeDefined();
      expect(service.saveDaySchedule).toBeDefined();
      expect(service.loadDaySchedule).toBeDefined();
    });

    it('should provide storage info', () => {
      const factory = new StorageServiceFactory();
      const service = factory.create(container);
      const info = service.getStorageInfo();

      expect(info).toHaveProperty('used');
      expect(info).toHaveProperty('available');
      expect(info).toHaveProperty('type');
      expect(info.type).toBe('localStorage');
    });
  });

  describe('ValidationServiceFactory', () => {
    it('should create a validation service instance', () => {
      const factory = new ValidationServiceFactory();
      const service = factory.create(container);

      expect(service).toBeDefined();
      expect(service.validateTodoInput).toBeDefined();
      expect(service.validateTodoItem).toBeDefined();
      expect(service.sanitizeTodoInput).toBeDefined();
    });

    it('should validate todo input correctly', () => {
      const factory = new ValidationServiceFactory();
      const service = factory.create(container);

      const validInput = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: '10'
      };

      const result = service.validateTodoInput(validInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('DateServiceFactory', () => {
    it('should create a date service instance', () => {
      const factory = new DateServiceFactory();
      const service = factory.create(container);

      expect(service).toBeDefined();
      expect(service.formatDisplayDate).toBeDefined();
      expect(service.formatISODate).toBeDefined();
      expect(service.isToday).toBeDefined();
    });

    it('should format dates correctly', () => {
      const factory = new DateServiceFactory();
      const service = factory.create(container);
      const testDate = new Date('2024-03-14');

      const displayDate = service.formatDisplayDate(testDate);
      const isoDate = service.formatISODate(testDate);

      expect(displayDate).toBe('03/14/24');
      expect(isoDate).toBe('2024-03-14');
    });
  });

  describe('AnimationServiceFactory', () => {
    it('should create an animation service instance', () => {
      const factory = new AnimationServiceFactory();
      const service = factory.create(container);

      expect(service).toBeDefined();
      expect(service.queueAnimation).toBeDefined();
      expect(service.clearQueue).toBeDefined();
      expect(service.isPlaying).toBeDefined();
    });

    it('should manage animation queue', () => {
      const factory = new AnimationServiceFactory();
      const service = factory.create(container);

      expect(service.getQueueLength()).toBe(0);
      expect(service.isPlaying()).toBe(false);

      service.queueAnimation(10);
      expect(service.getQueueLength()).toBeGreaterThan(0);
    });
  });

  describe('TodoServiceFactory', () => {
    beforeEach(() => {
      // Register dependencies first
      container.register(SERVICE_TOKENS.STORAGE_SERVICE, new StorageServiceFactory());
      container.register(SERVICE_TOKENS.VALIDATION_SERVICE, new ValidationServiceFactory());
    });

    it('should create a todo service instance with dependencies', () => {
      const factory = new TodoServiceFactory();
      const service = factory.create(container);

      expect(service).toBeDefined();
      expect(service.createTodo).toBeDefined();
      expect(service.updateTodo).toBeDefined();
      expect(service.deleteTodo).toBeDefined();
      expect(service.getTodosForDate).toBeDefined();
    });

    it('should calculate day totals correctly', () => {
      const factory = new TodoServiceFactory();
      const service = factory.create(container);

      const todos = [
        {
          id: '1',
          title: 'Todo 1',
          description: '',
          pointValue: 10,
          isCompleted: true,
          createdAt: new Date(),
          completedAt: new Date()
        },
        {
          id: '2',
          title: 'Todo 2',
          description: '',
          pointValue: 20,
          isCompleted: false,
          createdAt: new Date()
        }
      ];

      const totals = service.calculateDayTotals(todos);
      expect(totals.total).toBe(30);
      expect(totals.completed).toBe(10);
    });
  });

  describe('Factory Dependencies', () => {
    it('should declare correct dependencies for TodoServiceFactory', () => {
      const factory = new TodoServiceFactory();
      expect(factory.dependencies).toContain(SERVICE_TOKENS.STORAGE_SERVICE);
      expect(factory.dependencies).toContain(SERVICE_TOKENS.VALIDATION_SERVICE);
    });

    it('should handle disposal correctly', () => {
      const factory = new ConfigServiceFactory();
      const service = factory.create(container);

      expect(() => factory.dispose(service)).not.toThrow();
    });
  });
}); 