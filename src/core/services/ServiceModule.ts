import { IServiceContainer } from '../di';
import { ServiceContainer } from '../di/ServiceContainer';
import { registerServices } from './ServiceRegistration';

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