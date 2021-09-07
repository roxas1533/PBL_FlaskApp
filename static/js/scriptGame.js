function loadSkinList() {
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
      res = JSON.parse(res);
      skinlist = res["list"];
      nowSkin = res["skin"];
      changeSkin = nowSkin;
    });
}

var canvas;
var c;
var player;
var ePlayer;
var server = null;
var offsetX = 0;
var offsetY = 0;
let currentScene = "titleScene";
var globalMap;
var globalPlayers;
let globalItems = [];
let globalBullets = [];
let receiveFlag;
let InstanceID;
let cycle = 0;

const BT = [1, 3, 3, 10, 10, 5, 1, 10];
const ItemColor = {
  1: "black",
  2: "green",
  3: "yellow",
  4: "red",
  5: "white",
  6: "#00AEEF",
  7: "#7cfc00",
  10: "#25523f",
};

let renderObject = [];

function connectServer() {
  renderObject = [];

  if (server ?? false) {
    server.close();
  }
  let host = window.location.host + ":3000";

  server = new WebSocket(`ws://${host}/connect`);
  let myid = 0;

  server.onmessage = async (e) => {
    const data = JSON.parse(e.data);

    if ((data.player ?? false) && data.player.length === 2) {
      data.Item.forEach((item) => {
        globalItems.push(
          new Item(item.x, item.y, item.width, item.height, item.ID)
        );
      });
      data.Bullet.forEach((bullet) => {
        renderObject.push(Object.assign(new Bullet(), bullet).onStage());
      });
      globalPlayers = data.player;
      receiveFlag = true;
    }
    if (data.id ?? false) {
      globalMap = data.map;
      InstanceID = data.Iid;
      myid = data.id;
    } else {
      let players = data.player;
      if (currentScene === "loadingScene") {
        if (players ?? false) {
          if (players.length === 2) {
            currentScene = "gameScene";
            let formData = new FormData();
            formData.append("id", InstanceID);
            await fetch(`http://${host}/getPoint`, {
              method: "POST",
              mode: "cors",
              body: formData,
            })
              .then((response) => {
                return response.json();
              })
              .then((res) => {
                res["player"].forEach((p, i) => {
                  if (p.ID == myid) {
                    if (i != 0) {
                      isLast = true;
                    }
                    player = new Player(
                      p.x,
                      p.y,
                      p.width,
                      p.height,
                      myid,
                      p.HP,
                      p.Skin
                    );
                    player.updateSetting();
                    player.name = p.Name;
                    renderObject.push(
                      new PointObject(-300, 10, 20, p.Name, p.Cv)
                    );
                  } else {
                    ePlayer = new Player(
                      p.x,
                      p.y,
                      p.width,
                      p.height,
                      null,
                      p.HP,
                      p.Skin
                    );
                    renderObject.push(
                      new PointObject(500, 100, -20, p.Name, p.Cv)
                    );
                  }
                });
              });
            setGameScene(globalMap);
            changeScene("gameScene");
          }
        }
      }
    }
  };
}

function setTitleScene() {
  app.ticker.maxFPS = 60;
  app.ticker.minFPS = 60;
  gameScenes["titleScene"] = new PIXI.Container();
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
    connectServer();
  });
  button.addChild(startText);
  gameScenes["titleScene"].addChild(duelText);
  gameScenes["titleScene"].addChild(button);
  app.stage.addChild(gameScenes["titleScene"]);
}

function setLoadinScene() {
  gameScenes["loadingScene"] = new PIXI.Container();
  const duelText = new PIXI.Text("プレイヤーを待機中", {
    fontFamily: "Arial",
    fontSize: 30,
    fill: 0xffffff,
  });
  duelText.position.set(250 - duelText.width / 2, 250);
  gameScenes["loadingScene"].addChild(duelText);
  app.stage.addChild(gameScenes["loadingScene"]);
  app.ticker.add(loadingLoop);
  function loadingLoop() {
    cycle += 60 / app.ticker.FPS;
    if (currentScene == "loadingScene") {
      if (server.readyState == 1) {
        server.send(JSON.stringify({ key: 0 }));
      }
      let comma = "";
      for (var i = 0; i < (cycle / 40) % 4; i++) {
        comma += ".";
      }
      duelText.text = "プレイヤーを待機中" + comma;
    } else app.ticker.remove(setLoadinScene);
  }
}
function setGameScene(map) {
  offsetX = offsetY = 0;
  gameScenes["gameScene"] = new PIXI.Container();
  const gameCanvas = new PIXI.Container();
  gameCanvas.visible = false;
  gameScenes["gameScene"].addChild(gameCanvas);
  const lightCanvas = new PIXI.Graphics();
  const UICanvas = new PIXI.Graphics();
  // lightCanvas.mask = ePlayer.cont;
  ePlayer.cont.mask = player.maskCanvas;
  lightCanvas.filters = [new PIXI.filters.BlurFilter()];
  gameCanvas.addChild(lightCanvas);
  const mapContainer = new PIXI.Container();
  let pol = [];

  map.forEach((e, i) => {
    e.forEach((b, j) => {
      if (b === 1) {
        let obj = new PIXI.Graphics();
        obj.beginFill(0x808080);
        obj.drawRect(j * 30 + offsetX, i * 30 + offsetY, 30, 30);
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

  player.onStage(gameCanvas);
  ePlayer.onStage(gameCanvas);
  const FPS = new PIXI.Text(app.ticker.FPS + "", {
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
  UICanvas.addChild(player.HPbar);

  const bullettext = new PIXI.Text("Bullet", {
    fontFamily: "Arial",
    fontSize: 11,
    fill: 0xffffff,
  });
  bullettext.position.set(200, 525 - bullettext.height);
  UICanvas.addChild(bullettext);

  const bulletMaxText = new PIXI.Text(
    Math.floor(player.C / BT[player.BT]) +
      "/" +
      Math.floor(player.MC / BT[player.BT]),
    {
      fontFamily: "Arial",
      fontSize: 20,
      fill: 0xffffff,
    }
  );
  bulletMaxText.position.set(210, 525);
  UICanvas.addChild(bulletMaxText);

  if (player.Sp > 150) c.fillStyle = "red";

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

  let i = renderObject.length;
  while (i--) {
    renderObject[i].onStage(gameScenes["gameScene"]);
  }
  app.stage.addChild(gameScenes["gameScene"]);
  var segments = VisibilityPolygon.convertToSegments(pol);
  segments = VisibilityPolygon.breakIntersections(segments);
  cycle = 0;
  app.ticker.add(gameLoop);
  function gameLoop() {
    let delta = 60 / app.ticker.FPS;
    FPS.text = app.ticker.FPS;
    if (currentScene == "gameScene") {
      for (let i = renderObject.length - 1; i >= 0; i--) {
        renderObject[i].update(delta);
        if (renderObject[i].isDead) {
          renderObject[i].outStage();
          renderObject.splice(i, 1);
        }
      }
      if (cycle >= 100 * delta) {
        gameCanvas.visible = true;
        drawPlayers(globalPlayers, globalMap, delta);

        drawView(player.maskCanvas, lightCanvas, segments);
        mapContainer.position.set(offsetX, offsetY);

        for (let i = globalItems.length - 1; i >= 0; i--) {
          globalItems[i].update();
          collisionObject(globalItems[i], [player, ePlayer], (obj) => {
            if (obj === player) {
              if (globalItems[i].ID >= 9 && globalItems[i].ID <= 18) {
                if (player.item ?? false) player.item.isDead = true;
                const uiitem = new Item(
                  370 + 2.5,
                  520 + 2.5,
                  15,
                  15,
                  globalItems[i].ID,
                  1
                );
                UICanvas.addChild(uiitem.wrapper);
                renderObject.push(uiitem);
                player.item = uiitem;
              }
            }
            globalItems[i].isDead = true;
            Item.ItemContainer.removeChild(globalItems[i].wrapper);
            globalItems.splice(i, 1);
          });
        }
        if (player.effect > 0) {
          effectLine.clear();
          effectLine.lineStyle(2, 0x0000ff);
          effectLine.moveTo(0, 500);
          effectLine.lineTo(player.effect * 500, 500);
        }
        if ((player.key & 128) > 0 && (player.item ?? false))
          player.item.isDead = true;

        if (player.chageHp != 0) {
          console.log("aaa");
          // if (player.chageHp == 1)
          //   c.fillStyle = `rgba(255,0,0,${(50 - player.effectTimer) / 90})`;
          // if (player.chageHp == 2)
          //   c.fillStyle = `rgba(0,255,0,${(50 - player.effectTimer) / 90})`;
          player.effectTimer++;
          // c.fillRect(0, 0, 600, 600);
          if (player.effectTimer > 50) {
            player.chageHp = 0;
            player.effectTimer = 0;
          }
        }
        bulletMaxText.text =
          Math.floor(player.C / BT[player.BT]) +
          "/" +
          Math.floor(player.MC / BT[player.BT]);
        server.send(JSON.stringify({ key: player.key }));

        receiveFlag = false;
        if (currentScene != "gameScene") app.ticker.remove(gameLoop);
      }
    }
  }
}

function setEndScene(winlose) {
  gameScenes["endScene"] = new PIXI.Container();
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
    app = new PIXI.Application({
      width: 500,
      height: 550,
      antialias: true,
    });
    setUp();
    globalBullets = [];
    globalItems = [];
    globalMap = [];
    Item.ItemContainer = new PIXI.Container();
    Bullet.BulletContainer = new PIXI.Container();
    setLoadinScene();
    changeScene("loadingScene");
    connectServer();
  });
  button.addChild(startText);
  gameScenes["endScene"].addChild(duelText);
  gameScenes["endScene"].addChild(button);
  app.stage.addChild(gameScenes["endScene"]);
}

function changeScene(nextScene) {
  currentScene = nextScene;
  Object.keys(gameScenes).forEach((scene) => {
    if (scene === nextScene) gameScenes[scene].visible = true;
    else gameScenes[scene].visible = false;
  });
}

let app = new PIXI.Application({
  width: 500,
  height: 550,
  antialias: true,
});
let gameScenes = {};

function setUp() {
  canvas = document.getElementById("canvas");
  cycle = 0;

  while (canvas.lastChild) {
    canvas.removeChild(canvas.lastChild);
  }
  canvas.appendChild(app.view);
}

window.onload = () => {
  loadSkinList();

  setUp();
  document.addEventListener("keydown", (e) => {
    e.preventDefault();
    const inputKey = e.key.toUpperCase();
    if (currentScene == "gameScene") {
      if (inputKey in player.keyPow) player.key |= player.keyPow[inputKey];
    }
  });
  document.addEventListener("keyup", (e) => {
    if (currentScene == "gameScene") {
      const inputKey = e.key.toUpperCase();
      if (inputKey in player.keyPow) player.key &= ~player.keyPow[inputKey];
    }
  });

  setTitleScene();
};

function drawLaser(p) {
  c.beginPath();
  tX = p.x + p.width / 2;
  tY = p.y + p.height / 2;
  c.moveTo(
    tX + 30 * Math.cos(p.rotate + Math.PI / 2) + offsetX,
    tY + 30 * Math.sin(p.rotate + Math.PI / 2) + offsetY
  );
  let to = 30;
  for (; ; to++) {
    if (
      globalMap[Math.floor((tY + to * Math.sin(p.rotate + Math.PI / 2)) / 30)][
        Math.floor((tX + to * Math.cos(p.rotate + Math.PI / 2)) / 30)
      ] > 0
    ) {
      break;
    }
  }
  c.lineTo(
    tX + to * Math.cos(p.rotate + Math.PI / 2) + offsetX,
    tY + to * Math.sin(p.rotate + Math.PI / 2) + offsetY
  );
  c.strokeStyle = "red";
  c.lineWidth = 1;
  c.stroke();
}
function drawView(maskCanvas, lightCanvas, segments) {
  const position = [player.x + player.width / 2, player.y + player.height / 2];
  let visibility = VisibilityPolygon.computeViewport(
    position,
    segments,
    [player.x - 500, player.y - 500],
    [player.x + 500, player.y + 500]
  );
  lightCanvas.clear();
  lightCanvas.beginFill(0x444444);
  maskCanvas.clear();
  maskCanvas.beginFill(0xffff00);
  const startX = visibility[0][0] + offsetX;
  const startY = visibility[0][1] + offsetY;
  lightCanvas.moveTo(startX, startY);
  maskCanvas.moveTo(startX, startY);
  for (var j = 1; j <= visibility.length; j++) {
    const endX = visibility[j % visibility.length][0] + offsetX;
    const endY = visibility[j % visibility.length][1] + offsetY;
    lightCanvas.lineTo(endX, endY);
    maskCanvas.lineTo(endX, endY);
  }
  lightCanvas.endFill();
  maskCanvas.endFill();
}
function drawLightning(x, y) {
  let startX = x,
    startY = y;
  c.beginPath();
  c.moveTo(x, y);
  x += 12.5 * Math.cos((110 * Math.PI) / 180);
  y += 12.5 * Math.sin((110 * Math.PI) / 180);
  c.lineTo(x, y);
  x += 7.5 * Math.cos((-5 * Math.PI) / 180);
  y += 7.5 * Math.sin((-5 * Math.PI) / 180);
  c.lineTo(x, y);
  x += 20 * Math.cos((130 * Math.PI) / 180);
  y += 20 * Math.sin((130 * Math.PI) / 180);
  c.lineTo(x, y);
  x += 12.5 * Math.cos((-65 * Math.PI) / 180);
  y += 12.5 * Math.sin((-65 * Math.PI) / 180);
  c.lineTo(x, y);
  x += 7.5 * Math.cos((175 * Math.PI) / 180);
  y += 7.5 * Math.sin((175 * Math.PI) / 180);
  c.lineTo(x, y);
  x = startX;
  y = startY;
  c.lineTo(x, y);
  c.strokeStyle = "yellow";
  c.fillStyle = "yellow";
  c.stroke();
  c.fill();
}

function drawPoison(x, y) {
  c.fillStyle = "#FF00FF";
  c.strokeStyle = "white";
  c.lineWidth = 1;

  c.beginPath();
  c.arc(x - 8, y, 10, 0, 2 * Math.PI);
  c.fill();
  c.stroke();
  c.beginPath();
  c.arc(x, y + 17, 7, 0, 2 * Math.PI);
  c.fill();
  c.stroke();
  c.beginPath();
  c.arc(x + 8, y + 5, 4, 0, 2 * Math.PI);
  c.fill();
  c.stroke();

  c.fillStyle = "white";
  c.beginPath();
  c.arc(x - 4, y - 5, 3.1, 0, 2 * Math.PI);
  c.fill();
  c.beginPath();
  c.arc(x + 3.5, y + 14, 2, 0, 2 * Math.PI);
  c.fill();
  c.beginPath();
  c.arc(x + 9, y + 4, 1, 0, 2 * Math.PI);
  c.fill();
  // c.fillRect(x, y, 30, 300)
}
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
function collisionMap(x, y, map) {
  x = Math.ceil(x);
  y = Math.ceil(y);
  let startX = Math.max(Math.floor(x / 30.0), 0) | 0;
  let startY = Math.max(Math.floor(y / 30.0), 0) | 0;
  let endX = Math.min(Math.floor((x + 30.0 - 1.0) / 30.0), map[0].length) | 0;
  let endY = Math.min(Math.floor((y + 30.0 - 1.0) / 30.0), map.length) | 0;
  for (let i = startY; i <= endY; i++) {
    for (j = startX; j <= endX; j++) {
      if (map[i][j] == 1) {
        return new Point(j, i);
      }
    }
  }
  return null;
}
function drawPlayers(players, map, delta) {
  let r = 0;

  players.forEach((p, i) => {
    if (!receiveFlag) {
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
    if (p.ID === player.id) {
      op = player;
      offsetX = 250 - p.x;
      offsetX = Math.min(offsetX, 0);
      offsetX = Math.max(offsetX, 500 - map[0].length * 30);
      offsetY = 250 - p.y;
      offsetY = Math.min(offsetY, 0);
      offsetY = Math.max(offsetY, 500 - map.length * 30);

      if (op.isV != p.IsInvisible) {
        if (p.IsInvisible) op.enalbeInvisible();
        else op.disableInvisible();
      }
      if (op.show != p.Show) {
        if (p.Show) ePlayer.cont.mask = null;
        else ePlayer.cont.mask = player.maskCanvas;
      }
      if (op.rader != p.Rader) player.raderArrow.visible = p.Rader;
    } else {
      op = ePlayer;
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
    op.El = p.EnemyLaser;
    op.isV = p.IsInvisible;
    op.rader = p.Rader;
    op.show = p.Show;
    op.Sp = p.SpaceCount;
    op.R = p.rotate;
    if (op.hp != op.lastHp) op.HPbar.width = op.hp;
    if (op.hp < op.lastHp) {
      op.chageHp = 1;
      op.effectTimer = 0;
    } else if (op.hp > op.lastHp) op.chageHp = 2;
    op.lastHp = p.HP;
    if (op.hp <= 0) {
      setEndScene(op == player ? 1 : 0);
      changeScene("endScene");

      if (typeof loadProfile !== "undefined") loadProfile();
    }

    op.x = p.x;
    op.y = p.y;
    op.width = p.width;
    op.height = p.height;
    op.update();
    // if (setting.setting["show_damage"] && ePlayer.lastHp - ePlayer.hp > 0) {
    //   renderObject.push(
    //     new DamageNum(
    //       Math.random() * (p.width - 10) + p.x,
    //       Math.random() * (p.width - 10) + p.y,
    //       ePlayer.lastHp - ePlayer.hp
    //     )
    //   );
    // }
    ePlayer.lastHp = p.HP;
  });
}
function dp(p) {
  if (p.Status ?? false) {
    var statusCount = p.Status.length - 1;
    p.Status.forEach((s, i) => {
      if (s.Type == 0)
        drawLightning(
          p.x + offsetX + p.width / 2 + 5 - statusCount * 15,
          p.y + offsetY - 50
        );
      if (s.Type == 1)
        drawPoison(
          p.x + offsetX + p.width / 2 + statusCount * 15,
          p.y + offsetY - 50
        );
    });
  }
  c.fillStyle = skinlist[p.Skin]["firearm"];
}
