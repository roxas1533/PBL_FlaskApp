let profile;
let skinlist;
let nowSkin;
let changeSkin;
window.addEventListener("load", function () {
  loadProfile();
});
function loadProfile() {
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
}

function openProfile() {
  const body = document.querySelector("html body");
  body.insertAdjacentHTML("afterbegin", profile);
  const skin = document.getElementById("skins");

  skinlist.forEach((e, i) => {
    skin.insertAdjacentHTML(
      "beforeend",
      `<div data-number="${i}" class="skin" onclick="updateSkin()">
    <div class="example body" style="background-color: ${e["body"]};"></div>
    <div class="example firearm" style="background-color: ${e["body"]};"></div>
    </div>`
    );
  });

  skin.children[nowSkin].classList.add("nowSkin");
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
