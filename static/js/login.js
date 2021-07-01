function login() {
  if (active) {
    let name = document.getElementById("name");
    let password = document.getElementById("password");

    if (!name.value || !name.value.match(/.*\S+.*/g)) {
      name.style.border = "1px solid #FF0000";
    }
    window
      .fetch("http://" + window.location.host + "/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          JSON.stringify({ username: name.value, password: password.value })
        ),
      })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return Promise.reject(new Error("エラーです"));
        }
      })
      .then((res) => {
        if (!res["result"]) {
          erro.innerHTML = res["reason"];
        } else {
          window.location.href = "/game";
        }
      });
  }
}
let active = false;
function chageButton(b, t, a) {
  active = a;
  if (!active) {
    b.style.backgroundColor = "#175981";
    b.style.cursor = "default";
  } else {
    b.style.backgroundColor = "#548ac9";
    b.style.cursor = "pointer";
  }

  if (!active) t.style.color = "#888888";
  else t.style.color = "#ffffff";
}
let erro;

window.addEventListener("DOMContentLoaded", function () {
  // input要素を取得
  let nullName = true;
  let nullPass = true;
  var input_name = document.getElementById("name");
  var input_pass = document.getElementById("password");
  let registButton = document.getElementById("register");
  let registText = document.getElementById("regsiterText");
  erro = document.getElementById("error");
  chageButton(registButton, registText, false);
  input_name.addEventListener("input", function () {
    if (this.value && this.value.match(/.*\S+.*/g)) {
      nullName = false;
      this.style.border = "2px solid #62b0fa";
    } else {
      nullName = true;
      this.style.border = "1px solid #FF0000";
    }
    if (!nullName && !nullPass) chageButton(registButton, registText, true);
    else chageButton(registButton, registText, false);
  });
  input_pass.addEventListener("input", function () {
    if (this.value) {
      nullPass = false;
      this.style.border = "2px solid #62b0fa";
    } else {
      nullPass = true;
      this.style.border = "1px solid #FF0000";
    }
    if (!nullName && !nullPass) chageButton(registButton, registText, true);
    else chageButton(registButton, registText, false);
  });
});
