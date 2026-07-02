declare module "react-simple-maps" {
  import type { ComponentType, ReactNode } from "react";

  export type GeographyType = {
    rsmKey: string;
    [key: string]: unknown;
  };

  export const ComposableMap: ComponentType<{
    children?: ReactNode;
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    style?: Record<string, unknown>;
    [key: string]: unknown;
  }>;

  export const Geographies: ComponentType<{
    geography: string | Record<string, unknown>;
    children: (args: { geographies: GeographyType[] }) => ReactNode;
    [key: string]: unknown;
  }>;

  export const Geography: ComponentType<{
    geography: GeographyType;
    style?: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
  }>;

  export const Line: ComponentType<{
    from: [number, number];
    to: [number, number];
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: string;
    strokeOpacity?: number;
    strokeDasharray?: string;
    style?: Record<string, unknown>;
    [key: string]: unknown;
  }>;

  export const Marker: ComponentType<{
    children?: ReactNode;
    coordinates: [number, number];
    onClick?: () => void;
    style?: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
  }>;
}
