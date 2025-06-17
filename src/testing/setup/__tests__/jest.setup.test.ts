/**
 * Test file to verify Jest setup is working correctly
 */

import { localStorageMock, sessionStorageMock } from '../jest.setup';

describe('Jest Setup', () => {
  describe('Global Mocks', () => {
    it('should have localStorage mock available', () => {
      expect(window.localStorage).toBeDefined();
      expect(typeof window.localStorage.getItem).toBe('function');
      expect(typeof window.localStorage.setItem).toBe('function');
    });

    it('should have sessionStorage mock available', () => {
      expect(window.sessionStorage).toBeDefined();
      expect(typeof window.sessionStorage.getItem).toBe('function');
      expect(typeof window.sessionStorage.setItem).toBe('function');
    });

    it('should have IntersectionObserver mock', () => {
      expect(window.IntersectionObserver).toBeDefined();
      const observer = new window.IntersectionObserver(() => {});
      
      expect(typeof observer.observe).toBe('function');
      expect(typeof observer.disconnect).toBe('function');
    });

    it('should have ResizeObserver mock', () => {
      expect(window.ResizeObserver).toBeDefined();
      const observer = new window.ResizeObserver(() => {});
      expect(typeof observer.observe).toBe('function');
      expect(typeof observer.disconnect).toBe('function');
    });

    it('should have matchMedia mock', () => {
      expect(window.matchMedia).toBeDefined();
      const result = window.matchMedia('(min-width: 768px)');
      
      expect(result.matches).toBe(false);
      expect(result.media).toBe('(min-width: 768px)');
    });

    it('should have requestAnimationFrame mock', () => {
      expect(global.requestAnimationFrame).toBeDefined();
      expect(global.cancelAnimationFrame).toBeDefined();
    });

    it('should have crypto mock', () => {
      expect(global.crypto).toBeDefined();
      expect(global.crypto.randomUUID).toBeDefined();
      
      const uuid = global.crypto.randomUUID();
      
      expect(typeof uuid).toBe('string');
      expect(uuid.startsWith('mocked-uuid-')).toBe(true);
    });

    it('should have fetch mock', () => {
      expect(global.fetch).toBeDefined();
      expect(typeof global.fetch).toBe('function');
    });
  });

  describe('Custom Matchers', () => {
    it('should have toBeWithinRange custom matcher', () => {
      expect(5).toBeWithinRange(1, 10);
      expect(15).not.toBeWithinRange(1, 10);
    });
  });

  describe('Date Mocking', () => {
    it('should have consistent Date.now mock', () => {
      const now1 = Date.now();
      const now2 = Date.now();
      expect(now1).toBe(now2);
      expect(now1).toBe(new Date('2024-01-01T00:00:00.000Z').getTime());
    });
  });

  describe('File Handling Mocks', () => {
    it('should have File mock', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      expect(file.name).toBe('test.txt');
      expect(file.type).toBe('text/plain');
      expect(file.size).toBe(7); // 'content' length
    });

    it('should have FileReader mock', () => {
      const reader = new FileReader();
      expect(reader.readAsText).toBeInstanceOf(Function);
      expect(reader.readAsDataURL).toBeInstanceOf(Function);
      
      reader.onload = jest.fn();
      reader.readAsText(new File(['test'], 'test.txt'));
      expect(reader.result).toBe('mocked-file-content');
    });

    it('should have Blob mock', () => {
      const blob = new Blob(['content'], { type: 'text/plain' });
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBe(7);
    });

    it('should have URL object methods mocked', () => {
      expect(URL.createObjectURL).toBeDefined();
      expect(URL.revokeObjectURL).toBeDefined();
      
      const url = URL.createObjectURL(new Blob(['test']));
      
      expect(url).toBe('mocked-url');
    });
  });

  describe('Mock Cleanup', () => {
    it('should reset mocks between tests', () => {
      const mockFn = jest.fn();
      mockFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // This would be reset in beforeEach
      jest.clearAllMocks();
      expect(mockFn).toHaveBeenCalledTimes(0);
    });
  });

  describe('Testing Library Integration', () => {
    it('should have @testing-library/jest-dom matchers available', () => {
      const div = document.createElement('div');
      div.textContent = 'Hello World';
      document.body.appendChild(div);
      
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent('Hello World');
      
      document.body.removeChild(div);
    });
  });
}); 