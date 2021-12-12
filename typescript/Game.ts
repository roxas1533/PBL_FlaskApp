import * as PIXI from "pixi.js";
import { Bullet } from "./Bullet";
import { DamageNum } from "./DamageNumObject";
import { Item } from "./Item";
import { Player } from "./Player";
import { PointObject } from "./PointObject";
import { Prize } from "./Prize";
import { loadProfile } from "./profile";
import { RenderObject } from "./RenderObject";
import { BT, setEndScene } from "./scriptGame";
import { Setting } from "./Setting";
import { collisionObject, collisionMap } from "./utils";
import { VisibilityPolygon } from "./VisibilityPolygon";
let magnification: number;

export class Game {
  static game: Game;
  static loader: PIXI.Loader;
  static setting: Setting;
  static resourceLoadedFlag = false;
  static currentScene = "loadingScene";
  static gameScenes: { [key: string]: PIXI.Container } = {};
  static cycle: number = 0;

  static app: PIXI.Application;
  public chargeGage: PIXI.Graphics;
  public player: Player;
  public ePlayer: Player;
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
  floorTexture: PIXI.Texture<PIXI.Resource>;
  wallTexture: PIXI.Texture<PIXI.Resource>;
  constructor() {
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
    this.floorTexture = this.getMapTexture(true);
    this.wallTexture = this.getMapTexture(false);
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
                new Bullet(
                  bullet.InnerId,
                  bullet.TimeStamp,
                  Prize.skinByType[0]
                ),
                bullet
              ).onStage()
            );
            Bullet.pushedBulletID.push(bullet.InnerId);
          }
        });
        this.player.updateLastPoint();
        this.ePlayer.updateLastPoint();
        this.globalPlayers = data.player;
        this.receiveFlag = true;
      }
      if (data.id ?? false) {
        this.globalMap = data.map;
        this.InstanceID = data.Iid;
        myid = data.id;
      } else {
        let players = data.player;
        if (Game.currentScene === "waitingScene") {
          if (players ?? false) {
            if (players.length === 2) {
              Game.currentScene = "gameScene";
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
              this.generateMaptexture();
              this.setGameScene();
              Game.changeScene("gameScene");
            }
          }
        }
      }
    };
  }

  setGameScene() {
    Game.gameScenes["gameScene"] = new PIXI.Container();
    const gameCanvas = new PIXI.Container();
    gameCanvas.visible = false;
    Game.gameScenes["gameScene"].addChild(gameCanvas);
    const lightCanvas = new PIXI.Graphics();
    const UICanvas = new PIXI.Graphics();
    this.ePlayer.cont.mask = this.player.maskCanvas;
    lightCanvas.filters = [new PIXI.filters.BlurFilter()];
    const wallContainer = new PIXI.Container();
    const floorContainer = new PIXI.Container();
    let pol: number[][][] = [];
    this.globalMap.forEach((e, i) => {
      e.forEach((b, j) => {
        let obj: PIXI.Sprite;
        if (b === 1) {
          obj = new PIXI.Sprite(this.wallTexture);
          pol.push([
            [j * 30, i * 30],
            [j * 30 + 30, i * 30],
            [j * 30 + 30, i * 30 + 30],
            [j * 30, i * 30 + 30],
          ]);
          wallContainer.addChild(obj);
        } else {
          obj = new PIXI.Sprite(this.floorTexture);
          floorContainer.addChild(obj);
        }
        obj.position.set(j * 30, i * 30);
        obj.width = 30;
        obj.height = 30;
      });
    });
    gameCanvas.addChild(floorContainer);
    gameCanvas.addChild(lightCanvas);
    gameCanvas.addChild(wallContainer);

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
    const FPS = new PIXI.Text(Math.round(Game.app.ticker.FPS * 10) / 10 + "", {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
    });
    if (Game.setting.setting["show_fps"]) gameCanvas.addChild(FPS);

    let UIback = new PIXI.Graphics()
      .beginFill(0)
      .drawRect(0, 500, 500, 50)
      .endFill();
    UICanvas.addChild(UIback);

    let UILine = new PIXI.Graphics()
      .lineStyle(2, 0xffffff)
      .moveTo(0, 500)
      .lineTo(500, 500);
    UICanvas.addChild(UILine);

    const HPtext = new PIXI.Text("HP", {
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
    });
    HPtext.position.set(50, 520 - HPtext.height);
    UICanvas.addChild(HPtext);

    let HPback = new PIXI.Graphics()
      .beginFill(0xff0000)
      .drawRect(50, 520, 100, 20)
      .endFill();
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

    const itemStroke = new PIXI.Graphics()
      .lineStyle(1, 0xffffff)
      .drawRect(370, 520, 20, 20);
    UICanvas.addChild(itemStroke);

    const itemText = new PIXI.Text("Item", {
      fontFamily: "Arial",
      fontSize: 11,
      fill: 0xffffff,
    });
    itemText.position.set(370, 520 - itemText.height);
    UICanvas.addChild(itemText);

    const effectLine = new PIXI.Graphics()
      .lineStyle(2, 0x0000ff)
      .moveTo(0, 500)
      .lineTo(500, 500);
    UICanvas.addChild(effectLine);
    gameCanvas.addChild(UICanvas);

    let i = this.renderObject.length;
    while (i--) {
      this.renderObject[i].onStage(Game.gameScenes["gameScene"]);
    }

    Game.app.stage.addChild(Game.gameScenes["gameScene"]);

    var segments = VisibilityPolygon.convertToSegments(pol);
    segments = VisibilityPolygon.breakIntersections(segments);
    Game.cycle = 0;
    let lastTime = Date.now();
    const gameLoop = (t: number) => {
      magnification = 62.5 / Game.app.ticker.FPS;
      lastTime = Date.now();
      this.timeSinceSync += t;
      Game.cycle += magnification;
      FPS.text = "" + Math.round(Game.app.ticker.FPS * 10) / 10;

      for (let i = this.renderObject.length - 1; i >= 0; i--) {
        this.renderObject[i].update(magnification, this.offsetX, this.offsetY);
        if (this.renderObject[i].isDead) {
          this.renderObject[i].outStage();
          this.renderObject.splice(i, 1);
        }
      }
      if (Game.cycle >= 100 * magnification) {
        if (Game.cycle % 100) Bullet.pushedBulletID = [];
        gameCanvas.visible = true;
        this.drawPlayers(magnification, gameCanvas);

        this.updateView(lightCanvas, segments);
        this.updateMapContainer(wallContainer, floorContainer);
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

        if (Game.currentScene != "gameScene") {
          this.server!.close();
          Game.app.ticker.remove(gameLoop);
        }
        this.receiveFlag = false;
      }
    };
    Game.app.ticker.add(gameLoop);
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
    lightCanvas.clear().beginFill(0xffffff);
    lightCanvas.alpha = 0.3;
    this.player.maskCanvas.clear().beginFill(0xffff00);
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
      if (p.ID === Game.game.player.id) {
        op = Game.game.player;

        if (op.isV != p.IsInvisible) {
          if (p.IsInvisible) op.enalbeInvisible();
          else op.disableInvisible();
        }
        if (op.show != p.Show) {
          if (p.Show) Game.game.ePlayer.cont.mask = null;
          else Game.game.ePlayer.cont.mask = Game.game.player.maskCanvas;
        }
        if (op.rader != p.Rader) Game.game.player.raderArrow.visible = p.Rader;
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
        op = Game.game.ePlayer;
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
        if (op.id === Game.game.player.id) {
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
          if (Game.setting.setting["show_damage"] && op.lastHp - op.hp > 0) {
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
        Game.changeScene("endScene");
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
      if (Game.game.receiveFlag) {
        if (Math.abs(op.x - p.x) > 10) op.x = p.x;
        if (Math.abs(op.y - p.y) > 10) op.y = p.y;
      }

      if (op == Game.game.player) {
        Game.game.offsetX = 250 - op.x;
        Game.game.offsetX = Math.min(Game.game.offsetX, 0);
        Game.game.offsetX = Math.max(
          Game.game.offsetX,
          500 - this.globalMap[0].length * 30
        );
        Game.game.offsetY = 250 - op.y;
        Game.game.offsetY = Math.min(Game.game.offsetY, 0);
        Game.game.offsetY = Math.max(
          Game.game.offsetY,
          500 - this.globalMap.length * 30
        );
      }

      op.width = p.width;
      op.height = p.height;
      op.update();
    });
  }

  getMapTexture(isFloor = false): PIXI.Texture {
    let texuteID = Prize.skinByType[1] - 4;
    let texutureName = "/static/img/wallTexture.png";
    if (isFloor) {
      texuteID = Prize.skinByType[2] - 25;
      texutureName = "/static/img/floorTexture.png";
    }

    const tex = new PIXI.Texture(
      Game.loader.resources[texutureName].texture!.castToBaseTexture(),
      new PIXI.Rectangle(
        (texuteID % 5) * 128,
        Math.floor(texuteID / 5) * 128,
        128,
        128
      )
    );

    return tex;
  }

  generateMaptexture() {
    this.floorTexture = this.getMapTexture(true);
    this.wallTexture = this.getMapTexture(false);
  }
  updateMapContainer(
    wallContainer: PIXI.Container,
    floorContainer: PIXI.Container
  ) {
    wallContainer.position.set(
      Math.floor(this.offsetX),
      Math.floor(this.offsetY)
    );
    floorContainer.position.set(
      Math.floor(this.offsetX),
      Math.floor(this.offsetY)
    );
  }
  static changeScene(nextScene: string) {
    Game.currentScene = nextScene;
    Object.keys(Game.gameScenes).forEach((scene) => {
      if (scene === nextScene) Game.gameScenes[scene].visible = true;
      else Game.gameScenes[scene].visible = false;
    });
  }
}
