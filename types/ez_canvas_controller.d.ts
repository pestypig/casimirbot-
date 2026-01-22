declare module "ez_canvas_controller" {
  export class Controller {
    mousemove?: (prev: [number, number], cur: [number, number], evt: MouseEvent) => void;
    wheel?: (amt: number) => void;
    pinch?: (amt: number) => void;
    twoFingerDrag?: (drag: [number, number]) => void;
    registerForCanvas(canvas: HTMLCanvasElement): void;
  }
}
