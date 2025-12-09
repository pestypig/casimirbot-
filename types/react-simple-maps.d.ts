declare module "react-simple-maps" {
  import * as React from "react";

  export type GeographyDatum = {
    rsmKey: string;
    [key: string]: unknown;
  };

  export type GeographiesChildrenProps = {
    geographies: GeographyDatum[];
    path?: unknown;
  };

  export type GeographiesProps = {
    geography: string | object;
    children?: (props: GeographiesChildrenProps) => React.ReactNode;
  };

  export type StatefulStyle = {
    default?: React.CSSProperties;
    hover?: React.CSSProperties;
    pressed?: React.CSSProperties;
  };

  export type GeographyProps = {
    geography: GeographyDatum | object;
    style?: StatefulStyle;
  };

  export type MarkerProps = React.SVGProps<SVGGElement> & {
    coordinates: [number, number];
    style?: StatefulStyle | React.CSSProperties;
  };

  export type ComposableMapProps = React.SVGProps<SVGSVGElement> & {
    projection?: string | ((width?: number, height?: number) => unknown);
    projectionConfig?: Record<string, unknown>;
    style?: React.CSSProperties;
    width?: number;
    height?: number;
  };

  export const ComposableMap: React.ComponentType<ComposableMapProps>;
  export const Geographies: React.ComponentType<GeographiesProps>;
  export const Geography: React.ComponentType<GeographyProps>;
  export const Marker: React.ComponentType<MarkerProps>;
}
