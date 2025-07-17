import React, { useEffect } from 'react';

interface SuccessFeedbackProps {
  message: string;
  icon: React.ReactNode;
  duration: number;
  onClose: () => void;
}

const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({ message, icon, duration, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration || 2000);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-8 right-8 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3 animate-fade-in">
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold">{message}</span>
    </div>
  );
};

export default SuccessFeedback; 