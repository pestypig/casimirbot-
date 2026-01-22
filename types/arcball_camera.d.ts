declare module "arcball_camera" {
  export class ArcballCamera {
    camera: Float32Array;
    constructor(
      eye: Float32Array,
      center: Float32Array,
      up: Float32Array,
      radius: number,
      screen: [number, number]
    );
    eyePos(): Float32Array;
    rotate(prev: [number, number], cur: [number, number]): void;
    pan(delta: [number, number]): void;
    zoom(amount: number): void;
  }
}
