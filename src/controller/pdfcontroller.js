const fs = require("fs");
const dicer = require("dicer");
const sql = require("../db/dbconnect");
const axios = require("axios");
const path = require("path");

function getData(req, res, webContents, store, client, index, dialog, window) {
  var pacreg = null;

  function filesView() {
    window.loadFile(path.join(__dirname, "../views/files.html"));
    window.setSize(800, 800);
    window.center();
    window.show();
    window.webContents.removeAllListeners("did-finish-load");
  }

  function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  }

  async function getInfo() {
    const stream = fs.createReadStream(
      store.get("files")[store.get("files").length - 1].file
    );

    axios
      .post(
        "http://localhost:4500/getInfo",
        stream,

        {
          headers: {
            "Content-Type": "application/octet-stream",
            recordArray: JSON.stringify({ record: store.get("record") }),
          },
        }
      )
      .then((response) => {
        filesView();
        if (response.data.type !== "") {
          let files = store.get("files");
          files[files.length - 1].filename =
            response.data.type + files[files.length - 1].filename;
          store.set("files", files);
        }
        webContents.on("did-finish-load", function formSender() {
          webContents.send("files", {
            files: store.get("files"),
            records: store.get("record"),
            pacreg: response.data.atd,
            client,
          });
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  try {
    const RE_BOUNDARY =
      /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
    let m;
    var filename = "";
    // var filename2 = "";
    var saveFile = fs.createWriteStream(
      "./" + store.get("files").length.toString() + ".pdf"
    );
    function writer(data) {
      saveFile.write(data);
    }
    // const form = {};
    if (
      req.method === "POST" &&
      req.headers["content-type"] &&
      (m = RE_BOUNDARY.exec(req.headers["content-type"]))
    ) {
      const d = new dicer({ boundary: m[1] || m[2] });

      d.on("part", (p) => {
        console.log("Nova impressão!");
        p.on("header", (header) => {
          filename = header["content-disposition"][0];
          if (filename.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)[1]) {
            filename = filename.match(
              /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
            )[1];
            filename = filename.replaceAll('"', "");
            if (filename.includes("=?utf-8?B")) {
              filename = filename.slice(10, -2);
              filename = b64DecodeUnicode(filename);
            }
          } else {
            return res.sendStatus(404);
          }
        });
        p.on("data", (data) => {
          if (!res.headersSent) {
            writer(data);
          }
        });
        p.on("end", () => {
          console.log("Fim da impressão.");
        });
      });
      d.on("finish", async () => {
        try {
          var files = store.get("files");
          files.push({
            filename,
            file: store.get("files").length.toString() + ".pdf",
          });
          store.set("files", files);
          console.log("Arquivo montado e sendo enviado...");
          res.writeHead(200);
          res.end("Form submission successful!");
          if (client === "Smart") {
            if (filename.match(/\d+\.\d+\.pdf$/)) {
              let osm1 = filename
                .match(/\d+\.\d+\.pdf$/)[0]
                .split(".pdf")[0]
                .split(".")[0];
              let osm2 = filename
                .match(/\d+\.\d+\.pdf$/)[0]
                .split(".pdf")[0]
                .split(".")[1];
              if ((pacreg = await sql.pacreg(osm1, osm2))) {
                store.set("pacreg", pacreg.pacreg);
                store.set("convenio", pacreg.convenio);
                store.set("email_med", pacreg.email_med);
              } else {
                dialog.showErrorBox(
                  "Erro",
                  "Erro na consulta da Ordem de Servico na Base de Dados"
                );
                index(window, store);
              }
            } else if (filename.match(/O\.S\. \d+\.\d+/)) {
              let osm1 = filename
                .match(/O\.S\. \d+\.\d+/)[0]
                .split("O.S. ")[1]
                .split(".")[0];
              let osm2 = filename
                .match(/O\.S\. \d+\.\d+/)[0]
                .split("O.S. ")[1]
                .split(".")[1];

              if ((pacreg = await sql.pacreg(osm1, osm2))) {
                store.set("pacreg", pacreg.pacreg);
                store.set("convenio", pacreg.convenio);
                store.set("email_med", pacreg.email_med);
              } else {
                dialog.showErrorBox(
                  "Erro",
                  "Erro na consulta da Ordem de Servico na Base de Dados"
                );
                index(window, store);
              }
            }
            filesView();
            webContents.on("did-finish-load", function formSender() {
              webContents.send("files", {
                files: store.get("files"),
                records: store.get("record"),
                pacreg: store.get("pacreg"),
                client,
              });
            });
          } else if (client === "Tasy") {
            await getInfo();
          } else {
            filesView();
            webContents.on("did-finish-load", function formSender() {
              webContents.send("files", {
                files: store.get("files"),
                records: store.get("record"),
                client,
              });
            });
          }
        } catch (error) {
          console.log(error);
          dialog.showErrorBox(
            "Erro",
            "Erro na consulta da Ordem de Servico na Base de Dados"
          );
          index(window, store);
        }
      });
      req.pipe(d);
    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (error) {
    console.error(error);
  }
}

function getData24(
  req,
  res,
  webContents,
  store,
  client,
  index,
  dialog,
  window
) {
  var filename = "";
  var pacreg = null;

  function b64DecodeUnicode(str) {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  }

  function filesView() {
    window.loadFile(path.join(__dirname, "../views/files.html"));
    window.setSize(800, 800);
    window.center();
    window.show();
    window.webContents.removeAllListeners("did-finish-load");
  }

  async function getInfo() {
    const stream = fs.createReadStream(
      store.get("files")[store.get("files").length - 1].file
    );

    axios
      .post(
        "http://localhost:4500/getInfo",
        stream,

        {
          headers: {
            "Content-Type": "application/octet-stream",
            recordArray: JSON.stringify({ record: store.get("record") }),
          },
        }
      )
      .then((response) => {
        filesView();
        if (response.data.type !== "") {
          let files = store.get("files");
          files[files.length - 1].filename =
            response.data.type + files[files.length - 1].filename;
          store.set("files", files);
        }
        webContents.on("did-finish-load", function formSender() {
          webContents.send("files", {
            files: store.get("files"),
            records: store.get("record"),
            pacreg: response.data.atd,
            client,
          });
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  filename = req.file.originalname;
  filename = filename.slice(10, -2);
  filename = b64DecodeUnicode(filename);

  fs.writeFileSync(
    "./" + store.get("files").length.toString() + ".pdf",
    req.file.buffer
  );

  try {
    var files = store.get("files");
    files.push({
      filename,
      file: store.get("files").length.toString() + ".pdf",
    });
    store.set("files", files);
    console.log("Arquivo montado e sendo enviado...");
    res.status(201).location("/return").send();
    if (client === "Smart") {
      try {
        if (filename.match(/\d+\.\d+\.pdf$/)) {
          let osm1 = filename
            .match(/\d+\.\d+\.pdf$/)[0]
            .split(".pdf")[0]
            .split(".")[0];
          let osm2 = filename
            .match(/\d+\.\d+\.pdf$/)[0]
            .split(".pdf")[0]
            .split(".")[1];

          sql.pacreg(osm1, osm2).then((result) => {
            if (result) {
              filesView();
              store.set("pacreg", result.pacreg);
              store.set("convenio", result.convenio);
              store.set("email_med", result.email_med);
              webContents.on("did-finish-load", () => {
                webContents.send("files", {
                  files: store.get("files"),
                  records: store.get("record"),
                  pacreg: store.get("pacreg"),
                  client,
                });
              });
            } else {
              dialog.showErrorBox(
                "Erro",
                "Erro na consulta da Ordem de Servico na Base de Dados"
              );
              index(window, store);
            }
          });
        } else if (filename.match(/O\.S\. \d+\.\d+/)) {
          let osm1 = filename
            .match(/O\.S\. \d+\.\d+/)[0]
            .split("O.S. ")[1]
            .split(".")[0];
          let osm2 = filename
            .match(/O\.S\. \d+\.\d+/)[0]
            .split("O.S. ")[1]
            .split(".")[1];
          sql.pacreg(osm1, osm2).then((result) => {
            if (result) {
              filesView();
              store.set("pacreg", result.pacreg);
              store.set("convenio", result.convenio);
              store.set("email_med", result.email_med);
              webContents.on("did-finish-load", () => {
                webContents.send("files", {
                  files: store.get("files"),
                  records: store.get("record"),
                  pacreg: store.get("pacreg"),
                  client,
                });
              });
            } else {
              dialog.showErrorBox(
                "Erro",
                "Erro na consulta da Ordem de Servico na Base de Dados"
              );
              index(window, store);
            }
          });
        } else {
          filesView();
          webContents.on("did-finish-load", () => {
            webContents.send("files", {
              files: store.get("files"),
              records: store.get("record"),
              pacreg: store.get("pacreg"),
              client,
            });
          });
        }
      } catch (error) {
        console.log(error);
        dialog.showErrorBox(
          "Erro",
          "Erro na consulta da Ordem de Servico na Base de Dados"
        );
        index(window, store);
      }
    } else if (client === "Tasy") {
      getInfo();
    } else {
      filesView();
      webContents.on("did-finish-load", function formSender() {
        webContents.send("files", {
          files: store.get("files"),
          records: store.get("record"),
          client,
        });
      });
    }
  } catch (error) {
    console.log(error);
    dialog.showErrorBox("Erro", "Erro no upload de arquivo");
    index(window, store);
  }
}

module.exports = {
  getData,
  getData24,
};
