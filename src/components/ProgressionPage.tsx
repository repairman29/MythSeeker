import React from 'react';
import ProgressionDemo from './ProgressionDemo';
import Navigation from './Navigation';

interface ProgressionPageProps {
  user: any;
}

const ProgressionPage: React.FC<ProgressionPageProps> = ({ user }) => {
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

export default ProgressionPage; 