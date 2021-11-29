import * as PIXI from "pixi.js";
import { VisibilityPolygon } from "./VisibilityPolygon";
export let setting: Setting;
import { loadProfile } from "./profile";
import {
  BT,
  changeScene,
  collisionMap,
  game,
  loadSkinList,
  setEndScene,
  setTitleScene,
  setUp,
} from "./scriptGame";

export class Skin {
  static skinlist: { [key: string]: string }[];
  static nowSkin: number;
  static changeSkin: number;
}
let magnification: number;
export class Game {
  public cycle: number;
  public app: PIXI.Application;
  public currentScene: string;
  public chargeGage: PIXI.Graphics;
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
  public lastTime: number;
  public bettweenNowLastTime: number;
  public timeSinceSync: number;
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
    this.player = new Player(0, 0, 0, 0, 0, 0, 0, true);
    this.ePlayer = new Player(0, 0, 0, 0, 0, 0, 0, false);
    this.server = undefined;
    this.renderObject = [];
    this.globalItems = [];
    this.globalPlayers = [];
    this.globalMap = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.receiveFlag = false;
    this.lastTime = Date.now();
    this.bettweenNowLastTime = 0;
    this.timeSinceSync = 0;
    this.chargeGage = new PIXI.Graphics();
  }

  connectServer() {
    this.renderObject = [];

    if (this.server ?? false) {
      this.server!.close();
    }
    let host = window.location.hostname + ":3000";

    this.server = new WebSocket(`ws://${host}/connect`);
    let myid = 0;

    this.server.onmessage = async (e) => {
      const data = JSON.parse(e.data);
      this.bettweenNowLastTime = Date.now() - this.lastTime;
      this.lastTime = Date.now();
      this.timeSinceSync = 0;
      if ((data.player ?? false) && data.player.length === 2) {
        data.Item.forEach((item: any) => {
          this.globalItems.push(
            new Item(item.x, item.y, item.width, item.height, item.ID)
          );
        });
        data.Bullet.forEach((bullet: any) => {
          for (let e of this.renderObject) {
            if (bullet.InnerId == e.getID()) {
              e.syncPosition(bullet);
              return;
            }
          }

          if (!(bullet.InnerId in Bullet.pushedBulletID)) {
            this.renderObject.push(
              Object.assign(
                new Bullet(bullet.InnerId, bullet.TimeStamp),
                bullet
              ).onStage()
            );
            Bullet.pushedBulletID.push(bullet.InnerId);
          }
        });
        this.player.lastX = this.player.x;
        this.player.lastY = this.player.y;
        this.ePlayer.lastY = this.ePlayer.y;
        this.ePlayer.lastY = this.ePlayer.y;
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
                        p.Skin,
                        true
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
                        p.ID,
                        p.HP,
                        p.Skin,
                        false
                      );
                      this.renderObject.push(
                        new PointObject(500, 100, -20, p.Name, p.Cv)
                      );
                    }
                  });
                });
              this.setGameScene();
              changeScene("gameScene");
            }
          }
        }
      }
    };
  }

  setGameScene() {
    this.gameScenes["gameScene"] = new PIXI.Container();
    const gameCanvas = new PIXI.Container();
    gameCanvas.visible = false;
    this.gameScenes["gameScene"].addChild(gameCanvas);
    const lightCanvas = new PIXI.Graphics();
    const UICanvas = new PIXI.Graphics();
    this.ePlayer.cont.mask = this.player.maskCanvas;
    lightCanvas.filters = [new PIXI.filters.BlurFilter()];
    gameCanvas.addChild(lightCanvas);
    const mapContainer = new PIXI.Container();
    let pol: number[][][] = [];

    this.globalMap.forEach((e, i) => {
      e.forEach((b, j) => {
        if (b === 1) {
          let obj = new PIXI.Graphics();
          obj.beginFill(0x808080);
          obj.drawRect(j * 30 + this.offsetX, i * 30 + this.offsetY, 30, 30);
          obj.endFill();
          mapContainer.addChild(obj);
          pol.push([
            [j * 30, i * 30],
            [j * 30 + 30, i * 30],
            [j * 30 + 30, i * 30 + 30],
            [j * 30, i * 30 + 30],
          ]);
        }
      });
    });

    gameCanvas.addChild(mapContainer);

    gameCanvas.addChild(Item.ItemContainer);
    gameCanvas.addChild(Bullet.BulletContainer);

    this.player.onStage(gameCanvas);
    this.ePlayer.onStage(gameCanvas);
    this.chargeGage.beginFill(0xffffff);
    this.chargeGage.drawRect(0, 0, 30, 15);
    this.chargeGage.endFill();
    this.chargeGage.width = 0;
    this.chargeGage.position.set(this.player.x, this.player.y - 20);
    this.chargeGage.tint = 0xff0000;
    gameCanvas.addChild(this.chargeGage);
    const FPS = new PIXI.Text(this.app.ticker.FPS + "", {
      fontFamily: "Arial",
      fontSize: 10,
      fill: 0xffffff,
    });
    gameCanvas.addChild(FPS);

    let UIback = new PIXI.Graphics();
    UIback.beginFill(0);
    UIback.drawRect(0, 500, 500, 50);
    UIback.endFill();
    UICanvas.addChild(UIback);

    let UILine = new PIXI.Graphics();
    UILine.lineStyle(2, 0xffffff);
    UILine.moveTo(0, 500);
    UILine.lineTo(500, 500);
    UICanvas.addChild(UILine);

    const HPtext = new PIXI.Text("HP", {
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
    });
    HPtext.position.set(50, 520 - HPtext.height);
    UICanvas.addChild(HPtext);

    let HPback = new PIXI.Graphics();
    HPback.beginFill(0xff0000);
    HPback.drawRect(50, 520, 100, 20);
    HPback.endFill();
    UICanvas.addChild(HPback);
    UICanvas.addChild(this.player.HPbar);

    const bullettext = new PIXI.Text("Bullet", {
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
    });
    bullettext.position.set(200, 525 - bullettext.height);
    UICanvas.addChild(bullettext);

    const bulletMaxText = new PIXI.Text(
      Math.floor(this.player.C / BT[this.player.BT]) +
        "/" +
        Math.floor(this.player.MC / BT[this.player.BT]),
      {
        fontFamily: "Arial",
        fontSize: 20,
        fill: 0xffffff,
      }
    );
    bulletMaxText.position.set(210, 525);
    UICanvas.addChild(bulletMaxText);

    const itemStroke = new PIXI.Graphics();
    itemStroke.lineStyle(1, 0xffffff);
    itemStroke.drawRect(370, 520, 20, 20);
    UICanvas.addChild(itemStroke);

    const itemText = new PIXI.Text("Item", {
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
    });
    itemText.position.set(370, 520 - itemText.height);
    UICanvas.addChild(itemText);

    const effectLine = new PIXI.Graphics();
    effectLine.lineStyle(2, 0x0000ff);
    effectLine.moveTo(0, 500);
    effectLine.lineTo(500, 500);
    UICanvas.addChild(effectLine);
    gameCanvas.addChild(UICanvas);

    let i = this.renderObject.length;
    while (i--) {
      this.renderObject[i].onStage(this.gameScenes["gameScene"]);
    }

    this.app.stage.addChild(this.gameScenes["gameScene"]);

    var segments = VisibilityPolygon.convertToSegments(pol);
    segments = VisibilityPolygon.breakIntersections(segments);
    this.cycle = 0;
    let lastTime = Date.now();
    const gameLoop = (t: number) => {
      magnification = 62.5 / this.app.ticker.FPS;
      // console.log(
      //   this.app.ticker.deltaTime,
      //   this.app.ticker.deltaMS,
      //   Date.now() - lastTime,
      // );
      lastTime = Date.now();
      this.timeSinceSync += t;
      this.cycle += magnification;
      FPS.text = "" + this.app.ticker.FPS;
      for (let i = this.renderObject.length - 1; i >= 0; i--) {
        this.renderObject[i].update(magnification, this.offsetX, this.offsetY);
        if (this.renderObject[i].isDead) {
          this.renderObject[i].outStage();
          this.renderObject.splice(i, 1);
        }
      }
      if (this.cycle >= 100 * magnification) {
        if (this.cycle % 100) Bullet.pushedBulletID = [];
        gameCanvas.visible = true;
        this.drawPlayers(magnification, gameCanvas);

        this.updateView(lightCanvas, segments);
        mapContainer.position.set(this.offsetX, this.offsetY);

        for (let i = this.globalItems.length - 1; i >= 0; i--) {
          this.globalItems[i].update(this.offsetX, this.offsetY);
          collisionObject(
            this.globalItems[i],
            [this.player, this.ePlayer],
            (obj: Player) => {
              if (obj === this.player) {
                if (
                  this.globalItems[i].ID > 1 &&
                  this.globalItems[i].ID < 100
                ) {
                  if (this.player.item ?? false) this.player.item.isDead = true;
                  const uiitem = new Item(
                    370 + 2.5,
                    520 + 2.5,
                    15,
                    15,
                    this.globalItems[i].ID,
                    1
                  );
                  UICanvas.addChild(uiitem.wrapper);
                  this.renderObject.push(uiitem);
                  this.player.item = uiitem;
                }
              }
              this.globalItems[i].isDead = true;
              Item.ItemContainer.removeChild(this.globalItems[i].wrapper);
              this.globalItems.splice(i, 1);
            }
          );
        }
        if (this.player.effect > 0) {
          effectLine.clear();
          effectLine.lineStyle(2, 0x0000ff);
          effectLine.moveTo(0, 500);
          effectLine.lineTo(this.player.effect * 500, 500);
        }

        bulletMaxText.text =
          Math.floor(this.player.C / BT[this.player.BT]) +
          "/" +
          Math.floor(this.player.MC / BT[this.player.BT]);
        this.server!.send(JSON.stringify({ key: this.player.key }));

        if (this.currentScene != "gameScene") {
          this.app.ticker.remove(gameLoop);
        }
        this.receiveFlag = false;
      }
    };
    this.app.ticker.add(gameLoop);
  }

  updateView(lightCanvas: PIXI.Graphics, segments: any) {
    const position = [
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
    ];
    let visibility = VisibilityPolygon.computeViewport(
      position,
      segments,
      [this.player.x - 500, this.player.y - 500],
      [this.player.x + 500, this.player.y + 500]
    );
    lightCanvas.clear();
    lightCanvas.beginFill(0x444444);
    this.player.maskCanvas.clear();
    this.player.maskCanvas.beginFill(0xffff00);
    const startX = visibility[0][0] + this.offsetX;
    const startY = visibility[0][1] + this.offsetY;
    lightCanvas.moveTo(startX, startY);
    this.player.maskCanvas.moveTo(startX, startY);
    for (var j = 1; j <= visibility.length; j++) {
      const endX = visibility[j % visibility.length][0] + this.offsetX;
      const endY = visibility[j % visibility.length][1] + this.offsetY;
      lightCanvas.lineTo(endX, endY);
      this.player.maskCanvas.lineTo(endX, endY);
    }
    lightCanvas.endFill();
    this.player.maskCanvas.endFill();
  }

  drawPlayers(delta: number, gameCanvas: PIXI.Container) {
    this.globalPlayers.forEach((p: any, i: number) => {
      let op;
      if (p.ID === game.player.id) {
        op = game.player;

        if (op.isV != p.IsInvisible) {
          if (p.IsInvisible) op.enalbeInvisible();
          else op.disableInvisible();
        }
        if (op.show != p.Show) {
          if (p.Show) game.ePlayer.cont.mask = null;
          else game.ePlayer.cont.mask = game.player.maskCanvas;
        }
        if (op.rader != p.Rader) game.player.raderArrow.visible = p.Rader;
        if (op.key & Math.pow(2, 0)) p.vx = -(p.mv + p.BaseSpeed);
        if (op.key & Math.pow(2, 1)) p.vy = -(p.mv + p.BaseSpeed);
        if (op.key & Math.pow(2, 2)) p.vx = p.mv + p.BaseSpeed;
        if (op.key & Math.pow(2, 3)) p.vy = p.mv + p.BaseSpeed;
        if ((op.key & Math.pow(2, 0)) == 0 && (op.key & Math.pow(2, 2)) == 0) {
          p.vx = 0;
        }
        if ((op.key & Math.pow(2, 1)) == 0 && (op.key & Math.pow(2, 3)) == 0) {
          p.vy = 0;
        }
      } else {
        op = game.ePlayer;
        if (op.isV != p.IsInvisible) {
          if (p.IsInvisible) op.cont.visible = false;
          else op.cont.visible = true;
        }
      }

      op.lastSpace = p.Key & 16;

      op.hp = p.HP;
      op.C = p.Charge;
      op.MC = p.MaxCharge;
      op.BT = p.BT;
      op.itemStock = p.ItemStock;
      op.effect = p.Effect;
      op.isV = p.IsInvisible;
      op.rader = p.Rader;
      op.show = p.Show;
      op.Sp = p.SpaceCount;
      op.R = p.rotate;
      if (op.hp != op.lastHp) {
        if (op.id === game.player.id) {
          if (p.ID === op.id) {
            op.HPbar.width = op.hp;
            op.disPlayeffect.visible = true;
            op.effectTimer = 0;
            if (op.hp < op.lastHp) {
              op.disPlayeffect.tint = 0xff0000;
              op.chageHp = 1;
            } else if (op.hp > op.lastHp) {
              op.chageHp = 2;
              op.disPlayeffect.tint = 0x00ff00;
            }
          }
        } else {
          if (setting.setting["show_damage"] && op.lastHp - op.hp > 0) {
            this.renderObject.push(
              new DamageNum(
                Math.random() * (op.width - 10) + op.x,
                Math.random() * (op.width - 10) + op.y,
                op.lastHp - op.hp
              ).onStage(gameCanvas)
            );
          }
        }
      }
      op.lastHp = p.HP;
      if (op.hp <= 0) {
        setEndScene(op == this.player ? 1 : 0);
        changeScene("endScene");
        loadProfile();
      }

      let point = collisionMap(p.x + p.vx, p.y, this.globalMap);
      if (!point) {
        op.x += p.vx * delta;
      } else {
        if (p.vx < 0) {
          op.x = (point.x + 1) * 30;
        } else if (p.vx > 0) {
          op.x = point.x * 30 - 30;
        }
      }
      point = collisionMap(p.x, p.y + p.vy, this.globalMap);
      if (!point) {
        op.y += p.vy * delta;
      } else {
        if (p.vy < 0) {
          op.y = (point.y + 1) * 30;
        } else if (p.vy > 0) {
          op.y = point.y * 30 - 30;
        }
      }
      if (game.receiveFlag) {
        if (Math.abs(op.x - p.x) > 10) op.x = p.x;
        if (Math.abs(op.y - p.y) > 10) op.y = p.y;
      }

      if (op == game.player) {
        game.offsetX = 250 - op.x;
        game.offsetX = Math.min(game.offsetX, 0);
        game.offsetX = Math.max(
          game.offsetX,
          500 - this.globalMap[0].length * 30
        );
        game.offsetY = 250 - op.y;
        game.offsetY = Math.min(game.offsetY, 0);
        game.offsetY = Math.max(game.offsetY, 500 - this.globalMap.length * 30);
      }

      op.width = p.width;
      op.height = p.height;
      op.update();
    });
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
  loader.add("/static/img/bulletItem.png");
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
    const touchControl = document.getElementById("touchControl")!.children;
    for (let i = 0; i < touchControl.length; i++) {
      touchControl[i].addEventListener("touchstart", (e) => {
        e.preventDefault();
        const button = <HTMLElement>e.currentTarget;
        button.classList.add("tourch-button-pushed");
        if (game.currentScene == "gameScene") {
          game.player.key |= game.player.keyPow[button.getAttribute("data")!];
        }
      });
    }
    for (let i = 0; i < touchControl.length; i++) {
      touchControl[i].addEventListener("touchend", (e) => {
        e.preventDefault();
        const button = <HTMLElement>e.currentTarget;
        button.classList.remove("tourch-button-pushed");
        if (game.currentScene == "gameScene") {
          game.player.key &= ~game.player.keyPow[button.getAttribute("data")!];
        }
      });
    }

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
    let copySetting = JSON.parse(JSON.stringify(setting.setting));
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
    this.cont.x = this.x + game.offsetX;
    this.cont.y = this.y + game.offsetY;
    this.renderArm.rotation = this.R;
    if (this.rader)
      this.raderArrow.rotation =
        Math.atan2(game.ePlayer.y - this.y, game.ePlayer.x - this.x) +
        Math.PI / 2;
    if (this.isPlayer) {
      game.chargeGage.position.set(
        this.x + game.offsetX,
        this.y - 20 + game.offsetY
      );
      if (this.Sp > 10 || this.Sp == 0)
        game.chargeGage.width = (Math.min(this.Sp, 150) / 150) * this.width;
      if (this.Sp >= 150) game.chargeGage.tint = 0x00ff00;
      else game.chargeGage.tint = 0xff0000;
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
  getID(): number {
    return 0;
  }
  syncPosition(b: any) {}
}

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
        loader.resources["/static/img/items.png"].texture!.castToBaseTexture(),
        new PIXI.Rectangle(
          Item.ItemImage[ID].x * 32,
          Item.ItemImage[ID].y * 32,
          32,
          32
        )
      );
    } else {
      tex = new PIXI.Texture(
        loader.resources[
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
export function collisionMapBullet(
  me: GameObject,
  vx: number,
  vy: number
): boolean {
  var x = Math.ceil(me.x + vx);
  var y = Math.ceil(me.y + vy);
  var startX = Math.floor(Math.max(Math.floor(x / 30.0), 0));
  var startY = Math.floor(Math.max(Math.floor(y / 30.0), 0));
  var endX = Math.floor(
    Math.min(Math.floor((x + me.width - 1.0) / 30.0), game.globalMap[0].length)
  );
  var endY = Math.floor(
    Math.min(Math.floor((y + me.height - 1.0) / 30.0), game.globalMap.length)
  );
  for (let i = startY; i <= endY; i++) {
    for (let j = startX; j <= endX; j++) {
      if (game.globalMap[i][j] > 0) {
        return true;
      }
    }
  }
  return false;
}
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

    this.bullet.x = this.x + game.offsetX;
    this.bullet.y = this.y + game.offsetY;
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
  getID(): number {
    return this.innerID;
  }
}
