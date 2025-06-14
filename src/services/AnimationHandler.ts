import { AnimationParams } from '../types/ui';

interface QueuedAnimation {
  params: AnimationParams;
  onComplete?: () => void;
}

export class AnimationHandler {
  private queue: QueuedAnimation[] = [];
  private isPlaying = false;

  /**
   * Maps point values to animation parameters
   */
  private getAnimationParams(points: number): AnimationParams {
    // Base parameters
    const baseDuration = 1200; // 1.2 seconds
    const baseIntensity = 0.8;

    // Scale ball count based on points (1-5 points = 1-5 balls)
    const ballCount = Math.min(Math.max(points, 1), 5);

    // Adjust duration based on points
    const duration = baseDuration + (points * 100);

    // Adjust intensity based on points (higher points = more intense)
    const intensity = Math.min(baseIntensity + (points * 0.05), 1);

    return {
      ballCount,
      duration,
      colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
      intensity
    };
  }

  /**
   * Queues a new animation based on point value
   */
  public queueAnimation(points: number, onComplete?: () => void): void {
    const params = this.getAnimationParams(points);
    this.queue.push({ params, onComplete });

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
      return;
    }

    this.isPlaying = true;
    const { params, onComplete } = this.queue.shift()!;

    // Emit animation event
    const event = new CustomEvent('animation:play', { detail: params });
    window.dispatchEvent(event);

    // Set up completion handler
    const handleComplete = () => {
      onComplete?.();
      this.playNext();
    };

    // Listen for animation completion
    const completeHandler = () => {
      window.removeEventListener('animation:complete', completeHandler);
      handleComplete();
    };

    window.addEventListener('animation:complete', completeHandler);
  }

  /**
   * Clears all queued animations
   */
  public clearQueue(): void {
    this.queue = [];
    this.isPlaying = false;
  }
}

// Create singleton instance
export const animationHandler = new AnimationHandler(); 