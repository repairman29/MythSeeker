import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Settings, ExternalLink } from 'lucide-react';

interface AIServiceStatusProps {
  onRetry?: () => void;
  className?: string;
}

type ServiceStatus = 'checking' | 'optimal' | 'degraded' | 'unavailable';

const AIServiceStatus: React.FC<AIServiceStatusProps> = ({ onRetry, className = '' }) => {
  const [status, setStatus] = useState<ServiceStatus>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Check AI service status
  const checkServiceStatus = async () => {
    setStatus('checking');
    try {
      // Simple test call to check AI service
      const response = await fetch('/api/ai-health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      if (response.ok) {
        setStatus('optimal');
        setErrorDetails('');
      } else {
        setStatus('degraded');
        setErrorDetails('AI service responding but with errors');
      }
    } catch (error) {
      setStatus('degraded');
      setErrorDetails('Using enhanced fallback responses until API keys are configured');
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkServiceStatus();
    // Check every 5 minutes
    const interval = setInterval(checkServiceStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'optimal':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-400" />,
          title: 'AI Service Optimal',
          message: 'Full AI capabilities available',
          bgColor: 'bg-green-500/10 border-green-500/20',
          textColor: 'text-green-300'
        };
      case 'degraded':
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-400" />,
          title: 'AI Service Degraded',
          message: errorDetails || 'Using enhanced fallback responses',
          bgColor: 'bg-yellow-500/10 border-yellow-500/20',
          textColor: 'text-yellow-300'
        };
      case 'unavailable':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          title: 'AI Service Unavailable',
          message: 'Please try again later',
          bgColor: 'bg-red-500/10 border-red-500/20',
          textColor: 'text-red-300'
        };
      default:
        return {
          icon: <Settings className="w-4 h-4 text-blue-400 animate-spin" />,
          title: 'Checking AI Service',
          message: 'Please wait...',
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          textColor: 'text-blue-300'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Only show if not optimal
  if (status === 'optimal') {
    return null;
  }

  return (
    <div className={`${statusConfig.bgColor} border rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-3">
        {statusConfig.icon}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${statusConfig.textColor}`}>
            {statusConfig.title}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {statusConfig.message}
          </div>
          {status === 'degraded' && (
            <div className="mt-2 text-xs text-gray-500">
              <div className="mb-1">
                ℹ️ The game is fully functional with intelligent responses.
              </div>
              <div className="mb-2">
                For enhanced AI quality, administrator setup is needed.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRetry}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Retry Connection
                </button>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500">
                  Last checked: {lastCheck.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIServiceStatus; 