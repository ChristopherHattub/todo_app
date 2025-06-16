import { AnimationParams } from '../../types/ui';

export interface IAnimationService {
  // Animation Management
  queueAnimation(points: number, onComplete?: () => void): void;
  queueAnimationWithTaskMovement(points: number, todoId: string, onComplete?: () => void): void;
  clearQueue(): void;

  // Animation State
  isPlaying(): boolean;
  getQueueLength(): number;

  // Configuration
  setAnimationParams(params: Partial<AnimationParams>): void;
  getAnimationParams(points: number): AnimationParams;

  // Lifecycle
  dispose?(): void;
} 