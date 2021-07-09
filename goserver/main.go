package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"io/ioutil"
	"math"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

// const Secret string = "qjG+ocH6KFhO6V1Ys1kXIY1VXTF7Ne/VztlPYasW/gSEyKkYHEha9auA/qr20+njG0qy3yRk+Nf+yMBEwzXNEQ=="

var key = make(map[string]int)

//StatusType 状態異常
type StatusType int

const (
	//Stun スタン
	Stun StatusType = iota
	//Poison 毒
	Poison
)

func constMakeBullet(w int, h int, spread int, iv bool, speed float64, d int, l int, id int) bullet {
	b := bullet{}
	b.W = w
	b.H = h
	b.Spread = spread
	b.Vx = speed
	b.IV = iv
	b.Damage = d
	b.Life = l
	b.Type = id
	return b
}

func main() {

	bulletType = append(bulletType, bullet{W: 5, H: 5, Spread: 1, IV: false, Vx: 5, Damage: 10, Life: 100, Type: 0})
	bulletType = append(bulletType, constMakeBullet(20, 20, 3, false, 4, 30, 100, 1))
	bulletType = append(bulletType, constMakeBullet(5, 5, 3, false, 3, 10, 100, 2))
	bulletType = append(bulletType, constMakeBullet(5, 5, 10, false, 3, 10, 100, 3))
	bulletType = append(bulletType, constMakeBullet(5, 5, 10, false, 10, 50, 10000, 4))
	bulletType = append(bulletType, constMakeBullet(30, 30, 5, true, 0, 20, 1000, 5))
	bulletType = append(bulletType, constMakeBullet(5, 5, 1, false, 4, 5, 1000, 6))
	bulletType = append(bulletType, constMakeBullet(5, 5, 10, false, 4, 2, 30, 7))

	files, _ := ioutil.ReadDir("./")
	for _, file := range files {
		path := filepath.Ext(file.Name())
		if path == ".map" {
			fp, err := os.Open(file.Name())
			if err != nil {
				panic(err)
			}
			defer fp.Close()
			scanner := bufio.NewScanner(fp)
			var m [][]int
			for scanner.Scan() {
				var row []int
				for _, b := range strings.Split(scanner.Text(), ",") {
					i, _ := strconv.Atoi(b)
					row = append(row, i)
				}
				m = append(m, row)
			}
			Map = append(Map, m)
		}
	}

	e := echo.New()
	go loopInstance()
	// go WriteMessage()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.GET("/connect", WebsocketGlobalServer)
	e.POST("/getPoint", getPoint)
	key["left"] = 1
	key["up"] = 2
	key["right"] = 4
	key["down"] = 8
	key["space"] = 16
	key["A"] = 32
	key["D"] = 64
	key["Z"] = 128
	// getitem := e.Group("")
	// getitem.Use(middleware.JWT([]byte(Secret)))
	// getitem.POST("/api/getItem", func(c echo.Context) error {
	// 	return c.File("oto.wav")
	// })
	e.Logger.Fatal(e.Start(":3000"))
}
func getPoint(c echo.Context) error {
	name := c.FormValue("id")
	for ins := range instances {
		id, _ := strconv.Atoi(name)
		if ins.id == id {
			return c.JSON(http.StatusOK, ins.rMP)
		}
	}
	return c.String(http.StatusAccepted, "aa")
}

// type Template struct {
// 	templates *template.Template
// }

var instances = make(map[*instance]bool)
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

//Message クライアントから受信するキー入力
type Message struct {
	Key int `json:"key"`
}

//Status 状態異常
type Status struct {
	Type     int     `json:"Type"`
	LeftTime float32 `json:"Time"`
}
type player struct {
	X              float64  `json:"x"`
	Y              float64  `json:"y"`
	W              int      `json:"width"`
	H              int      `json:"height"`
	R              float32  `json:"rotate"`
	Hp             int      `json:"HP"`
	C              int      `json:"Charge"`
	MC             int      `json:"MaxCharge"`
	ID             int      `json:"ID"`
	BT             int      `json:"BT"`
	ItemStock      int      `json:"ItemStock"`
	Effect         float32  `json:"Effect"`
	Laser          bool     `json:"Laser"`
	ELaser         bool     `json:"EnemyLaser"`
	IsInvisible    bool     `json:"IsInvisible"`
	Status         []Status `json:"Status"`
	Vx             int      `json:"vx"`
	Vy             int      `json:"vy"`
	MaxV           int      `json:"mv"`
	EffectS        float32
	EffectType     int
	BaseBulletLife int
	BaseSpeed      int
	Count          int
	Key            int
	lastSpace      int
	SpaceCount     int
	AddStun        bool
	AddPoison      bool
	isAuto         bool
	isSpire        bool
	Rader          bool
	Name           string
	sessionId      string
	Cv             int
	Skin           int
}
type bullet struct {
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
}
type Item struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	W      int     `json:"width"`
	H      int     `json:"height"`
	ItemID int     `json:"ID"`
}

type returnMessagePlayer struct {
	Player []player `json:"player"`
}
type returnMessageOther struct {
	Bullets []bullet `json:"bullets"`
	Item    []Item   `json:"item"`
}

type instance struct {
	id     int
	isLock bool
	rMP    *returnMessagePlayer
	rMO    *returnMessageOther
	time   int
	cl     []*websocket.Conn
	MapID  int
	R      bool
}
type firstReturn struct {
	ID         int     `json:"id"`
	InstanceID int     `json:"Iid"`
	Map        [][]int `json:"map"`
}

var bulletType []bullet

// Map 全体マップ配列
var Map [][][]int

func deg2rad(deg float64) float64 {
	return deg * (math.Pi / 180)
}
func collisionMap(x float64, y float64, MapID int) (int, int) {
	x = math.Ceil(x)
	y = math.Ceil(y)
	startX := int(math.Max(math.Floor(float64(x)/30.0), 0))
	startY := int(math.Max(math.Floor(float64(y)/30.0), 0))
	endX := int(math.Min(math.Floor(float64(x+30.0-1.0)/30.0), float64(len(Map[MapID][0]))))
	endY := int(math.Min(math.Floor(float64(y+30.0-1.0)/30.0), float64(len(Map[MapID]))))
	for i := startY; i <= endY; i++ {
		for j := startX; j <= endX; j++ {
			if Map[MapID][i][j] == 1 {
				return j, i
			}
		}
	}
	return -1, -1
}
func makeBullet(player *player, r float64) bullet {
	return makeBulletL(player, r, bulletType[player.BT].Life+player.BaseBulletLife)
}
func makeBulletL(player *player, r float64, life int) bullet {
	w := bulletType[player.BT].W
	h := bulletType[player.BT].H
	d := bulletType[player.BT].Damage
	s := bulletType[player.BT].Vx
	spread := bulletType[player.BT].Spread
	iv := bulletType[player.BT].IV
	Type := bulletType[player.BT].Type
	bullet := bullet{
		X: player.X + float64(player.W/2-w/2) + 30*math.Cos(float64(player.R)+math.Pi/2),
		Y: player.Y + float64(player.H/2-h/2) + 30*math.Sin(float64(player.R)+math.Pi/2),
		W: w, H: h, ID: player.ID, Spread: spread, IV: iv,
		Vx:     s * math.Cos(float64(player.R)+math.Pi/2+deg2rad(r)),
		Vy:     s * math.Sin(float64(player.R)+math.Pi/2+deg2rad(r)),
		Damage: d, Life: life, Type: Type,
		IsStunA:   player.AddStun,
		IsPoisonA: player.AddPoison,
		IsSpireA:  player.isSpire}
	return bullet
}
func shot(player *player, ins *instance, ls int) {
	spread := bulletType[player.BT].Spread
	if player.C > 0 || ls > 150 {
		if ls > 150 {
			bullet := bullet{
				X: player.X + float64(player.W)/2 - 15 + 30*math.Cos(float64(player.R)+math.Pi/2),
				Y: player.Y + float64(player.H)/2 - 15 + 30*math.Sin(float64(player.R)+math.Pi/2),
				W: 30, H: 39, ID: player.ID, Spread: spread,
				Vx:     8 * math.Cos(float64(player.R)+math.Pi/2),
				Vy:     8 * math.Sin(float64(player.R)+math.Pi/2),
				Damage: 100, Life: 10000, Type: 0}
			ins.rMO.Bullets = append(ins.rMO.Bullets, bullet)
		} else if player.BT == 2 {
			for i := -1; i < 2; i++ {
				ins.rMO.Bullets = append(ins.rMO.Bullets, makeBullet(player, float64(i*15)))
			}
		} else if player.BT == 3 {
			for i := 0; i < 10; i++ {
				ins.rMO.Bullets = append(ins.rMO.Bullets, makeBullet(player, float64(36*i)))
			}
		} else if player.BT == 7 {

			w := bulletType[player.BT].W
			h := bulletType[player.BT].H
			d := bulletType[player.BT].Damage
			spread := bulletType[player.BT].Spread
			iv := bulletType[player.BT].IV
			Type := bulletType[player.BT].Type
			for i := 0; i < 50; i++ {
				s := float64(rand.Intn(7) + 2)
				ins.rMO.Bullets = append(ins.rMO.Bullets, bullet{
					X: player.X + float64(player.W/2-w/2) + 30*math.Cos(float64(player.R)+math.Pi/2),
					Y: player.Y + float64(player.H/2-h/2) + 30*math.Sin(float64(player.R)+math.Pi/2),
					W: w, H: h, ID: player.ID, Spread: spread, IV: iv,
					Vx:     s * math.Cos(float64(player.R)+math.Pi/2+deg2rad(float64(rand.NormFloat64()*15))),
					Vy:     s * math.Sin(float64(player.R)+math.Pi/2+deg2rad(float64(rand.NormFloat64()*15))),
					Damage: d, Life: bulletType[player.BT].Life + player.BaseBulletLife, Type: Type,
					IsStunA:   player.AddStun,
					IsPoisonA: player.AddPoison,
					IsSpireA:  player.isSpire})
			}
		} else {
			ins.rMO.Bullets = append(ins.rMO.Bullets, makeBullet(player, 0))
		}
		player.C -= spread
		if player.C < 0 {
			player.C = 0
		}
	}
}
func bulletsUpdate(ins *instance) {
	var tb []bullet
	for _, v := range ins.rMO.Bullets {

		v.Life--
		v.X += float64(v.Vx)
		v.Y += float64(v.Vy)
		flag := false
		if v.X <= 0 || v.Y <= 0 || v.X >= float64(len(Map[ins.MapID][0])*30) || v.Y >= float64(len(Map[ins.MapID])*30) {
			continue
		}
		for i := 0; i < len(ins.rMP.Player); i++ {
			if v.ID != ins.rMP.Player[i].ID {
				p := &ins.rMP.Player[i]
				if int(p.X) < int(v.X)+v.W && int(p.X)+p.W > int(v.X) && int(p.Y) < int(v.Y)+v.H && int(p.Y)+p.H > int(v.Y) {
					ins.rMP.Player[i].Hp -= v.Damage
					flag = true
					if v.IsStunA && rand.Intn(101) > 60 {
						status := Status{int(Stun), 62.5 * 3}
						p.Status = append(p.Status, status)
					}
					if v.IsPoisonA {
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

		t := func() bool {
			if v.Type != 6 {
				return true
			}
			temp := v
			temp.X -= temp.Vx
			x := Map[ins.MapID][int(math.Floor(temp.Y/30))][int(math.Floor(temp.X/30))]
			if x == 0 {
				v.Vx *= -1
			} else {
				v.Vy *= -1
			}
			return false
		}
		if !v.IsSpireA {
			if v.W >= 30 {
				x := math.Ceil(v.X)
				y := math.Ceil(v.Y)
				startX := int(math.Max(math.Floor(x/30.0), 0))
				startY := int(math.Max(math.Floor(y/30.0), 0))
				endX := int(math.Min(math.Floor((x+float64(v.W)-1.0)/30.0), float64(len(Map[ins.MapID][0]))))
				endY := int(math.Min(math.Floor((y+float64(v.H)-1.0)/30.0), float64(len(Map[ins.MapID]))))
				for i := startY; i <= endY; i++ {
					for j := startX; j <= endX; j++ {
						if Map[ins.MapID][i][j] > 0 {
							if t() {
								flag = true
								break
							}
						}
					}
				}
			} else if Map[ins.MapID][int(math.Floor(v.Y/30))][int(math.Floor(v.X/30))] > 0 {
				if t() {
					continue
				}
			}
		}
		if flag || v.Life < 0 {
			continue
		}
		tb = append(tb, v)
	}
	ins.rMO.Bullets = tb
}

func playerUpdate(player *player, ls int, MapID int) {
	var latestStatus []Status
	for _, s := range player.Status {
		if s.LeftTime <= 0 {
			continue
		}
		s.LeftTime--
		latestStatus = append(latestStatus, s)
	}
	player.Status = latestStatus
	x, _ := collisionMap(player.X+float64(player.Vx), player.Y, MapID)
	if x == -1 {
		player.X += float64(player.Vx)
	} else {
		if player.Vx < 0 {
			player.X = float64((x + 1) * 30)
		} else if player.Vx > 0 {
			player.X = float64(x*30 - 30)
		}
	}
	_, y := collisionMap(player.X, player.Y+float64(player.Vy), MapID)

	if y == -1 {
		player.Y += float64(player.Vy)
	} else {
		if player.Vy < 0 {
			player.Y = float64((y + 1) * 30)
		} else if player.Vy > 0 {
			player.Y = float64(y*30 - 30)
		}
	}
	if player.Count%50 == 0 && ls == 0 {
		player.C += bulletType[player.BT].Spread
		if player.C > player.MC {
			player.C = player.MC
		}
	}
	player.Count++

}

//--------------------------------------------↓アイテム関連↓------------------------------------------------------

//MaxItemID 最大のアイテムID
const MaxItemID = 18

//EffectUpdate エフェクト効果を更新します。
func effectUpdate(p *player, id int, lastTime float32) {
	lastTime = 62.5 * lastTime
	p.EffectS = lastTime
	p.Effect = p.EffectS / lastTime
	for p.EffectS > 0 {
		time.Sleep(time.Millisecond * 16)
		p.EffectS--
		p.Effect = p.EffectS / lastTime
	}
	endEffect(p, id)
}
func timer(left int, p *player, do func(*player)) {
	for left > 0 {
		do(p)
		time.Sleep(time.Second)
		left--
	}
}
func endEffect(p *player, id int) {
	switch id {
	case 9:
		p.BaseSpeed -= 3
	case 10:
		p.Laser = false
	case 11:
		p.ELaser = false
	case 12:
		p.IsInvisible = false
	case 13:
		p.BaseBulletLife = 0
	case 14:
		p.AddStun = false
	case 15:
		p.AddPoison = false
	case 16:
		p.isAuto = false
	case 17:
		p.isSpire = false
	case 18:
		p.Rader = false
	}
}

func useItem(itemID int, player *player) {
	switch itemID {
	case 0:
		player.Hp += 20
		if player.Hp > 100 {
			player.Hp = 100
		}
	case 8:
		player.MC += 5
	case 9:
		player.BaseSpeed += 3
		go effectUpdate(player, itemID, 10)
	case 10:
		player.Laser = true
		go effectUpdate(player, itemID, 30)
	case 11:
		player.ELaser = true
		go effectUpdate(player, itemID, 30)
	case 12:
		player.IsInvisible = true
		go effectUpdate(player, itemID, 5)
	case 13:
		player.BaseBulletLife = 100
		go effectUpdate(player, itemID, 20)
	case 14:
		player.AddStun = true
		go effectUpdate(player, itemID, 15)
	case 15:
		player.AddPoison = true
		go effectUpdate(player, itemID, 15)
	case 16:
		player.isAuto = true
		go effectUpdate(player, itemID, 3)
	case 17:
		player.isSpire = true
		go effectUpdate(player, itemID, 8)
	case 18:
		player.Rader = true
		go effectUpdate(player, itemID, 25)

	default:
		player.MC++
		player.BT = itemID
	}
}
func itemCollision(ins *instance) {
	ins.time++
	if len(ins.rMO.Item) < 5 {
		if ins.time%300 == 0 {
			makeItem(ins.rMO, ins.MapID)
		}
	}
	var ti []Item
	for _, v := range ins.rMO.Item {
		flag := false
		for i := 0; i < len(ins.rMP.Player); i++ {
			p := &ins.rMP.Player[i]
			if int(p.X) < int(v.X)+v.W && int(p.X)+p.W > int(v.X) && int(p.Y) < int(v.Y)+v.H && int(p.Y)+p.H > int(v.Y) {
				switch {
				case v.ItemID >= 9 && v.ItemID <= MaxItemID:
					p.ItemStock = v.ItemID
				default:
					useItem(v.ItemID, p)
				}
				flag = true
			}
		}
		if !flag {
			ti = append(ti, v)
		}
	}
	ins.rMO.Item = ti
}
func makeItem(rMO *returnMessageOther, MapID int) {
	var x float64
	var y float64
	isBuild := false
	for {
		if isBuild {
			break
		}
		x = float64(rand.Intn(len(Map[MapID][0])*28-30) + 30)
		y = float64(rand.Intn(len(Map[MapID])*28-30) + 30)
		isBuild = true
		for j := int(math.Floor(y / 30)); j <= int(math.Floor((y+20)/30)); j++ {
			for k := int(math.Floor(x / 30)); k <= int(math.Floor((x+20)/30)); k++ {
				if Map[MapID][j][k] > 0 {
					isBuild = false
				}
			}
		}
	}
	// rM.Item = append(rM.Item, Item{x, y, 20, 20, 18})
	rMO.Item = append(rMO.Item, Item{x, y, 20, 20, rand.Intn(MaxItemID + 1)})
}

//--------------------------------------------↑アイテム関連ここまで↑------------------------------------------------------
func loopInstance() {
	for {
		for v := range instances {
			if !v.R {
				bulletsUpdate(v)
				itemCollision(v)
				for i := 0; i < len(v.rMP.Player); i++ {
					p := &v.rMP.Player[i]
					isStun := false
					for _, s := range p.Status {
						switch s.Type {
						case int(Stun):
							isStun = true
						}
					}
					if p != nil {
						if !isStun {
							if (p.Key & key["left"]) > 0 {
								p.Vx = -(p.MaxV + p.BaseSpeed)
							}
							if (p.Key & key["up"]) > 0 {
								p.Vy = -(p.MaxV + p.BaseSpeed)
							}
							if (p.Key & key["right"]) > 0 {
								p.Vx = (p.MaxV + p.BaseSpeed)
							}
							if (p.Key & key["down"]) > 0 {
								p.Vy = (p.MaxV + p.BaseSpeed)
							}
						}
						if !p.isAuto {
							if (p.Key & key["A"]) > 0 {
								p.R -= 0.02
							}
							if (p.Key & key["D"]) > 0 {
								p.R += 0.02
							}
						} else {
							for i := 0; i < len(v.rMP.Player); i++ {
								if v.rMP.Player[i].ID != p.ID {
									p.R = float32(math.Atan2(v.rMP.Player[i].Y-p.Y, v.rMP.Player[i].X-p.X) - math.Pi/2)
								}
							}
						}
						if (p.Key&key["left"]) == 0 && (p.Key&key["right"]) == 0 {
							p.Vx = 0
						}
						if p.Key&key["Z"] > 0 {
							if p.ItemStock != -1 {
								useItem(p.ItemStock, p)
							}
							p.ItemStock = -1
						}
						if p.Key&key["space"] > 0 {
							p.SpaceCount++
							if p.SpaceCount%15 == 0 {
								p.C--
							}
						}
						if p.lastSpace > 0 && (p.Key&key["space"] == 0) {
							shot(p, v, p.SpaceCount)
							p.SpaceCount = 0
						}

						if (p.Key&key["down"]) == 0 && (p.Key&key["up"]) == 0 {
							p.Vy = 0
						}

						playerUpdate(p, p.SpaceCount, v.MapID)
						if p.SpaceCount > 10 {
							p.MaxV = 1
						} else {
							p.MaxV = 3
						}
						p.lastSpace = p.Key & key["space"]
						if p.Hp <= 0 {

							v.R = true
							if v.time%2 != 0 {
								v.time++
							}
						}
					}
				}
				if v.R {
					for i := 0; i < len(v.rMP.Player); i++ {
						p := &v.rMP.Player[i]
						if p.sessionId != "" {
							client := &http.Client{}
							if p.sessionId != "" {
								mysteriousJSON := "{\"sessionid\": \"" + p.sessionId + "\", \"win\":" + strconv.FormatBool(p.Hp > 0) + "}"

								// var i interface{}
								// json.Unmarshal([]byte(mysteriousJSON), &i)
								req, _ := http.NewRequest("POST", "http://localhost:5000/pointUpdate", bytes.NewBuffer([]byte(mysteriousJSON)))
								client.Do(req)
								// body, _ := io.ReadAll(resp.Body)
							}
						}

					}
				}
				if v.time%2 == 0 {
					for _, c := range v.cl {
						err := c.WriteJSON(v.rMP)
						if err != nil {
							c.Close()
						}
					}
				}
				// if v.time%10 == 0 {
				for _, c := range v.cl {
					err := c.WriteJSON(v.rMO)
					if err != nil {
						c.Close()
					}
				}

			}

			// }

		}
		time.Sleep(time.Millisecond * 16)
	}
}

//WebsocketGlobalServer クライアントから受け取り
func WebsocketGlobalServer(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), c.Response().Header())
	if err != nil {
		return err
	}
	defer ws.Close()
	rand.Seed(time.Now().UnixNano())
	id := rand.Intn(10000000)
	in := false
	var p = player{}
	p.W = 30
	p.H = 30
	p.R = math.Pi
	p.Hp = 100
	p.MC = 10
	p.C = 100
	p.ID = id
	p.MaxV = 3
	p.ItemStock = -1
	session, err := c.Cookie("session")
	if err == nil {
		p.sessionId = session.Value
	}
	var Cinstance *instance
	for v := range instances {
		if len(v.cl) < 2 && !v.isLock {
			v.cl = append(v.cl, ws)
			v.isLock = true
			in = true
			p.X = float64((len(Map[v.MapID][0]) - 2) * 30)
			p.Y = float64((len(Map[v.MapID]) - 2) * 30)
			Cinstance = v
		}
	}
	if !in {
		var rMP returnMessagePlayer
		var rMO returnMessageOther
		// rM.Map = Map
		Cinstance = &instance{rand.Intn(10000000), false, &rMP, &rMO, 0, make([]*websocket.Conn, 0), rand.Intn(len(Map)), false}
		for i := 0; i < 5; i++ {
			makeItem(&rMO, Cinstance.MapID)
		}
		Cinstance.cl = append(Cinstance.cl, ws)
		instances[Cinstance] = true
		p.X = 60
		p.Y = 60
	}
	var message Message
	ws.WriteJSON(firstReturn{id, Cinstance.id, Map[Cinstance.MapID]})
	Cinstance.rMP.Player = append(Cinstance.rMP.Player, p)

	if len(Cinstance.cl) > 1 {

		type point struct {
			Cv       int    `json:"cv"`
			Username string `json:"username"`
			Skin     int
		}

		for i, p := range Cinstance.rMP.Player {
			po := point{0, "guest" + strconv.Itoa(rand.Intn(10000)), 0}

			client := &http.Client{}
			if p.sessionId != "" {
				req, _ := http.NewRequest("POST", "http://localhost:5000/getName", strings.NewReader(p.sessionId))

				resp, _ := client.Do(req)
				body, _ := io.ReadAll(resp.Body)
				json.Unmarshal(body, &po)
			}

			Cinstance.rMP.Player[i].Cv = po.Cv
			Cinstance.rMP.Player[i].Name = po.Username
			Cinstance.rMP.Player[i].Skin = po.Skin

		}

	}

	for {
		// Read
		_, p, err := ws.ReadMessage()
		// 切断処理
		if err != nil {
			var temp []*websocket.Conn
			for i, v := range Cinstance.rMP.Player {

				if id != v.ID {
					temp = append(temp, Cinstance.cl[i])
				} else {
					Cinstance.rMP.Player[i].Hp = 0
				}

				// temp = append(temp, v)
			}
			for _, cl := range temp {
				cl.WriteJSON(Cinstance.rMP)
			}
			// Cinstance.rMP.Player = temp

			delete(instances, Cinstance)
			// delete(clients, ws)
			return err
		}
		json.Unmarshal(p, &message)
		for i := 0; i < len(Cinstance.rMP.Player); i++ {
			if Cinstance.rMP.Player[i].ID == id {
				Cinstance.rMP.Player[i].Key = message.Key
			}
		}

	}
}

// //WriteMessage クライアントに送信
// func WriteMessage() {
// 	for {

// 		time.Sleep(time.Millisecond * 16)
// 	}
// }

// func getToken() string {
// 	token := jwt.New(jwt.SigningMethodHS256)
// 	claims := token.Claims.(jwt.MapClaims)
// 	claims["iat"] = time.Now()
// 	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()
// 	tokenString, _ := token.SignedString([]byte(Secret))
// 	return tokenString
// }
