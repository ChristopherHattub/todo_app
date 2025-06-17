import React, { useEffect, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { AnimationParams } from '../../types/ui';

export interface CircleFillAnimationProps {
  /** Triggers a ball drop animation with the specified count */
  onBallDrop?: () => void;
  /** Number of balls to display in this animation cycle */
  ballCount: number;
  /** Whether animations are currently playing */
  isAnimating: boolean;
  /** Animation parameters for this cycle */
  animationParams: AnimationParams;
  /** Callback when a single ball animation completes */
  onAnimationComplete?: (ballId: string) => void;
  /** Callback when all animations in the cycle complete */
  onCycleComplete?: () => void;
  /** Optional className for styling */
  className?: string;
}

interface BallData {
  id: string;
  colorIndex: number;
  x: number;
  y: number;
  layer: number;
  isAnimating: boolean;
  hasAnimated?: boolean;
}

interface AnimatedBallProps {
  ball: BallData;
  ballSize: number;
  colors: string[];
  duration: number;
  onAnimationComplete: (ballId: string) => void;
}

const AnimatedBall: React.FC<AnimatedBallProps> = ({ 
  ball, 
  ballSize, 
  colors, 
  duration,
  onAnimationComplete 
}) => {
  const [animationStarted, setAnimationStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(ball.hasAnimated || false);

  const { scale, opacity, filterBrightness } = useSpring({
    from: {
      scale: ball.hasAnimated ? 1 : 0,
      opacity: ball.hasAnimated ? 1 : 0,
      filterBrightness: ball.hasAnimated ? 1 : 2,
    },
    to: {
      scale: ball.isAnimating || hasCompleted ? 1 : 0,
      opacity: ball.isAnimating || hasCompleted ? 1 : 0,
      filterBrightness: ball.isAnimating ? 1.2 : (hasCompleted ? 1 : 2),
    },
    config: {
      ...config.wobbly,
      duration: ball.isAnimating ? duration : 0,
    },
    onStart: () => {
      if (ball.isAnimating && !animationStarted) {
        setAnimationStarted(true);
      }
    },
    onRest: () => {
      if (ball.isAnimating && animationStarted && !hasCompleted) {
        setHasCompleted(true);
        onAnimationComplete(ball.id);
      }
    },
  });

  return (
    <animated.div
      className="animation-ball"
      style={{
        position: 'absolute',
        left: ball.x - ballSize / 2,
        top: ball.y - ballSize / 2,
        width: ballSize,
        height: ballSize,
        backgroundColor: colors[ball.colorIndex],
        borderRadius: '50%',
        boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2), 0 0 8px ${colors[ball.colorIndex]}40`,
        transform: scale.to(s => `scale(${s})`),
        opacity,
        filter: filterBrightness.to(b => `brightness(${b}) saturate(1.4)`),
        zIndex: ball.isAnimating ? 100 : 1,
      }}
    />
  );
};

export const CircleFillAnimation: React.FC<CircleFillAnimationProps> = ({
  ballCount,
  isAnimating,
  animationParams,
  onAnimationComplete,
  onCycleComplete,
  className
}) => {
  const [balls, setBalls] = useState<BallData[]>([]);

  // Circle parameters - 2 inch diameter = 144px at 72 DPI
  const CONTAINER_SIZE = 144;
  const CIRCLE_RADIUS = 72;
  const CIRCLE_CENTER = CONTAINER_SIZE / 2;
  // Ball diameter - 0.16 inch = ~11.5px at 72 DPI
  const BALL_SIZE = 11.5;

  // Generate clustered ball positions that fill the circle gradually
  const generateBallPositions = (totalBalls: number): BallData[] => {
    const positions: BallData[] = [];
    const centerX = CIRCLE_CENTER;
    const centerY = CIRCLE_CENTER;
    
    // Start from center and spiral outward in layers
    let layer = 0;
    let ballIndex = 0;
    
    // First ball at center
    if (totalBalls > 0) {
      positions.push({
        id: `ball-${ballIndex}`,
        colorIndex: ballIndex % animationParams.colors.length,
        x: centerX,
        y: centerY,
        layer: 0,
        isAnimating: false,
        hasAnimated: false
      });
      ballIndex++;
    }
    
    // Add balls in concentric layers
    while (ballIndex < totalBalls && layer < 20) {
      layer++;
      const layerRadius = layer * (BALL_SIZE * 0.8); // Overlap slightly for clustering effect
      
      // Calculate how many balls can fit in this layer
      const circumference = 2 * Math.PI * layerRadius;
      const ballsInLayer = Math.max(1, Math.floor(circumference / (BALL_SIZE * 0.9)));
      
      // Don't exceed the circle boundary
      if (layerRadius + BALL_SIZE/2 > CIRCLE_RADIUS) break;
      
      for (let i = 0; i < ballsInLayer && ballIndex < totalBalls; i++) {
        const angle = (i / ballsInLayer) * 2 * Math.PI;
        const x = centerX + layerRadius * Math.cos(angle);
        const y = centerY + layerRadius * Math.sin(angle);
        
        // Check if position is within circle boundary
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distanceFromCenter + BALL_SIZE/2 <= CIRCLE_RADIUS) {
          positions.push({
            id: `ball-${ballIndex}`,
            colorIndex: ballIndex % animationParams.colors.length,
            x,
            y,
            layer,
            isAnimating: false,
            hasAnimated: false
          });
          ballIndex++;
        }
      }
    }
    
    return positions;
  };

  // Start animation when triggered
  const startAnimation = (newBallCount: number) => {
    setBalls(prevBalls => {
      const existingBalls = prevBalls.filter(b => !b.isAnimating);
      const totalBallsAfter = existingBalls.length + newBallCount;
      const allPositions = generateBallPositions(totalBallsAfter);
      const newBalls = allPositions.slice(existingBalls.length);
      
      // Create new balls with staggered animation timing
      const staggeredBalls = newBalls.map((ball) => ({
        ...ball,
        isAnimating: false, // Start as not animating
        hasAnimated: false
      }));
      
      // Start the first ball immediately and schedule the rest
      if (staggeredBalls.length > 0) {
        staggeredBalls[0].isAnimating = true;
        
        // Schedule remaining balls to start with staggered timing
        staggeredBalls.slice(1).forEach((ball, index) => {
          setTimeout(() => {
            setBalls(currentBalls => 
              currentBalls.map(b => 
                b.id === ball.id ? { ...b, isAnimating: true } : b
              )
            );
          }, (index + 1) * 180); // 180ms delay between each ball (45% of 400ms duration)
        });
      }
      
      return [...existingBalls, ...staggeredBalls];
    });
  };

  // Handle individual ball animation completion
  const handleBallAnimationComplete = (ballId: string) => {
    setBalls(prevBalls => {
      const updatedBalls = prevBalls.map(ball => 
        ball.id === ballId ? { ...ball, isAnimating: false } : ball
      );
      
      // Check if all animations are complete
      const stillAnimating = updatedBalls.some(ball => ball.isAnimating);
      if (!stillAnimating && onCycleComplete) {
        onCycleComplete();
      }
      
      return updatedBalls;
    });

    if (onAnimationComplete) {
      onAnimationComplete(ballId);
    }
  };

  // Trigger animation when ballCount changes
  useEffect(() => {
    if (ballCount > 0) {
      startAnimation(ballCount);
    }
  }, [ballCount]);

  // Container spring animation
  const containerSpring = useSpring({
    borderColor: isAnimating ? 'rgba(59, 130, 246, 0.6)' : 'rgba(148, 163, 184, 0.4)',
    boxShadow: isAnimating 
      ? '0 0 25px rgba(59, 130, 246, 0.4)' 
      : '0 0 15px rgba(148, 163, 184, 0.2)',
    config: config.gentle,
  });

  return (
    <div 
      data-testid="circle-fill-animation"
      className={`circle-fill-animation ${isAnimating ? 'loading' : 'idle'} ${className || ''}`}
    >
      <div 
        className="animation-wrapper" 
        style={{ 
          position: 'relative', 
          width: CONTAINER_SIZE, 
          height: CONTAINER_SIZE,
          margin: '0 auto'
        }}
      >
        {/* Circle boundary with spring animation */}
        <animated.div 
          className="circle-boundary"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CONTAINER_SIZE,
            height: CONTAINER_SIZE,
            border: '2px solid',
            borderRadius: '50%',
            ...containerSpring,
          }}
        />
        
        {/* All balls - both persisted and animating */}
        {balls.map((ball) => (
          <AnimatedBall
            key={ball.id}
            ball={ball}
            ballSize={BALL_SIZE}
            colors={animationParams.colors}
            duration={animationParams.duration}
            onAnimationComplete={handleBallAnimationComplete}
          />
        ))}
      </div>
    </div>
  );
}; 