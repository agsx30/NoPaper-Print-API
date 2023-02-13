const cancelLogin = document.querySelector("#cancelLogin");
const loginButton = document.querySelector("#loginButton");
const login = document.querySelector("#login");
const pass = document.querySelector("#pass");

cancelLogin.addEventListener("click", () => {
  login.value = null;
  pass.value = null;
});

loginButton.addEventListener("click", () => {
  localStorage.removeItem("forms");
  ipcRenderer.send("login", { login: login.value, pass: pass.value });
});
