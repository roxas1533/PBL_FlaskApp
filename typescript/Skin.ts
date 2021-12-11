export class Skin {
  static skinlist: { [key: string]: string }[];
  static nowSkin: number;
  static changeSkin: number;
  static updateSkin(dom: HTMLDivElement) {
    const target = dom;
    target.classList.add("selected");
    let previous = target.previousElementSibling;
    while (previous != null) {
      previous.classList.remove("selected");
      previous = previous.previousElementSibling;
    }
    let next = target.nextElementSibling;
    while (next != null) {
      next.classList.remove("selected");
      next = next.nextElementSibling;
    }
    Skin.changeSkin = Number(target.dataset.number);
  }
}
