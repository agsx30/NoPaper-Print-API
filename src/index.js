require("dotenv").config();
const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require("electron");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const qr = require("qrcode");
const Store = require("electron-store");
const db = require("./db/dbconnect");
const multer = require("multer");
const upload = multer();
const { autoUpdater, AppUpdater } = require("electron-updater");

const { app: express, server } = require("./server");
const { getData, getData24 } = require("./controller/pdfcontroller");
const { login, index, loading, logout } = require("./ui");

const noPaperUrl = process.env.NOPAPER_URL;
const docsUrl = noPaperUrl + "/api/cb_docs";
const loginURL = noPaperUrl + "/api/auth/login";
const recordURL = noPaperUrl + "/api/document-types";
const userUrl = noPaperUrl + "/api/user";
const formsUrl = noPaperUrl + "/api/cb_custom_forms";

const appToken = "XNQIQRI1SVT";

const store = new Store();
var form = new FormData();
const gotTheLock = app.requestSingleInstanceLock();

var client = process.env.CLIENT;
var mainWindow;
var tray;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoRunAppAfterInstall = true;

function setupMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    simpleFullscreen: true,
    show: true,
    autoHideMenuBar: true,
    resizable: true,
    center: true,
    icon: path.join(__dirname, "./assets/images/logo_quad.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.setTitle(`NoPaper API v${app.getVersion()}`);

  mainWindow.loadFile(path.join(__dirname, "./views/login.html"));

  mainWindow.on("minimize", function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.webContents.openDevTools();
}

function setupTray() {
  tray = new Tray(path.join(__dirname, "./assets/images/logo_quad.png"));
  trayMenu = Menu.buildFromTemplate([
    {
      label: "Abrir",
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: "Fechar",
      click: function () {
        app.isQuiting = true;
        app.quit();
      },
    },
    {
      label: "Logout",
      id: "logout",
      click: function () {
        logout(mainWindow, trayMenu, store);
      },
    },
  ]);
  tray.setContextMenu(trayMenu);
  tray.on("double-click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function config() {
  setupMainWindow();
  setupTray();
  store.set("login", false);
}

if (require("electron-squirrel-startup")) {
  app.quit();
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on("ready", () => {
  autoUpdater.checkForUpdates();
  config();
  logoutButton = trayMenu.getMenuItemById("logout");
  logoutButton.enabled = false;
  mainWindow.on("closed", () => (mainWindow = null));

  mainWindow.on("close", function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      if (store.get("login")) {
        if (!store.get("files")) {
          index(mainWindow, store);
        }
      }
    }

    return false;
  });

  server.listen(express.get("port"));

  let queue = [];
  let running = false;

  async function executeQueue() {
    while (queue.length > 0) {
      running = true;
      const next = queue.shift();
      await next();
      running = false;
    }
  }

  async function addToQueue(fn) {
    queue.push(fn);
    if (!running) {
      await executeQueue();
    }
  }

  express.post("/pdf", async (req, res) => {
    await addToQueue(async () => {
      if (client === "Salux") {
        const currentTime = Math.floor(Date.now() / 1000); // convert to seconds
        if (
          store.get("saluxJWTokenTime") &&
          store.get("saluxJWTokenTime") < currentTime
        ) {
          console.log("TOKEN EXPIRADA");
          response = await db.testDBConnection(client, store);
          if (response === "ok") {
            if (store.get("login")) {
              loading(mainWindow);
              mainWindow.webContents.removeAllListeners("did-finish-load");
              getData(
                req,
                res,
                mainWindow.webContents,
                store,
                client,
                index,
                dialog,
                mainWindow
              );
            } else {
              res.writeHead(404);
              res.end();
            }
          } else {
            dialog.showMessageBox({
              message: "Erro na atualização da Token para a API SALUX.",
              buttons: ["OK"],
            });

            logout(mainWindow, trayMenu, store);
            res.writeHead(404);
            res.end();
          }
        } else if (store.get("saluxJWTokenTime")) {
          if (store.get("login")) {
            loading(mainWindow);
            mainWindow.webContents.removeAllListeners("did-finish-load");
            getData(
              req,
              res,
              mainWindow.webContents,
              store,
              client,
              index,
              dialog,
              mainWindow
            );
          } else {
            res.writeHead(404);
            res.end();
          }
        }
      } else {
        if (store.get("login")) {
          loading(mainWindow);
          mainWindow.webContents.removeAllListeners("did-finish-load");
          getData(
            req,
            res,
            mainWindow.webContents,
            store,
            client,
            index,
            dialog,
            mainWindow
          );
        } else {
          res.writeHead(404);
          res.end();
        }
      }
    });
  });

  express.post("/pdf24", upload.single("file"), async (req, res) => {
    await addToQueue(() => {
      loading(mainWindow);
      mainWindow.webContents.removeAllListeners("did-finish-load");
      if (store.get("login")) {
        getData24(
          req,
          res,
          mainWindow.webContents,
          store,
          client,
          index,
          dialog,
          mainWindow
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  });

  express.get("/return", (req, res) => {
    res.send("<script>window.close();</script > ");
  });
});

autoUpdater.on("update-available", () => {
  const response = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["Baixar", "Agora não"],
    defaultId: 0,
    message:
      "Uma nova versão do aplicativo está disponível, gostaria de baixar agora?",
  });

  if (response === 0) {
    autoUpdater.downloadUpdate();
  }
});

autoUpdater.on("update-downloaded", () => {
  const response = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["Atualizar"],
    defaultId: 0,
    message: "Seu aplicativo será atualizado agora.",
  });
  if (response === 0) {
    autoUpdater.quitAndInstall();
  }
});

autoUpdater.on("error", (error) => {
  dialog.showMessageBox(mainWindow, error);
});

ipcMain.on("index", () => {
  index(mainWindow, store);
});

ipcMain.on("returnLogin", () => {
  login(mainWindow, trayMenu);
});

ipcMain.on("fileDeleteButton", () => {
  let result = false;
  dialog
    .showMessageBox(mainWindow, {
      type: "question",
      title: "Delete",
      message: "Quer mesmo deletar essa impressão?",
      buttons: ["Não", "Sim"],
    })
    .then((res) => {
      if (res.response !== 0) {
        result = true;
        mainWindow.webContents.send("dialogResponse", result);
      }
      if (res.response === 0) {
        result = false;
        mainWindow.webContents.send("dialogResponse", result);
      }
    });
});

ipcMain.on("dialogError", (e, info) => {
  dialog.showErrorBox("Erro", info);
});

ipcMain.on("login", async (e, data) => {
  await loading(mainWindow);
  store.set("files", []);
  try {
    var resLogin = await axios({
      headers: { "X-APP-TOKEN": appToken, "Content-type": "application/json" },
      method: "post",
      url: loginURL,
      data: { email: data.login, password: data.pass },
    });

    if (resLogin.status === 200) {
      try {
        let resRecord = await axios({
          headers: {
            "X-APP-TOKEN": appToken,
            Authorization: "Bearer " + resLogin.data.access_token,
          },
          method: "get",
          url: recordURL,
        });
        if (resRecord.status === 200) {
          try {
            let resUser = await axios({
              headers: {
                "X-APP-TOKEN": appToken,
                Authorization: "Bearer " + resLogin.data.access_token,
              },
              method: "get",
              url: userUrl,
            });
            if (resUser.status === 200) {
              try {
                res = await db.testDBConnection(client, store);
                if (res === "ok") {
                  store.set("login", resLogin.data);
                  store.set(
                    "record",
                    resRecord.data.filter(
                      (obj) => obj.reception_integration === 1
                    )
                  );
                  store.set("user", resUser.data);
                  index(mainWindow, store);
                  logoutButton = trayMenu.getMenuItemById("logout");
                  logoutButton.enabled = true;
                } else {
                  console.log(res.message);
                  dialog.showMessageBox({
                    message: res.message,
                    buttons: ["OK"],
                  });

                  logout(mainWindow, trayMenu, store);
                }
              } catch (error) {
                console.log(error.message);
                dialog.showMessageBox({
                  message: error.message,
                  buttons: ["OK"],
                });

                logout(mainWindow, trayMenu, store);
              }
            }
          } catch (error) {
            dialog.showErrorBox("Erro", "Erro na configuração de usuário");
            console.log(error);
            login(mainWindow, trayMenu);
          }
        }
      } catch (error) {
        dialog.showErrorBox(
          "Erro",
          "Erro na configuração de Tipos de Documentos"
        );
        login(mainWindow, trayMenu);
      }
    }
  } catch (error) {
    dialog.showErrorBox("Erro", "Login sem sucesso...");
    login(mainWindow, trayMenu);
  }
});

ipcMain.on("confirm", async (e, formIn) => {
  mainWindow.webContents.removeAllListeners("did-finish-load");
  loading(mainWindow);
  var indexPage = false;
  var params = formIn.parms;
  var qrCodeLink;

  params.convenio = store.get("convenio");
  params.med_email = store.get("email_med");
  console.log(params);

  if (formIn.forms) {
    form = new FormData();
    form.append("custom_forms", JSON.stringify(formIn.forms));
    form.append("send_mail", formIn.send_mail);
    form.append("parms", JSON.stringify(params));
    form.append("id_user", store.get("user").id);
    form.append("channel_name", formIn.channel_name);
    try {
      let resposta = await axios({
        headers: {
          "X-APP-TOKEN": appToken,
          Authorization: "Bearer " + store.get("login").access_token,
        },
        method: "post",
        url: formsUrl,
        // url: "https://webhook.site/20d06909-c6ad-4852-aa71-aa42a8be10ed",
        data: form,
      });

      console.log("Resposta do servidor : " + resposta.status + ".");
    } catch (error) {
      console.log(error);
    }
  }

  for (let i = 0; i < formIn.files.length; i++) {
    form = new FormData();
    form.append("pdf", fs.createReadStream("./" + formIn.files[i].file), {
      filename: formIn.files[i].filename,
    });
    form.append("record_id", formIn.files[i].record);
    form.append("send_mail", formIn.send_mail);
    form.append("parms", JSON.stringify(params));
    form.append("id_user", store.get("user").id);
    form.append("channel_name", formIn.channel_name);
    try {
      let resposta = await axios({
        headers: {
          "X-APP-TOKEN": appToken,
          Authorization: "Bearer " + store.get("login").access_token,
        },
        method: "post",
        url: docsUrl,
        // url: "https://webhook.site/20d06909-c6ad-4852-aa71-aa42a8be10ed",
        data: form,
      });

      console.log("Resposta do servidor : " + resposta.status + ".");

      if (resposta.status === 200 && i === 0) {
        if (resposta.data.link) {
          qrCodeLink = resposta.data.link;
        }
      }
    } catch (error) {
      // console.log(error);
      Object.keys(error.response.data).forEach((item) => {
        if (item === "pdf") {
          dialog.showErrorBox(
            "Erro",
            "Erro no envio do arquivo, tente novamente."
          );
        } else if (item === "id_user") {
          dialog.showErrorBox(
            "Erro",
            "Erro no envio da id do usuário, tente novamente."
          );
        } else if (item === "record_id") {
          dialog.showErrorBox(
            "Erro",
            "Erro no envio do id do tipo de documento, tente novamente."
          );
        } else if (item === "parms") {
          dialog.showErrorBox(
            "Erro",
            "Erro no envio das informações do paciente, tente novamente."
          );
        }
      });
      index(mainWindow, store);
      indexPage = true;
    }
  }

  if (formIn.send_mail !== "true" && formIn.qrcode && !indexPage) {
    console.log("entrou no if do qrcode");

    qr.toString(qrCodeLink, { type: "svg", width: 350 }, (err, svg) => {
      mainWindow.hide();
      mainWindow.webContents.on("did-finish-load", function QRCodeSender() {
        mainWindow.webContents.send("loadQRCode", svg);
      });
    });

    setTimeout(() => {
      mainWindow.loadFile(path.join(__dirname, "./views/QRCode.html"));
      mainWindow.setSize(800, 700);
      mainWindow.center();
      mainWindow.show();
    }, 300);
    console.log("Arquivo enviado com sucesso.");
    indexPage = true;
  }
  if (!indexPage) {
    console.log("Arquivo enviado com sucesso.");
    index(mainWindow, store);
  }
  // store.get("files").map((current) => {
  //   fs.unlink(path.join(__dirname, `./file/${current.file}`),()=>{
  //     console.log("Removed")
  //   });
  // });
  store.set("files", []);
});

ipcMain.on("filesDelete", (e, files) => {
  store.set("files", files);
});

ipcMain.on("dbConnect", async (e, info) => {
  let formForData = info;
  try {
    if (client === "Smart") {
      if ((formForData.parms = await db.getdata(formForData.pacReg))) {
        if (
          formForData.parms.cpf &&
          formForData.parms.data_nascimento &&
          formForData.parms.nome
        ) {
          formForData.channel_name = process.env.CHANNEL_NAME;
          mainWindow.webContents.on("did-finish-load", function formSender() {
            mainWindow.webContents.send("form", formForData);
          });
          mainWindow.loadFile(path.join(__dirname, "./views/data.html"));
          mainWindow.setSize(800, 750);
          mainWindow.center();
          mainWindow.show();
        } else {
          dialog.showErrorBox(
            "Erro",
            "Paciente sem cadastro completo na base de dados."
          );
          index(mainWindow, store);
        }
      } else {
        dialog.showErrorBox(
          "Erro",
          "Paciente não encontrado na base de dados."
        );
        index(mainWindow, store);
      }
    } else if (client === "Tasy") {
      if (
        (formForData.parms = await db.getData_tasy(formForData.pacReg, store))
      ) {
        if (
          formForData.parms.cpf &&
          formForData.parms.data_nascimento &&
          formForData.parms.nome
        ) {
          formForData.channel_name = process.env.CHANNEL_NAME;
          mainWindow.webContents.on("did-finish-load", function formSender() {
            mainWindow.webContents.send("form", formForData);
          });
          mainWindow.loadFile(path.join(__dirname, "./views/data.html"));
          mainWindow.setSize(800, 750);
          mainWindow.center();
          mainWindow.show();
        } else {
          dialog.showErrorBox(
            "Erro",
            "Paciente sem cadastro completo na base de dados."
          );
          index(mainWindow, store);
        }
      } else {
        mainWindow.webContents.on("did-finish-load", function formSender() {
          mainWindow.webContents.send("erroform", store.get("formerror"));
        });
        // dialog.showErrorBox(
        //   "Erro",
        //   "Paciente não encontrado na base de dados."
        // );
        // index(mainWindow, store);
      }
    } else if (client === "Salux") {
      try {
        formForData.parms = await db.pacregSalux(formForData.pacReg, store);
        if (
          formForData.parms.cpf &&
          formForData.parms.data_nascimento &&
          formForData.parms.nome
        ) {
          formForData.channel_name = process.env.CHANNEL_NAME;
          mainWindow.webContents.on("did-finish-load", function formSender() {
            mainWindow.webContents.send("form", formForData);
          });
          mainWindow.loadFile(path.join(__dirname, "./views/data.html"));
          mainWindow.setSize(800, 750);
          mainWindow.center();
          mainWindow.show();
        } else {
          dialog.showErrorBox(
            "Erro",
            "Paciente sem cadastro completo na base de dados."
          );
          index(mainWindow, store);
        }
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
});

app.on("activate", () => {
  if (mainWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  store.set("login", false);
  store.set("record", null);
  store.set("user", null);
  store.set("convenio", null);
  // store.get("files").map((current) => {
  //   fs.unlinkSync(path.join(__dirname, `./file/${current.file}`));
  // });
  store.set("files", []);
  server.close();
});
