import React from 'react';

// Fade In Animation
export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <div 
    className="animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// Slide In Animation
export const SlideIn: React.FC<{ 
  children: React.ReactNode; 
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}> = ({ children, direction = 'left', delay = 0 }) => (
  <div 
    className={`animate-slide-in-${direction}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// Pulse Animation
export const Pulse: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="animate-pulse">
    {children}
  </div>
);

// Loading Spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-blue-400 border-t-transparent ${sizeClasses[size]}`} />
  );
};

// Page Transition
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="animate-page-transition">
    {children}
  </div>
);

// Hover Effect
export const HoverEffect: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`transition-all duration-300 hover:scale-105 hover:shadow-lg ${className}`}>
    {children}
  </div>
);

// Typing Effect
export const TypingEffect: React.FC<{ 
  text: string;
  speed?: number;
  className?: string;
}> = ({ text, speed = 50, className = '' }) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={`${className}`}>
      {displayText}
      <span className="animate-blink">|</span>
    </span>
  );
};

// Floating Animation
export const Floating: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="animate-float">
    {children}
  </div>
);

// Shake Animation
export const Shake: React.FC<{ children: React.ReactNode; trigger?: boolean }> = ({ children, trigger = false }) => (
  <div className={trigger ? 'animate-shake' : ''}>
    {children}
  </div>
);

// Glow Effect
export const Glow: React.FC<{ 
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}> = ({ children, color = 'blue' }) => {
  const glowColors = {
    blue: 'shadow-blue-500/50',
    green: 'shadow-green-500/50',
    purple: 'shadow-purple-500/50',
    red: 'shadow-red-500/50',
    yellow: 'shadow-yellow-500/50'
  };

  return (
    <div className={`shadow-lg ${glowColors[color]} transition-shadow duration-300`}>
      {children}
    </div>
  );
}; 