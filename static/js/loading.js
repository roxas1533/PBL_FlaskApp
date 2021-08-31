class Setting {
  constructor(settingpage, gamesetting, keysetting, setting, defaultSetting) {
    this.settingpage = settingpage;
    this.gamesetting = gamesetting;
    this.keysetting = keysetting;
    this.setting = setting;
    this.tempSetting = setting;
    this.defaultSetting = defaultSetting;
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

class GaneObject {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
}
class Button extends GaneObject {
  constructor(x, y, w, h, s) {
    super(x, y, w, h, s);
    this.t = s;
    this.isclick = false;
  }
  draw(c) {
    c.font = "20pt ＭＳ Ｐゴシック";

    const m = c.measureText(this.t);
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    if (
      pointX > this.x &&
      pointX < this.x + this.width &&
      pointY > this.y &&
      pointY < this.y + this.height
    ) {
      c.fillStyle = "#444444";
      c.fillRect(this.x, this.y, this.width, this.height);
      this.isclick = true;
    } else this.isclick = false;
    c.strokeStyle = "white";
    c.fillStyle = "white";
    c.fillText(
      this.t,
      this.x + this.width / 2 - m.width / 2,
      this.y + 25 + h / 2
    );
    c.strokeRect(this.x, this.y, this.width, this.height);
  }
  click(c) {
    if (this.isclick) {
      gameScene = 0;
      chageHp = 0;
      effectTimer = 0;
      key = 0;
      connectServer();
    }
  }
}
class Player extends GaneObject {
  constructor(x, y, w, h, id, hp) {
    super(x, y, w, h);
    this.id = id;
    this.hp = hp;
    this.C = 0;
    this.MC = 0;
    this.BT = 0;
    this.lastHp = hp;
    this.itemStock = -1;
    this.effect = 0;
    this.El = false;
    this.isV = false;
    this.rader = false;
    this.show = false;
    this.name = "";
    this.enemyName = "";
    this.cv = 0;
    this.enemyCv = 0;
    this.Sp = 0;
    this.viewNum = 0;
    this.keyPow = {};
  }
  updateSetting() {
    let copySetting = JSON.parse(JSON.stringify(setting.setting));
    copySetting[
      Object.keys(copySetting).filter((key) => {
        return copySetting[key] === "SPACE";
      })["0"]
    ] = " ";

    this.viewNum = (copySetting["view_num"] / 100) * 720;
    this.keyPow[copySetting["leftkey"]] = Math.pow(2, 0);
    this.keyPow[copySetting["upkey"]] = Math.pow(2, 1);
    this.keyPow[copySetting["rightkey"]] = Math.pow(2, 2);
    this.keyPow[copySetting["downkey"]] = Math.pow(2, 3);
    this.keyPow[copySetting["firekey"]] = Math.pow(2, 4);
    this.keyPow[copySetting["useitemkey"]] = Math.pow(2, 7);
    this.keyPow[copySetting["leftarmrkey"]] = Math.pow(2, 5);
    this.keyPow[copySetting["rightarmrkey"]] = Math.pow(2, 6);
    console.log(this.keyPow);
  }
  draw(c) {
    c.fillStyle = "yellow";
    ctx.beginPath();
    c.ellipse(
      this.x + offsetX,
      this.y + offsetY,
      this.width,
      this.height,
      Math.PI / 4,
      0,
      32 * Math.PI
    );
    c.fill();
  }
}

class RenderObject extends GaneObject {
  constructor(x, y, h, w) {
    c = canvas.getContext("2d");
    super(x, y, h, w);
    this.vx = 0;
    this.vy = 0;
    this.isDead = false;
    this.time = 0;
  }
  draw(c) {}
  update() {
    this.time++;
  }
}

class DamageNum extends RenderObject {
  constructor(x, y, num) {
    c = canvas.getContext("2d");
    super(x, y, 0, 0);
    this.num = num;
    this.vx = Math.random() * 7 - 3.5;
    this.vy = -(Math.random() * 5 + 2);
    this.g = 0.6;
    this.alpha = 1.0;
  }
  draw(c) {
    // c.font = "20pt Dosis";
    c.fillStyle = `rgba(255,255,255,${this.alpha})`;
    c.fillText(this.num, this.x + offsetX, this.y + offsetY);
  }
  update() {
    super.update();
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.g;
    this.vy = Math.min(this.vy, 6);
    if (this.time > 17) this.alpha -= 0.2;
    if (this.time > 22) this.isDead = true;
  }
}

class PointObject extends RenderObject {
  constructor(x, y, vx, txt, cv) {
    c = canvas.getContext("2d");
    super(x, y, 300, 70);
    this.name = txt;
    this.cv = cv;
    this.m = 0;
    this.vx = vx;
    this.textData = c.measureText(txt);
    this.textH =
      this.textData.actualBoundingBoxAscent +
      this.textData.actualBoundingBoxDescent;
  }
  draw(c) {
    c.fillStyle = "#FFFFFF";
    c.fillRect(this.x, this.y, this.width, this.height);
    c.fillStyle = "#999999";
    c.fillText(this.name, this.textPos, this.y + 5 + this.textH);
    c.fillStyle = "#888888";
    c.fillText(this.cv + "連勝", this.textPos, this.y + 15 + this.textH * 2);
  }
  update() {
    super.update();
    if (this.vx != 0)
      this.textPos =
        this.vx > 0
          ? this.x + this.width - this.textData.width - 10
          : this.x + 10;

    this.x += this.vx;
    if (this.m >= 250) this.vx = 0;
    this.m += Math.abs(this.vx);
    if (this.time >= 100) this.isDead = true;
  }
}

let setting;

window.addEventListener("DOMContentLoaded", () => {
  loadingDOM = document.getElementById("loading");
  if (typeof loadProfile !== "undefined") loadProfile();
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
