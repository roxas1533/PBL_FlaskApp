import { setting, Skin } from "./loading";

let profile: string;
let nowSetting = 0;

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

function openProfile() {
  const body = document.querySelector("html body");
  body!.insertAdjacentHTML("afterbegin", profile);
  const skin = document.getElementById("skins");

  Skin.skinlist.forEach((e, i) => {
    skin!.insertAdjacentHTML(
      "beforeend",
      `<div data-number="${i}" class="skin" onclick="updateSkin(this)">
    <div class="example firearm" style="background-color: ${e["firearm"]};"></div>
    <div class="example body" style="background-color: ${e["body"]};"></div>
    </div>`
    );
  });

  skin!.children[Skin.nowSkin].classList.add("nowSkin");
}
window.openProfile = openProfile;
window.openSetting = openSetting;
window.updateSkin = updateSkin;
window.deleteProfile = deleteProfile;
window.changesetting = changesetting;
window.changeKey = changeKey;
window.updateSetting = updateSetting;
window.resertDefault = resertDefault;
function openSetting() {
  const body = document.querySelector("html body");
  body!.insertAdjacentHTML("afterbegin", setting.settingpage);
  setting.stackSetting();
  changesetting(<HTMLDivElement>document.getElementById("0"));
}

function updateSkin(dom: HTMLDivElement) {
  const target = dom;
  target.classList.add("nowSkin");
  let previous = target.previousElementSibling;
  while (previous != null) {
    previous.classList.remove("nowSkin");
    previous = previous.previousElementSibling;
  }
  let next = target.nextElementSibling;
  while (next != null) {
    next.classList.remove("nowSkin");
    next = next.nextElementSibling;
  }
  Skin.changeSkin = Number(target.dataset.number);
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

function changesetting(obj: HTMLDivElement) {
  const profile = document.getElementById("settingWrapper");
  const settingname = document.getElementById("settingname");
  settingname!.innerHTML = obj.innerHTML;
  if (profile ?? false) profile!.remove();
  const settingcontent = document.getElementById("settingcontent");
  switch (obj.id) {
    case "0":
      settingcontent!.insertAdjacentHTML("afterbegin", setting.gamesetting);
      const show_damage: HTMLInputElement = <HTMLInputElement>(
        document.getElementById("cb_toggle_switch")
      );
      show_damage!.checked = setting.tempSetting["show_damage"];
      show_damage.addEventListener("change", (e) => {
        setting.tempSetting["show_damage"] = +show_damage.checked;
      });
      //   num = document.getElementById("num");
      //   num.innerText = viewnum.value;
      //   viewnum.addEventListener("input", (e) => {
      //     num.innerText = e.target.value;
      //     setting.tempSetting["view_num"] = e.target.value;
      //   });
      break;
    case "1":
      settingcontent!.insertAdjacentHTML("afterbegin", setting.keysetting);
      let keys = document.getElementsByClassName("key");
      Array.prototype.forEach.call(keys, (e) => {
        e.innerHTML = setting.tempSetting[e.id];
      });
      break;
  }
  obj.style.color = "white";
  obj.style.border = "solid 2px #59a6ff";
  obj.style.background = "#2c2c2c";
  nowSetting = Number(obj.id);

  const settinglist: HTMLDivElement = <HTMLDivElement>(
    document.getElementById("settinglist")
  );
  const settinglists = settinglist!.childNodes;

  settinglists.forEach((e) => {
    if (e.nodeName != "#text") {
      const ele = <HTMLDivElement>e;
      if (nowSetting != Number(ele.id)) {
        ele.style.color = "#888888";
        ele.style.border = "solid 1px #888888";
        ele.style.background = "none";
        ele.addEventListener(
          "mouseenter",
          () => {
            ele.style.background = "#2c2c2c";
          },
          false
        );
        ele.addEventListener(
          "mouseleave",
          () => {
            ele.style.background = "none";
          },
          false
        );
      }
    }
    // console.log(e.id);
  });
  // console.log(obj.id);
}

function changeKey(obj: HTMLDivElement) {
  const body = document.querySelector("html body");
  body!.insertAdjacentHTML(
    "afterend",
    `<div class="overray" tabindex="0" id=keyoverray onclick="this.remove()" style="flex-direction: column;">
  <h1 style="color:white;">割り当てるキーを入力してください。</h1>
  <div class="spinner-box">
  <div class="configure-border-1"></div>  
  <div class="configure-border-2"></div>
</div>
    </div>`
  );
  const keyoverray = document.getElementById("keyoverray")!;
  keyoverray.focus();
  keyoverray.addEventListener("keyup", (e) => {
    obj.innerHTML = `${e.key == " " ? "SPACE" : e.key}`.toUpperCase();
    setting.tempSetting[obj.id] = obj.innerHTML;
    keyoverray.remove();
  });
}

function updateSetting() {
  setting.updateSetting();
  fetch("http://" + window.location.host + "/updateSetting", {
    method: "POST",
    body: JSON.stringify(setting.setting),
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(new Error("エラーです"));
    }
  });
  deleteProfile();
}

function resertDefault() {
  setting.setDef();
  changesetting(<HTMLDivElement>document.getElementById("0"));
}
