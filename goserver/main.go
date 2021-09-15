package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
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

func main() {

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
	X              float64 `json:"x"`
	Y              float64 `json:"y"`
	W              int     `json:"width"`
	H              int     `json:"height"`
	R              float32 `json:"rotate"`
	Hp             int     `json:"HP"`
	C              int     `json:"Charge"`
	MC             int     `json:"MaxCharge"`
	ID             int     `json:"ID"`
	BT             int     `json:"BT"`
	ItemStock      int     `json:"ItemStock"`
	Effect         float32 `json:"Effect"`
	Show           bool
	isReflect      bool
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
	gun            GunClass
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
	Item   []Item
	Bullet []Bullet
}

func (me *instance) Append(b BulletClass) {
	me.wrapperBullets = append(me.wrapperBullets, b)
}

type instance struct {
	id             int
	isLock         bool
	rMP            *returnMessagePlayer
	time           int
	cl             []*websocket.Conn
	MapID          int
	R              bool
	item           []Item
	wrapperBullets []BulletClass
}
type firstReturn struct {
	ID         int     `json:"id"`
	InstanceID int     `json:"Iid"`
	Map        [][]int `json:"map"`
}

var bulletType = []GunClass{Musingun{Gun{Spread: 1}}, Punchur{Gun{Spread: 3}},
	Triple{Gun{Spread: 3}}, Around{Gun{Spread: 10}}, Sniper{Gun{Spread: 10}},
	Mine{Gun{Spread: 5}}, Reflect{Gun{Spread: 1}}, Shotgun{Gun{Spread: 10}}}

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
func shot(player *player, ins *instance, ls int) {
	spread := player.gun.getSpread()
	if player.C > 0 || ls > 150 {
		if ls > 150 {
			ChargShot{}.Shot(player, ins)
		} else {
			player.gun.Shot(player, ins)
		}
		player.C -= spread
		if player.C < 0 {
			player.C = 0
		}
	}
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
		player.C += player.gun.getSpread()
		if player.C > player.MC {
			player.C = player.MC
		}
	}
	player.Count++

}

//--------------------------------------------↓アイテム関連↓------------------------------------------------------

//MaxItemID 最大のアイテムID
const MaxItemID = 11

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
	case 2:
		p.BaseSpeed -= 3
	case 3:
		p.Show = false
	case 4:
		p.isReflect = false
	case 5:
		p.IsInvisible = false
	case 6:
		p.BaseBulletLife = 0
	case 7:
		p.AddStun = false
	case 8:
		p.AddPoison = false
	case 9:
		p.isAuto = false
	case 10:
		p.isSpire = false
	case 11:
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
	case 1:
		player.MC += 5
	case 2:
		player.BaseSpeed += 3
		go effectUpdate(player, itemID, 10)
	case 3:
		player.Show = true
		go effectUpdate(player, itemID, 23)
	case 4:
		player.isReflect = true
		go effectUpdate(player, itemID, 30)
	case 5:
		player.IsInvisible = true
		go effectUpdate(player, itemID, 5)
	case 6:
		player.BaseBulletLife = 100
		go effectUpdate(player, itemID, 20)
	case 7:
		player.AddStun = true
		go effectUpdate(player, itemID, 15)
	case 8:
		player.AddPoison = true
		go effectUpdate(player, itemID, 15)
	case 9:
		player.isAuto = true
		go effectUpdate(player, itemID, 3)
	case 10:
		player.isSpire = true
		go effectUpdate(player, itemID, 8)
	case 11:
		player.Rader = true
		go effectUpdate(player, itemID, 25)

	default:
		player.MC++
		player.BT = itemID - 100
		player.gun = bulletType[itemID-100]
	}
}
func itemCollision(ins *instance) {
	if len(ins.item) < 5 {
		if ins.time%300 == 0 {
			makeItem(ins, ins.MapID)
		}
	}
	var ti []Item
	for _, v := range ins.item {
		flag := false
		for i := 0; i < len(ins.rMP.Player); i++ {
			p := &ins.rMP.Player[i]
			if int(p.X) < int(v.X)+v.W && int(p.X)+p.W > int(v.X) && int(p.Y) < int(v.Y)+v.H && int(p.Y)+p.H > int(v.Y) {
				switch {
				case v.ItemID >= 2 && v.ItemID <= MaxItemID:
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
	ins.item = ti
}
func makeItem(ins *instance, MapID int) {
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
		for j := int(math.Floor(y / 30)); j <= int(math.Floor((y+25)/30)); j++ {
			for k := int(math.Floor(x / 30)); k <= int(math.Floor((x+25)/30)); k++ {
				if Map[MapID][j][k] > 0 {
					isBuild = false
					break
				}
			}
			if !isBuild {
				break
			}
		}
	}
	var ItemID int
	if rand.Float32() <= 0.5 {
		ItemID = rand.Intn(8) + 100
	} else {
		ItemID = rand.Intn(MaxItemID + 1)
	}
	item := Item{x, y, 25, 25, ItemID}
	ins.item = append(ins.item, item)
	ins.rMP.Item = append(ins.rMP.Item, item)
}

//--------------------------------------------↑アイテム関連ここまで↑------------------------------------------------------
var tmep int

func loopInstance() {
	for {
		tmep++
		for v := range instances {

			if !v.R {
				v.time++

				var tempB []BulletClass
				for _, b := range v.wrapperBullets {
					if updatedB := b.Update(v); updatedB != nil {
						tempB = append(tempB, updatedB)
					}
				}
				v.wrapperBullets = tempB
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
									p.R = float32(math.Atan2(v.rMP.Player[i].Y-p.Y, v.rMP.Player[i].X-p.X) + math.Pi/2)
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
								if p.C < 0 {
									p.C = 0
								}
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
								req, _ := http.NewRequest("POST", "http://localhost:50000/pointUpdate", bytes.NewBuffer([]byte(mysteriousJSON)))
								client.Do(req)
								// body, _ := io.ReadAll(resp.Body)
							}
						}

					}
				}
				if v.time%3 == 0 {
					v.rMP.Bullet = []Bullet{}
					for _, b := range v.wrapperBullets {
						v.rMP.Bullet = append(v.rMP.Bullet, b.GetMe())
					}
					for _, c := range v.cl {
						err := c.WriteJSON(v.rMP)
						if err != nil {
							c.Close()
						}
					}
					if len(v.cl) == 2 {
						v.rMP.Item = []Item{}
					}
				}
			}

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
	p.gun = bulletType[0]
	session, err := c.Cookie("session")
	if err == nil {
		p.sessionId = session.Value
	}
	fmt.Printf("%p", ws)
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
		rMP.Bullet = []Bullet{}
		Cinstance = &instance{id: rand.Intn(10000000), rMP: &rMP, cl: make([]*websocket.Conn, 0), MapID: rand.Intn(len(Map))}
		for i := 0; i < 5; i++ {
			makeItem(Cinstance, Cinstance.MapID)
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
				req, _ := http.NewRequest("POST", "http://localhost/getName", strings.NewReader(p.sessionId))
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
