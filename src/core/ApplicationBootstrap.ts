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