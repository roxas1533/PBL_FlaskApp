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

  skin!.children[Skin.nowSkin].classList.add("nowSkin");

  const prizes = document.getElementById("prizes")!;

  Prize.prizelist.forEach((e, i) => {
    if (Prize.userOpend & Number(e["id"])) {
      prizes.insertAdjacentHTML(
        "beforeend",
        `<div data-number="${i}" class="pos-relative prize">
        <img src="static/img/prizeImage/${e["image_name"]}.png" class="prize-image">
      <div class="pos-absolute balloon">
        <p>${e["description"]}</p>
      </div>
      </div>`
      );
    } else {
      prizes.insertAdjacentHTML(
        "beforeend",
        `<div data-number="${i}" class="pos-relative prize">
        <img src="static/img/prizeImage/${e["image_name"]}.png" class="prize-image"/>
        <div class="pos-absolute point-not-opened lock"/>
        <img src="static/img/locked.png" class="pos-absolute locked-image lock" />
      <div class="pos-absolute balloon lock">
        <p>開放:${e["need_point"]}p</p>
      </div>
      </div>`
      );
      prizes.lastElementChild?.addEventListener("click", openPrize);
    }
  });
  document
    .getElementById("confirmOpenPrize")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      (<HTMLDivElement>e.currentTarget!).classList.remove("d-flex");
      (<HTMLDivElement>e.currentTarget!).classList.add("d-none");
    });
  document.getElementById("havePoint")!.innerHTML = Prize.userPoint.toString();
}

function openPrize(e: Event) {
  const num = Number(
    (<HTMLDivElement>e.currentTarget!).getAttribute("data-number")
  );
  document.getElementById("prizeName")!.innerHTML =
    Prize.prizelist[num]["description"];
  document.getElementById("need_point")!.innerHTML =
    Prize.prizelist[num]["need_point"];
  const confirmOpenPrize = document.getElementById("confirmOpenPrize")!;
  confirmOpenPrize.classList.add("d-flex");
  confirmOpenPrize.classList.remove("d-none");
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
