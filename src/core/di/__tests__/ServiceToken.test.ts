/**
 * ServiceToken test suite
 * Tests service token creation, uniqueness, and registry functionality
 */

import { createServiceToken, SERVICE_TOKENS } from '../ServiceToken';
import { ServiceToken } from '../types';

describe('ServiceToken', () => {
  describe('createServiceToken', () => {
    it('should create a service token with correct properties', () => {
      const token = createServiceToken<string>('TestService', 'A test service');
      
      expect(token).toMatchObject({
        name: 'TestService',
        description: 'A test service',
        symbol: expect.any(Symbol)
      });
    });

    it('should create a service token with default description', () => {
      const token = createServiceToken<string>('TestService');
      
      expect(token.description).toBe('Service token for TestService');
    });

    it('should create unique symbols for each token', () => {
      const token1 = createServiceToken<string>('Service1');
      const token2 = createServiceToken<string>('Service2');
      const token3 = createServiceToken<string>('Service1'); // Same name
      
      expect(token1.symbol).not.toBe(token2.symbol);
      expect(token1.symbol).not.toBe(token3.symbol);
      expect(token2.symbol).not.toBe(token3.symbol);
    });

    it('should handle empty name', () => {
      const token = createServiceToken<string>('');
      
      expect(token.name).toBe('');
      expect(token.description).toBe('Service token for ');
    });

    it('should handle special characters in name', () => {
      const specialName = 'Service@#$%^&*()';
      const token = createServiceToken<string>(specialName);
      
      expect(token.name).toBe(specialName);
      expect(token.symbol.toString()).toContain(specialName);
    });

    it('should create tokens with correct TypeScript types', () => {
      interface ITestService {
        test(): string;
      }
      
      const token: ServiceToken<ITestService> = createServiceToken<ITestService>('ITestService');
      
      // Type check - this should compile without errors
      expect(token.name).toBe('ITestService');
    });
  });

  describe('SERVICE_TOKENS registry', () => {
    it('should contain all expected service tokens', () => {
      const expectedTokens = [
        'TODO_SERVICE',
        'STORAGE_SERVICE', 
        'VALIDATION_SERVICE',
        'DATE_SERVICE',
        'ANIMATION_SERVICE',
        'CONFIG_SERVICE'
      ] as const;

      expectedTokens.forEach(tokenName => {
        expect(SERVICE_TOKENS).toHaveProperty(tokenName);
        expect(SERVICE_TOKENS[tokenName]).toMatchObject({
          name: expect.any(String),
          description: expect.any(String),
          symbol: expect.any(Symbol)
        });
      });
    });

    it('should have unique symbols for all service tokens', () => {
      const symbols = Object.values(SERVICE_TOKENS).map(token => token.symbol);
      const uniqueSymbols = new Set(symbols);
      
      expect(uniqueSymbols.size).toBe(symbols.length);
    });

    it('should have descriptive names for all tokens', () => {
      Object.entries(SERVICE_TOKENS).forEach(([key, token]) => {
        expect(token.name).toBeTruthy();
        expect(token.name.length).toBeGreaterThan(0);
        expect(token.description).toBeTruthy();
        expect(token.description?.length || 0).toBeGreaterThan(0);
      });
    });

    it('should follow naming conventions', () => {
      const expectedPatterns: Record<keyof typeof SERVICE_TOKENS, RegExp> = {
        TODO_SERVICE: /ITodoService/,
        STORAGE_SERVICE: /IStorageService/,
        VALIDATION_SERVICE: /IValidationService/,
        DATE_SERVICE: /IDateService/,
        ANIMATION_SERVICE: /IAnimationService/,
        CONFIG_SERVICE: /IConfigService/
      };

      Object.entries(expectedPatterns).forEach(([tokenKey, pattern]) => {
        const token = SERVICE_TOKENS[tokenKey as keyof typeof SERVICE_TOKENS];
        expect(token.name).toMatch(pattern);
      });
    });

    it('should be readonly', () => {
      // TypeScript compile-time check - SERVICE_TOKENS should be readonly
      expect(() => {
        // This should not be allowed in TypeScript
        // (SERVICE_TOKENS as any).NEW_TOKEN = createServiceToken('New');
      }).not.toThrow();
      
      // Runtime check that the object is frozen
      expect(Object.isFrozen(SERVICE_TOKENS)).toBe(true);
    });
  });

  describe('token serialization', () => {
    it('should handle symbol serialization correctly', () => {
      const token = createServiceToken<string>('TestService');
      
      // Symbols cannot be JSON serialized
      expect(() => JSON.stringify(token)).not.toThrow();
      
      const serialized = JSON.stringify({
        name: token.name,
        description: token.description
        // symbol is omitted intentionally
      });
      
      expect(serialized).toContain(token.name);
      expect(serialized).toContain(token.description || '');
    });

    it('should maintain symbol reference equality', () => {
      const token = createServiceToken<string>('TestService');
      const symbol1 = token.symbol;
      const symbol2 = token.symbol;
      
      expect(symbol1).toBe(symbol2);
    });
  });

  describe('error cases', () => {
    it('should handle null/undefined names gracefully', () => {
      expect(() => createServiceToken<string>(null as any)).not.toThrow();
      expect(() => createServiceToken<string>(undefined as any)).not.toThrow();
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(10000);
      const token = createServiceToken<string>(longName);
      
      expect(token.name).toBe(longName);
      expect(token.description).toBe(`Service token for ${longName}`);
    });
  });
}); 