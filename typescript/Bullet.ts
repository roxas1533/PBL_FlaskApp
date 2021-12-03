import { GameObject } from "./RenderObject";
import * as PIXI from "pixi.js";
import { collisionMapBullet, collisionObject } from "./utils";
import { Game } from "./Game";

export class Bullet extends GameObject {
  static pushedBulletID: number[] = [];
  static BulletContainer = new PIXI.Container();
  private time: number;
  public bullet: PIXI.Graphics;
  public IsSpireA: boolean;
  public IsReflectA: boolean;
  public Life: number;
  public nextX: number;
  public nextY: number;
  private history: number[][];
  ID: number;
  constructor(public innerID: number, public lastUpdate: number) {
    super(0, 0, 0, 0);
    this.time = 0;
    this.bullet = new PIXI.Graphics();
    this.IsSpireA = false;
    this.IsReflectA = false;
    this.Life = 0;
    this.ID = 0;
    this.history = [];
    this.nextX = this.nextY = 0;
  }
  syncPosition(b: any) {
    this.nextX = b.x;
    this.nextY = b.y;
    this.lastUpdate = b.TimeStamp;
    if (Math.abs(b.x - this.x) > 5) this.x = b.x;
    if (Math.abs(b.y - this.y) > 5) this.y = b.y;
  }
  update(delta: number) {
    this.time += delta;
    // var lerp = (s: number, e: number, t: number) =>
    //   (e - s) * (1 - Math.pow(1 - 0.1, 60 * t)) + s;
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.history.push([Date.now(), this.x, this.y]);
    if (this.history.length >= 50) {
      this.history.shift();
    }

    this.bullet.x = this.x + Game.game.offsetX;
    this.bullet.y = this.y + Game.game.offsetY;
    if (this.time >= this.Life) this.isDead = true;
    if (!this.IsSpireA) {
      if (collisionMapBullet(this, this.vx, 0)) {
        if (this.IsReflectA) {
          this.vx *= -1;
        } else this.isDead = true;
      }
      if (collisionMapBullet(this, 0, this.vy)) {
        if (this.IsReflectA) {
          this.vy *= -1;
        } else this.isDead = true;
      }
    }
    collisionObject(this, [Game.game.ePlayer, Game.game.player], (p) => {
      if (p.id != this.ID) this.isDead = true;
    });
  }
  onStage() {
    this.bullet
      .beginFill(0xff0000)
      .drawCircle(0, 0, this.width / 2)
      .endFill();

    this.bullet.position.set(this.x + this.width / 2, this.y);
    Bullet.BulletContainer.addChild(this.bullet);
    return this;
  }
  outStage() {
    this.bullet.parent.removeChild(this.bullet);
  }
  getID(): number {
    return this.innerID;
  }
}
