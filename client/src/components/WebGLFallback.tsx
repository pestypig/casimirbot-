import React, { useEffect, useState } from 'react';
import { AlertTriangle, Monitor, Cpu, HelpCircle } from 'lucide-react';

interface WebGLCapabilities {
  hasWebGL: boolean;
  hasWebGL2: boolean;
  renderer?: string;
  vendor?: string;
  version?: string;
  error?: string;
}

function detectWebGLCapabilities(): WebGLCapabilities {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const gl2 = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) as WebGL2RenderingContext | null;
    const gl = gl2 || (canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null) || 
               (canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null);
    
    if (gl) {
      const caps: WebGLCapabilities = {
        hasWebGL: true,
        hasWebGL2: !!gl2,
        renderer: gl.getParameter(gl.RENDERER),
        vendor: gl.getParameter(gl.VENDOR),
        version: gl.getParameter(gl.VERSION)
      };
      
      // Cleanup
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      
      return caps;
    }
    
    return {
      hasWebGL: false,
      hasWebGL2: false,
      error: 'WebGL context creation failed'
    };
  } catch (error) {
    return {
      hasWebGL: false,
      hasWebGL2: false,
      error: error instanceof Error ? error.message : 'Unknown WebGL detection error'
    };
  }
}

interface WebGLFallbackProps {
  title?: string;
  description?: string;
  showDiagnostics?: boolean;
  className?: string;
}

export default function WebGLFallback({ 
  title = "WebGL Not Supported",
  description = "The Warp Render Inspector requires WebGL support.",
  showDiagnostics = true,
  className = ""
}: WebGLFallbackProps) {
  const [capabilities, setCapabilities] = useState<WebGLCapabilities | null>(null);
  
  useEffect(() => {
    const caps = detectWebGLCapabilities();
    setCapabilities(caps);
  }, []);

  const commonIssues = [
    "Headless environments or CI/CD systems",
    "Browsers with WebGL disabled",
    "Virtual machines without GPU acceleration",
    "Outdated graphics drivers",
    "Hardware acceleration disabled in browser settings"
  ];

  const troubleshootingSteps = [
    "Check if hardware acceleration is enabled in browser settings",
    "Update graphics drivers to the latest version",
    "Try a different browser (Chrome, Firefox, Edge)",
    "Ensure your system meets minimum WebGL requirements",
    "Disable browser extensions that might interfere with WebGL"
  ];

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">{title}</h3>
      </div>
      
      <p className="text-center text-red-700 dark:text-red-200 mb-6 max-w-md">
        {description}
      </p>

      {showDiagnostics && capabilities && (
        <div className="w-full max-w-2xl space-y-6">
          {/* WebGL Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">WebGL Status</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">WebGL 1.0:</span>
                <span className={capabilities.hasWebGL ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {capabilities.hasWebGL ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">WebGL 2.0:</span>
                <span className={capabilities.hasWebGL2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {capabilities.hasWebGL2 ? '✓ Available' : '✗ Not Available'}
                </span>
              </div>
              {capabilities.renderer && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Renderer:</span>
                  <span className="text-gray-900 dark:text-gray-100 text-right flex-1 ml-2">{capabilities.renderer}</span>
                </div>
              )}
              {capabilities.vendor && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vendor:</span>
                  <span className="text-gray-900 dark:text-gray-100">{capabilities.vendor}</span>
                </div>
              )}
              {capabilities.version && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Version:</span>
                  <span className="text-gray-900 dark:text-gray-100 text-right flex-1 ml-2">{capabilities.version}</span>
                </div>
              )}
              {capabilities.error && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Error:</span>
                  <span className="text-red-600 dark:text-red-400 text-right flex-1 ml-2">{capabilities.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">System Information</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Hardware Concurrency:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {navigator.hardwareConcurrency || 'Unknown'} cores
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">GPU Info:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {(navigator as any).gpu ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">User Agent:</span>
                <span className="text-gray-900 dark:text-gray-100 text-right flex-1 ml-2 break-all">
                  {navigator.userAgent.slice(0, 80)}...
                </span>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Common Causes</h4>
            </div>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {commonIssues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1 text-xs">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Troubleshooting Steps</h4>
            </div>
            <ol className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {troubleshootingSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1 text-xs font-medium">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for detecting WebGL support
export function useWebGLSupport(): WebGLCapabilities {
  const [capabilities, setCapabilities] = useState<WebGLCapabilities>({
    hasWebGL: false,
    hasWebGL2: false
  });

  useEffect(() => {
    const caps = detectWebGLCapabilities();
    setCapabilities(caps);
  }, []);

  return capabilities;
}