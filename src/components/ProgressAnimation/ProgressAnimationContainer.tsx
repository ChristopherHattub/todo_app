import React, { useEffect, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { AnimationParams } from '../../types/ui';

interface ProgressAnimationContainerProps {
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
  onAnimationComplete: (ballId: string) => void;
}

const AnimatedBall: React.FC<AnimatedBallProps> = ({ ball, ballSize, colors, onAnimationComplete }) => {
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
      duration: ball.isAnimating ? 400 : 0, // Reverted back to 400ms from 200ms
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

export const ProgressAnimationContainer: React.FC<ProgressAnimationContainerProps> = ({ className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [balls, setBalls] = useState<BallData[]>([]);

  // Circle parameters - 2 inch diameter = 144px at 72 DPI
  const CONTAINER_SIZE = 144;
  const CIRCLE_RADIUS = 72;
  const CIRCLE_CENTER = CONTAINER_SIZE / 2;
  // Ball diameter - 0.16 inch = ~11.5px at 72 DPI
  const BALL_SIZE = 11.5;
  const MAX_BALLS = 119;

  // Color palette for balls
  const BALL_COLORS = [
    "#EF4444", // red
    "#F59E0B", // amber
    "#10B981", // emerald
    "#3B82F6", // blue
    "#8B5CF6", // violet
    "#EC4899"  // pink
  ];

  // Generate clustered ball positions that fill the circle gradually
  const generateBallPositions = (ballCount: number): BallData[] => {
    const positions: BallData[] = [];
    const centerX = CIRCLE_CENTER;
    const centerY = CIRCLE_CENTER;
    
    // Start from center and spiral outward in layers
    let layer = 0;
    let ballIndex = 0;
    
    // First ball at center
    if (ballCount > 0) {
      positions.push({
        id: `ball-${ballIndex}`,
        colorIndex: ballIndex % BALL_COLORS.length,
        x: centerX,
        y: centerY,
        layer: 0,
        isAnimating: false,
        hasAnimated: false
      });
      ballIndex++;
    }
    
    // Add balls in concentric layers
    while (ballIndex < ballCount && layer < 20) {
      layer++;
      const layerRadius = layer * (BALL_SIZE * 0.8); // Overlap slightly for clustering effect
      
      // Calculate how many balls can fit in this layer
      const circumference = 2 * Math.PI * layerRadius;
      const ballsInLayer = Math.max(1, Math.floor(circumference / (BALL_SIZE * 0.9)));
      
      // Don't exceed the circle boundary
      if (layerRadius + BALL_SIZE/2 > CIRCLE_RADIUS) break;
      
      for (let i = 0; i < ballsInLayer && ballIndex < ballCount; i++) {
        const angle = (i / ballsInLayer) * 2 * Math.PI;
        const x = centerX + layerRadius * Math.cos(angle);
        const y = centerY + layerRadius * Math.sin(angle);
        
        // Check if position is within circle boundary
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distanceFromCenter + BALL_SIZE/2 <= CIRCLE_RADIUS) {
          positions.push({
            id: `ball-${ballIndex}`,
            colorIndex: ballIndex % BALL_COLORS.length,
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

  const startAnimation = (newBallCount: number) => {
    setBalls(prevBalls => {
      const existingBalls = prevBalls.filter(b => !b.isAnimating);
      const totalBallsAfter = existingBalls.length + newBallCount;
      const allPositions = generateBallPositions(totalBallsAfter);
      const newBalls = allPositions.slice(existingBalls.length);
      
      // Create new balls with staggered animation timing
      const staggeredBalls = newBalls.map((ball, index) => ({
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
    setIsPlaying(true);
  };

  const handleAnimationComplete = (ballId: string) => {
    setBalls(prevBalls => {
      const updatedBalls = prevBalls.map(ball => 
        ball.id === ballId ? { ...ball, isAnimating: false } : ball
      );
      
      // Check if all animations are complete
      const stillAnimating = updatedBalls.some(ball => ball.isAnimating);
      if (!stillAnimating) {
        setIsPlaying(false);
      }
      
      return updatedBalls;
    });
  };

  useEffect(() => {
    // Listen for animation play events
    const handleAnimationPlay = (event: CustomEvent<AnimationParams>) => {
      try {
        const params = event.detail;
        
        // Validate event data
        if (!params || typeof params.ballCount !== 'number' || params.ballCount < 0) {
          console.warn('Invalid animation parameters received:', params);
          return;
        }
        
        startAnimation(params.ballCount);
      } catch (error) {
        console.error('Error handling animation play event:', error);
      }
    };

    window.addEventListener('animation:play', handleAnimationPlay as EventListener);
    return () => window.removeEventListener('animation:play', handleAnimationPlay as EventListener);
  }, []);

  // Reset balls when date changes
  useEffect(() => {
    const handleDateChange = () => {
      setBalls([]);
    };

    window.addEventListener('date:changed', handleDateChange);
    return () => window.removeEventListener('date:changed', handleDateChange);
  }, []);

  // Load/save persisted balls from localStorage
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const storedBalls = localStorage.getItem(`progress-balls-${today}`);
      if (storedBalls) {
        try {
          const parsedBalls = JSON.parse(storedBalls);
          setBalls(parsedBalls.map((ball: any) => ({ 
            ...ball, 
            isAnimating: false,
            hasAnimated: true
          })));
        } catch (error) {
          console.warn('Failed to parse persisted balls JSON:', error);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted balls:', error);
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const persistedBalls = balls.filter(ball => !ball.isAnimating).map(ball => ({
      ...ball,
      hasAnimated: true
    }));
    
    try {
      localStorage.setItem(`progress-balls-${today}`, JSON.stringify(persistedBalls));
    } catch (error) {
      console.warn('Failed to save progress balls to localStorage:', error);
    }
  }, [balls]);

  // Container spring animation
  const containerSpring = useSpring({
    borderColor: isPlaying ? 'rgba(59, 130, 246, 0.6)' : 'rgba(148, 163, 184, 0.4)',
    boxShadow: isPlaying 
      ? '0 0 25px rgba(59, 130, 246, 0.4)' 
      : '0 0 15px rgba(148, 163, 184, 0.2)',
    config: config.gentle,
  });

  return (
    <div 
      data-testid="progress-animation-container"
      className={`progress-animation-container ${isPlaying ? 'loading' : 'idle'} ${className || ''}`}
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
            colors={BALL_COLORS}
            onAnimationComplete={handleAnimationComplete}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressAnimationContainer; 