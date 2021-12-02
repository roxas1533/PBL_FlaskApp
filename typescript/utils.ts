import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { Point } from "./Point";
import { GameObject } from "./RenderObject";
export function makeArialText(text: string, fontSize = 30, color = 0xffffff) {
  return new PIXI.Text(text, {
    fontFamily: "Arial",
    fontSize: fontSize,
    fill: color,
  });
}

export function colorToNum(s: string): number {
  return (parseInt(s.substr(1), 16) << 8) / 256;
}

export function collisionMapBullet(
  me: GameObject,
  vx: number,
  vy: number
): boolean {
  var x = Math.ceil(me.x + vx);
  var y = Math.ceil(me.y + vy);
  var startX = Math.floor(Math.max(Math.floor(x / 30.0), 0));
  var startY = Math.floor(Math.max(Math.floor(y / 30.0), 0));
  var endX = Math.floor(
    Math.min(
      Math.floor((x + me.width - 1.0) / 30.0),
      Game.game.globalMap[0].length
    )
  );
  var endY = Math.floor(
    Math.min(
      Math.floor((y + me.height - 1.0) / 30.0),
      Game.game.globalMap.length
    )
  );
  for (let i = startY; i <= endY; i++) {
    for (let j = startX; j <= endX; j++) {
      if (Game.game.globalMap[i][j] > 0) {
        return true;
      }
    }
  }
  return false;
}

export function collisionObject(
  obj1: GameObject,
  obj2: GameObject[],
  func: (obj: any) => void
) {
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
