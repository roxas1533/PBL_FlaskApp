import { GameObject } from "./RenderObject";
import * as PIXI from "pixi.js";
import { collisionMapBullet, collisionObject } from "./utils";
import { Game } from "./Game";
import { GlowFilter } from "@pixi/filter-glow";
import { Player } from "./Player";
import { DEG_TO_RAD } from "pixi.js";

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
  skin: number;
  constructor(public innerID: number, public lastUpdate: number, skin = 0) {
    super(0, 0, 0, 0);
    this.time = 0;
    this.bullet = new PIXI.Graphics();
    this.IsSpireA = false;
    this.IsReflectA = false;
    this.Life = 0;
    this.ID = 0;
    this.history = [];
    this.nextX = this.nextY = 0;
    this.skin = skin;
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

    this.bullet.x = this.x + this.width / 2 + Game.game.offsetX;
    this.bullet.y = this.y + this.width / 2 + Game.game.offsetY;
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
    this.bullet = this.skinBullet();

    // this.bullet
    //   .beginFill(0xff0000)
    //   .drawRect(0, 0, this.width, this.width)
    //   .endFill();

    Bullet.BulletContainer.addChild(this.bullet);
    return this;
  }
  outStage() {
    this.bullet.parent.removeChild(this.bullet);
  }
  getID(): number {
    return this.innerID;
  }

  skinBullet(): PIXI.Graphics {
    this.width = 50;
    const circle = this.bullet
      .beginFill(0xff0000)
      .drawCircle(0, 0, this.width / 2)
      .endFill();
    switch (this.skin) {
      case 0:
        return circle;
      case 1:
        this.bullet.filters = [
          new GlowFilter({ distance: 15, outerStrength: 6, quality: 0.7 }),
          new PIXI.filters.BlurFilter(3),
        ];
        return circle;
      case 2:
        this.bullet.clear();
        let player: Player;
        if (this.ID == Game.game.player.id) player = Game.game.player;
        else player = Game.game.ePlayer;
        return this.bullet
          .beginFill(0xff0000)
          .moveTo(0, 0)
          .lineTo(
            this.width * Math.cos(player.R + (90 + 30) * DEG_TO_RAD),
            this.width * Math.sin(player.R + (90 + 30) * DEG_TO_RAD)
          )
          .lineTo(
            this.width * Math.cos(player.R + (90 - 30) * DEG_TO_RAD),
            this.width * Math.sin(player.R + (90 - 30) * DEG_TO_RAD)
          )
          .endFill();
    }
    return circle;
  }
}
