import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationParams } from '../../types/ui';
import { animationHandler } from '../../services/AnimationHandler';

interface ProgressAnimationContainerProps {
  className?: string;
}

export const ProgressAnimationContainer: React.FC<ProgressAnimationContainerProps> = ({ className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentParams, setCurrentParams] = useState<AnimationParams | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleAnimationComplete = () => {
    if (isCompleting) return; // Prevent infinite recursion
    setIsCompleting(true);
    setIsPlaying(false);
    setCurrentParams(null);
    setIsCompleting(false);
  };

  useEffect(() => {
    // Listen for animation play events
    const handleAnimationPlay = (event: CustomEvent<AnimationParams>) => {
      setCurrentParams(event.detail);
      setIsPlaying(true);
    };

    window.addEventListener('animation:play', handleAnimationPlay as EventListener);
    window.addEventListener('animation:complete', handleAnimationComplete);

    // Cleanup
    return () => {
      window.removeEventListener('animation:play', handleAnimationPlay as EventListener);
      window.removeEventListener('animation:complete', handleAnimationComplete);
      animationHandler.clearQueue();
    };
  }, []);

  return (
    <div 
      data-testid="progress-animation-container"
      className={`progress-animation-container ${className || ''}`}
    >
      <AnimatePresence>
        {isPlaying && currentParams && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative w-[240px] h-[240px] mx-auto"
          >
            <div 
              className="absolute inset-0 rounded-full overflow-hidden shadow-lg"
              style={{ 
                background: 'radial-gradient(circle, #f0f9ff 0%, #e1f5fe 70%, #c8e6fc 100%)',
                border: '3px solid #b3e5fc'
              }}
            >
              {Array.from({ length: currentParams.ballCount }).map((_, index) => (
                <motion.div
                  key={index}
                  className="absolute rounded-full shadow-md"
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: currentParams.colors[index % currentParams.colors.length],
                    top: 0,
                    left: '50%',
                    x: '-50%',
                    zIndex: index
                  }}
                  initial={{ y: -240, opacity: 0, scale: 1.1 }}
                  animate={{ 
                    y: 120 + (index * 10),
                    opacity: 1,
                    scale: 1
                  }}
                  transition={{ 
                    type: "spring",
                    damping: 12,
                    mass: 0.8 + (Math.random() * 0.4),
                    bounce: 0.5,
                    duration: currentParams.duration / 1000,
                    delay: index * 0.1,
                    velocity: 20
                  }}
                  onAnimationComplete={() => {
                    if (index === currentParams.ballCount - 1) {
                      handleAnimationComplete();
                    }
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProgressAnimationContainer; 