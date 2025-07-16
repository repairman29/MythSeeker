import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  width = "w-full", 
  height = "h-4", 
  rounded = false,
  children 
}) => (
  <div 
    className={`animate-pulse bg-white/10 ${width} ${height} ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
  >
    {children}
  </div>
);

// Campaign Card Skeleton
export const CampaignCardSkeleton: React.FC = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
    <div className="space-y-4">
      <Skeleton height="h-6" width="w-3/4" />
      <Skeleton height="h-4" width="w-1/2" />
      <div className="space-y-2">
        <Skeleton height="h-3" width="w-full" />
        <Skeleton height="h-3" width="w-5/6" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton height="h-8" width="w-20" rounded />
        <Skeleton height="h-8" width="w-24" rounded />
      </div>
    </div>
  </div>
);

// Character Card Skeleton
export const CharacterCardSkeleton: React.FC = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton height="h-12" width="w-12" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton height="h-5" width="w-32" />
          <Skeleton height="h-4" width="w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton height="h-6" />
        <Skeleton height="h-6" />
      </div>
    </div>
  </div>
);

// Message Skeleton
export const MessageSkeleton: React.FC<{ isPlayer?: boolean }> = ({ isPlayer = false }) => (
  <div className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-3xl rounded-lg p-4 ${isPlayer ? 'bg-blue-600/30' : 'bg-white/10'}`}>
      <div className="space-y-2">
        <Skeleton height="h-4" width="w-16" />
        <Skeleton height="h-4" width="w-full" />
        <Skeleton height="h-4" width="w-3/4" />
      </div>
    </div>
  </div>
);

// Navigation Skeleton
export const NavSkeleton: React.FC = () => (
  <div className="w-20 lg:w-64 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 border-r border-white/20 flex flex-col">
    <div className="p-4 border-b border-white/20">
      <Skeleton height="h-8" width="w-full" />
    </div>
    <div className="flex-1 p-4 space-y-2">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <Skeleton height="h-6" width="w-6" />
          <Skeleton height="h-4" width="w-24" className="hidden lg:block" />
        </div>
      ))}
    </div>
  </div>
);

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center space-y-4">
      <Skeleton height="h-8" width="w-64" className="mx-auto" />
      <Skeleton height="h-4" width="w-48" className="mx-auto" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 bg-white/10 rounded-lg border border-white/20">
          <div className="space-y-3">
            <Skeleton height="h-8" width="w-8" className="mx-auto" />
            <Skeleton height="h-5" width="w-24" className="mx-auto" />
            <Skeleton height="h-4" width="w-32" className="mx-auto" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Full Page Loading Skeleton
export const FullPageSkeleton: React.FC = () => (
  <div className="main-container flex bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
    <NavSkeleton />
    <div className="flex-1 flex flex-col">
      {/* Top bar skeleton */}
      <div className="h-16 bg-black/20 border-b border-white/20 flex items-center justify-between px-6">
        <Skeleton height="h-6" width="w-32" />
        <div className="flex space-x-2">
          <Skeleton height="h-8" width="w-8" rounded />
          <Skeleton height="h-8" width="w-8" rounded />
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <DashboardSkeleton />
      </div>
    </div>
  </div>
);

export default Skeleton; 