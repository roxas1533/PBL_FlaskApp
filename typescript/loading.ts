import * as PIXI from "pixi.js";
export let setting: Setting;
import { loadProfile } from "./profile";
import {
  changeScene,
  game,
  loadSkinList,
  setGameScene,
  setTitleScene,
  setUp,
} from "./scriptGame";

export class Skin {
  static skinlist: { [key: string]: string }[];
  static nowSkin: number;
  static changeSkin: number;
}

export class Game {
  public cycle: number;
  public app: PIXI.Application;
  public currentScene: string;
  public player: Player;
  public ePlayer: Player;
  public gameScenes: { [key: string]: PIXI.Container };
  public server: WebSocket | undefined;
  public renderObject: RenderObject[];
  public globalItems: Item[];
  public globalMap: number[][];
  public globalPlayers: Player[];
  public offsetX: number;
  public offsetY: number;
  receiveFlag: boolean;
  InstanceID: any;
  constructor() {
    this.cycle = 0;
    this.app = new PIXI.Application({
      width: 500,
      height: 550,
      antialias: true,
    });
    this.currentScene = "titleScene";
    this.gameScenes = {};
    this.player = new Player(0, 0, 0, 0, 0, 0, 0);
    this.ePlayer = new Player(0, 0, 0, 0, 0, 0, 0);
    this.server = undefined;
    this.renderObject = [];
    this.globalItems = [];
    this.globalPlayers = [];
    this.globalMap = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.receiveFlag = false;
  }

  connectServer() {
    this.renderObject = [];

    if (this.server ?? false) {
      this.server!.close();
    }
    let host = window.location.host + ":3000";

    this.server = new WebSocket(`ws://${host}/connect`);
    let myid = 0;

    this.server.onmessage = async (e) => {
      const data = JSON.parse(e.data);

      if ((data.player ?? false) && data.player.length === 2) {
        data.Item.forEach((item: any) => {
          this.globalItems.push(
            new Item(item.x, item.y, item.width, item.height, item.ID)
          );
        });
        data.Bullet.forEach((bullet: any) => {
          this.renderObject.push(Object.assign(new Bullet(), bullet).onStage());
        });
        this.globalPlayers = data.player;
        this.receiveFlag = true;
      }
      if (data.id ?? false) {
        this.globalMap = data.map;
        this.InstanceID = data.Iid;
        myid = data.id;
      } else {
        let players = data.player;
        if (this.currentScene === "loadingScene") {
          if (players ?? false) {
            if (players.length === 2) {
              this.currentScene = "gameScene";
              let formData = new FormData();
              formData.append("id", this.InstanceID);
              await fetch(`http://${host}/getPoint`, {
                method: "POST",
                mode: "cors",
                body: formData,
              })
                .then((response) => {
                  return response.json();
                })
                .then((res) => {
                  res["player"].forEach((p: any, i: number) => {
                    if (p.ID == myid) {
                      this.player = new Player(
                        p.x,
                        p.y,
                        p.width,
                        p.height,
                        myid,
                        p.HP,
                        p.Skin
                      );
                      this.player.updateSetting();
                      this.player.name = p.Name;
                      this.renderObject.push(
                        new PointObject(-300, 10, 20, p.Name, p.Cv)
                      );
                    } else {
                      this.ePlayer = new Player(
                        p.x,
                        p.y,
                        p.width,
                        p.height,
                        0,
                        p.HP,
                        p.Skin
                      );
                      this.renderObject.push(
                        new PointObject(500, 100, -20, p.Name, p.Cv)
                      );
                    }
                  });
                });
              setGameScene(this.globalMap);
              changeScene("gameScene");
            }
          }
        }
      }
    };
  }
}

class Setting {
  public tempSetting: any;
  constructor(
    public settingpage: string,
    public gamesetting: string,
    public keysetting: string,
    public setting: any,
    public defaultSetting: any
  ) {
    this.tempSetting = setting;
  }
  stackSetting() {
    this.tempSetting = JSON.parse(JSON.stringify(this.setting));
  }
  updateSetting() {
    this.setting = JSON.parse(JSON.stringify(this.tempSetting));
  }
  setDef() {
    this.tempSetting = JSON.parse(JSON.stringify(this.defaultSetting));
  }
}

function colorToNum(s: string): number {
  return (parseInt(s.substr(1), 16) << 8) / 256;
}
let loader: PIXI.Loader;
window.addEventListener("load", () => {
  loader = PIXI.Loader.shared;
  loader.add("/static/img/items.png");
  loader.onComplete.add(() => {
    setUp();
    document.addEventListener("keydown", (e) => {
      e.preventDefault();
      const inputKey = e.key.toUpperCase();
      if (game.currentScene == "gameScene") {
        if (inputKey in game.player.keyPow)
          game.player.key |= game.player.keyPow[inputKey];
      }
    });
    document.addEventListener("keyup", (e) => {
      if (game.currentScene == "gameScene") {
        const inputKey = e.key.toUpperCase();
        if (inputKey in game.player.keyPow)
          game.player.key &= ~game.player.keyPow[inputKey];
      }
    });

    setTitleScene();
  });
  loadSkinList(() => {
    loader.load();
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const loadingDOM = document.getElementById("loading")!;
  loadProfile();
  fetch("http://" + window.location.host + "/setting", {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((res) => {
      setting = new Setting(
        res["main"],
        res["game"],
        res["key"],
        res["setting"],
        res["defaultSetting"]
      );
    });
  loadingDOM.classList.add("fadeout");
  setTimeout(function () {
    loadingDOM.remove();
  }, 300);
});

class GameObject {
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

  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public id: number,
    public hp: number,
    public skin: number
  ) {
    super(x, y, width, height);
    this.C = 0;
    this.MC = 0;
    this.BT = 0;
    this.R = 0;
    this.lastHp = hp;
    this.itemStock = -1;
    this.item = new Item(0, 0, 0, 0, 0, 0);
    this.effect = 0;
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
    let copySetting = JSON.parse(JSON.stringify(setting.setting));
    copySetting[
      Object.keys(copySetting).filter((key) => {
        return copySetting[key] === "SPACE";
      })[0]
    ] = " ";

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
    this.cont.x = this.x + game.offsetX;
    this.cont.y = this.y + game.offsetY;
    this.renderArm.rotation = this.R;
    if (this.rader)
      this.raderArrow.rotation =
        Math.atan2(game.ePlayer.y - this.y, game.ePlayer.x - this.x) +
        Math.PI / 2;
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
      game.app.renderer.generateTexture(cont)
    );
    damageEffect.tint = 0xff0000;
    damageEffect.visible = false;
    return damageEffect;
  }
}

//abstruct
class RenderObject extends GameObject {
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
}

export class Item extends RenderObject {
  static ItemImage: { [key: number]: { [key: string]: number } } = {
    0: { x: 0, y: 0 },
    8: { x: 4, y: 1 },
    9: { x: 3, y: 1 },
    10: { x: 1, y: 1 },
    12: { x: 0, y: 1 },
    13: { x: 0, y: 2 },
    14: { x: 4, y: 0 },
    15: { x: 3, y: 0 },
    16: { x: 2, y: 0 },
    17: { x: 1, y: 0 },
    18: { x: 2, y: 1 },
  };

  static ItemDetail = [
    "HEAL",
    "PUNCHEUR",
    "TRIPLE",
    "AROUND",
    "SNIPER",
    "MINE",
    "REFLECT",
    "SHOTGUN",
    "ADDBULLET",
    "加速",
    "敵表示",
    "敵のポインター",
    "透明化",
    "射程増加",
    "スタン付与",
    "毒付与",
    "オートエイム",
    "貫通弾",
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
    if (!(ID in Item.ItemImage)) {
      ID = 0;
    }
    let tex: PIXI.Texture = new PIXI.Texture(
      loader.resources["/static/img/items.png"].texture!.castToBaseTexture(),
      new PIXI.Rectangle(
        Item.ItemImage[ID].x * 32,
        Item.ItemImage[ID].y * 32,
        32,
        32
      )
    );

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
    this.text.position.set(x + game.offsetX, y + game.offsetX);
    this.g = 0.6;
  }

  update(delta: number, offsetX: number, offsetY: number) {
    super.update(delta, offsetX, offsetY);
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.g;
    this.vy = Math.min(this.vy, 6);
    this.text.position.set(this.x + offsetX, this.y + offsetX);
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

class PointObject extends RenderObject {
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

export function collisionObject(
  obj1: GameObject,
  obj2: GameObject[],
  func: (obj: any) => void
) {
  obj2.forEach((obj) => {
    if (
      obj1.x < obj.x + obj.width &&
      obj1.x + obj1.width > obj.x &&
      obj1.y < obj.y + obj.height &&
      obj1.y + obj1.height > obj.y
    ) {
      func(obj);
    }
  });
}

export class Bullet extends GameObject {
  static BulletContainer = new PIXI.Container();
  private time: number;
  public bullet: PIXI.Graphics;
  public IsSpireA: boolean;
  public Life: number;
  ID: number;
  constructor() {
    super(0, 0, 0, 0);
    this.time = 0;
    this.bullet = new PIXI.Graphics();
    this.IsSpireA = false;
    this.Life = 0;
    this.ID = 0;
  }
  update(delta: number) {
    this.time += delta;
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.bullet.x = this.x + game.offsetX;
    this.bullet.y = this.y + game.offsetY;
    if (this.time >= this.Life) this.isDead = true;
    if (
      !this.IsSpireA &&
      game.globalMap[Math.floor(this.y / 30)][Math.floor(this.x / 30)] > 0
    )
      this.isDead = true;
    collisionObject(this, [game.ePlayer, game.player], (p) => {
      if (p.id != this.ID) this.isDead = true;
    });
  }
  onStage() {
    this.bullet.beginFill(0xff0000);
    this.bullet.drawRect(0, 0, this.width, this.height);
    this.bullet.position.set(this.x, this.y);
    this.bullet.endFill();
    Bullet.BulletContainer.addChild(this.bullet);
    return this;
  }
  outStage() {
    this.bullet.parent.removeChild(this.bullet);
  }
}
