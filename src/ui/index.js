const path = require("path");

function loading(window) {
  window.webContents.removeAllListeners("did-finish-load");
  window.setAlwaysOnTop(false);
  window.hide();
  setTimeout(() => {
    window.loadFile(path.join(__dirname, "../views/loading.html"));
    window.setSize(800, 300);
    window.center();
    window.show();
  }, 300);
}
function index(window, store) {
  window.webContents.removeAllListeners("did-finish-load");
  window.setAlwaysOnTop(false);
  window.hide();
  store.set("files", []);
  store.set("pacreg", null);
  store.set("convenio", null);
  setTimeout(() => {
    window.loadFile(path.join(__dirname, "../views/index.html"));
    window.setSize(800, 300);
    window.center();
    window.hide();
  }, 300);
}

function login(window, trayMenu) {
  window.setAlwaysOnTop(true);
  setTimeout(() => {
    window.loadFile(path.join(__dirname, "../views/login.html"));
    window.setSize(800, 500);
    window.center();
    window.show();
    logoutButton = trayMenu.getMenuItemById("logout");
    logoutButton.enabled = false;
  }, 300);
}



module.exports = {
  login,
  index,
  loading,
};
