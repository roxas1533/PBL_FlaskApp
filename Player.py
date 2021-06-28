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

        self.x += self.vx
        self.y += self.vy

    # def collitionMap(self,x,y,MapID):
    #     x=math.ceil(x)
    #     y=math.ceil(y)
    #     startX=
