import * as PIXI from "pixi.js";
import { loadProfile, openProfile } from "./profile";
import { Setting } from "./Setting";
import {
  loadPrizeList,
  loadSkinList,
  setLoadingScene,
  setTitleScene,
  setUp,
} from "./scriptGame";
import { Game } from "./Game";

window.addEventListener("load", () => {
  Game.loader = PIXI.Loader.shared;
  Game.loader.add("/static/img/items.png");
  Game.loader.add("/static/img/bulletItem.png");
  Game.loader.onComplete.add(() => {
    Game.game = new Game();
    document.addEventListener("keydown", (e) => {
      e.preventDefault();
      const inputKey = e.key.toUpperCase();
      if (Game.currentScene == "gameScene") {
        if (inputKey in Game.game.player.keyPow)
          Game.game.player.key |= Game.game.player.keyPow[inputKey];
      }
    });
    document.addEventListener("keyup", (e) => {
      if (Game.currentScene == "gameScene") {
        const inputKey = e.key.toUpperCase();
        if (inputKey in Game.game.player.keyPow)
          Game.game.player.key &= ~Game.game.player.keyPow[inputKey];
      }
    });
    const touchControl = document.getElementById("touchControl")!.children;
    for (let i = 0; i < touchControl.length; i++) {
      touchControl[i].addEventListener("touchstart", (e) => {
        e.preventDefault();
        const button = <HTMLElement>e.currentTarget;
        button.classList.add("tourch-button-pushed");
        if (Game.currentScene == "gameScene") {
          Game.game.player.key |=
            Game.game.player.keyPow[button.getAttribute("data")!];
        }
      });
    }
    for (let i = 0; i < touchControl.length; i++) {
      touchControl[i].addEventListener("touchend", (e) => {
        e.preventDefault();
        const button = <HTMLElement>e.currentTarget;
        button.classList.remove("tourch-button-pushed");
        if (Game.currentScene == "gameScene") {
          Game.game.player.key &=
            ~Game.game.player.keyPow[button.getAttribute("data")!];
        }
      });
    }

    setTitleScene();
    Game.changeScene("titleScene");
  });
  loadSkinList(() => {
    loadPrizeList(() => {
      setUp(false);
      setLoadingScene();
      Game.changeScene("loadingScene");
      Game.loader.load();
    });
  });
});

window.addEventListener("DOMContentLoaded", () => {
  Game.app = new PIXI.Application({
    width: 500,
    height: 550,
    antialias: true,
  });
  const loadingDOM = document.getElementById("loading")!;

  const settingButton = document.getElementById("settingButton");
  if (settingButton)
    settingButton.addEventListener("click", Setting.openSetting);

  loadProfile();
  const openProfileDom = document.getElementById("openProfile");
  if (openProfileDom) openProfileDom.addEventListener("click", openProfile);

  fetch("http://" + window.location.host + "/setting", {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((res) => {
      Game.setting = new Setting(
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
