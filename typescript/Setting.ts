export class Setting {
  public tempSetting: any;
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
}
