export class Prize {
  static prizelist: { [key: string]: string }[];
  static prizeName: { [key: string]: string }[];
  static userOpend: number;
  static userPoint: number;
  static prizeSelected: number;
  static skinByType: number[];
  // static changeSkin: number;

  static setSkinByType() {
    Prize.skinByType = [];
    for (let i = 0; i < Prize.prizeName.length; i++) {
      Prize.prizelist.forEach((prize) => {
        if (i == Number(prize["type_id"])) {
          const id = Number(prize["id"]);
          if (Prize.prizeSelected & (1 << id)) {
            Prize.skinByType.push(id);
          }
        }
      });
    }
  }

  static async openPrize(id: number): Promise<boolean> {
    return await fetch("http://" + window.location.host + "/openprize", {
      method: "POST",
      body: JSON.stringify(id),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return Promise.reject(new Error("エラーです"));
        }
      })
      .then((re) => {
        return new Promise((reslove) => {
          if (re["result"] == -1) {
            Prize.userOpend = Number(re["playerOpened"]);
            Prize.userPoint = Number(re["playerPoint"]);
            return reslove(true);
          } else {
            switch (re["result"]) {
              case 0:
                alert("ポイント不足です");
                break;
              case 1:
                alert("既に開放済みです");
                break;
              default:
                alert("不明なエラー");
                break;
            }
            return reslove(false);
          }
        });
      });
  }

  static async changeSelectedPrize(e: Event, type_id: number, id: number) {
    const me = <HTMLDivElement>e.currentTarget;

    const selected = await Prize.selectPrize(type_id, id);
    Prize.prizeSelected = selected;
    Prize.setSkinByType();

    if (selected >= 0) {
      const typePrizes = Array.from(me.parentElement!.children!);
      typePrizes.forEach((p) => {
        p.classList.remove("selected");
        if (selected & (1 << Number(p.getAttribute("data-number")))) {
          p.classList.add("selected");
        }
      });
    }
  }

  static async selectPrize(type: number, id: number): Promise<number> {
    return await fetch("http://" + window.location.host + "/selectprize", {
      method: "POST",
      body: JSON.stringify({ type_id: type, id: id }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return Promise.reject(new Error("エラーです"));
        }
      })
      .then((re) => {
        return new Promise((reslove) => {
          if (re["result"] == -1) return reslove(re["data"]);
          else {
            switch (re["result"]) {
              case 0:
                alert("未開放です");
                break;
              default:
                alert("不明なエラー");
                break;
            }
            return reslove(-1);
          }
        });
      });
  }
}
