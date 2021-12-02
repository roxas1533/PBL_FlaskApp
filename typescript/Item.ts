import { RenderObject } from "./RenderObject";
import * as PIXI from "pixi.js";
import { Game } from "./Game";

export class Item extends RenderObject {
  static ItemImage: { [key: number]: { [key: string]: number } } = [
    { x: 0, y: 0 },
    { x: 4, y: 1 },
    { x: 3, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 4, y: 0 },
    { x: 3, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 1 },
  ];
  static GunImage: { [key: number]: { [key: string]: number } } = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
  ];

  static ItemDetail = [
    "HEAL",
    "ADDBULLET",
    "移動速度上昇",
    "敵表示",
    "反射付与",
    "透明化",
    "射程増加",
    "スタン付与",
    "毒付与",
    "オートエイム",
    "無限貫通付与",
    "レーダー",
  ];

  static ItemContainer = new PIXI.Container();

  public sprite: PIXI.Sprite;
  public wrapper: PIXI.Container;
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public ID: number,
    public type: number = 0
  ) {
    super(x, y, height, width);
    // if (!(ID in Item.ItemImage)) {
    //   ID = 0;
    // }

    let tex: PIXI.Texture;
    if (this.ID < 100) {
      tex = new PIXI.Texture(
        Game.loader.resources[
          "/static/img/items.png"
        ].texture!.castToBaseTexture(),
        new PIXI.Rectangle(
          Item.ItemImage[ID].x * 32,
          Item.ItemImage[ID].y * 32,
          32,
          32
        )
      );
    } else {
      tex = new PIXI.Texture(
        Game.loader.resources[
          "/static/img/bulletItem.png"
        ].texture!.castToBaseTexture(),
        new PIXI.Rectangle(
          Item.GunImage[ID - 100].x * 32,
          Item.GunImage[ID - 100].y * 32,
          32,
          32
        )
      );
    }

    this.sprite = new PIXI.Sprite(tex);
    this.sprite.width = width;
    this.sprite.height = height;
    this.sprite.position.set(this.x, this.y);
    this.wrapper = new PIXI.Container();
    this.wrapper.addChild(this.sprite);

    if (!type) Item.ItemContainer.addChild(this.wrapper);
    else {
      const text = new PIXI.Text(Item.ItemDetail[this.ID], {
        fontFamily: "Arial",
        fontSize: 14,
        fill: 0xffffff,
      });
      text.position.set(398, 522);
      this.wrapper.addChild(text);
    }
  }
  update(offsetX: number, offsetY: number) {
    if (!this.type) {
      this.sprite.x = this.x + offsetX;
      this.sprite.y = this.y + offsetY;
    }
  }
  outStage() {
    this.wrapper.parent.removeChild(this.wrapper);
  }
}
