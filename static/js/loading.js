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

class GameObject {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.isDead = false;
  }
}

class Player extends GameObject {
  constructor(x, y, w, h, id, hp, skin) {
    super(x, y, w, h);
    this.id = id;
    this.hp = hp;
    this.C = 0;
    this.MC = 0;
    this.BT = 0;
    this.R = 0;
    this.lastHp = hp;
    this.itemStock = -1;
    this.item;
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
    this.firearmColor = colorToNum(skinlist[skin]["firearm"]);
    this.bodyColor = colorToNum(skinlist[skin]["body"]);
    this.maskCanvas = new PIXI.Graphics();
    this.raderArrow = new PIXI.Graphics();
    this.HPbar = new PIXI.Graphics();
    this.HPbar.beginFill(0x00ff00);
    this.HPbar.drawRect(0, 0, this.hp, 20);
    this.HPbar.endFill();
    this.HPbar.position.set(50, 520);
  }
  updateSetting() {
    let copySetting = JSON.parse(JSON.stringify(setting.setting));
    copySetting[
      Object.keys(copySetting).filter((key) => {
        return copySetting[key] === "SPACE";
      })["0"]
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
    this.cont.x = this.x + offsetX;
    this.cont.y = this.y + offsetY;
    this.renderArm.rotation = this.R;
    if (this.rader)
      this.raderArrow.rotation =
        Math.atan2(ePlayer.y - this.y, ePlayer.x - this.x) + Math.PI / 2;
  }
  shot(ls) {
    let spread = this.bullet.spread;
    if (this.C > 0 || ls > 150) {
      // if ls > 150 {
      //   newChargeShot().Shot(player, ins)
      // } else {
      this.bullet.shot(renderObject);
      // }
    }
  }
  onStage(app) {
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
  }
  enalbeInvisible() {
    this.renderBody.clear();
    this.renderBody.beginFill(0x0);
    this.renderBody.lineStyle(2, 0x0000ff);
    this.renderBody.drawRect(0, 0, this.width, this.height);
    this.renderBody.endFill();

    this.renderArm.clear();
    this.renderArm.lineStyle(2, 0x0000ff);
    this.renderArm.beginFill(0x0);
    this.renderArm.drawRect(0, 0, 10, 30);
    this.renderArm.endFill();
    this.cont.filters = [new PIXI.filters.BlurFilter(4)];
  }
  disableInvisible() {
    this.renderBody.clear();
    this.renderBody.beginFill(0x0000ff);
    this.renderBody.drawRect(0, 0, this.width, this.height);
    this.renderBody.endFill();
    this.renderArm.clear();
    this.renderArm.beginFill(0x0000ff);
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
}

//abstruct
class RenderObject extends GameObject {
  constructor(x, y, w, h) {
    super(x, y, w, h);
    this.vx = 0;
    this.vy = 0;
    this.time = 0;
  }
  draw(c) {}
  update(delta) {
    this.time += delta;
  }
  outStage(app) {}
}

class DamageNum extends RenderObject {
  constructor(x, y, num) {
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

  update(delta) {
    super.update(delta);
    this.pointContainer.x += this.vx;
    if (this.m >= 250) this.vx = 0;
    this.m += Math.abs(this.vx);
    if (this.time >= 100 * delta) this.isDead = true;
  }

  onStage(app) {
    this.pointContainer.addChild(this.fill);
    this.pointContainer.addChild(this.name);
    this.pointContainer.addChild(this.cv);
    app.addChild(this.pointContainer);
  }
  outStage() {
    this.pointContainer.parent.removeChild(this.pointContainer);
  }
}

let setting;
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function collisionObject(obj1, obj2, func) {
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

function colorToNum(s) {
  return (parseInt(s.substr(1), 16) << 8) / 256;
}
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
let loader;
window.addEventListener("load", () => {
  loader = PIXI.Loader.shared;
  loader.add("/static/img/items.png");
  loader.load();
});

class Item extends GameObject {
  static ItemImage = {
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

  constructor(x, y, w, h, ID, type = 0) {
    super(x, y, h, w);
    this.ID = ID;
    if (!(ID in Item.ItemImage)) {
      ID = 0;
    }
    let tex = new PIXI.Texture(
      loader.resources["/static/img/items.png"].texture,
      new PIXI.Rectangle(
        Item.ItemImage[ID].x * 32,
        Item.ItemImage[ID].y * 32,
        32,
        32
      )
    );

    this.sprite = new PIXI.Sprite(tex);
    this.sprite.width = w;
    this.sprite.height = h;
    this.type = type;
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
  update() {
    if (!this.type) {
      this.sprite.x = this.x + offsetX;
      this.sprite.y = this.y + offsetY;
    }
  }
  outStage() {
    this.wrapper.parent.removeChild(this.wrapper);
  }
}

//-----------------------------------銃クラス------------------------------------------------------//
class Bullet extends GameObject {
  static BulletContainer = new PIXI.Container();
  constructor() {
    super(0, 0, 0, 0);
    this.time = 0;
    this.bullet = new PIXI.Graphics();
  }
  draw(c) {
    if (!this.IsInvisible || this.ID == player.id) {
      if (!this.IsStunA) this.fillStyle = "#7cfc00";
      else c.fillStyle = "red";
      c.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);
    }
  }
  update(delta) {
    this.time += delta;
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    this.bullet.x = this.x + offsetX;
    this.bullet.y = this.y + offsetY;
    if (this.time >= this.Life) this.isDead = true;
    if (
      !this.IsSpireA &&
      globalMap[Math.floor(this.y / 30)][Math.floor(this.x / 30)] > 0
    )
      this.isDead = true;
    collisionObject(this, [ePlayer, player], (p) => {
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

//-----------------------------------銃クラスここまで------------------------------------------------------//
