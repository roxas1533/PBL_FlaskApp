import * as PIXI from "pixi.js";

import { makeArialText } from "./utils";
import { Item } from "./Item";
import { Skin } from "./Skin";
import { Bullet } from "./Bullet";
import { Game } from "./Game";
import { Prize } from "./Prize";
export const BT = [1, 3, 3, 10, 10, 5, 1, 10];

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
export function loadPrizeList(callback: () => void) {
  fetch("http://" + window.location.host + "/getPrizeList", {
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
      Prize.prizelist = list["prize_list"];
      Prize.prizeName = list["name_list"];
      Prize.userOpend = list["opend_prize"];
      Prize.userPoint = list["point"];
      // Skin.changeSkin = Skin.nowSkin;
      callback();
    });
}

export function setUp(resetGame = true) {
  const canvas = document.getElementById("canvas")!;
  if (resetGame) Game.game = new Game();
  while (canvas.lastChild) {
    canvas.removeChild(canvas.lastChild);
  }
  canvas.appendChild(Game.app.view);
}

export function setTitleScene() {
  Game.gameScenes["titleScene"] = new PIXI.Container();
  const duelText = makeArialText("DUAL", 50);
  const startText = makeArialText("START");
  duelText.position.set(250 - duelText.width / 2, 250);
  startText.position.set(
    250 - startText.width / 2,
    300 + 25 - startText.height / 2
  );
  const button = new PIXI.Graphics()
    .lineStyle(1, 0xffffff)
    .drawRect(250 - 150 / 2, 300, 150, 50);
  button.hitArea = new PIXI.Rectangle(250 - 150 / 2, 300, 150, 50);
  button.interactive = true;
  button.buttonMode = true;
  button
    .on("mouseover", (e) => {
      button
        .clear()
        .lineStyle(1, 0xffffff)
        .beginFill(0x444444)
        .drawRect(250 - 150 / 2, 300, 150, 50)
        .endFill();
    })
    .on("mouseout", (e) => {
      button
        .clear()
        .lineStyle(1, 0xffffff)
        .drawRect(250 - 150 / 2, 300, 150, 50);
    })
    .on("pointerup", (e) => {
      setWaitingScene();
      Game.changeScene("waitingScene");
      Game.game.connectServer();
    })
    .addChild(startText);
  Game.gameScenes["titleScene"].addChild(duelText);
  Game.gameScenes["titleScene"].addChild(button);
  Game.app.stage.addChild(Game.gameScenes["titleScene"]);
}

function setWaitingScene() {
  Game.gameScenes["waitingScene"] = new PIXI.Container();
  const duelText = makeArialText("プレイヤーを待機中");
  duelText.position.set(250 - duelText.width / 2, 250);
  Game.gameScenes["waitingScene"].addChild(duelText);
  Game.app.stage.addChild(Game.gameScenes["waitingScene"]);
  Game.app.ticker.add(loadingLoop);
  function loadingLoop() {
    Game.cycle += 60 / Game.app.ticker.FPS;
    if (Game.currentScene == "waitingScene") {
      if (Game.game.server!.readyState == 1) {
        Game.game.server!.send(JSON.stringify({ key: 0 }));
      }
      let comma = "";
      for (var i = 0; i < (Game.cycle / 40) % 4; i++) {
        comma += ".";
      }
      duelText.text = "プレイヤーを待機中" + comma;
    } else Game.app.ticker.remove(loadingLoop);
  }
}

export function setLoadingScene() {
  Game.gameScenes["loadingScene"] = new PIXI.Container();
  const loadingText = makeArialText("Now loading");
  loadingText.position.set(250 - loadingText.width / 2, 230);
  const waku = new PIXI.Graphics()
    .lineStyle(1, 0xffffff)
    .drawRect(250 - 200, 270, 400, 30);
  const progressBar = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawRect(250 - 200, 270, 400, 30)
    .endFill();
  progressBar.width = 0;
  Game.gameScenes["loadingScene"].addChild(loadingText);
  Game.gameScenes["loadingScene"].addChild(progressBar);
  Game.gameScenes["loadingScene"].addChild(waku);

  Game.app.stage.addChild(Game.gameScenes["loadingScene"]);
  Game.app.ticker.add(loadingLoop);

  function loadingLoop() {
    Game.cycle += 60 / Game.app.ticker.FPS;
    if (Game.currentScene == "loadingScene") {
      let comma = "";
      for (var i = 0; i < (Game.cycle / 40) % 4; i++) {
        comma += ".";
      }
      loadingText.text = "Now loading" + comma;
    } else Game.app.ticker.remove(loadingLoop);
    progressBar.width = (Game.loader.progress / 100) * 400;
  }
}

export function setEndScene(winlose: number) {
  Game.gameScenes["endScene"] = new PIXI.Container();
  const duelText = new PIXI.Text(winlose == 0 ? "Win!!" : "Lose...", {
    fontFamily: "Arial",
    fontSize: 50,
    fill: winlose == 0 ? 0xff0000 : 0x000ff,
  });
  const startText = makeArialText("もう一回");
  duelText.position.set(250 - duelText.width / 2, 250);
  startText.position.set(
    250 - startText.width / 2,
    300 + 25 - startText.height / 2
  );
  const button = new PIXI.Graphics()
    .lineStyle(1, 0xffffff)
    .drawRect(250 - 150 / 2, 300, 150, 50);
  button.hitArea = new PIXI.Rectangle(250 - 150 / 2, 300, 150, 50);
  button.interactive = true;
  button.buttonMode = true;
  button
    .on("mouseover", (e) => {
      button
        .clear()
        .lineStyle(1, 0xffffff)
        .beginFill(0x444444)
        .drawRect(250 - 150 / 2, 300, 150, 50)
        .endFill();
    })
    .on("mouseout", (e) => {
      button
        .clear()
        .lineStyle(1, 0xffffff)
        .drawRect(250 - 150 / 2, 300, 150, 50);
    })
    .on("pointerup", (e) => {
      Game.app = new PIXI.Application({
        width: 500,
        height: 550,
        antialias: true,
      });
      setUp();
      Item.ItemContainer = new PIXI.Container();
      Bullet.BulletContainer = new PIXI.Container();
      setWaitingScene();
      Game.changeScene("waitingScene");
      Game.game.connectServer();
    })
    .addChild(startText);
  Game.gameScenes["endScene"].addChild(duelText);
  Game.gameScenes["endScene"].addChild(button);
  Game.app.stage.addChild(Game.gameScenes["endScene"]);
}
