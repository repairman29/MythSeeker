import React from 'react';
import Navigation from './Navigation';
import ProgressionDemo from './ProgressionDemo';

interface ProgressionWrapperProps {
  user: any;
}

const ProgressionWrapper: React.FC<ProgressionWrapperProps> = ({ user }) => {
  const handleSignOut = () => {
    // This will trigger the auth state change and redirect to landing page
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navigation user={user} onSignOut={handleSignOut} />
      <div className="flex-1 overflow-auto">
        <ProgressionDemo onBack={() => window.history.back()} />
      </div>
    </div>
  );
};

export default ProgressionWrapper; 