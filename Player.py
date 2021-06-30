import math

key = {
    "left": 1,
    "up": 2,
    "right": 4,
    "down": 8,
    "space": 16,
    "A": 32,
    "D": 64,
    "Z": 128,
}
import ctypes

libc = ctypes.CDLL("./lib.so")


class Object:
    def __init__(self, x, y, w, h) -> None:
        self.x = x
        self.y = y
        self.width = w
        self.height = h


class Player(Object):
    def __init__(self, x, y, w, h, id) -> None:
        super().__init__(x, y, w, h)
        self.key = 0
        self.vx = 0
        self.vy = 0
        self.rotate = 3.14
        self.HP = 100
        self.ID = id
        self.MaxV = 3
        self.Charge = 10
        self.MaxCharge = 10
        self.ItemStock = -1
        self.mv = 3
        self.BT = 0
        self.BaseSpeed = 0

    def collisionMap(self, x, y, MapID):
        a = ctypes.c_double(x)
        b = ctypes.c_double(y)
        ret = libc.collisionMap(a, b, MapID)
        if ret < 0:
            return -1, -1
        return ret >> 16, ret & 65535

    def update(self):

        if (self.key & key["left"]) > 0:
            self.vx = -(self.MaxV + self.BaseSpeed)

        if (self.key & key["up"]) > 0:
            self.vy = -(self.MaxV + self.BaseSpeed)

        if (self.key & key["right"]) > 0:
            self.vx = self.MaxV + self.BaseSpeed
        if (self.key & key["down"]) > 0:
            self.vy = self.MaxV + self.BaseSpeed
        if (self.key & key["A"]) > 0:
            self.rotate -= 0.02
        if (self.key & key["D"]) > 0:
            self.rotate += 0.02
        if (self.key & key["left"]) == 0 and (self.key & key["right"]) == 0:
            self.vx = 0

        if (self.key & key["down"]) == 0 and (self.key & key["up"]) == 0:
            self.vy = 0

        x, _ = self.collisionMap(self.x + self.vx, self.y, 0)
        if x == -1:
            self.x += self.vx
        else:
            if self.vx < 0:
                self.x = (x + 1) * 30
            elif self.vx > 0:
                self.x = x * 30 - 30

        _, y = self.collisionMap(self.x, self.y + self.vy, 0)
        if y == -1:
            self.y += self.vy
        else:
            if self.vy < 0:
                self.y = (y + 1) * 30
            elif self.vy > 0:
                self.y = y * 30 - 30
