require("dotenv").config();
const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require("electron");
const axios = require("axios");
const fs = require("fs");
var noPaperUrl = process.env.NOPAPER_URL;
var docsUrl = noPaperUrl + "/api/cb_docs";
var loginURL = noPaperUrl + "/api/auth/login";
var recordURL = noPaperUrl + "/api/document-types";
var userUrl = noPaperUrl + "/api/user";
const path = require("path");
const { app: express, server } = require("./server");
const { getData } = require("./controller/pdfcontroller");
const FormData = require("form-data");
const qr = require("qrcode");
const Store = require("electron-store");
const appToken = "XNQIQRI1SVT";
const sql = require("./db/dbconnect");
var client = "Smart";

const store = new Store();
var form = new FormData();
var mainWindow;
var tray;

async function loading() {
  mainWindow.webContents.removeAllListeners("did-finish-load");
  mainWindow.setAlwaysOnTop(false);
  mainWindow.hide();
  setTimeout(() => {
    mainWindow.loadFile(path.join(__dirname, "./views/loading.html"));
    mainWindow.setSize(800, 300);
    mainWindow.center();
    mainWindow.show();
  }, 300);
}

function index() {
  mainWindow.webContents.removeAllListeners("did-finish-load");
  mainWindow.setAlwaysOnTop(false);
  mainWindow.hide();
  store.set("files", []);
  store.set("pacreg", null);
  store.set("convenio", null);
  setTimeout(() => {
    mainWindow.loadFile(path.join(__dirname, "./views/index.html"));
    mainWindow.setSize(800, 300);
    mainWindow.center();
    mainWindow.hide();
  }, 300);
}

function login() {
  mainWindow.setAlwaysOnTop(true);
  setTimeout(() => {
    mainWindow.loadFile(path.join(__dirname, "./views/login.html"));
    mainWindow.setSize(800, 500);
    mainWindow.center();
    mainWindow.show();
    logoutButton = trayMenu.getMenuItemById("logout");
    logoutButton.enabled = false;
  }, 300);
}

function config() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    alwaysOnTop: true,
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

  tray = new Tray(path.join(__dirname, "./assets/images/logo_quad.png"));

  // and load the index.html of the app.

  mainWindow.loadFile(path.join(__dirname, "./views/login.html"));

  mainWindow.on("minimize", function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  // mainWindow.webContents.openDevTools();

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
      click: async function () {
        await loading();
        store.set("login", null);
        store.set("record", null);
        store.set("user", null);
        // store.get("files").map((current) => {
        //   fs.unlinkSync(path.join(__dirname, `./file/${current.file}`));
        // });
        store.set("files", []);
        login();
      },
    },
  ]);

  tray.setContextMenu(trayMenu);

  tray.on("double-click", () => {
    mainWindow.show();
  });

  store.set("login", null);
}

if (require("electron-squirrel-startup")) {
  app.quit();
}

app.on("ready", async () => {
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
          index();
        }
      }
    }

    return false;
  });

  server.listen(express.get("port"));

  express.post("/pdf", (req, res) => {
    if (store.get("login")) {
      getData(req, res, mainWindow.webContents, store, client, index, dialog);
      mainWindow.loadFile(path.join(__dirname, "./views/files.html"));
      mainWindow.setSize(800, 800);
      mainWindow.center();
      mainWindow.show();
      mainWindow.webContents.removeAllListeners("did-finish-load");
    } else {
      res.writeHead(404);
      res.end();
    }
  });
});

ipcMain.on("index", () => {
  index();
});

ipcMain.on("returnLogin", () => {
  login();
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
  await loading();
  store.set("files", []);
  try {
    var resLogin = await axios({
      headers: { "X-APP-TOKEN": appToken, "Content-type": "application/json" },
      method: "post",
      url: loginURL,
      // url: "http://localhost:3000/teste",
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
              store.set("login", resLogin.data);
              store.set("record", resRecord.data);
              store.set("user", resUser.data);
              index();
              logoutButton = trayMenu.getMenuItemById("logout");
              logoutButton.enabled = true;
            }
          } catch (error) {
            dialog.showErrorBox("Erro", "Erro na configuração de usuário");
            login();
          }
        }
      } catch (error) {
        dialog.showErrorBox(
          "Erro",
          "Erro na configuração de Tipos de Documentos"
        );
        login();
      }
    }
  } catch (error) {
    dialog.showErrorBox("Erro", "Login sem sucesso...");
    login();
  }
});

ipcMain.on("confirm", async (e, formIn) => {
  mainWindow.webContents.removeAllListeners("did-finish-load");
  loading();
  var indexPage = false;
  var params = formIn.parms;
  var qrCodeLink;
  params.data_nascimento = params.data_nascimento.toISOString().split("T")[0];
  params.convenio = store.get("convenio");
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
        // url: "https://webhook.site/f1fd5b2d-4546-4a87-8a35-604edfa96a6d",
        data: form,
      });

      console.log("Resposta do servidor : " + resposta.status + ".");

      if (resposta.status === 200 && i === 0) {
        if (resposta.data.link) {
          qrCodeLink = resposta.data.link;
        }
      } else if (resposta.status === 403) {
        console.log(resposta.data[0]);
        console.log(resposta.status);
        dialog.showErrorBox("Erro", "Erro no envio do arquivo");
      }
    } catch (error) {
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
    }
  }

  if (formIn.send_mail !== "true" && formIn.qrcode) {
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
    index();
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
    if ((formForData.parms = await sql.getdata(formForData.pacReg))) {
      formForData.parms = await sql.getdata(formForData.pacReg);
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
        index();
      }
    } else {
      dialog.showErrorBox("Erro", "Paciente não encontrado na base de dados.");
      index();
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
  store.set("login", null);
  store.set("record", null);
  store.set("user", null);
  // store.get("files").map((current) => {
  //   fs.unlinkSync(path.join(__dirname, `./file/${current.file}`));
  // });
  store.set("files", []);

  server.close();
});
