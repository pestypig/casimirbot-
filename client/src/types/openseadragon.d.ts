declare namespace OpenSeadragon {
  // Minimal, permissive declarations to satisfy global-namespace usage in the project.
  class Viewport {
    imageToWindowCoordinates(...args: any[]): any;
    windowToImageCoordinates(...args: any[]): any;
    getBounds(...args: any[]): any;
    [key: string]: any;
  }

  class Viewer {
    constructor(options?: any);
    viewport: Viewport;
    addHandler?(event: string, handler: any): any;
    addOverlay?(element: any, location?: any): any;
    removeOverlay?(element: any): any;
    open?(...args: any[]): any;
    [key: string]: any;
  }

  function createViewer(options?: any): Viewer;

  const OSD: any;
}

declare module 'openseadragon' {
  // Re-export the global namespace types for import style consumers.
  export import Viewer = OpenSeadragon.Viewer;
  export import Viewport = OpenSeadragon.Viewport;
  export import createViewer = OpenSeadragon.createViewer;
  const OSD: any;
  export default OSD;
}

// Also allow importing "openseadragon" via global script usage
declare global {
  interface Window {
    OpenSeadragon?: typeof OpenSeadragon;
  }
}
declare module 'openseadragon';
