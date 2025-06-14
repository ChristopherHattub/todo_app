import { AnimationParams } from '../types/ui';

interface QueuedAnimation {
  params: AnimationParams;
}

export class AnimationHandler {
  private queue: QueuedAnimation[] = [];
  private isPlaying = false;
  private finalCallback?: () => void;

  /**
   * Creates animation parameters for multiple balls
   */
  private getBallParams(ballCount: number): AnimationParams {
    return {
      ballCount: ballCount, // Use the actual ball count passed in
      duration: 400,
      colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
      intensity: 0.8
    };
  }

  /**
   * Queues a single animation with multiple balls based on point value
   */
  public queueAnimation(points: number, onComplete?: () => void): void {
    // Store the final callback to be called when animation is done
    if (onComplete) {
      this.finalCallback = onComplete;
    }

    // Create a single animation with all balls for this completion
    const params = this.getBallParams(points);
    this.queue.push({ params });

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Plays the next animation in the queue
   */
  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      // Call final callback when all animations are done
      if (this.finalCallback) {
        // Delay the callback to ensure the animation has time to complete
        setTimeout(() => {
          if (this.finalCallback) {
            this.finalCallback();
            this.finalCallback = undefined;
          }
        }, 500); // Give time for the animation to finish
      }
      return;
    }

    this.isPlaying = true;
    const { params } = this.queue.shift()!;

    // Emit animation event with the full ball count
    const event = new CustomEvent('animation:play', { detail: params });
    window.dispatchEvent(event);

    // Wait for this animation to complete before starting the next one
    // The duration should match the ball animation duration plus some buffer
    const animationCompleteDelay = params.duration + 100;
    setTimeout(() => {
      this.playNext();
    }, animationCompleteDelay);
  }

  /**
   * Clears all queued animations
   */
  public clearQueue(): void {
    this.queue = [];
    this.finalCallback = undefined;
    this.isPlaying = false;
  }
}

// Create singleton instance
export const animationHandler = new AnimationHandler(); 