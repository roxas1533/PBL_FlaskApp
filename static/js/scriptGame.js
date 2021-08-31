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
var key = 0;
var player;
var ePlayer;
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
let viewList = [];
let isLast = false;
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
  "#25523f",
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
let renderObject = [];

function connectServer() {
  renderObject = [];

  if (server ?? false) {
    server.close();
  }
  globalPlayers = undefined;
  let host = window.location.host + ":3000";

  server = new WebSocket(`ws://${host}/connect`);

  server.onmessage = async (e) => {
    const data = JSON.parse(e.data);

    if (data.id ?? false) {
      player = new Player(0, 0, 0, 0, data.id, data.hp);
      player.updateSetting();

      globalMap = data.map;
      InstanceID = data.Iid;
    } else {
      let players = data.player;
      if (gameScene === 0) {
        if (players ?? false) {
          if (players.length === 2) {
            ePlayer = new Player(0, 0, 0, 0, null, data.hp);
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
                  if (p.ID === player.id) {
                    if (i != 0) {
                      isLast = true;
                    }
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
        if (data.item ?? false) {
          globalBullets = data.bullets;
          receiveFlagO = true;
          globalItems = data.item;
        }
        if (players ?? false) {
          if (isLast) {
            players = players.reverse();
          }
          globalPlayers = players;
          receiveFlag = true;
        }
      }
    }
  };
}
window.onload = () => {
  loadSkinList();

  canvas = document.getElementById("canvas");
  c = canvas.getContext("2d");
  document.addEventListener("keydown", (e) => {
    e.preventDefault();
    const inputKey = e.key.toUpperCase();
    if (gameScene == 1) {
      if (inputKey in player.keyPow) key |= player.keyPow[inputKey];
    }
  });
  document.addEventListener("keyup", (e) => {
    if (gameScene == 1) {
      const inputKey = e.key.toUpperCase();
      if (inputKey in player.keyPow) key &= ~player.keyPow[inputKey];
    }
  });
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
function drawView(p) {
  viewList = [];
  for (i = 0; i < player.viewNum; i++) {
    // c.beginPath();
    tX = p.x + p.width / 2;
    tY = p.y + p.height / 2;
    const dig = 360 / player.viewNum;
    // c.moveTo(
    //   tX + 30 * Math.cos(((i * dig) / 180) * Math.PI) + offsetX,
    //   tY + 30 * Math.sin(((i * dig) / 180) * Math.PI) + offsetY
    // );
    let to = 30;
    for (; ; to += 1) {
      if (
        globalMap[
          Math.floor((tY + to * Math.sin(((i * dig) / 180) * Math.PI)) / 30)
        ][Math.floor((tX + to * Math.cos(((i * dig) / 180) * Math.PI)) / 30)] >
        0
      ) {
        break;
      }
    }
    // c.lineTo(
    //   tX + to * Math.cos(((i * dig) / 180) * Math.PI) + offsetX,
    //   tY + to * Math.sin(((i * dig) / 180) * Math.PI) + offsetY
    // );
    viewList.push([
      new Point(
        tX + 30 * Math.cos(((i * dig) / 180) * Math.PI) + offsetX,
        tY + 30 * Math.sin(((i * dig) / 180) * Math.PI) + offsetY
      ),
      new Point(
        tX + to * Math.cos(((i * dig) / 180) * Math.PI) + offsetX,
        tY + to * Math.sin(((i * dig) / 180) * Math.PI) + offsetY
      ),
    ]);
    // c.strokeStyle = "red";
    // c.lineWidth = 1;
    // c.stroke();
  }
  c.beginPath();
  c.moveTo(viewList[0][0].x, viewList[0][0].y);
  c.moveTo(viewList[0][1].x, viewList[0][1].y);
  c.lineTo(viewList[1][1].x, viewList[1][1].y);
  c.lineTo(viewList[1][0].x, viewList[1][0].y);

  for (let i = 1; i < viewList.length; i++) {
    let j = i;

    c.lineTo(viewList[j][1].x, viewList[j][1].y);
    if (viewList.length - 1 <= j) j = 0;
    c.lineTo(viewList[j + 1][1].x, viewList[j + 1][1].y);
    c.lineTo(viewList[j + 1][0].x, viewList[j + 1][0].y);
  }
  c.fillStyle = "#191919";

  c.fill();
  // c.fillStyle = "#FFffffff";
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
      player.show = p.Show;
      player.Sp = p.SpaceCount;
      if (player.hp < player.lastHp) {
        chageHp = 1;
        effectTimer = 0;
      } else if (player.hp > player.lastHp) chageHp = 2;

      player.lastHp = p.HP;
      if (p.HP <= 0) {
        gameScene = 2;
        reslutFlag = false;
        if (typeof loadProfile !== "undefined") loadProfile();
      }

      drawView(p);

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
      //敵
      ePlayer.hp = p.HP;
      if (p.HP <= 0) {
        gameScene = 2;
        reslutFlag = true;
        if (typeof loadProfile !== "undefined") loadProfile();
      }

      if (player.El) drawLaser(p);
      if (!player.show) c.globalCompositeOperation = "source-atop";

      if (!p.IsInvisible) dp(p);
      c.globalCompositeOperation = "source-over";

      if (player.rader) r = Math.atan2(p.y - player.y, p.x - player.x);
      if (setting.setting["show_damage"] && ePlayer.lastHp - ePlayer.hp > 0) {
        renderObject.push(
          new DamageNum(
            Math.random() * (p.width - 10) + p.x,
            Math.random() * (p.width - 10) + p.y,
            ePlayer.lastHp - ePlayer.hp
          )
        );
      }
      ePlayer.lastHp = p.HP;
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
  c.fillStyle = skinlist[p.Skin]["firearm"];

  c.save();
  c.translate(p.x + p.width / 2 + offsetX, p.y + p.height / 2 + offsetY);
  c.rotate(p.rotate);
  c.fillRect(-5, 0, 10, 30);
  c.restore();
  c.fillStyle = skinlist[p.Skin]["body"];
  // c.fillStyle = "#0000ff01";
  c.fillRect(p.x + offsetX, p.y + offsetY, p.width, p.height);
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

    if (cycle >= 100) {
      drawPlayers(globalPlayers, globalMap);
      c.globalCompositeOperation = "source-over";
      drawBullet(globalBullets);

      drawMap(globalMap);

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
      if (player.Sp > 150) c.fillStyle = "red";
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

    let i = renderObject.length;
    while (i--) {
      renderObject[i].update(cycle);
      renderObject[i].draw(c);
      if (renderObject[i].isDead) {
        renderObject.splice(i, 1);
      }
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
