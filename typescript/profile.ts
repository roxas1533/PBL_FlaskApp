import { Game } from "./Game";
import { Prize } from "./Prize";
import { Setting } from "./Setting";
import { Skin } from "./Skin";

let profile: string;

export async function loadProfile() {
  fetch("http://" + window.location.host + "/profile", {
    method: "GET",
  })
    .then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        return "";
      }
    })
    .then((res) => {
      profile = res;
    });
}
function getOpendPrizeDivText(e: any) {
  return `
  <img src="static/img/prizeImage/${e["image_name"]}.png" class="prize-image">
  <div class="pos-absolute balloon">
    <p>${e["description"]}</p>
  </div>
  `;
}

export function openProfile() {
  const body = document.querySelector("html body");
  body!.insertAdjacentHTML("afterbegin", profile);
  const skin = document.getElementById("skins");

  Skin.skinlist.forEach((e, i) => {
    skin!.insertAdjacentHTML(
      "beforeend",
      `<div data-number="${i}" class="pos-relative skin">
    <div class="pos-absolute firearm" style="background-color: ${e["firearm"]};"></div>
    <div class="pos-absolute body" style="background-color: ${e["body"]};"></div>
    <div class="pos-absolute balloon">
      <p>${e["description"]}</p>
    </div>
    </div>`
    );
  });
  const skins = Array.from(document.getElementsByClassName("skin"));
  skins.forEach((s) => {
    s.addEventListener("click", (e) => {
      Skin.updateSkin(<HTMLDivElement>s);
    });
  });
  const settingDeleter = Array.from(
    document.getElementsByClassName("deleteProfile")
  );

  settingDeleter.forEach((d) => {
    d.addEventListener("click", deleteProfile);
  });

  skin!.children[Skin.nowSkin].classList.add("selected");

  const prizes = document.getElementById("prizes")!;

  Prize.prizelist.forEach((prize, i) => {
    let prizeTypeWrapper = document.getElementById(
      `prize-type-wrapper-${prize["type_id"]}`
    );

    if (!(prizeTypeWrapper ?? false)) {
      prizes.insertAdjacentHTML(
        "beforeend",
        `<p class="text-centor">${Prize.prizeName[Number(prize["type_id"])]}</p>
        <div class="prizes" id="prize-type-wrapper-${prize["type_id"]}">
          </div>`
      );
      prizeTypeWrapper = document.getElementById(
        `prize-type-wrapper-${prize["type_id"]}`
      );
    }

    if (Prize.userOpend & (1 << Number(prize["id"]))) {
      prizeTypeWrapper!.insertAdjacentHTML(
        "beforeend",
        `<div data-number="${i}" class="pos-relative prize">` +
          getOpendPrizeDivText(prize) +
          "</div>"
      );
      prizeTypeWrapper!.lastElementChild?.addEventListener(
        "click",
        async (e) => {
          changeSelectedPrize(e, Number(prize["type_id"]), Number(prize["id"]));
        }
      );
    } else {
      prizeTypeWrapper!.insertAdjacentHTML(
        "beforeend",
        `<div data-number="${i}" class="pos-relative prize">
        <img src="static/img/prizeImage/${prize["image_name"]}.png" class="prize-image"/>
        <div class="pos-absolute point-not-opened lock"/>
        <img src="static/img/locked.png" class="pos-absolute locked-image lock" />
      <div class="pos-absolute balloon lock">
        <p>開放:${prize["need_point"]}p</p>
      </div>
      </div>`
      );
      prizeTypeWrapper!.lastElementChild?.addEventListener(
        "click",
        openPurchasePrizeWindow
      );
    }
  });
  const confirmOpenPrize = document.getElementById("confirmOpenPrize")!;
  confirmOpenPrize.addEventListener("click", (e) => {
    e.stopPropagation();
    confirmOpenPrize.classList.remove("d-flex");
    confirmOpenPrize.classList.add("d-none");
  });
  const prizeConfirm = document.getElementById("confirm")!;
  prizeConfirm.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  const prizeCloseList = Array.from(
    prizeConfirm.getElementsByClassName("prize-close")
  );
  prizeCloseList.forEach((p) => {
    p.addEventListener("click", (e) => {
      confirmOpenPrize.classList.remove("d-flex");
      confirmOpenPrize.classList.add("d-none");
    });
  });
  document.getElementById("havePoint")!.innerHTML = Prize.userPoint.toString();
}

function openPurchasePrizeWindow(e: Event) {
  const operateTarget = <HTMLDivElement>e.currentTarget!;
  const num = Number(operateTarget.getAttribute("data-number"));
  document.getElementById("prizeName")!.innerHTML =
    Prize.prizelist[num]["description"];
  document.getElementById("need_point")!.innerHTML =
    Prize.prizelist[num]["need_point"];
  const confirmOpenPrize = document.getElementById("confirmOpenPrize")!;
  confirmOpenPrize.classList.add("d-flex");
  confirmOpenPrize.classList.remove("d-none");
  document.getElementById("openPrize")?.addEventListener("click", async (e) => {
    if (await openPrize(num)) {
      const targetPrize = Prize.prizelist[num];
      operateTarget.innerHTML = getOpendPrizeDivText(targetPrize);
      operateTarget.removeEventListener("click", openPurchasePrizeWindow);
      operateTarget.addEventListener("click", async (e) => {
        changeSelectedPrize(
          e,
          Number(targetPrize["type_id"]),
          Number(targetPrize["id"])
        );
      });
      confirmOpenPrize.classList.remove("d-flex");
      confirmOpenPrize.classList.add("d-none");
    }
  });
}

async function selectPrize(type: number, id: number): Promise<number> {
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

async function changeSelectedPrize(e: Event, type_id: number, id: number) {
  const me = <HTMLDivElement>e.currentTarget;

  const selected = await selectPrize(type_id, id);

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

async function openPrize(id: number): Promise<boolean> {
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
        if (re["result"] == -1) return reslove(true);
        else {
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

function deleteProfile() {
  if (Skin.changeSkin != Skin.nowSkin) {
    fetch("http://" + window.location.host + "/updateSkin", {
      method: "POST",
      body: JSON.stringify(Skin.changeSkin),
    }).then((response) => {
      if (response.ok) {
        Skin.nowSkin = Skin.changeSkin;
      } else {
        return Promise.reject(new Error("エラーです"));
      }
    });
  }
  const profile = document.getElementById("Profile");
  profile!.remove();
}
