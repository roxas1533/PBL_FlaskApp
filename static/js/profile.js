let profile;
window.addEventListener("load", function () {
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
});

function openProfile() {
  const body = document.querySelector("html body");
  body.insertAdjacentHTML("afterbegin", profile);
}

function deleteProfile() {
  const profile = document.getElementById("Profile");
  profile.remove();
}
