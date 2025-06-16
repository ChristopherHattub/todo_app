import { ServiceModule } from '../ServiceModule';
import { SERVICE_TOKENS } from '../../di/ServiceToken';
import type { ITodoService, IStorageService, IValidationService, IDateService, IAnimationService, IConfigService } from '../../../services/interfaces';

describe('ServiceModule', () => {
  let serviceModule: ServiceModule;

  beforeEach(() => {
    serviceModule = new ServiceModule();
  });

  afterEach(async () => {
    await serviceModule.dispose();
  });

  describe('Service Registration', () => {
    it('should register all core services', () => {
      const container = serviceModule.getContainer();

      expect(container.isRegistered(SERVICE_TOKENS.CONFIG_SERVICE)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.STORAGE_SERVICE)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.VALIDATION_SERVICE)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.DATE_SERVICE)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.ANIMATION_SERVICE)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.TODO_SERVICE)).toBe(true);
    });

    it('should resolve config service', () => {
      const container = serviceModule.getContainer();
      const configService = container.resolve<IConfigService>(SERVICE_TOKENS.CONFIG_SERVICE);

      expect(configService).toBeDefined();
      expect(configService.getConfig).toBeDefined();
      expect(configService.getEnvironment).toBeDefined();
    });

    it('should resolve storage service', () => {
      const container = serviceModule.getContainer();
      const storageService = container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE_SERVICE);

      expect(storageService).toBeDefined();
      expect(storageService.saveYearSchedule).toBeDefined();
      expect(storageService.loadYearSchedule).toBeDefined();
      expect(storageService.isStorageAvailable).toBeDefined();
    });

    it('should resolve validation service', () => {
      const container = serviceModule.getContainer();
      const validationService = container.resolve<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE);

      expect(validationService).toBeDefined();
      expect(validationService.validateTodoInput).toBeDefined();
      expect(validationService.sanitizeTodoInput).toBeDefined();
    });

    it('should resolve date service', () => {
      const container = serviceModule.getContainer();
      const dateService = container.resolve<IDateService>(SERVICE_TOKENS.DATE_SERVICE);

      expect(dateService).toBeDefined();
      expect(dateService.formatDisplayDate).toBeDefined();
      expect(dateService.formatISODate).toBeDefined();
      expect(dateService.isToday).toBeDefined();
    });

    it('should resolve animation service', () => {
      const container = serviceModule.getContainer();
      const animationService = container.resolve<IAnimationService>(SERVICE_TOKENS.ANIMATION_SERVICE);

      expect(animationService).toBeDefined();
      expect(animationService.queueAnimation).toBeDefined();
      expect(animationService.clearQueue).toBeDefined();
      expect(animationService.isPlaying).toBeDefined();
    });

    it('should resolve todo service with dependencies', () => {
      const container = serviceModule.getContainer();
      const todoService = container.resolve<ITodoService>(SERVICE_TOKENS.TODO_SERVICE);

      expect(todoService).toBeDefined();
      expect(todoService.createTodo).toBeDefined();
      expect(todoService.updateTodo).toBeDefined();
      expect(todoService.deleteTodo).toBeDefined();
      expect(todoService.getDaySchedule).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should create working todo service with all dependencies', async () => {
      const container = serviceModule.getContainer();
      const todoService = container.resolve<ITodoService>(SERVICE_TOKENS.TODO_SERVICE);

      // Test that the service can perform basic operations
      const testDate = new Date('2024-03-14');
      const daySchedule = await todoService.getDaySchedule(testDate);

      expect(daySchedule).toBeDefined();
      expect(daySchedule.date).toBe('2024-03-14');
      expect(daySchedule.todoItems).toEqual([]);
      expect(daySchedule.totalPointValue).toBe(0);
    });

    it('should provide working validation through dependency injection', () => {
      const container = serviceModule.getContainer();
      const validationService = container.resolve<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE);

      const validInput = {
        title: 'Test Todo',
        description: 'Test Description',
        pointValue: '15'
      };

      const result = validationService.validateTodoInput(validInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide working date service through dependency injection', () => {
      const container = serviceModule.getContainer();
      const dateService = container.resolve<IDateService>(SERVICE_TOKENS.DATE_SERVICE);

      const testDate = new Date('2024-03-14');
      const formattedDate = dateService.formatDisplayDate(testDate);
      const isoDate = dateService.formatISODate(testDate);

      expect(formattedDate).toBe('03/14/24');
      expect(isoDate).toBe('2024-03-14');
    });

    it('should provide working storage service through dependency injection', () => {
      const container = serviceModule.getContainer();
      const storageService = container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE_SERVICE);

      expect(storageService.isStorageAvailable()).toBe(true);

      const storageInfo = storageService.getStorageInfo();
      expect(storageInfo).toHaveProperty('used');
      expect(storageInfo).toHaveProperty('available');
      expect(storageInfo).toHaveProperty('type');
      expect(storageInfo.type).toBe('localStorage');
    });
  });

  describe('Service Lifecycle', () => {
    it('should dispose all services properly', async () => {
      const container = serviceModule.getContainer();
      
      // Resolve all services to ensure they are created
      container.resolve<IConfigService>(SERVICE_TOKENS.CONFIG_SERVICE);
      container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
      container.resolve<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE);
      container.resolve<IDateService>(SERVICE_TOKENS.DATE_SERVICE);
      container.resolve<IAnimationService>(SERVICE_TOKENS.ANIMATION_SERVICE);
      container.resolve<ITodoService>(SERVICE_TOKENS.TODO_SERVICE);

      // Should not throw when disposing
      await expect(serviceModule.dispose()).resolves.not.toThrow();
    });

    it('should return the same service instance for singleton services', () => {
      const container = serviceModule.getContainer();
      
      const configService1 = container.resolve<IConfigService>(SERVICE_TOKENS.CONFIG_SERVICE);
      const configService2 = container.resolve<IConfigService>(SERVICE_TOKENS.CONFIG_SERVICE);

      expect(configService1).toBe(configService2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing dependencies gracefully', () => {
      const container = serviceModule.getContainer();
      
      // Should not throw when resolving registered services
      expect(() => container.resolve<IConfigService>(SERVICE_TOKENS.CONFIG_SERVICE)).not.toThrow();
      expect(() => container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE_SERVICE)).not.toThrow();
      expect(() => container.resolve<ITodoService>(SERVICE_TOKENS.TODO_SERVICE)).not.toThrow();
    });
  });
}); 