import { RenderObject } from "./RenderObject";
import * as PIXI from "pixi.js";

export class PointObject extends RenderObject {
  cv: PIXI.Text;
  name: PIXI.Text;
  fill: PIXI.Graphics;
  m: number;
  pointContainer: PIXI.Container;
  constructor(x: number, y: number, vx: number, txt: string, cv: number) {
    super(x, y, 300, 70);
    this.cv = new PIXI.Text(cv + "連勝", {
      fontFamily: "Arial",
      fontSize: 20,
      fill: 0x888888,
    });
    this.name = new PIXI.Text(txt, {
      fontFamily: "Arial",
      fontSize: 20,
      fill: 0x999999,
    });
    this.cv.position.set(
      vx > 0 ? this.x + this.width - this.cv.width - 10 : this.x + 10,
      this.y + 5 + this.name.height
    );
    this.name.position.set(
      vx > 0 ? this.x + this.width - this.name.width - 10 : this.x + 10,
      this.y + 5
    );

    this.fill = new PIXI.Graphics();
    this.fill.beginFill(0xffffff);
    this.fill.drawRect(x, y, this.width, this.height);
    this.fill.endFill();
    this.m = 0;
    this.vx = vx;
    this.pointContainer = new PIXI.Container();
  }

  update(delta: number) {
    super.update(delta, 0, 0);
    this.pointContainer.x += this.vx;
    if (this.m >= 250) this.vx = 0;
    this.m += Math.abs(this.vx);
    if (this.time >= 100 * delta) this.isDead = true;
  }

  onStage(app: PIXI.Container) {
    this.pointContainer.addChild(this.fill);
    this.pointContainer.addChild(this.name);
    this.pointContainer.addChild(this.cv);
    app.addChild(this.pointContainer);
  }
  outStage() {
    this.pointContainer.parent.removeChild(this.pointContainer);
  }
}
