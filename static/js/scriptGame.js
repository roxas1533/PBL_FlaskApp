class Object {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
}
class Button extends Object {
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
class Player extends Object {
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
    this.name = "";
    this.enemyName = "";
    this.cv = 0;
    this.enemyCv = 0;
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

class PointObject extends Object {
  constructor(x, y, vx, txt, cv) {
    c = canvas.getContext("2d");
    super(x, y, 300, 70);
    this.name = txt;
    this.cv = cv;
    this.vx = vx;
    this.m = 0;
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
    if (this.vx != 0)
      this.textPos =
        this.vx > 0
          ? this.x + this.width - this.textData.width - 10
          : this.x + 10;

    this.x += this.vx;
    if (this.m >= 250) this.vx = 0;
    this.m += Math.abs(this.vx);
  }
}

var canvas;
var c;
var key = 0;
var player;
var server = null;
var offsetX = 0;
var offsetY = 0;
var gameScene = -1;
var reslutFlag = false;
var pointX = 0;
var pointY = 0;
var globalMap;
var globalPlayers;
let globalItems;
let globalBullets;
let receiveFlag;
let receiveFlagO;
let InstanceID;
const BT = [1, 3, 3, 10, 10, 5, 1, 10];
const ItemColor = [
  "#ff1493",
  "black",
  "green",
  "yellow",
  "red",
  "white",
  "#00AEEF",
  "#7cfc00",
  "brown",
  "blue",
  "#800000",
  "#800000",
  "#90ee90",
  "#ff8c00",
  "#ffd700",
  "#FF00FF",
  "#808000",
  "#cd853f",
  "#32cd32",
];
const ItemDetail = [
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
  "ポインター表示",
  "敵のポインター",
  "透明化",
  "射程増加",
  "スタン付与",
  "毒付与",
  "オートエイム",
  "貫通弾",
  "レーダー",
];
let renderObject = [];
function keydown(e) {
  e.preventDefault();
  if (gameScene == 1) {
    if (e.keyCode >= 37 && e.keyCode <= 40)
      key = key | Math.pow(2, e.keyCode - 37);
    if (e.keyCode == 32) {
      key |= Math.pow(2, 4);
      return false;
    }
    if (e.keyCode == 65) key |= Math.pow(2, 5);
    if (e.keyCode == 68) key |= Math.pow(2, 6);
    if (e.keyCode === 90) key |= Math.pow(2, 7);
  }
  // console.log(e.keyCode) /
}
function keyUp(e) {
  if (gameScene == 1) {
    if (e.keyCode >= 37 && e.keyCode <= 40) key &= ~Math.pow(2, e.keyCode - 37);
    if (e.keyCode == 32) key &= ~Math.pow(2, 4);
    if (e.keyCode == 65) key &= ~Math.pow(2, 5);
    if (e.keyCode === 68) key &= ~Math.pow(2, 6);
    if (e.keyCode === 90) key &= ~Math.pow(2, 7);
  }
}
function connectServer() {
  renderObject = [];

  if (server ?? false) {
    server.close();
  }
  globalPlayers = undefined;
  let host = window.location.host;
  server = new WebSocket(`ws://${host.replace(/:5000/g, ":3000")}/connect`);

  server.onmessage = async (e) => {
    const data = JSON.parse(e.data);

    if (data.id ?? false) {
      player = new Player(0, 0, 0, 0, data.id, data.hp);
      globalMap = data.map;
      InstanceID = data.Iid;
    } else {
      let players = data.player;
      if (gameScene === 0) {
        if (players ?? false) {
          if (players.length === 2) {
            let formData = new FormData();
            formData.append("id", InstanceID);
            await etch(`http://${host.replace(/:5000/g, ":3000")}/getPoint`, {
              method: "POST",
              mode: "cors",
              body: formData,
            })
              .then((response) => {
                return response.json();
              })
              .then((res) => {
                res["player"].forEach((p, _) => {
                  if (p.ID === player.id) {
                    player.name = p.Name;
                    renderObject.push(
                      new PointObject(-300, 10, 20, p.Name, p.Cv)
                    );
                  } else {
                    player.enemyName = p.Name;
                    renderObject.push(
                      new PointObject(500, 100, -20, p.Name, p.Cv)
                    );
                  }
                });
              });
            gameScene = 1;
            cycle = 0;
          }
        }
      } else {
        globalBullets = data.bullets;
        receiveFlagO = true;
        globalItems = data.item;
        if (players ?? false) {
          globalPlayers = players;
          receiveFlag = true;
        }
      }
    }
  };
}
window.onload = () => {
  canvas = document.getElementById("canvas");
  c = canvas.getContext("2d");
  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyUp);
  canvas.addEventListener(
    "mousemove",
    function (e) {
      var rect = canvas.getBoundingClientRect();
      pointX = e.clientX - rect.left;
      pointY = e.clientY - rect.top;
    },
    false
  );
  canvas.addEventListener(
    "click",
    function (e) {
      if (gameScene === 2 || gameScene === -1) button.click(c);
    },
    false
  );
  key = 0;
  // connectServer();
  loop();
};

function drawItem(item) {
  if (item ?? false) {
    item.forEach((it, ind) => {
      c.fillStyle = ItemColor[it.ID];
      c.strokeStyle = "#FFFFFF";
      c.fillRect(it.x + offsetX, it.y + offsetY, it.width, it.height);
      c.strokeRect(it.x + offsetX, it.y + offsetY, it.width, it.height);
    });
  }
}
var chageHp = 0;
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
function drawArrow(p, r) {
  c.save();
  c.translate(p.x + p.width / 2 + offsetX, p.y + p.height / 2 + offsetY);
  c.rotate(r);
  let startX = (x = 0),
    startY = (y = -70);
  c.beginPath();
  c.moveTo(x, y);
  x += 15 * Math.cos((50 * Math.PI) / 180);
  y += 15 * Math.sin((50 * Math.PI) / 180);
  c.lineTo(x, y);
  x += 7 * Math.cos(Math.PI);
  y += 7 * Math.sin(Math.PI);
  c.lineTo(x, y);
  x += 20 * Math.cos(Math.PI / 2);
  y += 20 * Math.sin(Math.PI / 2);
  c.lineTo(x, y);
  x += 7 * Math.cos(Math.PI);
  y += 7 * Math.sin(Math.PI);
  c.lineTo(x, y);
  x += 20 * Math.cos(-Math.PI / 2);
  y += 20 * Math.sin(-Math.PI / 2);
  c.lineTo(x, y);
  x += 7.5 * Math.cos(Math.PI);
  y += 7.5 * Math.sin(Math.PI);
  c.lineTo(x, y);
  x = startX;
  y = startY;
  c.lineTo(x, y);
  c.strokeStyle = "white";
  c.fillStyle = "#00bfff";
  c.stroke();
  c.fill();
  c.restore();
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
function drawPlayers(players, map) {
  let r = 0;
  players.forEach((p, i) => {
    if (!receiveFlag) {
      // if ((key & 1) > 0) {
      //     p.vx = -p.mv
      // }
      // if ((key & 4) > 0) {
      //     p.vx = p.mv
      // }
      // if ((key & 2) > 0) {
      //     p.vy = -p.mv
      // }
      // if ((key & 8) > 0) {
      //     p.vy = p.mv
      // }
      // if ((key & 5) == 0) {
      //     p.vx = 0;
      // }
      // if ((key & 10) == 0) {
      //     p.vy = 0;
      // }
      let point = collisionMap(p.x + p.vx, p.y, map);
      if (!point) {
        p.x += p.vx;
      } else {
        if (p.vx < 0) {
          p.x = (point.x + 1) * 30;
        } else if (p.vx > 0) {
          p.x = point.x * 30 - 30;
        }
      }
      point = collisionMap(p.x, p.y + p.vy, map);
      if (!point) {
        p.y += p.vy;
      } else {
        if (p.vy < 0) {
          p.y = (point.y + 1) * 30;
        } else if (p.vy > 0) {
          p.y = point.y * 30 - 30;
        }
      }
    }
    if (p.ID === player.id) {
      offsetX = 250 - p.x;
      offsetX = Math.min(offsetX, 0);
      offsetX = Math.max(offsetX, 500 - map[0].length * 30);
      offsetY = 250 - p.y;
      offsetY = Math.min(offsetY, 0);
      offsetY = Math.max(offsetY, 500 - map.length * 30);

      player.hp = p.HP;
      player.C = p.Charge;
      player.MC = p.MaxCharge;
      player.BT = p.BT;
      player.itemStock = p.ItemStock;
      player.effect = p.Effect;
      player.El = p.EnemyLaser;
      player.isV = p.IsInvisible;
      player.rader = p.Rader;
      if (player.hp < player.lastHp) chageHp = 1;
      else if (player.hp > player.lastHp) chageHp = 2;

      player.lastHp = p.HP;
      if (p.HP <= 0) {
        gameScene = 2;
        reslutFlag = false;
      }

      if (p.Laser) drawLaser(p);
      if (player.isV) {
        c.strokeStyle = "blue";
        c.save();
        c.translate(p.x + p.width / 2 + offsetX, p.y + p.height / 2 + offsetY);
        c.rotate(p.rotate);
        c.strokeRect(-5, 0, 10, 30);
        c.restore();
        c.fillStyle = "black";
        c.fillRect(p.x + offsetX, p.y + offsetY, p.width, p.height);
        c.strokeRect(p.x + offsetX, p.y + offsetY, p.width, p.height);
      } else dp(p);

      player.x = p.x;
      player.y = p.y;
      player.width = p.width;
      player.height = p.height;
    } else {
      if (p.HP <= 0) {
        gameScene = 2;
        reslutFlag = true;
      }
      if (player.El) drawLaser(p);
      if (!p.IsInvisible) dp(p);
      if (player.rader) r = Math.atan2(p.y - player.y, p.x - player.x);
    }
  });
  if (player.rader) drawArrow(player, r + Math.PI / 2);
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
  c.fillStyle = "blue";
  c.fillRect(p.x + offsetX, p.y + offsetY, p.width, p.height);
  c.save();
  c.translate(p.x + p.width / 2 + offsetX, p.y + p.height / 2 + offsetY);
  c.rotate(p.rotate);
  c.fillRect(-5, 0, 10, 30);
  c.restore();
}
function drawMap(map) {
  c.fillStyle = "gray";
  c.strokeStyle = "#FFFFFF";

  map.forEach((e, i) => {
    e.forEach((b, j) => {
      if (b === 1) {
        c.fillRect(j * 30 + offsetX, i * 30 + offsetY, 30, 30);
      }
      // } else {
      //     c.strokeRect(j * 30 + offsetX, i * 30 + offsetY, 30, 30)
      // }
    });
  });
}
function drawBullet(bullets) {
  if (bullets ?? false) {
    bullets.forEach((e, i) => {
      if (!e.IsInvisible || e.ID == player.id) {
        if (e.IsStunA) c.fillStyle = "#7cfc00";
        else c.fillStyle = "red";

        if (!receiveFlagO) {
          e.x += e.vx;
          e.y += e.vy;
        }
        c.fillRect(e.x + offsetX, e.y + offsetY, e.width, e.height);
      }
    });
  }
}
let cycle = 0;
let button = new Button(250 - 150 / 2, 300, 150, 50, "START");
let effectTimer = 0;
function loop() {
  c.clearRect(0, 0, 500, 550);

  if (gameScene === -1) {
    c.fillStyle = "rgb(0,0,0)";
    c.fillRect(0, 0, 550, 550);
    c.font = "50pt Arial";
    var t = "DUEL";
    c.fillStyle = "white";
    c.fillText(t, 250 - c.measureText(t).width / 2, 250);
    button.draw(c);
  } else if (gameScene === 0) {
    cycle++;
    if (server.readyState == 1) {
      server.send(JSON.stringify({ key: 0 }));
    }
    c.font = "20pt Arial";
    c.fillStyle = "rgb(0,0,0)";
    c.fillRect(0, 0, 550, 550);
    let comma = "";
    for (var i = 0; i < (cycle / 50) % 4; i++) {
      comma += ".";
    }
    var t = "プレイヤーを待機中";
    c.fillStyle = "white";
    c.fillText(t + comma, 250 - c.measureText(t).width / 2, 250);
  } else if (gameScene === 1) {
    cycle++;

    if (cycle < 100) {
      renderObject.forEach((o, i) => {
        o.update(cycle);
        o.draw(c);
      });
    } else {
      drawBullet(globalBullets);
      drawMap(globalMap);

      if (globalPlayers ?? false) drawPlayers(globalPlayers, globalMap);
      drawItem(globalItems);

      c.font = "9pt Arial";
      c.fillStyle = "black";
      c.fillRect(0, 500, 500, 50);
      c.strokeStyle = "white";
      c.beginPath();
      c.moveTo(0, 500);
      c.lineTo(500, 500);
      c.lineWidth = 2;
      c.stroke();

      if (player.effect > 0) {
        c.strokeStyle = "blue";
        c.beginPath();
        c.moveTo(0, 500);
        c.lineTo(500 * player.effect, 500);
        c.stroke();
      }

      c.fillStyle = "white";
      c.fillText("HP", 50, 518);
      c.fillStyle = "#FF0000";
      c.fillRect(50, 520, 100, 20);
      c.fillStyle = "#00FF00";
      c.fillRect(50, 520, player.hp, 20);

      c.fillStyle = "white";
      c.fillText("Bullet", 200, 518);
      c.fillStyle = "gray";
      c.fillRect(200, 525, 130, 10);
      c.fillStyle = "white";

      const num = Math.ceil(player.MC / BT[player.BT]);
      const size = (130 - (num - 1) * 2) / num;
      for (let i = 0; i < player.C / BT[player.BT]; i++) {
        c.fillRect(200 + i * (size + 2), 525, size, 10);
      }
      c.fillStyle = "white";
      c.strokeStyle = "white";
      c.fillText("Item", 370, 518);
      c.font = "11pt Arial";
      if (player.itemStock != -1) {
        c.fillText(ItemDetail[player.itemStock], 400, 538);
        c.fillStyle = ItemColor[player.itemStock];
        c.fillRect(370 + 2.5, 520 + 2.5, 15, 15);
      }
      c.strokeRect(370, 520, 20, 20);
      if (chageHp != 0) {
        if (chageHp == 1)
          c.fillStyle = `rgba(255,0,0,${(50 - effectTimer) / 90})`;
        if (chageHp == 2)
          c.fillStyle = `rgba(0,255,0,${(50 - effectTimer) / 90})`;
        effectTimer++;
        c.fillRect(0, 0, 600, 600);
        if (effectTimer > 50) {
          chageHp = 0;
          effectTimer = 0;
        }
      }
      server.send(JSON.stringify({ key: key }));

      receiveFlag = false;
      receiveFlagO = false;
    }
  } else if (gameScene == 2) {
    button.t = "もう一回";
    server.send(JSON.stringify({ key: 0 }));
    c.fillStyle = "rgba(0,0,0,0.7)";
    c.fillRect(0, 0, 550, 550);
    c.font = "50pt Arial";
    if (reslutFlag) {
      c.fillStyle = "rgb(255,0,0)";
      var t = "Win!!";
      c.fillText(t, 250 - c.measureText(t).width / 2, 250);
    } else {
      c.fillStyle = "rgb(0,0,255)";
      var t = "Lose...";
      c.fillText(t, 250 - c.measureText(t).width / 2, 250);
    }
    button.draw(c);
  }

  window.requestAnimationFrame(() => loop());
}
