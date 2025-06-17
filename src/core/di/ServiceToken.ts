import { ServiceToken } from './types';
import { ITodoService } from '../../services/interfaces/ITodoService';
import { IStorageService } from '../../services/interfaces/IStorageService';
import { IValidationService } from '../../services/interfaces/IValidationService';
import { IDateService } from '../../services/interfaces/IDateService';
import { IAnimationService } from '../../services/interfaces/IAnimationService';
import { IConfigService } from '../../services/interfaces/IConfigService';

export function createServiceToken<T>(name: string, description?: string): ServiceToken<T> {
  return {
    symbol: Symbol(name),
    name,
    description: description || `Service token for ${name}`
  };
}

// Common service tokens
export const SERVICE_TOKENS = Object.freeze({
  // Storage Services
  TODO_SERVICE: createServiceToken<ITodoService>('ITodoService', 'Todo data operations'),
  STORAGE_SERVICE: createServiceToken<IStorageService>('IStorageService', 'Data persistence'),
  VALIDATION_SERVICE: createServiceToken<IValidationService>('IValidationService', 'Input validation'),
  
  // Date Services
  DATE_SERVICE: createServiceToken<IDateService>('IDateService', 'Date operations and formatting'),
  
  // Animation Services
  ANIMATION_SERVICE: createServiceToken<IAnimationService>('IAnimationService', 'Animation management'),
  
  // Configuration
  CONFIG_SERVICE: createServiceToken<IConfigService>('IConfigService', 'Application configuration')
} as const); 