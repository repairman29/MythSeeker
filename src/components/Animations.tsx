import React, { useEffect, useRef, useState } from 'react';

// Particle effect for special events
export const ParticleEffect: React.FC<{
  type: 'level-up' | 'achievement' | 'combat' | 'magic' | 'heal' | 'damage';
  position: { x: number; y: number };
  onComplete?: () => void;
}> = ({ type, position, onComplete }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }>>([]);

  useEffect(() => {
    const particleCount = type === 'level-up' ? 20 : type === 'achievement' ? 15 : 10;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: position.x,
      y: position.y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 1,
      maxLife: Math.random() * 0.5 + 0.5
    }));

    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1, // gravity
          life: p.life - 0.02
        })).filter(p => p.life > 0);

        if (updated.length === 0) {
          clearInterval(interval);
          onComplete?.();
        }
        return updated;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [type, position, onComplete]);

  const getParticleColor = () => {
    switch (type) {
      case 'level-up': return 'text-yellow-400';
      case 'achievement': return 'text-purple-400';
      case 'combat': return 'text-red-400';
      case 'magic': return 'text-blue-400';
      case 'heal': return 'text-green-400';
      case 'damage': return 'text-red-500';
      default: return 'text-white';
    }
  };

  const getParticleSymbol = () => {
    switch (type) {
      case 'level-up': return '⭐';
      case 'achievement': return '🏆';
      case 'combat': return '⚔️';
      case 'magic': return '✨';
      case 'heal': return '💚';
      case 'damage': return '💥';
      default: return '•';
    }
  };

  return (
    <div className="fixed pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`absolute ${getParticleColor()} text-lg transition-opacity duration-200`}
          style={{
            left: particle.x,
            top: particle.y,
            opacity: particle.life,
            transform: `scale(${particle.life})`
          }}
        >
          {getParticleSymbol()}
        </div>
      ))}
    </div>
  );
};

// Floating text animation
export const FloatingText: React.FC<{
  text: string;
  type: 'damage' | 'heal' | 'xp' | 'gold' | 'info';
  position: { x: number; y: number };
  onComplete?: () => void;
}> = ({ text, type, position, onComplete }) => {
  const [opacity, setOpacity] = useState(1);
  const [y, setY] = useState(position.y);

  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        onComplete?.();
        return;
      }

      setOpacity(1 - progress);
      setY(position.y - progress * 50);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [position, onComplete]);

  const getTextColor = () => {
    switch (type) {
      case 'damage': return 'text-red-400';
      case 'heal': return 'text-green-400';
      case 'xp': return 'text-yellow-400';
      case 'gold': return 'text-yellow-500';
      case 'info': return 'text-blue-400';
      default: return 'text-white';
    }
  };

  return (
    <div
      className={`fixed pointer-events-none z-40 font-bold text-lg ${getTextColor()}`}
      style={{
        left: position.x,
        top: y,
        opacity,
        transform: 'translateX(-50%)'
      }}
    >
      {text}
    </div>
  );
};

// Screen transition overlay
export const ScreenTransition: React.FC<{
  isActive: boolean;
  type: 'fade' | 'slide' | 'zoom';
  direction?: 'left' | 'right' | 'up' | 'down';
  onComplete?: () => void;
}> = ({ isActive, type, direction = 'left', onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive && !isVisible) return null;

  const getTransitionClasses = () => {
    switch (type) {
      case 'fade':
        return 'opacity-0 bg-black';
      case 'slide':
        const directionClasses = {
          left: 'translate-x-full',
          right: '-translate-x-full',
          up: 'translate-y-full',
          down: '-translate-y-full'
        };
        return `${directionClasses[direction]} bg-gradient-to-br from-blue-900 to-purple-900`;
      case 'zoom':
        return 'scale-0 bg-black';
      default:
        return 'opacity-0 bg-black';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-500 ease-in-out ${getTransitionClasses()}`}
      style={{
        transform: isVisible ? 'none' : undefined
      }}
    />
  );
};

// Loading spinner with custom styling
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'white';
  text?: string;
}> = ({ size = 'md', color = 'blue', text }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    white: 'border-white'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`${sizeClasses[size]} border-2 border-t-transparent rounded-full animate-spin ${colorClasses[color]}`}
      />
      {text && (
        <p className="text-sm text-gray-300 animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Pulse effect for important elements
export const PulseEffect: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}> = ({ children, isActive, color = 'blue' }) => {
  const colorClasses = {
    blue: 'ring-blue-400',
    green: 'ring-green-400',
    red: 'ring-red-400',
    yellow: 'ring-yellow-400'
  };

  return (
    <div className={`relative ${isActive ? `animate-pulse ring-2 ${colorClasses[color]} ring-opacity-50` : ''}`}>
      {children}
    </div>
  );
};

// Shake effect for damage or errors
export const ShakeEffect: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
}> = ({ children, isActive }) => {
  return (
    <div className={`${isActive ? 'animate-shake' : ''}`}>
      {children}
    </div>
  );
};

// Bounce effect for positive feedback
export const BounceEffect: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
}> = ({ children, isActive }) => {
  return (
    <div className={`${isActive ? 'animate-bounce' : ''}`}>
      {children}
    </div>
  );
};

// Fade in/out effect
export const FadeEffect: React.FC<{
  children: React.ReactNode;
  isVisible: boolean;
  duration?: number;
}> = ({ children, isVisible, duration = 300 }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-opacity duration-${duration}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {children}
    </div>
  );
};

// Progress bar with animation
export const AnimatedProgressBar: React.FC<{
  current: number;
  max: number;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  showText?: boolean;
  height?: 'sm' | 'md' | 'lg';
}> = ({ current, max, color = 'blue', showText = true, height = 'md' }) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-700 rounded-full ${heightClasses[height]} overflow-hidden`}>
        <div
          className={`${colorClasses[color]} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && (
        <div className="text-xs text-gray-300 mt-1">
          {current} / {max} ({Math.round(percentage)}%)
        </div>
      )}
    </div>
  );
};

// Custom CSS animations
export const AnimationStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }
      
      .animate-shake {
        animation: shake 0.5s ease-in-out;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px currentColor; }
        50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
      }
      
      .animate-glow {
        animation: glow 2s ease-in-out infinite;
      }
    `
  }} />
);

export default {
  ParticleEffect,
  FloatingText,
  ScreenTransition,
  LoadingSpinner,
  PulseEffect,
  ShakeEffect,
  BounceEffect,
  FadeEffect,
  AnimatedProgressBar,
  AnimationStyles
}; 