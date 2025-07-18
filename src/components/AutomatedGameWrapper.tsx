import React from 'react';
import { AutomatedGameManager } from './AutomatedGameManager';
import Navigation from './Navigation';

interface AutomatedGameWrapperProps {
  user: any;
}

export const AutomatedGameWrapper: React.FC<AutomatedGameWrapperProps> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-auto">
        <AutomatedGameManager />
      </div>
    </div>
  );
}; 