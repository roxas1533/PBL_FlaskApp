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

import { loadProfile } from "./profile";
export const BT = [1, 3, 3, 10, 10, 5, 1, 10];

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

class Point {
  constructor(public x: number, public y: number) {}
}
export function collisionMap(x: number, y: number, map: number[][]) {
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

export function setEndScene(winlose: number) {
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
