import React from 'react';
import WebGLFallback from './WebGLFallback';

interface WebGLErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface WebGLErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
  title?: string;
  description?: string;
}

export default class WebGLErrorBoundary extends React.Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): WebGLErrorBoundaryState {
    // Check if this is a WebGL-related error
    const errorMessage = error.message.toLowerCase();
    const isWebGLError = errorMessage.includes('webgl') || 
                        errorMessage.includes('context') ||
                        errorMessage.includes('gpu') ||
                        errorMessage.includes('graphics');

    return {
      hasError: true,
      error: isWebGLError ? error : new Error('WebGL initialization failed')
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WebGL Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Log WebGL debug information
    this.logWebGLDebugInfo(error);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private logWebGLDebugInfo(error: Error) {
    console.group('🚨 WebGL Error Debug Information');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    try {
      // Test WebGL availability
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        console.info('WebGL Context: Available');
        console.info('Renderer:', gl.getParameter(gl.RENDERER));
        console.info('Vendor:', gl.getParameter(gl.VENDOR));
        console.info('Version:', gl.getParameter(gl.VERSION));
        console.info('Shading Language Version:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
      } else {
        console.error('WebGL Context: Not Available');
      }
    } catch (testError) {
      console.error('WebGL Test Error:', testError);
    }
    
    console.info('System Info:', {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      platform: navigator.platform,
      gpu: (navigator as any).gpu ? 'Available' : 'Not available'
    });
    
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <WebGLFallback 
          title={this.props.title}
          description={this.props.description}
          showDiagnostics={true}
        />
      );
    }

    return this.props.children;
  }
}