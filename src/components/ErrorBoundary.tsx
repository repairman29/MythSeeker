import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console and any external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to Firebase Analytics or other service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true
      });
    }

    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-red-800 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 text-center">
            <div className="text-red-400 mb-6">
              <AlertTriangle size={64} className="mx-auto" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h1>
            <p className="text-red-200 mb-6">
              We encountered an unexpected error. Don't worry, your progress is safe!
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-red-300 cursor-pointer mb-2">Error Details (Development)</summary>
                <div className="bg-black/20 rounded-lg p-4 text-xs text-red-200 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.resetError}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw size={20} />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center justify-center space-x-2"
              >
                <Home size={20} />
                <span>Go Home</span>
              </button>
            </div>

            <p className="text-red-300 text-sm mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to catch errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, resetError };
};

// Higher-order component for error handling
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary; 