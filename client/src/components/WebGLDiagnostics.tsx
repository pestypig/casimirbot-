
export default function WebGLDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    const runDiagnostics = () => {
      const results: any = {
        timestamp: new Date().toISOString(),
        environment: {
          isReplit: window.location?.hostname?.includes('replit') || window.location?.hostname?.includes('repl.co'),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency,
          onLine: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled
        },
        webgl: {
          webglContext: !!window.WebGLRenderingContext,
          webgl2Context: !!window.WebGL2RenderingContext,
          canvas: !!window.HTMLCanvasElement
        }
      };

      // Test WebGL context creation
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;

        const gl2 = canvas.getContext('webgl2');
        const gl = gl2 || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (gl) {
          results.webgl.contextCreated = true;
          results.webgl.version = gl2 ? '2.0' : '1.0';
          results.webgl.renderer = gl.getParameter(gl.RENDERER);
          results.webgl.vendor = gl.getParameter(gl.VENDOR);
          results.webgl.glVersion = gl.getParameter(gl.VERSION);
          results.webgl.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
          results.webgl.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          results.webgl.maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);

          // Test shader compilation
          try {
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, 'attribute vec4 a_position; void main() { gl_Position = a_position; }');
            gl.compileShader(vertexShader);
            results.webgl.shaderCompilation = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
          } catch (shaderError) {
            results.webgl.shaderCompilation = false;
            results.webgl.shaderError = shaderError.message;
          }
        } else {
          results.webgl.contextCreated = false;
          results.webgl.error = 'Context creation failed';
        }
      } catch (error) {
        results.webgl.contextCreated = false;
        results.webgl.error = error.message;
      }

      setDiagnostics(results);
    };

    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return <div className="p-4">Running WebGL diagnostics...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">WebGL Diagnostics</h3>
      <pre className="text-xs overflow-auto bg-white dark:bg-gray-900 p-3 rounded">
        {JSON.stringify(diagnostics, null, 2)}
      </pre>
      
      {diagnostics.environment.isReplit && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Replit Environment Detected:</strong> If WebGL is not working, try refreshing the page or opening in a new tab.
          </p>
        </div>
      )}
    </div>
  );
}
