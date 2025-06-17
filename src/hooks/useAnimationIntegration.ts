import { useCallback, useEffect, useState } from 'react';
import { useService } from '../core/di/react';
import { IAnimationService } from '../services/interfaces/IAnimationService';
import { SERVICE_TOKENS } from '../core/di/ServiceToken';

export interface AnimationIntegrationHook {
  triggerAnimation: (points: number, onComplete?: () => void) => void;
  triggerAnimationWithTaskMovement: (points: number, todoId: string, onComplete?: () => void) => void;
  isAnimating: boolean;
  queueLength: number;
  clearAnimations: () => void;
}

export function useAnimationIntegration(): AnimationIntegrationHook {
  const animationService = useService(SERVICE_TOKENS.ANIMATION_SERVICE);
  const [isAnimating, setIsAnimating] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  // Track animation state changes
  useEffect(() => {
    const updateAnimationState = () => {
      setIsAnimating(animationService.isPlaying());
      setQueueLength(animationService.getQueueLength());
    };

    // Initial state
    updateAnimationState();

    // Set up polling to check animation state
    // This could be improved with events in the future
    const interval = setInterval(updateAnimationState, 100);

    return () => clearInterval(interval);
  }, [animationService]);

  const triggerAnimation = useCallback((points: number, onComplete?: () => void) => {
    animationService.queueAnimation(points, onComplete);
    setQueueLength(animationService.getQueueLength());
  }, [animationService]);

  const triggerAnimationWithTaskMovement = useCallback((points: number, todoId: string, onComplete?: () => void) => {
    animationService.queueAnimationWithTaskMovement(points, todoId, onComplete);
    setQueueLength(animationService.getQueueLength());
  }, [animationService]);

  const clearAnimations = useCallback(() => {
    animationService.clearQueue();
    setIsAnimating(false);
    setQueueLength(0);
  }, [animationService]);

  return {
    triggerAnimation,
    triggerAnimationWithTaskMovement,
    isAnimating,
    queueLength,
    clearAnimations
  };
} 