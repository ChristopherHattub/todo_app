import { AnimationParams } from '../types/ui';
import { IAnimationService } from './interfaces/IAnimationService';
import { IConfigService } from './interfaces/IConfigService';

interface QueuedAnimation {
  params: AnimationParams;
  onComplete?: () => void;
}

export class AnimationHandler implements IAnimationService {
  private queue: QueuedAnimation[] = [];
  private _isPlaying = false;
  private configService?: IConfigService;

  constructor(configService?: IConfigService) {
    this.configService = configService;
  }

  /**
   * Creates animation parameters for multiple balls
   */
  private getBallParams(ballCount: number): AnimationParams {
    // Get animation config from config service if available
    const animationConfig = this.configService?.getConfig()?.animation;
    
    return {
      ballCount: ballCount,
      duration: animationConfig?.duration || 400,
      colors: animationConfig?.ballColors || ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
      intensity: 0.8 // This will remain hardcoded as it's not in the config interface
    };
  }

  /**
   * Queues a single animation with multiple balls based on point value
   */
  public queueAnimation(points: number, onComplete?: () => void): void {
    // Create a single animation with all balls for this completion
    const params = this.getBallParams(points);
    this.queue.push({ params, onComplete });

    if (!this._isPlaying) {
      this.playNext();
    }
  }

  /**
   * Queues animation with task movement (for now, same as regular animation)
   */
  public queueAnimationWithTaskMovement(points: number, todoId: string, onComplete?: () => void): void {
    // For now, implement the same as queueAnimation
    // In future this could include special effects for task completion
    this.queueAnimation(points, onComplete);
  }

  /**
   * Check if animations are currently playing
   */
  public isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Get the number of queued animations
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Set animation parameters (for configuration)
   */
  public setAnimationParams(params: Partial<AnimationParams>): void {
    // Store custom animation settings in the config service if available
    if (this.configService) {
      const currentConfig = this.configService.getConfig();
      const updatedConfig = {
        ...currentConfig,
        animation: {
          ...currentConfig.animation,
          ...params
        }
      };
      // Note: This assumes the config service has an update method
      // which might need to be added to the interface
    }
  }

  /**
   * Get animation parameters for a given point value
   */
  public getAnimationParams(points: number): AnimationParams {
    return this.getBallParams(points);
  }

  /**
   * Plays the next animation in the queue
   */
  private playNext(): void {
    if (this.queue.length === 0) {
      this._isPlaying = false;
      // Dispatch animation cycle complete event
      const event = new CustomEvent('animation:cycle-complete');
      window.dispatchEvent(event);
      return;
    }

    this._isPlaying = true;
    const { params, onComplete } = this.queue.shift()!;

    // Emit animation event with the full ball count
    const event = new CustomEvent('animation:play', { detail: params });
    window.dispatchEvent(event);

    // Wait for this animation to complete before starting the next one
    // The duration should match the ball animation duration plus some buffer
    const animationCompleteDelay = params.duration + 100;
    setTimeout(() => {
      // Call the completion callback for this specific animation
      if (onComplete) {
        try {
          onComplete();
        } catch (error) {
          console.error('Error in animation completion callback:', error);
        }
      }
      
      // Continue to next animation
      this.playNext();
    }, animationCompleteDelay);
  }

  /**
   * Clears all queued animations
   */
  public clearQueue(): void {
    this.queue = [];
    this._isPlaying = false;
    
    // Dispatch clear event
    const event = new CustomEvent('animation:cleared');
    window.dispatchEvent(event);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.clearQueue();
  }
}

// Create singleton instance for backward compatibility
export const animationHandler = new AnimationHandler(); 