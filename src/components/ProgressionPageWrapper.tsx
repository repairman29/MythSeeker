import React from 'react';
import ProgressionDemo from './ProgressionDemo';

interface ProgressionPageWrapperProps {
  user?: any;
}

const ProgressionPageWrapper: React.FC<ProgressionPageWrapperProps> = ({ user }) => {
  return (
    <div className="min-h-screen">
      <ProgressionDemo 
        onBack={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = '/dashboard';
          }
        }} 
      />
    </div>
  );
};

export default ProgressionPageWrapper; 