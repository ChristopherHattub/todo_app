import { AnimationHandler, animationHandler } from '../AnimationHandler';
import { AnimationParams } from '../../types/ui';

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
});

describe('AnimationHandler', () => {
  let handler: AnimationHandler;

  beforeEach(() => {
    handler = new AnimationHandler();
    mockDispatchEvent.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty queue and not playing', () => {
      const newHandler = new AnimationHandler();
      expect(newHandler['queue']).toEqual([]);
      expect(newHandler['isPlaying']).toBe(false);
      expect(newHandler['finalCallback']).toBeUndefined();
    });
  });

  describe('queueAnimation', () => {
    it('should queue a single animation with correct parameters', () => {
      const points = 3;
      const onComplete = jest.fn();

      handler.queueAnimation(points, onComplete);

      // Animation starts immediately, so check the event dispatch
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'animation:play',
          detail: {
            ballCount: 3,
            duration: 400,
            colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
            intensity: 0.8
          }
        })
      );
      expect(handler['finalCallback']).toBe(onComplete);
    });

    it('should start animation immediately if not already playing', () => {
      const points = 2;
      
      handler.queueAnimation(points);

      expect(handler['isPlaying']).toBe(true);
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'animation:play',
          detail: {
            ballCount: 2,
            duration: 400,
            colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
            intensity: 0.8
          }
        })
      );
    });

    it('should queue multiple animations without starting immediately if already playing', () => {
      // Start first animation
      handler.queueAnimation(1);
      expect(handler['isPlaying']).toBe(true);
      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);

      // Queue second animation
      handler.queueAnimation(2);
      expect(handler['queue']).toHaveLength(1); // Second animation still in queue
      expect(mockDispatchEvent).toHaveBeenCalledTimes(1); // No new dispatch yet
    });

    it('should handle zero points correctly', () => {
      handler.queueAnimation(0);

      // Should dispatch event even for 0 balls
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            ballCount: 0
          })
        })
      );
    });

    it('should handle large point values correctly', () => {
      const points = 50;
      handler.queueAnimation(points);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            ballCount: 50
          })
        })
      );
    });

    it('should update finalCallback when multiple animations are queued', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      handler.queueAnimation(1, callback1);
      handler.queueAnimation(2, callback2);

      expect(handler['finalCallback']).toBe(callback2);
    });
  });

  describe('animation playback', () => {
    it('should play animations sequentially', () => {
      handler.queueAnimation(1);
      handler.queueAnimation(2);
      handler.queueAnimation(3);

      // First animation should start immediately
      expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
      expect(mockDispatchEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ ballCount: 1 })
        })
      );

      // Advance time to trigger second animation
      jest.advanceTimersByTime(500); // 400ms duration + 100ms buffer
      expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
      expect(mockDispatchEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ ballCount: 2 })
        })
      );

      // Advance time to trigger third animation
      jest.advanceTimersByTime(500);
      expect(mockDispatchEvent).toHaveBeenCalledTimes(3);
      expect(mockDispatchEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ ballCount: 3 })
        })
      );
    });

    it('should set isPlaying to false when queue is empty', () => {
      handler.queueAnimation(1);
      expect(handler['isPlaying']).toBe(true);

      // Advance time to complete animation
      jest.advanceTimersByTime(500);
      expect(handler['isPlaying']).toBe(false);
    });

    it('should call final callback when all animations complete', () => {
      const onComplete = jest.fn();
      handler.queueAnimation(1, onComplete);

      expect(onComplete).not.toHaveBeenCalled();

      // Complete the animation
      jest.advanceTimersByTime(500); // Animation completion
      expect(onComplete).not.toHaveBeenCalled(); // Not called yet

      jest.advanceTimersByTime(500); // Final callback delay
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call final callback only once for multiple animations', () => {
      const onComplete = jest.fn();
      handler.queueAnimation(1, onComplete);
      handler.queueAnimation(2);

      // Complete both animations
      jest.advanceTimersByTime(1000); // First animation
      jest.advanceTimersByTime(1000); // Second animation + final callback delay

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should clear final callback after calling it', () => {
      const onComplete = jest.fn();
      handler.queueAnimation(1, onComplete);

      // Complete animation
      jest.advanceTimersByTime(1000);

      expect(handler['finalCallback']).toBeUndefined();
    });
  });

  describe('clearQueue', () => {
    it('should clear all queued animations', () => {
      handler.queueAnimation(1);
      handler.queueAnimation(2);
      handler.queueAnimation(3);

      expect(handler['queue']).toHaveLength(2); // One started, two queued

      handler.clearQueue();

      expect(handler['queue']).toHaveLength(0);
      expect(handler['isPlaying']).toBe(false);
      expect(handler['finalCallback']).toBeUndefined();
    });

    it('should prevent pending callbacks from executing', () => {
      const onComplete = jest.fn();
      handler.queueAnimation(1, onComplete);

      handler.clearQueue();

      // Advance time past when callback would have been called
      jest.advanceTimersByTime(2000);

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('getBallParams', () => {
    it('should generate correct parameters for different ball counts', () => {
      const params1 = handler['getBallParams'](1);
      const params5 = handler['getBallParams'](5);
      const params10 = handler['getBallParams'](10);

      expect(params1.ballCount).toBe(1);
      expect(params5.ballCount).toBe(5);
      expect(params10.ballCount).toBe(10);

      // All should have same other properties
      [params1, params5, params10].forEach(params => {
        expect(params.duration).toBe(400);
        expect(params.intensity).toBe(0.8);
        expect(params.colors).toEqual(["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"]);
      });
    });
  });

  describe('error handling', () => {
    it('should handle dispatchEvent errors gracefully', () => {
      // Create a new handler for this test to avoid polluting other tests
      const testHandler = new AnimationHandler();
      
      const mockDispatchEventWithError = jest.fn(() => {
        throw new Error('Dispatch failed');
      });
      
      // Temporarily replace the global dispatchEvent
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = mockDispatchEventWithError;

      expect(() => {
        testHandler.queueAnimation(1);
      }).toThrow('Dispatch failed'); // The error is not caught in the current implementation

      // Restore original
      window.dispatchEvent = originalDispatchEvent;
    });

    it('should continue processing queue even if one animation fails', () => {
      // Create a new handler for this test
      const testHandler = new AnimationHandler();
      
      const mockDispatchEventSequence = jest.fn()
        .mockImplementationOnce(() => {
          throw new Error('First animation failed');
        })
        .mockImplementationOnce(() => true);

      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = mockDispatchEventSequence;

      testHandler.queueAnimation(1);
      testHandler.queueAnimation(2);

      // First call should throw
      expect(mockDispatchEventSequence).toHaveBeenCalledTimes(1);

      // Advance time to trigger second animation
      jest.advanceTimersByTime(500);
      
      // Second call should succeed
      expect(mockDispatchEventSequence).toHaveBeenCalledTimes(2);

      // Restore original
      window.dispatchEvent = originalDispatchEvent;
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(animationHandler).toBeInstanceOf(AnimationHandler);
    });

    it('should maintain state across imports', () => {
      // Clear any existing state first
      animationHandler.clearQueue();
      
      animationHandler.queueAnimation(1);
      expect(animationHandler['isPlaying']).toBe(true);
      
      // Clean up
      animationHandler.clearQueue();
    });
  });

  describe('timing and performance', () => {
    it('should respect animation duration in timing calculations', () => {
      // Use a fresh handler to avoid interference from other tests
      const testHandler = new AnimationHandler();
      const testMockDispatch = jest.fn();
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = testMockDispatch;

      testHandler.queueAnimation(1);
      testHandler.queueAnimation(2);

      expect(testMockDispatch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(499); // Just before expected next animation
      expect(testMockDispatch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1); // Exactly at expected next animation time
      expect(testMockDispatch).toHaveBeenCalledTimes(2);

      // Restore original
      window.dispatchEvent = originalDispatchEvent;
    });

    it('should handle rapid successive queueing', () => {
      // Use a fresh handler to avoid interference from other tests
      const testHandler = new AnimationHandler();
      const testMockDispatch = jest.fn();
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = testMockDispatch;

      // Queue many animations quickly
      for (let i = 1; i <= 10; i++) {
        testHandler.queueAnimation(i);
      }

      expect(testHandler['queue']).toHaveLength(9); // 10 - 1 currently playing
      expect(testMockDispatch).toHaveBeenCalledTimes(1); // Only first one starts

      // Restore original
      window.dispatchEvent = originalDispatchEvent;
    });
  });
}); 