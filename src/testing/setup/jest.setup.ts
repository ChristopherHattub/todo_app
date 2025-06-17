// Jest setup file for todo_app
// This file is executed before each test file

import '@testing-library/jest-dom';

// Import custom matchers and utilities
import { cleanup } from '@testing-library/react';
import { resetAllMocks } from '../mocks/ServiceMocks';

// Store references to our mocks so we can reset them properly
let mockStorage: any;
let mockIntersectionObserver: any;
let mockResizeObserver: any;
let mockMatchMedia: any;
let mockCrypto: any;
let mockFetch: any;
let mockDateNow: any;
let mockURL: any;

// Global test configuration
beforeAll(() => {
  // Mock console methods to reduce noise in tests (optional)
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args: any[]) => {
    // Suppress specific React warnings during tests
    if (
      typeof args[0] === 'string' && (
        args[0].includes('Warning: ReactDOM.render is deprecated') ||
        args[0].includes('Warning: validateDOMNesting')
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    // Suppress specific warnings during tests
    if (
      typeof args[0] === 'string' && (
        args[0].includes('Warning: An invalid form control') ||
        args[0].includes('Warning: Failed prop type')
      )
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  // Set up global mocks
  setupGlobalMocks();
});

afterAll(() => {
  // Cleanup after all tests
  jest.restoreAllMocks();
});

// Configure Jest environment
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  resetAllMocks();
  
  // Re-apply mock implementations after clearing
  reapplyMockImplementations();
  
  // Clear any timers
  jest.clearAllTimers();
});

afterEach(() => {
  // Cleanup React Testing Library
  cleanup();
  
  // Restore all mocks
  jest.restoreAllMocks();
});

function setupGlobalMocks() {
  // Mock localStorage
  mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: mockStorage,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    configurable: true,
    value: sessionStorageMock,
  });

  // Mock IntersectionObserver
  mockIntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }));
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver
  });
  Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver
  });

  // Mock ResizeObserver
  mockResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));
  
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver
  });
  Object.defineProperty(global, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver
  });

  // Mock matchMedia for responsive design tests
  mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });

  // Mock scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn(),
  });

  // Mock requestAnimationFrame
  Object.defineProperty(global, 'requestAnimationFrame', {
    writable: true,
    value: jest.fn((cb) => setTimeout(cb, 0))
  });
  Object.defineProperty(global, 'cancelAnimationFrame', {
    writable: true,
    value: jest.fn((id) => clearTimeout(id))
  });

  // Mock performance.now for timing-based tests
  let performanceNowCounter = 0;
  Object.defineProperty(window, 'performance', {
    writable: true,
    configurable: true,
    value: {
      now: jest.fn(() => {
        performanceNowCounter += 10; // Increment by 10ms each call
        return performanceNowCounter;
      }),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
    },
  });

  // Also set global performance for broader compatibility
  if (!global.performance) {
    global.performance = window.performance;
  }

  // Mock File for file upload tests
  global.File = class MockFile {
    public name: string;
    public size: number;
    public type: string;
    
    constructor(chunks: any[], name: string, options: any = {}) {
      this.name = name;
      this.size = chunks.reduce((size, chunk) => size + (chunk.length || 0), 0);
      this.type = options.type || '';
    }
  } as any;

  // Mock FileReader for file upload tests
  global.FileReader = class MockFileReader {
    result: any = null;
    error: any = null;
    readyState: number = 0;
    onload: any = null;
    onerror: any = null;
    onloadend: any = null;
    
    readAsText() {
      this.readyState = 2;
      this.result = 'mocked-file-content';
      if (this.onload) this.onload({ target: this });
    }
    
    readAsDataURL() {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,bW9ja2VkLWZpbGUtY29udGVudA==';
      if (this.onload) this.onload({ target: this });
    }
  } as any;

  // Mock Blob for download functionality
  global.Blob = class MockBlob {
    public size: number;
    public type: string;
    
    constructor(chunks: any[], options: any = {}) {
      this.size = chunks.reduce((size, chunk) => size + (chunk.length || 0), 0);
      this.type = options.type || '';
    }
  } as any;

  // Mock crypto.randomUUID for UUID generation
  mockCrypto = {
    randomUUID: jest.fn(() => 'mocked-uuid-' + Date.now()),
    getRandomValues: jest.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  };
  
  Object.defineProperty(global, 'crypto', {
    writable: true,
    configurable: true,
    value: mockCrypto,
  });

  // Mock fetch for API calls
  mockFetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  );
  
  Object.defineProperty(global, 'fetch', {
    writable: true,
    configurable: true,
    value: mockFetch
  });

  // Mock URL.createObjectURL and URL.revokeObjectURL for file handling
  if (!global.URL) {
    global.URL = {} as any;
  }
  mockURL = {
    createObjectURL: jest.fn(() => 'mocked-url'),
    revokeObjectURL: jest.fn()
  };
  
  global.URL.createObjectURL = mockURL.createObjectURL;
  global.URL.revokeObjectURL = mockURL.revokeObjectURL;

  // Mock Date.now for consistent testing
  const originalDateNow = Date.now;
  mockDateNow = jest.fn(() => new Date('2024-01-01T00:00:00.000Z').getTime());
  Date.now = mockDateNow;
  
  // Store original for restoration if needed
  (mockDateNow as any).originalImplementation = originalDateNow;
}

function reapplyMockImplementations() {
  // Re-apply mock implementations after jest.clearAllMocks()
  if (mockIntersectionObserver) {
    mockIntersectionObserver.mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      root: null,
      rootMargin: '',
      thresholds: []
    }));
  }

  if (mockResizeObserver) {
    mockResizeObserver.mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
  }

  if (mockMatchMedia) {
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  }

  if (mockCrypto?.randomUUID) {
    mockCrypto.randomUUID.mockReturnValue('mocked-uuid-' + Date.now());
  }

  if (mockFetch) {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
  }

  if (mockURL?.createObjectURL) {
    mockURL.createObjectURL.mockReturnValue('mocked-url');
  }

  if (mockDateNow) {
    mockDateNow.mockReturnValue(new Date('2024-01-01T00:00:00.000Z').getTime());
  }

  // Reset performance.now counter for consistent timing tests
  if (window.performance?.now) {
    let performanceNowCounter = 0;
    (window.performance.now as jest.Mock).mockImplementation(() => {
      performanceNowCounter += 10; // Increment by 10ms each call
      return performanceNowCounter;
    });
  }
}

// Custom Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

// Set default timeout for tests
jest.setTimeout(10000);

// Export useful test utilities for backwards compatibility
export const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

export const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}; 