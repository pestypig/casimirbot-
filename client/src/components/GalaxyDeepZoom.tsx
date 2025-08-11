import * as React from "react";
import OpenSeadragon from "openseadragon";

type Props = {
  dziUrl: string;                 // e.g. "/galaxy_tiles.dzi"
  width?: number; height?: number;
  onViewerReady?: (viewer: OpenSeadragon.Viewer) => void;
  onViewportChange?: (viewport: OpenSeadragon.Viewport) => void;
};

export function GalaxyDeepZoom({ 
  dziUrl, 
  width = 1200, 
  height = 650, 
  onViewerReady,
  onViewportChange 
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<OpenSeadragon.Viewer | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    
    const viewer = OpenSeadragon({
      element: ref.current,
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: dziUrl,
      showNavigator: true,
      navigatorSizeRatio: 0.15,
      defaultZoomLevel: 0,        // OSD will auto-fit
      minZoomLevel: 0.1,
      maxZoomLevel: 20,
      animationTime: 0.8,
      gestureSettingsMouse: { 
        clickToZoom: false, 
        dblClickToZoom: true,
        scrollToZoom: true
      },
      visibilityRatio: 0.5,
      constrainDuringPan: true,
    });
    
    viewerRef.current = viewer;

    const handleUpdate = () => {
      if (onViewportChange) {
        onViewportChange(viewer.viewport);
      }
    };

    viewer.addHandler("animation", handleUpdate);
    viewer.addHandler("open", () => {
      if (onViewerReady) {
        onViewerReady(viewer);
      }
      handleUpdate();
    });
    viewer.addHandler("zoom", handleUpdate);
    viewer.addHandler("pan", handleUpdate);

    return () => { 
      viewer.destroy(); 
      viewerRef.current = null; 
    };
  }, [dziUrl, onViewerReady, onViewportChange]);

  return (
    <div 
      ref={ref} 
      style={{ width, height }} 
      className="rounded-lg overflow-hidden border bg-black"
    />
  );
}