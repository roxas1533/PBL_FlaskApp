import * as PIXI from "pixi.js";

export class GameObject {
  public isDead: boolean;
  public vx: number;
  public vy: number;
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {
    this.vx = 0;
    this.vy = 0;
    this.isDead = false;
  }
}
//abstruct
export class RenderObject extends GameObject {
  public time: number;
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {
    super(x, y, width, height);
    this.time = 0;
  }
  update(delta: number, offsetX: number, offsetY: number) {
    this.time += delta;
  }
  onStage(app: PIXI.Container) {}
  outStage() {}
  getID(): number {
    return 0;
  }
  syncPosition(b: any) {}
}
