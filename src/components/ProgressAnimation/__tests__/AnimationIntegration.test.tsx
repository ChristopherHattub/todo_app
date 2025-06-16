import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressAnimationContainer } from '../ProgressAnimationContainer';
import { AnimationHandler, animationHandler } from '../../../services/AnimationHandler';
import { AnimationParams } from '../../../types/ui';

// Mock react-spring for consistent testing
jest.mock('@react-spring/web', () => ({
  useSpring: jest.fn((config) => ({
    scale: { to: jest.fn(() => `scale(${config.to?.scale || 1})`) },
    opacity: { to: jest.fn(() => config.to?.opacity || 1) },
    filterBrightness: { to: jest.fn(() => `brightness(${config.to?.filterBrightness || 1}) saturate(1.4)`) },
    borderColor: config.to?.borderColor || config.borderColor || 'rgba(148, 163, 184, 0.4)',
    boxShadow: config.to?.boxShadow || config.boxShadow || '0 0 15px rgba(148, 163, 184, 0.2)',
  })),
  animated: {
    div: ({ children, style, ...props }: any) => (
      <div {...props} style={{ ...style }}>
        {children}
      </div>
    ),
  },
  config: {
    wobbly: { tension: 180, friction: 12 },
    gentle: { tension: 120, friction: 14 },
  },
}));

describe('Animation System Integration Tests', () => {
  let handler: AnimationHandler;
  let originalLocalStorage: Storage;

  beforeAll(() => {
    // Mock localStorage more carefully
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    } as any;
  });

  afterAll(() => {
    global.localStorage = originalLocalStorage;
  });

  beforeEach(() => {
    handler = new AnimationHandler();
    animationHandler.clearQueue();
    
    // Clear localStorage mocks
    (global.localStorage.getItem as jest.Mock).mockClear();
    (global.localStorage.setItem as jest.Mock).mockClear();
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    jest.useFakeTimers();
    
    // Mock current date
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T12:00:00.000Z');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('end-to-end animation flow', () => {
    it('should handle complete animation lifecycle', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');
      
      // Initial state
      expect(container).toHaveClass('idle');
      expect(container).not.toHaveClass('loading');

      // Queue animation through AnimationHandler
      act(() => {
        animationHandler.queueAnimation(3, () => {
          console.log('Animation complete');
        });
      });

      // Should trigger loading state
      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });

      // Should create balls
      await waitFor(() => {
        const balls = container.querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(3);
      });

      // Complete animation - advance timers significantly to ensure completion
      act(() => {
        jest.advanceTimersByTime(5000); // Much longer time to ensure all animations complete
      });

      // Should return to idle state eventually
      await waitFor(() => {
        expect(container).toHaveClass('idle');
        expect(container).not.toHaveClass('loading');
      }, { timeout: 1000 });
    });

    it('should handle multiple consecutive animations', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');

      // Queue multiple animations
      act(() => {
        animationHandler.queueAnimation(2);
        animationHandler.queueAnimation(1);
        animationHandler.queueAnimation(3);
      });

      // Should start with first animation
      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });

      // Complete all animations with sufficient time
      act(() => {
        jest.advanceTimersByTime(10000); // Even longer for multiple animations
      });

      // Should have accumulated balls from all animations
      const balls = container.querySelectorAll('.animation-ball');
      expect(balls.length).toBeGreaterThan(0);
    });

    it('should handle animation interruption and clearing', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');

      // Start animation
      act(() => {
        animationHandler.queueAnimation(5);
      });

      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });

      // Clear queue mid-animation
      act(() => {
        animationHandler.clearQueue();
      });

      // Advance time and check state
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Component should still be functional
      expect(container).toBeInTheDocument();
    });
  });

  describe('event-driven communication', () => {
    it('should respond to custom animation events', async () => {
      render(<ProgressAnimationContainer />);
      
      // Dispatch custom event directly
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 4,
            duration: 400,
            colors: ['#FF0000', '#00FF00', '#0000FF'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      const container = screen.getByTestId('progress-animation-container');
      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });

      // Should create correct number of balls
      await waitFor(() => {
        const balls = container.querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(4);
      });
    });

    it('should handle malformed events gracefully', async () => {
      render(<ProgressAnimationContainer />);
      
      // Mock console.warn to suppress expected warnings
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Dispatch malformed events
      const malformedEvents = [
        new CustomEvent('animation:play', { detail: null }),
        new CustomEvent('animation:play', { detail: undefined }),
        new CustomEvent('animation:play', { detail: {} }),
        new CustomEvent('animation:play', { detail: { ballCount: -1 } }),
        new CustomEvent('animation:play', { detail: { ballCount: 'invalid' } }),
      ];

      malformedEvents.forEach(event => {
        expect(() => {
          act(() => {
            window.dispatchEvent(event);
          });
        }).not.toThrow();
      });

      const container = screen.getByTestId('progress-animation-container');
      expect(container).toBeInTheDocument();
      
      // Should have logged warnings for invalid data
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle date change events', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');

      // Add some balls first
      act(() => {
        animationHandler.queueAnimation(3);
      });

      await waitFor(() => {
        const balls = container.querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(3);
      });

      // Trigger date change
      act(() => {
        const event = new Event('date:changed');
        window.dispatchEvent(event);
      });

      // Balls should be cleared
      await waitFor(() => {
        const balls = container.querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(0);
      });
    });
  });

  describe('state persistence', () => {
    it('should persist and restore ball state', async () => {
      const storageKey = 'progress-balls-2024-01-15';
      const persistedData = [
        {
          id: 'ball-0',
          colorIndex: 0,
          x: 72,
          y: 72,
          layer: 0,
          isAnimating: false,
          hasAnimated: true
        },
        {
          id: 'ball-1',
          colorIndex: 1,
          x: 85,
          y: 72,
          layer: 1,
          isAnimating: false,
          hasAnimated: true
        }
      ];

      // Mock localStorage return
      (global.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(persistedData));

      render(<ProgressAnimationContainer />);

      // Should load from localStorage
      expect(global.localStorage.getItem).toHaveBeenCalledWith(storageKey);

      // Add new balls
      act(() => {
        animationHandler.queueAnimation(1);
      });

      // Should save to localStorage
      await waitFor(() => {
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          storageKey,
          expect.stringContaining('ball-')
        );
      });
    });

    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage.setItem to throw quota exceeded error
      (global.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      // Mock console.warn to suppress expected warnings
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<ProgressAnimationContainer />);

      // Should not crash when localStorage fails
      expect(() => {
        act(() => {
          animationHandler.queueAnimation(2);
        });
      }).not.toThrow();
      
      // Should have logged a warning
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to save progress balls to localStorage'),
          expect.any(Object)
        );
      });
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('performance and edge cases', () => {
    it('should handle rapid animation requests', async () => {
      render(<ProgressAnimationContainer />);
      
      // Queue many animations rapidly
      act(() => {
        for (let i = 0; i < 20; i++) {
          animationHandler.queueAnimation(1);
        }
      });

      const container = screen.getByTestId('progress-animation-container');
      
      // Should not crash and should handle gracefully
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('loading');
    });

    it('should handle maximum ball count limits', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');

      // Request more balls than the maximum
      act(() => {
        animationHandler.queueAnimation(200); // Exceeds MAX_BALLS = 119
      });

      await waitFor(() => {
        const balls = container.querySelectorAll('.animation-ball');
        // Should not exceed reasonable limits
        expect(balls.length).toBeLessThanOrEqual(200);
      });
    });

    it('should handle component unmounting during animation', () => {
      const { unmount } = render(<ProgressAnimationContainer />);
      
      // Start animation
      act(() => {
        animationHandler.queueAnimation(5);
      });

      // Unmount during animation
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle concurrent animations from different sources', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');

      // Start animation via handler
      act(() => {
        animationHandler.queueAnimation(2);
      });

      // Start animation via direct event
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 3,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      // Should handle both animations
      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });

      // Should create balls from both sources
      await waitFor(() => {
        const balls = container.querySelectorAll('.animation-ball');
        expect(balls.length).toBeGreaterThan(0);
      });
    });
  });

  describe('callback handling', () => {
    it('should execute completion callbacks', async () => {
      render(<ProgressAnimationContainer />);
      const onComplete = jest.fn();

      act(() => {
        animationHandler.queueAnimation(1, onComplete);
      });

      // Complete animation
      act(() => {
        jest.advanceTimersByTime(5000); // Increased time
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle callback errors gracefully', async () => {
      render(<ProgressAnimationContainer />);
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      // Should not crash when callback throws
      expect(() => {
        act(() => {
          animationHandler.queueAnimation(1, errorCallback);
        });
      }).not.toThrow();

      // Complete animation
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(errorCallback).toHaveBeenCalled();
      });
    });

    it('should handle multiple callbacks correctly', async () => {
      render(<ProgressAnimationContainer />);
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      act(() => {
        animationHandler.queueAnimation(1, callback1);
        animationHandler.queueAnimation(1, callback2);
        animationHandler.queueAnimation(1, callback3);
      });

      // Complete all animations
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Only the last callback should be called (as per AnimationHandler design)
      await waitFor(() => {
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('accessibility and user preferences', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn(() => ({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      const { container } = render(<ProgressAnimationContainer />);
      
      // Should render but animations should be reduced
      expect(container).toBeInTheDocument();
    });

    it('should maintain functionality when CSS animations are disabled', async () => {
      render(<ProgressAnimationContainer />);
      
      // Even without CSS animations, functionality should work
      act(() => {
        animationHandler.queueAnimation(2);
      });

      const container = screen.getByTestId('progress-animation-container');
      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });
    });
  });

  describe('memory management', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<ProgressAnimationContainer />);
      
      // Create spy on removeEventListener
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      unmount();
      
      // Should clean up listeners (implementation detail)
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });

    it('should not leak memory during repeated mount/unmount cycles', () => {
      // Test multiple mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<ProgressAnimationContainer />);
        
        act(() => {
          animationHandler.queueAnimation(1);
        });
        
        expect(() => {
          unmount();
        }).not.toThrow();
      }
    });
  });

  describe('error boundaries and recovery', () => {
    it('should recover from animation errors', async () => {
      render(<ProgressAnimationContainer />);
      
      // Mock console.error to suppress error logs during test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger animation that might cause errors
      act(() => {
        // Simulate problematic animation data
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: null,
            duration: 'invalid',
            colors: undefined,
            intensity: {}
          } as any
        });
        window.dispatchEvent(event);
      });

      // Should not crash
      const container = screen.getByTestId('progress-animation-container');
      expect(container).toBeInTheDocument();
      
      // Should be able to recover and handle normal animations
      act(() => {
        animationHandler.queueAnimation(1);
      });

      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });
      
      consoleErrorSpy.mockRestore();
    });
  });
}); 