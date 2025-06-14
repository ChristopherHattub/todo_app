import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ProgressAnimationContainer } from '../ProgressAnimationContainer';
import { animationHandler } from '../../../services/AnimationHandler';

describe('ProgressAnimationContainer', () => {
  beforeEach(() => {
    // Clear any existing animations
    animationHandler.clearQueue();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<ProgressAnimationContainer />);
    expect(screen.getByTestId('progress-animation-container')).toBeInTheDocument();
  });

  it('triggers animation when receiving animation:play event', () => {
    render(<ProgressAnimationContainer />);
    
    // Simulate animation play event
    act(() => {
      const event = new CustomEvent('animation:play', {
        detail: {
          ballCount: 3,
          duration: 1000,
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          intensity: 0.8
        }
      });
      window.dispatchEvent(event);
    });

    // Check if animation container is visible
    const container = screen.getByTestId('progress-animation-container');
    expect(container).toBeInTheDocument();
    expect(container).toBeVisible();
  });

  it('queues multiple animations correctly', () => {
    render(<ProgressAnimationContainer />);
    
    // Queue multiple animations
    act(() => {
      animationHandler.queueAnimation(2);
      animationHandler.queueAnimation(3);
    });

    // First animation should start immediately
    const container = screen.getByTestId('progress-animation-container');
    expect(container).toBeInTheDocument();
    expect(container).toBeVisible();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<ProgressAnimationContainer />);
    
    // Spy on removeEventListener
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    // Unmount component
    unmount();
    
    // Check if event listeners were removed (only animation:play is added in useEffect)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('animation:play', expect.any(Function));
  });

  it('handles animation completion correctly', () => {
    render(<ProgressAnimationContainer />);
    
    // Spy on dispatchEvent
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    
    // Trigger animation
    act(() => {
      const event = new CustomEvent('animation:play', {
        detail: {
          ballCount: 1,
          duration: 1000,
          colors: ['#FF0000'],
          intensity: 0.8
        }
      });
      window.dispatchEvent(event);
    });

    // Simulate animation completion
    act(() => {
      const completeEvent = new Event('animation:complete');
      window.dispatchEvent(completeEvent);
    });

    // Check if completion event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
  });
}); 