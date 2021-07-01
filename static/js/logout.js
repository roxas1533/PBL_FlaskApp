function logout() {
  fetch("http://" + window.location.host + "/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (response.ok) {
      location.reload();
    } else {
      return Promise.reject(new Error("エラーです"));
    }
  });
}
