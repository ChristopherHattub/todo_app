import React, { useEffect, useState, useCallback } from 'react';
import { useService } from '../../core/di/react';
import { IAnimationService } from '../../services/interfaces/IAnimationService';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';
import { AnimationParams } from '../../types/ui';
import { ProgressAnimationContainer } from '../ProgressAnimation/ProgressAnimationContainer';

export interface AnimationContainerProps {
  className?: string;
}

export interface AnimationState {
  isPlaying: boolean;
  queueLength: number;
  currentAnimation?: AnimationParams;
}

export const AnimationContainer: React.FC<AnimationContainerProps> = ({ className }) => {
  const animationService = useService(SERVICE_TOKENS.ANIMATION_SERVICE);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    queueLength: 0
  });

  // Update animation state from service
  const updateAnimationState = useCallback(() => {
    setAnimationState({
      isPlaying: animationService.isPlaying(),
      queueLength: animationService.getQueueLength()
    });
  }, [animationService]);

  // Listen for animation events from the service
  useEffect(() => {
    const handleAnimationPlay = (event: CustomEvent<AnimationParams>) => {
      setAnimationState(prev => ({
        ...prev,
        isPlaying: true,
        currentAnimation: event.detail
      }));
    };

    const handleAnimationComplete = () => {
      updateAnimationState();
    };

    // Listen to the custom events dispatched by the animation service
    window.addEventListener('animation:play', handleAnimationPlay as EventListener);
    window.addEventListener('animation:complete', handleAnimationComplete);

    // Also poll state changes as a fallback
    const interval = setInterval(updateAnimationState, 200);

    return () => {
      window.removeEventListener('animation:play', handleAnimationPlay as EventListener);
      window.removeEventListener('animation:complete', handleAnimationComplete);
      clearInterval(interval);
    };
  }, [updateAnimationState]);

  // Handle animation completion from the presentation component
  const handleAnimationComplete = useCallback(() => {
    updateAnimationState();
    
    // Dispatch completion event for the service to handle
    const event = new CustomEvent('animation:complete');
    window.dispatchEvent(event);
  }, [updateAnimationState]);

  return (
    <ProgressAnimationContainer 
      className={className}
      onAnimationComplete={handleAnimationComplete}
    />
  );
}; 