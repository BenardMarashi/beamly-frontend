import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';

interface Props {
  children: ReactNode;
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
    return { hasError: true, error, errorInfo: null };
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
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardBody className="text-center py-12 px-6">
              <Icon 
                icon="solar:danger-triangle-bold-duotone" 
                className="text-6xl text-danger mx-auto mb-4" 
              />
              <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                We're sorry for the inconvenience. An unexpected error has occurred.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 text-left">
                  <details className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-xs overflow-auto">
                      <code>{this.state.error.toString()}</code>
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-xs overflow-auto mt-2">
                        <code>{this.state.errorInfo.componentStack}</code>
                      </pre>
                    )}
                  </details>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button 
                  color="primary" 
                  onClick={this.handleReset}
                  startContent={<Icon icon="solar:home-2-bold-duotone" />}
                >
                  Go to Home
                </Button>
                <Button 
                  variant="flat"
                  onClick={() => window.location.reload()}
                  startContent={<Icon icon="solar:refresh-bold-duotone" />}
                >
                  Refresh Page
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