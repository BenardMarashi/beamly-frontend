import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, CardBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardBody className="p-8 text-center">
              <Icon icon="lucide:alert-triangle" className="w-16 h-16 mx-auto mb-4 text-warning" />
              <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
              </p>
              
              {/* FIXED: Use import.meta.env instead of process.env for Vite */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
                    <p className="font-mono text-xs text-red-600 dark:text-red-400 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button
                  color="primary"
                  onPress={() => window.location.reload()}
                  startContent={<Icon icon="lucide:refresh-cw" />}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="bordered"
                  onPress={this.handleReset}
                  startContent={<Icon icon="lucide:rotate-ccw" />}
                >
                  Try Again
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;