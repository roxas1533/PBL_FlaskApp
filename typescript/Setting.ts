import { Game } from "./Game";

export class Setting {
  public tempSetting: any;
  static nowSetting = 0;

  constructor(
    public settingpage: string,
    public gamesetting: string,
    public keysetting: string,
    public setting: any,
    public defaultSetting: any
  ) {
    this.tempSetting = setting;
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
  static openSetting() {
    const body = document.querySelector("html body");
    body!.insertAdjacentHTML("afterbegin", Game.setting.settingpage);
    const settingDeleter = Array.from(
      document.getElementsByClassName("deleteProfile")
    );

    settingDeleter.forEach((d) => {
      d.addEventListener("click", document.getElementById("Profile")!.remove);
    });
    const settings = Array.from(document.getElementsByClassName("setting"));
    document
      .getElementById("updateSetting")
      ?.addEventListener("click", Setting.updateSetting);
    document
      .getElementById("resertDefault")
      ?.addEventListener("click", Setting.resertDefault);
    settings.forEach((s) => {
      s.addEventListener("click", (e) => {
        Setting.changesetting(<HTMLDivElement>s);
      });
    });

    Game.setting.stackSetting();
    Setting.changesetting(<HTMLDivElement>document.getElementById("0"));
  }

  static changesetting(obj: HTMLDivElement) {
    const profile = document.getElementById("settingWrapper");
    const settingname = document.getElementById("settingname");
    settingname!.innerHTML = obj.innerHTML;
    if (profile ?? false) profile!.remove();
    const settingcontent = document.getElementById("settingcontent");
    switch (obj.id) {
      case "0":
        settingcontent!.insertAdjacentHTML(
          "afterbegin",
          Game.setting.gamesetting
        );
        const show_damage: HTMLInputElement = <HTMLInputElement>(
          document.getElementById("showDamage")
        );
        show_damage!.checked = Game.setting.tempSetting["show_damage"];
        show_damage.addEventListener("change", (e) => {
          Game.setting.tempSetting["show_damage"] = +show_damage.checked;
        });
        const showFps: HTMLInputElement = <HTMLInputElement>(
          document.getElementById("showFps")
        );
        showFps.checked = Game.setting.tempSetting["show_fps"];
        showFps.addEventListener("change", (e) => {
          Game.setting.tempSetting["show_fps"] = +showFps.checked;
        });
        //   num = document.getElementById("num");
        //   num.innerText = viewnum.value;
        //   viewnum.addEventListener("input", (e) => {
        //     num.innerText = e.target.value;
        //     Game.setting.tempSetting["view_num"] = e.target.value;
        //   });
        break;
      case "1":
        settingcontent!.insertAdjacentHTML(
          "afterbegin",
          Game.setting.keysetting
        );
        let keys = Array.from(document.getElementsByClassName("key"));
        keys.forEach((key) => {
          key.innerHTML = Game.setting.tempSetting[key.id];
          key.addEventListener("click", (e) => {
            Setting.changeKey(<HTMLDivElement>key);
          });
        });
        break;
    }
    obj.style.color = "white";
    obj.style.border = "solid 2px #59a6ff";
    obj.style.background = "#2c2c2c";
    Setting.nowSetting = Number(obj.id);

    const settinglist: HTMLDivElement = <HTMLDivElement>(
      document.getElementById("settinglist")
    );
    const settinglists = settinglist!.childNodes;

    settinglists.forEach((e) => {
      if (e.nodeName != "#text") {
        const ele = <HTMLDivElement>e;
        if (Setting.nowSetting != Number(ele.id)) {
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
    });
  }

  static changeKey(obj: HTMLDivElement) {
    const body = document.querySelector("html body");
    body!.insertAdjacentHTML(
      "afterend",
      `<div class="d-flex overray" tabindex="0" id=keyoverray onclick="this.remove()" style="flex-direction: column;z-index:101">
    <h1 style="color:white;">割り当てるキーを入力してください。</h1>
    <div class="spinner-box">
    <div class="pos-absolute d-flex configure-border-1"></div>  
    <div class="d-flex configure-border-2"></div>
  </div>
      </div>`
    );
    const keyoverray = document.getElementById("keyoverray")!;
    keyoverray.focus();
    keyoverray.addEventListener("keyup", (e) => {
      obj.innerHTML = `${e.key == " " ? "SPACE" : e.key}`.toUpperCase();
      Game.setting.tempSetting[obj.id] = obj.innerHTML;
      keyoverray.remove();
    });
  }

  static updateSetting() {
    Game.setting.updateSetting();
    fetch("http://" + window.location.host + "/updateSetting", {
      method: "POST",
      body: JSON.stringify(Game.setting.setting),
    }).then((response) => {
      if (!response.ok) {
        return Promise.reject(new Error("エラーです"));
      }
    });
    const profile = document.getElementById("Profile");
    profile!.remove();
  }

  static resertDefault() {
    Game.setting.setDef();
    Setting.changesetting(<HTMLDivElement>document.getElementById("0"));
  }
}
