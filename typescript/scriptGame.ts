import {
  Skin,
  Game,
  Bullet,
  Item,
  Player,
  collisionObject,
  setting,
  DamageNum,
} from "./loading";
import * as PIXI from "pixi.js";
import { VisibilityPolygon } from "./VisibilityPolygon";
import { loadProfile } from "./profile";
const BT = [1, 3, 3, 10, 10, 5, 1, 10];

export var game: Game;
export function loadSkinList(callback: () => void) {
  fetch("http://" + window.location.host + "/getSkinList", {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        return Promise.reject(new Error("エラーです"));
      }
    })
    .then((res) => {
      const list = JSON.parse(res) as { [key: string]: any };
      Skin.skinlist = list["list"];
      Skin.nowSkin = list["skin"];
      Skin.changeSkin = Skin.nowSkin;
      callback();
    });
}

export function setUp() {
  const canvas = document.getElementById("canvas")!;
  game = new Game();
  while (canvas.lastChild) {
    canvas.removeChild(canvas.lastChild);
  }
  canvas.appendChild(game.app.view);
}

export function setTitleScene() {
  game.app.ticker.maxFPS = 60;
  game.app.ticker.minFPS = 60;
  game.gameScenes["titleScene"] = new PIXI.Container();
  const duelText = new PIXI.Text("DUEL", {
    fontFamily: "Arial",
    fontSize: 50,
    fill: 0xffffff,
  });
  const startText = new PIXI.Text("START", {
    fontFamily: "Arial",
    fontSize: 30,
    fill: 0xffffff,
  });
  duelText.position.set(250 - duelText.width / 2, 250);
  startText.position.set(
    250 - startText.width / 2,
    300 + 25 - startText.height / 2
  );
  const button = new PIXI.Graphics();
  button.lineStyle(1, 0xffffff);
  button.drawRect(250 - 150 / 2, 300, 150, 50);
  button.hitArea = new PIXI.Rectangle(250 - 150 / 2, 300, 150, 50);
  button.interactive = true;
  button.buttonMode = true;
  button.on("mouseover", (e) => {
    button.clear();
    button.lineStyle(1, 0xffffff);
    button.beginFill(0x444444);
    button.drawRect(250 - 150 / 2, 300, 150, 50);
    button.endFill();
  });
  button.on("mouseout", (e) => {
    button.clear();
    button.lineStyle(1, 0xffffff);
    button.drawRect(250 - 150 / 2, 300, 150, 50);
  });
  button.on("mouseup", (e) => {
    setLoadinScene();
    changeScene("loadingScene");
    game.connectServer();
  });
  button.addChild(startText);
  game.gameScenes["titleScene"].addChild(duelText);
  game.gameScenes["titleScene"].addChild(button);
  game.app.stage.addChild(game.gameScenes["titleScene"]);
}

function setLoadinScene() {
  game.gameScenes["loadingScene"] = new PIXI.Container();
  const duelText = new PIXI.Text("プレイヤーを待機中", {
    fontFamily: "Arial",
    fontSize: 30,
    fill: 0xffffff,
  });
  duelText.position.set(250 - duelText.width / 2, 250);
  game.gameScenes["loadingScene"].addChild(duelText);
  game.app.stage.addChild(game.gameScenes["loadingScene"]);
  game.app.ticker.add(loadingLoop);
  function loadingLoop() {
    game.cycle += 60 / game.app.ticker.FPS;
    if (game.currentScene == "loadingScene") {
      if (game.server!.readyState == 1) {
        game.server!.send(JSON.stringify({ key: 0 }));
      }
      let comma = "";
      for (var i = 0; i < (game.cycle / 40) % 4; i++) {
        comma += ".";
      }
      duelText.text = "プレイヤーを待機中" + comma;
    } else game.app.ticker.remove(loadingLoop);
  }
}

export function changeScene(nextScene: string) {
  game.currentScene = nextScene;
  Object.keys(game.gameScenes).forEach((scene) => {
    if (scene === nextScene) game.gameScenes[scene].visible = true;
    else game.gameScenes[scene].visible = false;
  });
}

export function setGameScene(map: number[][]) {
  game.gameScenes["gameScene"] = new PIXI.Container();
  const gameCanvas = new PIXI.Container();
  gameCanvas.visible = false;
  game.gameScenes["gameScene"].addChild(gameCanvas);
  const lightCanvas = new PIXI.Graphics();
  const UICanvas = new PIXI.Graphics();
  game.ePlayer.cont.mask = game.player.maskCanvas;
  lightCanvas.filters = [new PIXI.filters.BlurFilter()];
  gameCanvas.addChild(lightCanvas);
  const mapContainer = new PIXI.Container();
  let pol: number[][][] = [];

  map.forEach((e, i) => {
    e.forEach((b, j) => {
      if (b === 1) {
        let obj = new PIXI.Graphics();
        obj.beginFill(0x808080);
        obj.drawRect(j * 30 + game.offsetX, i * 30 + game.offsetY, 30, 30);
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

  game.player.onStage(gameCanvas);
  game.ePlayer.onStage(gameCanvas);
  const FPS = new PIXI.Text(game.app.ticker.FPS + "", {
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
  UICanvas.addChild(game.player.HPbar);

  const bullettext = new PIXI.Text("Bullet", {
    fontFamily: "Arial",
    fontSize: 11,
    fill: 0xffffff,
  });
  bullettext.position.set(200, 525 - bullettext.height);
  UICanvas.addChild(bullettext);

  const bulletMaxText = new PIXI.Text(
    Math.floor(game.player.C / BT[game.player.BT]) +
      "/" +
      Math.floor(game.player.MC / BT[game.player.BT]),
    {
      fontFamily: "Arial",
      fontSize: 20,
      fill: 0xffffff,
    }
  );
  bulletMaxText.position.set(210, 525);
  UICanvas.addChild(bulletMaxText);

  // if (game.player.Sp > 150) c.fillStyle = "red";

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

  let i = game.renderObject.length;
  while (i--) {
    game.renderObject[i].onStage(game.gameScenes["gameScene"]);
  }
  game.app.stage.addChild(game.gameScenes["gameScene"]);
  var segments = VisibilityPolygon.convertToSegments(pol);
  segments = VisibilityPolygon.breakIntersections(segments);
  game.cycle = 0;
  game.app.ticker.add(gameLoop);
  function gameLoop() {
    let delta = 60 / game.app.ticker.FPS;
    game.cycle += delta;
    FPS.text = "" + game.app.ticker.FPS;
    if (game.currentScene == "gameScene") {
      for (let i = game.renderObject.length - 1; i >= 0; i--) {
        game.renderObject[i].update(delta, game.offsetX, game.offsetY);
        if (game.renderObject[i].isDead) {
          game.renderObject[i].outStage();
          game.renderObject.splice(i, 1);
        }
      }
      if (game.cycle >= 100 * delta) {
        gameCanvas.visible = true;
        drawPlayers(game.globalPlayers, game.globalMap, delta, gameCanvas);

        drawView(game.player.maskCanvas, lightCanvas, segments);
        mapContainer.position.set(game.offsetX, game.offsetY);

        for (let i = game.globalItems.length - 1; i >= 0; i--) {
          game.globalItems[i].update(game.offsetX, game.offsetY);
          collisionObject(
            game.globalItems[i],
            [game.player, game.ePlayer],
            (obj: Player) => {
              if (obj === game.player) {
                if (
                  game.globalItems[i].ID >= 9 &&
                  game.globalItems[i].ID <= 18
                ) {
                  if (game.player.item ?? false) game.player.item.isDead = true;
                  const uiitem = new Item(
                    370 + 2.5,
                    520 + 2.5,
                    15,
                    15,
                    game.globalItems[i].ID,
                    1
                  );
                  UICanvas.addChild(uiitem.wrapper);
                  game.renderObject.push(uiitem);
                  game.player.item = uiitem;
                }
              }
              game.globalItems[i].isDead = true;
              Item.ItemContainer.removeChild(game.globalItems[i].wrapper);
              game.globalItems.splice(i, 1);
            }
          );
        }
        if (game.player.effect > 0) {
          effectLine.clear();
          effectLine.lineStyle(2, 0x0000ff);
          effectLine.moveTo(0, 500);
          effectLine.lineTo(game.player.effect * 500, 500);
        }
        if ((game.player.key & 128) > 0 && (game.player.item ?? false))
          game.player.item.isDead = true;

        if (game.player.chageHp != 0) {
          game.player.disPlayeffect.alpha = (50 - game.player.effectTimer) / 90;
          game.player.effectTimer++;
          if (game.player.effectTimer > 50) {
            game.player.chageHp = 0;
            game.player.effectTimer = 0;
            game.player.disPlayeffect.visible = false;
          }
        }
        bulletMaxText.text =
          Math.floor(game.player.C / BT[game.player.BT]) +
          "/" +
          Math.floor(game.player.MC / BT[game.player.BT]);
        game.server!.send(JSON.stringify({ key: game.player.key }));

        game.receiveFlag = false;
        if (game.currentScene != "gameScene") {
          game.app.ticker.remove(gameLoop);
        }
      }
    }
  }
}

function drawView(
  maskCanvas: PIXI.Graphics,
  lightCanvas: PIXI.Graphics,
  segments: any
) {
  const position = [
    game.player.x + game.player.width / 2,
    game.player.y + game.player.height / 2,
  ];
  let visibility = VisibilityPolygon.computeViewport(
    position,
    segments,
    [game.player.x - 500, game.player.y - 500],
    [game.player.x + 500, game.player.y + 500]
  );
  lightCanvas.clear();
  lightCanvas.beginFill(0x444444);
  maskCanvas.clear();
  maskCanvas.beginFill(0xffff00);
  const startX = visibility[0][0] + game.offsetX;
  const startY = visibility[0][1] + game.offsetY;
  lightCanvas.moveTo(startX, startY);
  maskCanvas.moveTo(startX, startY);
  for (var j = 1; j <= visibility.length; j++) {
    const endX = visibility[j % visibility.length][0] + game.offsetX;
    const endY = visibility[j % visibility.length][1] + game.offsetY;
    lightCanvas.lineTo(endX, endY);
    maskCanvas.lineTo(endX, endY);
  }
  lightCanvas.endFill();
  maskCanvas.endFill();
}

class Point {
  constructor(public x: number, public y: number) {}
}
function collisionMap(x: number, y: number, map: number[][]) {
  x = Math.ceil(x);
  y = Math.ceil(y);
  let startX = Math.max(Math.floor(x / 30.0), 0) | 0;
  let startY = Math.max(Math.floor(y / 30.0), 0) | 0;
  let endX = Math.min(Math.floor((x + 30.0 - 1.0) / 30.0), map[0].length) | 0;
  let endY = Math.min(Math.floor((y + 30.0 - 1.0) / 30.0), map.length) | 0;
  for (let i = startY; i <= endY; i++) {
    for (let j = startX; j <= endX; j++) {
      if (map[i][j] == 1) {
        return new Point(j, i);
      }
    }
  }
  return null;
}

function drawPlayers(
  players: any,
  map: number[][],
  delta: number,
  gameCanvas: PIXI.Container
) {
  players.forEach((p: any, i: number) => {
    if (!game.receiveFlag) {
      let point = collisionMap(p.x + p.vx, p.y, map);
      if (!point) {
        p.x += p.vx * delta;
      } else {
        if (p.vx < 0) {
          p.x = (point.x + 1) * 30;
        } else if (p.vx > 0) {
          p.x = point.x * 30 - 30;
        }
      }
      point = collisionMap(p.x, p.y + p.vy, map);
      if (!point) {
        p.y += p.vy * delta;
      } else {
        if (p.vy < 0) {
          p.y = (point.y + 1) * 30;
        } else if (p.vy > 0) {
          p.y = point.y * 30 - 30;
        }
      }
    }
    let op;
    if (p.ID === game.player.id) {
      op = game.player;
      game.offsetX = 250 - p.x;
      game.offsetX = Math.min(game.offsetX, 0);
      game.offsetX = Math.max(game.offsetX, 500 - map[0].length * 30);
      game.offsetY = 250 - p.y;
      game.offsetY = Math.min(game.offsetY, 0);
      game.offsetY = Math.max(game.offsetY, 500 - map.length * 30);

      if (op.isV != p.IsInvisible) {
        if (p.IsInvisible) op.enalbeInvisible();
        else op.disableInvisible();
      }
      if (op.show != p.Show) {
        if (p.Show) game.ePlayer.cont.mask = null;
        else game.ePlayer.cont.mask = game.player.maskCanvas;
      }
      if (op.rader != p.Rader) game.player.raderArrow.visible = p.Rader;
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
    if (op.hp != op.lastHp)
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
      } else if (setting.setting["show_damage"] && op.lastHp - op.hp > 0) {
        game.renderObject.push(
          new DamageNum(
            Math.random() * (p.width - 10) + p.x,
            Math.random() * (p.width - 10) + p.y,
            op.lastHp - op.hp
          ).onStage(gameCanvas)
        );
      }
    op.lastHp = p.HP;
    if (op.hp <= 0) {
      setEndScene(op == game.player ? 1 : 0);
      changeScene("endScene");
      loadProfile();
    }

    op.x = p.x;
    op.y = p.y;
    op.width = p.width;
    op.height = p.height;
    op.update();
  });
}

function setEndScene(winlose: number) {
  game.gameScenes["endScene"] = new PIXI.Container();
  const duelText = new PIXI.Text(winlose == 0 ? "Win!!" : "Lose...", {
    fontFamily: "Arial",
    fontSize: 50,
    fill: winlose == 0 ? 0xff0000 : 0x000ff,
  });
  const startText = new PIXI.Text("もう一回", {
    fontFamily: "Arial",
    fontSize: 30,
    fill: 0xffffff,
  });
  duelText.position.set(250 - duelText.width / 2, 250);
  startText.position.set(
    250 - startText.width / 2,
    300 + 25 - startText.height / 2
  );
  const button = new PIXI.Graphics();
  button.lineStyle(1, 0xffffff);
  button.drawRect(250 - 150 / 2, 300, 150, 50);
  button.hitArea = new PIXI.Rectangle(250 - 150 / 2, 300, 150, 50);
  button.interactive = true;
  button.buttonMode = true;
  button.on("mouseover", (e) => {
    button.clear();
    button.lineStyle(1, 0xffffff);
    button.beginFill(0x444444);
    button.drawRect(250 - 150 / 2, 300, 150, 50);
    button.endFill();
  });
  button.on("mouseout", (e) => {
    button.clear();
    button.lineStyle(1, 0xffffff);
    button.drawRect(250 - 150 / 2, 300, 150, 50);
  });
  button.on("mouseup", (e) => {
    game.app = new PIXI.Application({
      width: 500,
      height: 550,
      antialias: true,
    });
    setUp();
    Item.ItemContainer = new PIXI.Container();
    Bullet.BulletContainer = new PIXI.Container();
    setLoadinScene();
    changeScene("loadingScene");
    game.connectServer();
  });
  button.addChild(startText);
  game.gameScenes["endScene"].addChild(duelText);
  game.gameScenes["endScene"].addChild(button);
  game.app.stage.addChild(game.gameScenes["endScene"]);
}
