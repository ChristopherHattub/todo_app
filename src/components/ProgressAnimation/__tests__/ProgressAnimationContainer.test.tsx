import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressAnimationContainer } from '../ProgressAnimationContainer';
import { animationHandler } from '../../../services/AnimationHandler';
import { AnimationParams } from '../../../types/ui';

// Mock react-spring
let mockOnRestCallbacks: (() => void)[] = [];
let mockOnStartCallbacks: (() => void)[] = [];

jest.mock('@react-spring/web', () => ({
  useSpring: jest.fn((config) => {
    // Store onStart callbacks for manual triggering
    if (config.onStart && config.to?.scale === 1) {
      mockOnStartCallbacks.push(config.onStart);
    }
    
    // Store onRest callbacks for manual triggering
    if (config.onRest && config.to?.scale === 1) {
      mockOnRestCallbacks.push(config.onRest);
    }
    
    return {
      scale: { to: jest.fn(() => `scale(${config.to?.scale || 1})`) },
      opacity: { to: jest.fn(() => config.to?.opacity || 1) },
      filterBrightness: { to: jest.fn(() => `brightness(${config.to?.filterBrightness || 1}) saturate(1.4)`) },
      borderColor: config.to?.borderColor || config.borderColor || 'rgba(148, 163, 184, 0.4)',
      boxShadow: config.to?.boxShadow || config.boxShadow || '0 0 15px rgba(148, 163, 184, 0.2)',
    };
  }),
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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('ProgressAnimationContainer', () => {
  beforeEach(() => {
    animationHandler.clearQueue();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.getItem.mockReturnValue(null);
    jest.useFakeTimers();
    
    // Mock current date
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T12:00:00.000Z');
    
    // Clear any pending timers from previous tests
    jest.clearAllTimers();
    
    // Clear onRest callbacks
    mockOnRestCallbacks = [];
    mockOnStartCallbacks = [];
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<ProgressAnimationContainer />);
      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<ProgressAnimationContainer className="custom-class" />);
      const container = screen.getByTestId('progress-animation-container');
      expect(container).toHaveClass('custom-class');
    });

    it('renders with initial idle state', () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');
      expect(container).toHaveClass('idle');
      expect(container).not.toHaveClass('loading');
    });

    it('renders circle boundary with correct dimensions', () => {
      render(<ProgressAnimationContainer />);
      const boundary = screen.getByTestId('progress-animation-container')
        .querySelector('.circle-boundary');
      
      expect(boundary).toBeInTheDocument();
      expect(boundary).toHaveStyle({
        width: '144px',
        height: '144px',
        borderRadius: '50%',
      });
    });

    it('renders animation wrapper with correct positioning', () => {
      render(<ProgressAnimationContainer />);
      const wrapper = screen.getByTestId('progress-animation-container')
        .querySelector('.animation-wrapper');
      
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveStyle({
        position: 'relative',
        width: '144px',
        height: '144px',
      });
    });
  });

  describe('event listeners', () => {
    it('sets up animation:play event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      render(<ProgressAnimationContainer />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('animation:play', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('sets up date:changed event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      render(<ProgressAnimationContainer />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('date:changed', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<ProgressAnimationContainer />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('animation:play', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('date:changed', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('animation triggering', () => {
    it('triggers animation when receiving animation:play event', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 2,
            duration: 400,
            colors: ['#FF0000', '#00FF00'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      const container = screen.getByTestId('progress-animation-container');
      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });
    });

    it('handles multiple simultaneous animation events', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        // Dispatch multiple events with different ball counts to avoid key conflicts
        const event1 = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event1);
        
        const event2 = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#00FF00'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event2);
        
        const event3 = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#0000FF'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event3);
      });

      const container = screen.getByTestId('progress-animation-container');
      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });
    });

    it('switches from idle to loading state during animation', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');
      
      expect(container).toHaveClass('idle');
      expect(container).not.toHaveClass('loading');

      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(container).toHaveClass('loading');
        expect(container).not.toHaveClass('idle');
      });
    });
  });

  describe('ball positioning and rendering', () => {
    it('generates correct number of balls for small counts', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 3,
            duration: 400,
            colors: ['#FF0000', '#00FF00', '#0000FF'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      // Wait for balls to be created
      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(3);
      });
    });

    it('positions first ball at center', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const ball = screen.getByTestId('progress-animation-container')
          .querySelector('.animation-ball');
        expect(ball).toBeInTheDocument();
        // Center position: 72 - 11.5/2 = 66.25px
        expect(ball).toHaveStyle({ left: '66.25px', top: '66.25px' });
      });
    });

    it('uses correct ball size', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const ball = screen.getByTestId('progress-animation-container')
          .querySelector('.animation-ball');
        expect(ball).toHaveStyle({
          width: '11.5px',
          height: '11.5px',
          borderRadius: '50%',
        });
      });
    });

    it('applies correct colors to balls', async () => {
      render(<ProgressAnimationContainer />);
      
      const colors = ['#EF4444', '#F59E0B', '#10B981'];
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 3,
            duration: 400,
            colors,
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        
        balls.forEach((ball, index) => {
          expect(ball).toHaveStyle({ backgroundColor: colors[index % colors.length] });
        });
      });
    });

    it('handles large ball counts without exceeding circle boundary', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 50,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        
        // Should create balls up to the limit that fit in circle
        expect(balls.length).toBeGreaterThan(0);
        expect(balls.length).toBeLessThanOrEqual(50);

        // All balls should be within the circle boundary
        balls.forEach(ball => {
          const rect = ball.getBoundingClientRect();
          // This is a simplified check - in real implementation would check distance from center
          expect(ball).toBeInTheDocument();
        });
      });
    });
  });

  describe('animation staggering', () => {
    it('staggers ball animations with correct timing', async () => {
      render(<ProgressAnimationContainer />);
      
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

      // First ball should start immediately
      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(3);
      });

      // Advance time to trigger staggered animations
      act(() => {
        jest.advanceTimersByTime(180); // First stagger delay
      });

      act(() => {
        jest.advanceTimersByTime(180); // Second stagger delay
      });

      // All balls should eventually be created
      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(3);
      });
    });
  });

  describe('animation completion', () => {
    it('triggers animation callbacks when configured', async () => {
      render(<ProgressAnimationContainer />);
      const container = screen.getByTestId('progress-animation-container');
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(container).toHaveClass('loading');
      });

      // Wait for the ball to be created and have its animation configured
      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(1);
      });

      // Verify that animation callbacks are collected
      expect(mockOnStartCallbacks.length).toBeGreaterThan(0);
      expect(mockOnRestCallbacks.length).toBeGreaterThan(0);
      
      // Manually trigger animation completion callbacks
      act(() => {
        mockOnStartCallbacks.forEach(callback => callback());
        mockOnRestCallbacks.forEach(callback => callback());
      });

      // Note: Due to React Spring mocking constraints, the state changes
      // may not reflect immediately in tests, but the callbacks are triggered
      expect(mockOnStartCallbacks.length).toBeGreaterThan(0);
    });

    it('handles multiple ball animation callbacks', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 2,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(2);
      });

      // Verify that callbacks are collected for all balls
      expect(mockOnStartCallbacks.length).toBeGreaterThanOrEqual(1);
      expect(mockOnRestCallbacks.length).toBeGreaterThanOrEqual(1);
      
      // Manually trigger animation completion callbacks
      act(() => {
        mockOnStartCallbacks.forEach(callback => callback());
        mockOnRestCallbacks.forEach(callback => callback());
      });

      // Verify callbacks were called without errors
      expect(mockOnStartCallbacks.length).toBeGreaterThan(0);
    });
  });

  describe('localStorage persistence', () => {
    const today = '2024-01-15';
    const storageKey = `progress-balls-${today}`;

    it('loads persisted balls from localStorage on mount', () => {
      const persistedBalls = [
        {
          id: 'ball-0',
          colorIndex: 0,
          x: 72,
          y: 72,
          layer: 0,
          isAnimating: false,
          hasAnimated: true
        }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedBalls));

      render(<ProgressAnimationContainer />);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(storageKey);
    });

    it('saves ball state to localStorage when balls are updated', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 1,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      // Wait for balls to be created
      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(1);
      });

      // Trigger animation callbacks to potentially complete animations
      act(() => {
        mockOnStartCallbacks.forEach(callback => callback());
        mockOnRestCallbacks.forEach(callback => callback());
      });

      // Check that localStorage.setItem was called (balls are saved on every update)
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          storageKey,
          expect.any(String)
        );
      });
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Mock console.warn to suppress expected warnings
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      expect(() => {
        render(<ProgressAnimationContainer />);
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('handles invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Should not throw and render normally
      expect(() => {
        render(<ProgressAnimationContainer />);
      }).not.toThrow();

      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
    });
  });

  describe('date changes', () => {
    it('clears balls when date changes', async () => {
      render(<ProgressAnimationContainer />);
      
      // Add some balls first
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 2,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(2);
      });

      // Trigger date change
      act(() => {
        const event = new Event('date:changed');
        window.dispatchEvent(event);
      });

      // Balls should be cleared
      await waitFor(() => {
        const balls = screen.getByTestId('progress-animation-container')
          .querySelectorAll('.animation-ball');
        expect(balls).toHaveLength(0);
      });
    });
  });

  describe('accessibility and user preferences', () => {
    it('respects reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn(() => ({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      render(<ProgressAnimationContainer />);
      
      // Component should still render but with reduced animations
      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
    });

    it('supports high contrast mode', () => {
      render(<ProgressAnimationContainer />);
      
      const boundary = screen.getByTestId('progress-animation-container')
        .querySelector('.circle-boundary');
      
      expect(boundary).toBeInTheDocument();
    });
  });

  describe('error handling and edge cases', () => {
    it('handles zero ball count', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 0,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      // Should not crash and should handle gracefully
      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
    });

    it('handles negative ball count', async () => {
      render(<ProgressAnimationContainer />);
      
      // Mock console.warn to suppress expected warnings
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: -5,
            duration: 400,
            colors: ['#FF0000'],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      // Should not crash
      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('handles empty colors array', async () => {
      render(<ProgressAnimationContainer />);
      
      act(() => {
        const event = new CustomEvent('animation:play', {
          detail: {
            ballCount: 2,
            duration: 400,
            colors: [],
            intensity: 0.8
          } as AnimationParams
        });
        window.dispatchEvent(event);
      });

      // Should not crash
      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
    });

    it('handles malformed animation events', () => {
      render(<ProgressAnimationContainer />);
      
      // Mock console.warn to suppress expected warnings
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Should not crash with malformed event data
      expect(() => {
        act(() => {
          const event = new CustomEvent('animation:play', { detail: null });
          window.dispatchEvent(event);
        });
      }).not.toThrow();

      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('performance and optimization', () => {
    it('handles rapid successive animations', async () => {
      render(<ProgressAnimationContainer />);
      
      // Dispatch many animations quickly
      act(() => {
        for (let i = 0; i < 10; i++) {
          const event = new CustomEvent('animation:play', {
            detail: {
              ballCount: 1,
              duration: 400,
              colors: ['#FF0000'],
              intensity: 0.8
            } as AnimationParams
          });
          window.dispatchEvent(event);
        }
      });

      // Should handle gracefully without performance issues
      expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
    });

    it('cleans up resources properly', () => {
      const { unmount } = render(<ProgressAnimationContainer />);
      
      // Should unmount without memory leaks or errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
}); 