package main

import (
	"math"
	"math/rand"
)

type Bullet struct {
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	W          int     `json:"width"`
	H          int     `json:"height"`
	ID         int     `json:"ID"`
	IV         bool    `json:"IsInvisible"`
	Vx         float64 `json:"vx"`
	Vy         float64 `json:"vy"`
	IsStunA    bool    `json:"IsStunA"`
	IsPoisonA  bool    `json:"IsPoisonA"`
	IsReflectA bool
	IsSpireA   bool
	Damage     int
	Life       int
	Dead       bool
	Type       int
	baseSpeed  float64
	InnerId    int
}
type GunClass interface {
	Shot(player *player, ins *instance)
	getSpread() int
}
type BulletClass interface {
	Update(ins *instance) BulletClass
	GetMe() Bullet
}

func (b Bullet) GetMe() Bullet {
	return b
}

type Gun struct {
	Spread int
}

type Musingun struct {
	Gun
}
type ChargShot struct {
	Gun
}
type Punchur struct {
	Gun
}
type Triple struct {
	Gun
}
type Around struct {
	Gun
}
type Sniper struct {
	Gun
}
type Mine struct {
	Gun
}
type Reflect struct {
	Gun
}
type Shotgun struct {
	Gun
}

func (me Bullet) Update(ins *instance) BulletClass {

	me.Life--
	me.X += float64(me.Vx)
	me.Y += float64(me.Vy)
	flag := false

	if me.X <= 0 || me.Y <= 0 || me.X >= float64(len(Map[ins.MapID][0])*30) || me.Y >= float64(len(Map[ins.MapID])*30) {
		return nil
	}
	for i := 0; i < len(ins.rMP.Player); i++ {
		if me.ID != ins.rMP.Player[i].ID {
			p := &ins.rMP.Player[i]
			if int(p.X) < int(me.X)+me.W && int(p.X)+p.W > int(me.X) && int(p.Y) < int(me.Y)+me.H && int(p.Y)+p.H > int(me.Y) {
				ins.rMP.Player[i].Hp -= me.Damage
				flag = true
				if me.IsStunA && rand.Intn(101) > 60 {
					status := Status{int(Stun), 62.5 * 3}
					p.Status = append(p.Status, status)
				}
				if me.IsPoisonA {
					status := Status{int(Poison), 62.5 * 10}
					p.Status = append(p.Status, status)
					go timer(10, p, func(p *player) {
						if rand.Intn(100) > 50 {
							p.Hp -= rand.Intn(5) + 5
						}
					})
				}
			}
		}
	}

	if !me.IsSpireA {

		if collisionMapBullet(&me, me.Vx, 0, ins.MapID) {
			if me.IsReflectA {
				me.Vx *= -1
			} else {
				return nil
			}
		}
		if collisionMapBullet(&me, 0, me.Vy, ins.MapID) {
			if me.IsReflectA {
				me.Vy *= -1
			} else {
				return nil
			}
		}
	}

	if flag || me.Life < 0 {
		return nil
	}
	return me
}

func collisionMapBullet(me *Bullet, vx float64, vy float64, mapid int) bool {
	x := math.Ceil(me.X + vx)
	y := math.Ceil(me.Y + vy)
	startX := int(math.Max(math.Floor(x/30.0), 0))
	startY := int(math.Max(math.Floor(y/30.0), 0))
	endX := int(math.Min(math.Floor((x+float64(me.W)-1.0)/30.0), float64(len(Map[mapid][0]))))
	endY := int(math.Min(math.Floor((y+float64(me.H)-1.0)/30.0), float64(len(Map[mapid]))))
	for i := startY; i <= endY; i++ {
		for j := startX; j <= endX; j++ {
			if Map[mapid][i][j] > 0 {
				return true
			}
		}
	}
	return false
}

func newBullet(player *player, me Bullet) *Bullet {
	me.Life += player.BaseBulletLife
	me.InnerId = rand.Intn(10000000)
	me.ID = player.ID
	me.X = player.X + float64(player.W/2-me.W/2) + 30*math.Cos(float64(player.R)-math.Pi/2)
	me.Y = player.Y + float64(player.H/2-me.H/2) + 30*math.Sin(float64(player.R)-math.Pi/2)
	me.Vx = me.baseSpeed * math.Cos(float64(player.R)-math.Pi/2+deg2rad(0))
	me.Vy = me.baseSpeed * math.Sin(float64(player.R)-math.Pi/2+deg2rad(0))
	me.IsPoisonA = player.AddPoison
	me.IsSpireA = player.isSpire
	me.IsStunA = player.AddStun
	if player.isReflect {
		me.IsReflectA = player.isReflect
	}
	return &me
}
func (me Gun) Shot(player *player, ins *instance) {
	temp := newBullet(player, Bullet{W: 5, H: 5, Damage: 10, baseSpeed: 5, Life: 100})
	ins.Append(temp)
}
func (me Gun) getSpread() int {
	return me.Spread
}

func (me Musingun) Shot(player *player, ins *instance) {
	temp := newBullet(player, Bullet{W: 5, H: 5, Damage: 10, baseSpeed: 5, Life: 100})
	ins.Append(temp)
	// ins.rMP.Bullet = append(ins.rMP.Bullet, temp)

}
func (me Punchur) Shot(player *player, ins *instance) {
	temp := newBullet(player, Bullet{W: 20, H: 20, Damage: 15, baseSpeed: 4, Life: 100, Type: 1})
	ins.Append(temp)
	// ins.rMP.Bullet = append(ins.rMP.Bullet, temp)

}

func (me Around) Shot(player *player, ins *instance) {
	for i := 0; i < 10; i++ {
		temp := newBullet(player, Bullet{W: 5, H: 5, Damage: 10, baseSpeed: 4, Life: 100})
		temp.Vx = temp.baseSpeed * math.Cos(float64(player.R)-math.Pi/2+deg2rad(float64(36*i)))
		temp.Vy = temp.baseSpeed * math.Sin(float64(player.R)-math.Pi/2+deg2rad(float64(36*i)))
		ins.Append(temp)
		//ins.rMP.Bullet = append(ins.rMP.Bullet, temp.Bullet)
	}
}

func (me Triple) Shot(player *player, ins *instance) {
	for i := -1; i < 2; i++ {
		temp := newBullet(player, Bullet{W: 5, H: 5, Damage: 10, baseSpeed: 4, Life: 100})
		temp.Vx = temp.baseSpeed * math.Cos(float64(player.R)-math.Pi/2+deg2rad(float64(i*15)))
		temp.Vy = temp.baseSpeed * math.Sin(float64(player.R)-math.Pi/2+deg2rad(float64(i*15)))
		ins.Append(temp)
		//ins.rMP.Bullet = append(ins.rMP.Bullet, temp.Bullet)
	}
}

func (me ChargShot) Shot(player *player, ins *instance) {
	temp := newBullet(player, Bullet{W: 30, H: 30, Damage: 100, baseSpeed: 8, Life: 1000})
	ins.Append(temp)
	//ins.rMP.Bullet = append(ins.rMP.Bullet, temp.Bullet)
}

func (me Sniper) Shot(player *player, ins *instance) {
	temp := newBullet(player, Bullet{W: 5, H: 5, Damage: 50, baseSpeed: 10, Life: 10000})
	ins.Append(temp)
}

func (me Mine) Shot(player *player, ins *instance) {
	temp := newBullet(player, Bullet{W: 30, H: 30, Damage: 20, baseSpeed: 0, Life: 1000})
	temp.IV = true
	ins.Append(temp)
}
func (me Reflect) Shot(player *player, ins *instance) {
	temp := newBullet(player, Bullet{W: 5, H: 5, Damage: 5, baseSpeed: 4, Life: 700})
	temp.IsReflectA = true
	ins.Append(temp)
	//ins.rMP.Bullet = append(ins.rMP.Bullet, temp.Bullet)
}

func (me Shotgun) Shot(player *player, ins *instance) {
	for i := 0; i < 50; i++ {
		s := float64(rand.Intn(7) + 2)
		temp := newBullet(player, Bullet{W: 5, H: 5, Damage: 2, baseSpeed: 4, Life: 30})
		temp.Vx = s * math.Cos(float64(player.R)-math.Pi/2+deg2rad(float64(rand.NormFloat64()*20)))
		temp.Vy = s * math.Sin(float64(player.R)-math.Pi/2+deg2rad(float64(rand.NormFloat64()*20)))
		ins.Append(temp)
		//ins.rMP.Bullet = append(ins.rMP.Bullet, temp.Bullet)
	}

}
