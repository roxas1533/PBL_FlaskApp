import { RenderObject } from "./RenderObject";
import * as PIXI from "pixi.js";

export class DamageNum extends RenderObject {
  text: PIXI.Text;
  private g: number;
  constructor(x: number, y: number, num: number) {
    super(x, y, 0, 0);
    this.vx = Math.random() * 7 - 3.5;
    this.vy = -(Math.random() * 5 + 2);
    this.text = new PIXI.Text(num + "", {
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
    });
    this.g = 0.6;
  }

  update(delta: number, offsetX: number, offsetY: number) {
    super.update(delta, offsetX, offsetY);

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.g;
    this.vy = Math.min(this.vy, 6);
    this.text.position.set(this.x + offsetX, this.y + offsetY);
    if (this.time > 17) this.text.alpha -= 0.2;
    if (this.time > 22) this.isDead = true;
  }
  onStage(app: PIXI.Container): RenderObject {
    app.addChild(this.text);
    return this;
  }
  outStage() {
    this.text.parent.removeChild(this.text);
  }
}
