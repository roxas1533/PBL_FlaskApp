import { GameObject } from "./RenderObject";
import * as PIXI from "pixi.js";
import { Item } from "./Item";
import { colorToNum } from "./utils";
import { Skin } from "./Skin";
import { Game } from "./Game";

export class Player extends GameObject {
  public C: number;
  public MC: number;
  public BT: number;
  public R: number;
  public lastHp: number;
  public itemStock: number;
  public effect: number;
  public isV: boolean;
  public rader: boolean;
  public name: string;
  public show: boolean;
  public cv: number;
  public Sp: number;
  public keyPow: { [key: string]: number };
  public chageHp: number;
  public lastSpace: number;
  public effectTimer: number;
  public renderBody: PIXI.Graphics;
  public renderArm: PIXI.Graphics;
  public cont: PIXI.Container;
  public key: number;
  public firearmColor: number;
  public bodyColor: number;
  public maskCanvas: PIXI.Graphics;
  public raderArrow: PIXI.Graphics;
  public HPbar: PIXI.Graphics;
  public item: Item;
  disPlayeffect: any;
  public lastX: number;
  public lastY: number;

  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public id: number,
    public hp: number,
    public skin: number,
    public isPlayer: boolean
  ) {
    super(x, y, width, height);
    this.lastX = this.lastY = 0;
    this.C = this.MC = this.BT = this.R = this.effect = 0;
    this.lastHp = hp;
    this.itemStock = -1;
    this.item = new Item(0, 0, 0, 0, 0, 0);
    this.isV = false;
    this.rader = false;
    this.show = false;
    this.name = "";
    this.cv = 0;
    this.Sp = 0;
    this.keyPow = {};
    this.chageHp = 0;
    this.lastSpace = 0;
    this.effectTimer = 0;
    this.renderBody = new PIXI.Graphics();
    this.renderArm = new PIXI.Graphics();
    this.cont = new PIXI.Container();
    this.key = 0;
    this.firearmColor = colorToNum(Skin.skinlist[skin]["firearm"]);
    this.bodyColor = colorToNum(Skin.skinlist[skin]["body"]);
    this.maskCanvas = new PIXI.Graphics();
    this.raderArrow = new PIXI.Graphics();
    this.HPbar = new PIXI.Graphics();
    this.HPbar.beginFill(0x00ff00);
    this.HPbar.drawRect(0, 0, this.hp, 20);
    this.HPbar.endFill();
    this.HPbar.position.set(50, 520);
    if (id) this.disPlayeffect = this.makeDisPlayeffect();
  }
  updateSetting() {
    console.log(Game.setting.setting);
    let copySetting = JSON.parse(JSON.stringify(Game.setting.setting));
    copySetting[
      Object.keys(copySetting).filter((key) => {
        return copySetting[key] === "SPACE";
      })[0]
    ] = " ";
    const touchControl = document.getElementById("touchControl")!.children;
    for (var i = 0, len = touchControl.length; i < len; i++) {
      const keyName = touchControl[i].classList[1];
      touchControl[i].setAttribute("data", copySetting[keyName]);
    }

    this.keyPow[copySetting["leftkey"]] = Math.pow(2, 0);
    this.keyPow[copySetting["upkey"]] = Math.pow(2, 1);
    this.keyPow[copySetting["rightkey"]] = Math.pow(2, 2);
    this.keyPow[copySetting["downkey"]] = Math.pow(2, 3);
    this.keyPow[copySetting["firekey"]] = Math.pow(2, 4);
    this.keyPow[copySetting["useitemkey"]] = Math.pow(2, 7);
    this.keyPow[copySetting["leftarmrkey"]] = Math.pow(2, 5);
    this.keyPow[copySetting["rightarmrkey"]] = Math.pow(2, 6);
  }
  update() {
    this.cont.x = this.x + Game.game.offsetX;
    this.cont.y = this.y + Game.game.offsetY;
    this.renderArm.rotation = this.R;
    if (this.rader)
      this.raderArrow.rotation =
        Math.atan2(Game.game.ePlayer.y - this.y, Game.game.ePlayer.x - this.x) +
        Math.PI / 2;
    if (this.isPlayer) {
      Game.game.chargeGage.position.set(
        this.x + Game.game.offsetX,
        this.y - 20 + Game.game.offsetY
      );
      if (this.Sp > 10 || this.Sp == 0)
        Game.game.chargeGage.width =
          (Math.min(this.Sp, 150) / 150) * this.width;
      if (this.Sp >= 150) Game.game.chargeGage.tint = 0x00ff00;
      else Game.game.chargeGage.tint = 0xff0000;
      if ((this.key & 128) > 0 && (this.item ?? false)) this.item.isDead = true;

      if (this.chageHp != 0) {
        this.disPlayeffect.alpha = (50 - this.effectTimer) / 90;
        this.effectTimer++;
        if (this.effectTimer > 50) {
          this.chageHp = 0;
          this.effectTimer = 0;
        }
      }
    }
  }
  onStage(app: PIXI.Container) {
    this.renderBody.beginFill(this.bodyColor);
    this.renderBody.drawRect(0, 0, this.width, this.height);
    this.renderBody.endFill();

    this.renderArm.beginFill(this.firearmColor);
    this.renderArm.drawRect(0, 0, 10, 30);
    this.renderArm.endFill();
    this.renderArm.pivot.x = 5;
    this.renderArm.pivot.y = 30;
    this.renderArm.position.x = this.width / 2;
    this.renderArm.position.y = this.height / 2;
    this.cont.addChild(this.renderArm);
    this.cont.addChild(this.renderBody);
    if (this.id ?? false) this.setArrow();
    this.cont.position.set(this.x, this.y);
    app.addChild(this.cont);
    if (this.id) app.addChild(this.disPlayeffect);
  }
  enalbeInvisible() {
    this.renderBody.clear();
    this.renderBody.beginFill(0x0);
    this.renderBody.lineStyle(2, this.bodyColor);
    this.renderBody.drawRect(0, 0, this.width, this.height);
    this.renderBody.endFill();

    this.renderArm.clear();
    this.renderArm.lineStyle(2, this.firearmColor);
    this.renderArm.beginFill(0x0);
    this.renderArm.drawRect(0, 0, 10, 30);
    this.renderArm.endFill();
    this.cont.filters = [new PIXI.filters.BlurFilter(4)];
  }
  disableInvisible() {
    this.renderBody.clear();
    this.renderBody.beginFill(this.bodyColor);
    this.renderBody.drawRect(0, 0, this.width, this.height);
    this.renderBody.endFill();
    this.renderArm.clear();
    this.renderArm.beginFill(this.firearmColor);
    this.renderArm.drawRect(0, 0, 10, 30);
    this.renderArm.endFill();
    this.cont.filters = null;
  }
  setArrow() {
    this.raderArrow.lineStyle(1, 0xffffff);
    this.raderArrow.pivot.x = 0;
    this.raderArrow.pivot.y = 70;
    this.raderArrow.position.set(this.width / 2, this.height / 2);
    let startX, x, startY, y;
    startX = x = 0;
    startY = y = 0;
    this.raderArrow.beginFill(0x00bfff);
    this.raderArrow.moveTo(x, y);
    x += 15 * Math.cos((50 * Math.PI) / 180);
    y += 15 * Math.sin((50 * Math.PI) / 180);
    this.raderArrow.lineTo(x, y);
    x += 7 * Math.cos(Math.PI);
    y += 7 * Math.sin(Math.PI);
    this.raderArrow.lineTo(x, y);
    x += 20 * Math.cos(Math.PI / 2);
    y += 20 * Math.sin(Math.PI / 2);
    this.raderArrow.lineTo(x, y);
    x += 7 * Math.cos(Math.PI);
    y += 7 * Math.sin(Math.PI);
    this.raderArrow.lineTo(x, y);
    x += 20 * Math.cos(-Math.PI / 2);
    y += 20 * Math.sin(-Math.PI / 2);
    this.raderArrow.lineTo(x, y);
    x += 7.5 * Math.cos(Math.PI);
    y += 7.5 * Math.sin(Math.PI);
    this.raderArrow.lineTo(x, y);
    this.raderArrow.lineTo(startX, startY);
    this.raderArrow.endFill();
    this.raderArrow.visible = false;
    this.cont.addChild(this.raderArrow);
  }

  makeDisPlayeffect(): PIXI.Sprite {
    let cont = new PIXI.Container();
    let temp = new PIXI.Graphics();
    temp.beginFill(0xffffff);
    temp.drawRect(0, 0, 500, 500);
    temp.endFill();
    cont.addChild(temp);
    let temp2 = new PIXI.Graphics();
    temp2.beginFill(0);
    temp2.drawRect(0, 0, 400, 400);
    temp2.endFill();
    temp2.position.set(50, 50);
    cont.addChild(temp2);
    cont.filters = [
      new PIXI.filters.BlurFilter(20, 10, PIXI.settings.FILTER_RESOLUTION, 15),
    ];
    const damageEffect = new PIXI.Sprite(
      Game.app.renderer.generateTexture(cont)
    );
    damageEffect.tint = 0xff0000;
    damageEffect.visible = false;
    return damageEffect;
  }
  updateLastPoint() {
    this.lastX = this.x;
    this.lastY = this.y;
  }
}
