import React, { Component, ReactNode } from 'react';
import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <Icon 
              icon="lucide:alert-triangle" 
              className="text-red-500 mb-4 mx-auto" 
              width={64} 
            />
            <h1 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page or go back to the homepage.
            </p>
            <div className="space-y-3">
              <Button
                color="primary"
                onClick={this.handleReset}
                fullWidth
              >
                Go to Homepage
              </Button>
              <Button
                variant="bordered"
                onClick={() => window.location.reload()}
                fullWidth
              >
                Refresh Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs text-gray-400 overflow-auto p-3 bg-gray-900 rounded">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}