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
        `<div data-number="${prize["id"]}" class="pos-relative prize">` +
          getOpendPrizeDivText(prize) +
          "</div>"
      );
      const addedElement = prizeTypeWrapper!.lastElementChild!;
      addedElement.addEventListener("click", async (e) => {
        Prize.changeSelectedPrize(
          e,
          Number(prize["type_id"]),
          Number(prize["id"])
        );
      });
      if (Prize.prizeSelected & (1 << Number(prize["id"]))) {
        addedElement.classList.add("selected");
      }
    } else {
      prizeTypeWrapper!.insertAdjacentHTML(
        "beforeend",
        `<div data-number="${prize["id"]}" class="pos-relative prize">
        <img src="static/img/prizeImage/${prize["image_name"]}.png" class="prize-image"/>
        <div class="pos-absolute point-not-opened lock"/>
        <img src="static/img/locked.png" class="pos-absolute locked-image lock" />
      <div class="pos-absolute balloon lock">
        <p>開放:${prize["need_point"]}p</p>
      </div>
      </div>`
      );
      const me = prizeTypeWrapper!.lastElementChild!;
      me.removeEventListener("click", openPurchasePrizeWindow);
      me.addEventListener("click", openPurchasePrizeWindow);
    }
  });
  const prizeConfirm = document.getElementById("confirm")!;
  prizeConfirm.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  updatePrizePointString();
}

function openPurchasePrizeWindow(e: Event) {
  const operateTarget = <HTMLDivElement>e.currentTarget!;
  const num = Number(operateTarget.getAttribute("data-number"));
  document.getElementById("prizeName")!.innerHTML =
    Prize.prizeDict[num]["description"];
  document.getElementById("need_point")!.innerHTML =
    Prize.prizeDict[num]["need_point"];
  const confirmOpenPrize = document.getElementById("confirmOpenPrize")!;
  confirmOpenPrize.setAttribute("data", num.toString());
  confirmOpenPrize.classList.add("d-flex");
  confirmOpenPrize.classList.remove("d-none");
  const openPrizeElement = document.getElementById("openPrize");
  openPrizeElement!.removeEventListener("click", yesEvent);
  openPrizeElement!.addEventListener("click", yesEvent);
  const prizeCloseList = Array.from(
    document.getElementsByClassName("prize-close")
  );
  prizeCloseList.forEach((p) => {
    p.addEventListener("click", closeConfirmWindow, {
      once: true,
    });
  });
}
function closeConfirmWindow(e: Event) {
  const confirmOpenPrize = document.getElementById("confirmOpenPrize")!;
  e.stopPropagation();
  confirmOpenPrize.classList.remove("d-flex");
  confirmOpenPrize.classList.add("d-none");
  const prizeCloseList = Array.from(
    document.getElementsByClassName("prize-close")
  );
  prizeCloseList.forEach((p) => {
    p.removeEventListener("click", closeConfirmWindow);
  });
}
async function yesEvent(e: Event) {
  const confirmOpenPrize = document.getElementById("confirmOpenPrize")!;
  const num = Number(confirmOpenPrize.getAttribute("data"));
  if (await Prize.openPrize(Number(Prize.prizeDict[num]["id"]))) {
    updatePrizePointString();
    const targetPrize = Prize.prizeDict[num];
    const prizesElementList = Array.from(
      document.getElementsByClassName("prize")
    );
    let operateTarget: HTMLDivElement | undefined;
    prizesElementList.forEach((ele) => {
      const dataId = Number(ele.getAttribute("data-number"));
      if (dataId === num) {
        operateTarget = <HTMLDivElement>ele;
        return;
      }
    });
    if (operateTarget != undefined) {
      operateTarget.innerHTML = getOpendPrizeDivText(targetPrize);
      operateTarget.removeEventListener("click", openPurchasePrizeWindow);
      operateTarget.addEventListener("click", async (e) => {
        Prize.changeSelectedPrize(
          e,
          Number(targetPrize["type_id"]),
          Number(targetPrize["id"])
        );
      });
    }
    confirmOpenPrize.classList.remove("d-flex");
    confirmOpenPrize.classList.add("d-none");
  }
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

function updatePrizePointString() {
  const elements = Array.from(document.getElementsByClassName("havePoint"));
  elements.forEach((element) => {
    element.innerHTML = Prize.userPoint.toString();
  });
}
