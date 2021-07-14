package main

import (
	"math"
	"math/rand"
)

type Bullet struct {
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	W         int     `json:"width"`
	H         int     `json:"height"`
	ID        int     `json:"ID"`
	Spread    int     `json:"Spread"`
	IV        bool    `json:"IsInvisible"`
	Vx        float64 `json:"vx"`
	Vy        float64 `json:"vy"`
	IsStunA   bool    `json:"IsStunA"`
	IsPoisonA bool    `json:"IsPoisonA"`
	IsSpireA  bool
	Damage    int
	Life      int
	Dead      bool
	Type      int
	baseSpeed float64
}
type BulletClass interface {
	Shot(player *player, ins *instance)
	Update(ins *instance) BulletClass
	GetMe() Bullet
}

type Musingun struct {
	Bullet
}
type ChargShot struct {
	Bullet
}
type Punchur struct {
	Bullet
}
type Triple struct {
	Bullet
}
type Around struct {
	Bullet
}
type Sniper struct {
	Bullet
}
type Mine struct {
	Bullet
}
type Reflect struct {
	Bullet
}
type Shotgun struct {
	Bullet
}

func (me *Bullet) GetMe() Bullet {
	return *me
}

func (me *Bullet) Update(ins *instance) BulletClass {

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
		if Map[ins.MapID][int(math.Floor(me.Y/30))][int(math.Floor(me.X/30))] > 0 {
			return nil
		}
	}
	if flag || me.Life < 0 {
		return nil
	}
	return me
}

func (me *Reflect) Update(ins *instance) BulletClass {
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
		if Map[ins.MapID][int(math.Floor(me.Y/30))][int(math.Floor(me.X/30))] > 0 {
			temp := me
			temp.X -= temp.Vx
			x := Map[ins.MapID][int(math.Floor(temp.Y/30))][int(math.Floor(temp.X/30))]
			if x == 0 {
				me.Vx *= -1
			} else {
				me.Vy *= -1
			}
		}
	}
	if flag || me.Life < 0 {
		return nil
	}
	return me
}

func (me *ChargShot) Update(ins *instance) BulletClass {
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
		x := math.Ceil(me.X)
		y := math.Ceil(me.Y)
		startX := int(math.Max(math.Floor(x/30.0), 0))
		startY := int(math.Max(math.Floor(y/30.0), 0))
		endX := int(math.Min(math.Floor((x+float64(me.W)-1.0)/30.0), float64(len(Map[ins.MapID][0]))))
		endY := int(math.Min(math.Floor((y+float64(me.H)-1.0)/30.0), float64(len(Map[ins.MapID]))))
		for i := startY; i <= endY; i++ {
			for j := startX; j <= endX; j++ {
				if Map[ins.MapID][i][j] > 0 {
					return nil
				}
			}
		}
	}
	if flag || me.Life < 0 {
		return nil
	}
	return me
}

func newBullet() BulletClass {
	me := Bullet{}
	me.W = 5
	me.H = 5
	me.Damage = 10
	me.Spread = 1
	me.IV = false
	me.Type = 0
	me.Life = 100
	me.IsStunA = false
	me.IsPoisonA = false
	me.IsSpireA = false
	me.baseSpeed = 5
	return &me
}

func newMusingun() *Musingun {
	me := Musingun{Bullet: *newBullet().(*Bullet)}
	return &me
}

func _shot(player *player, ins *instance, me *Bullet) Bullet {
	temp := *me
	temp.ID = player.ID
	temp.X = player.X + float64(player.W/2-me.W/2) + 30*math.Cos(float64(player.R)+math.Pi/2)
	temp.Y = player.Y + float64(player.H/2-me.H/2) + 30*math.Sin(float64(player.R)+math.Pi/2)
	temp.Vx = me.baseSpeed * math.Cos(float64(player.R)+math.Pi/2+deg2rad(0))
	temp.Vy = me.baseSpeed * math.Sin(float64(player.R)+math.Pi/2+deg2rad(0))
	temp.IsPoisonA = player.AddPoison
	temp.IsSpireA = player.isSpire
	temp.IsStunA = player.AddStun
	return temp
}
func (me *Bullet) Shot(player *player, ins *instance) {
	temp := _shot(player, ins, me)
	ins.rMO.Append(&temp)
	ins.rMO.Bullets = append(ins.rMO.Bullets, temp)

}

func (me *Around) Shot(player *player, ins *instance) {
	for i := 0; i < 10; i++ {
		temp := *me
		temp.Bullet = _shot(player, ins, &me.Bullet)
		temp.Vx = temp.baseSpeed * math.Cos(float64(player.R)+math.Pi/2+deg2rad(float64(36*i)))
		temp.Vy = temp.baseSpeed * math.Sin(float64(player.R)+math.Pi/2+deg2rad(float64(36*i)))
		ins.rMO.Append(&temp)
		ins.rMO.Bullets = append(ins.rMO.Bullets, temp.Bullet)
	}
}

func (me *Triple) Shot(player *player, ins *instance) {
	for i := -1; i < 2; i++ {
		temp := *me
		temp.Bullet = _shot(player, ins, &me.Bullet)
		temp.Vx = temp.baseSpeed * math.Cos(float64(player.R)+math.Pi/2+deg2rad(float64(i*15)))
		temp.Vy = temp.baseSpeed * math.Sin(float64(player.R)+math.Pi/2+deg2rad(float64(i*15)))
		ins.rMO.Append(&temp)
		ins.rMO.Bullets = append(ins.rMO.Bullets, temp.Bullet)
	}
}

func (me *ChargShot) Shot(player *player, ins *instance) {
	temp := *me
	temp.Bullet = _shot(player, ins, &me.Bullet)
	ins.rMO.Append(&temp)
	ins.rMO.Bullets = append(ins.rMO.Bullets, temp.Bullet)
}
func (me *Reflect) Shot(player *player, ins *instance) {
	temp := *me
	temp.Bullet = _shot(player, ins, &me.Bullet)
	ins.rMO.Append(&temp)
	ins.rMO.Bullets = append(ins.rMO.Bullets, temp.Bullet)
}

func (me *Shotgun) Shot(player *player, ins *instance) {
	for i := 0; i < 50; i++ {
		s := float64(rand.Intn(7) + 2)
		temp := *me
		temp.Bullet = _shot(player, ins, &me.Bullet)
		temp.Vx = s * math.Cos(float64(player.R)+math.Pi/2+deg2rad(float64(rand.NormFloat64()*15)))
		temp.Vy = s * math.Sin(float64(player.R)+math.Pi/2+deg2rad(float64(rand.NormFloat64()*15)))
		ins.rMO.Append(&temp)
		ins.rMO.Bullets = append(ins.rMO.Bullets, temp.Bullet)
	}

}

func newChargeShot() *ChargShot {
	me := ChargShot{Bullet: *newBullet().(*Bullet)}
	me.W = 30
	me.H = 30
	me.Damage = 100
	me.Spread = 0
	me.Type = 0
	me.Life = 10000
	me.baseSpeed = 8
	return &me
}
func newPunchur() *Punchur {
	me := Punchur{Bullet: *newBullet().(*Bullet)}
	me.W = 20
	me.H = 20
	me.Damage = 10
	me.Spread = 3
	me.Type = 1
	me.Life = 100
	me.baseSpeed = 4
	return &me
}
func newTriple() *Triple {
	me := Triple{Bullet: *newBullet().(*Bullet)}
	me.Spread = 3
	me.Type = 2
	me.Life = 100
	me.baseSpeed = 3
	return &me
}

func newAround() *Around {
	me := Around{Bullet: *newBullet().(*Bullet)}
	me.Spread = 3
	me.Type = 3
	me.Life = 100
	me.baseSpeed = 3
	return &me
}
func newSniper() *Sniper {
	me := Sniper{Bullet: *newBullet().(*Bullet)}
	me.Damage = 50
	me.Spread = 10
	me.Type = 4
	me.Life = 10000
	me.baseSpeed = 10
	return &me
}

func newMine() *Mine {
	me := Mine{Bullet: *newBullet().(*Bullet)}
	me.W = 30
	me.H = 30
	me.Damage = 20
	me.Spread = 5
	me.Type = 5
	me.Life = 1000
	me.baseSpeed = 0
	me.IV = true
	return &me
}
func newReflect() *Reflect {
	me := Reflect{Bullet: *newBullet().(*Bullet)}
	me.Damage = 5
	me.Type = 6
	me.Life = 1000
	me.baseSpeed = 4
	return &me
}

func newShotgun() *Shotgun {
	me := Shotgun{Bullet: *newBullet().(*Bullet)}
	me.Damage = 2
	me.Type = 7
	me.Life = 30
	me.Spread = 10
	return &me
}
