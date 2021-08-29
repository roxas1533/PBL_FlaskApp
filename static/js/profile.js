let profile;
let skinlist;
let nowSkin;
let changeSkin;
let nowSetting = 0;

class Setting {
  constructor(settingpage, gamesetting, keysetting, setting, defaultSetting) {
    this.settingpage = settingpage;
    this.gamesetting = gamesetting;
    this.keysetting = keysetting;
    this.setting = setting;
    this.tempSetting = setting;
    this.defaultSetting = defaultSetting;
  }
  stackSetting() {
    this.tempSetting = JSON.parse(JSON.stringify(this.setting));
  }
  updateSetting() {
    this.setting = JSON.parse(JSON.stringify(this.tempSetting));
  }
  setDef() {
    this.tempSetting = JSON.parse(JSON.stringify(this.defaultSetting));
  }
}

let setting;

window.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
async function loadProfile() {
  loadingDOM = document.getElementById("loading");
  fetch("http://" + window.location.host + "/profile", {
    method: "GET",
  })
    .then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        return Promise.reject(new Error("エラーです"));
      }
    })
    .then((res) => {
      profile = res;
    });

  await fetch("http://" + window.location.host + "/setting", {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((res) => {
      setting = new Setting(
        res["main"],
        res["game"],
        res["key"],
        res["setting"],
        res["defaultSetting"]
      );
    });

  loadingDOM.classList.add("fadeout");
  setTimeout(function () {
    loadingDOM.remove();
  }, 300);
}

function openProfile() {
  const body = document.querySelector("html body");
  body.insertAdjacentHTML("afterbegin", profile);
  const skin = document.getElementById("skins");

  skinlist.forEach((e, i) => {
    skin.insertAdjacentHTML(
      "beforeend",
      `<div data-number="${i}" class="skin" onclick="updateSkin()">
    <div class="example firearm" style="background-color: ${e["firearm"]};"></div>
    <div class="example body" style="background-color: ${e["body"]};"></div>
    </div>`
    );
  });

  skin.children[nowSkin].classList.add("nowSkin");
}

function openSetting() {
  const body = document.querySelector("html body");
  body.insertAdjacentHTML("afterbegin", setting.settingpage);
  setting.stackSetting();
  changesetting(document.getElementById("0"));
}

function updateSkin() {
  const target = window.event.currentTarget;
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
  changeSkin = target.dataset.number;
}

function deleteProfile() {
  if (changeSkin != nowSkin) {
    fetch("http://" + window.location.host + "/updateSkin", {
      method: "POST",
      body: changeSkin,
    }).then((response) => {
      if (response.ok) {
        nowSkin = changeSkin;
      } else {
        return Promise.reject(new Error("エラーです"));
      }
    });
  }
  const profile = document.getElementById("Profile");
  profile.remove();
}

function changesetting(obj) {
  const profile = document.getElementById("settingWrapper");
  const settingname = document.getElementById("settingname");
  settingname.innerHTML = obj.innerHTML;
  if (profile ?? false) profile.remove();
  const settingcontent = document.getElementById("settingcontent");
  switch (obj.id) {
    case "0":
      settingcontent.insertAdjacentHTML("afterbegin", setting.gamesetting);
      viewnum = document.getElementById("viewnum");
      show_damage = document.getElementById("cb_toggle_switch");
      show_damage.checked = setting.tempSetting["show_damage"];
      viewnum.value = setting.tempSetting["view_num"];
      show_damage.addEventListener("change", (e) => {
        setting.tempSetting["show_damage"] = +show_damage.checked;
      });
      num = document.getElementById("num");
      num.innerText = viewnum.value;
      viewnum.addEventListener("input", (e) => {
        num.innerText = e.target.value;
        setting.tempSetting["view_num"] = e.target.value;
      });
      break;
    case "1":
      settingcontent.insertAdjacentHTML("afterbegin", setting.keysetting);
      let keys = document.getElementsByClassName("key");
      Array.prototype.forEach.call(keys, (e) => {
        e.innerHTML = setting.tempSetting[e.id];
      });
      break;
  }
  obj.style.color = "white";
  obj.style.border = "solid 2px #59a6ff";
  obj.style.background = "#2c2c2c";
  nowSetting = obj.id;

  const settinglist = document.getElementById("settinglist");
  settinglists = settinglist.childNodes;
  settinglists.forEach((e) => {
    if (e.nodeName != "#text") {
      if (nowSetting != e.id) {
        e.style.color = "#888888";
        e.style.border = "solid 1px #888888";
        e.style.background = "none";
        e.addEventListener(
          "mouseenter",
          () => {
            e.style.background = "#2c2c2c";
          },
          false
        );
        e.addEventListener(
          "mouseleave",
          () => {
            e.style.background = "none";
          },
          false
        );
      }
    }
    // console.log(e.id);
  });
  // console.log(obj.id);
}

function changeKey(obj) {
  const body = document.querySelector("html body");
  body.insertAdjacentHTML(
    "afterend",
    `<div class="overray" tabindex="0" id=keyoverray onclick="this.remove()" style="flex-direction: column;">
  <h1 style="color:white;">割り当てるキーを入力してください。</h1>
  <div class="spinner-box">
  <div class="configure-border-1"></div>  
  <div class="configure-border-2"></div>
</div>
    </div>`
  );
  const keyoverray = document.getElementById("keyoverray");
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
  changesetting(document.getElementById("0"));
}
