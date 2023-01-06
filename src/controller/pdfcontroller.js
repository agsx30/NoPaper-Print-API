const fs = require("fs");
const dicer = require("dicer");
const sql = require("../db/dbconnect");

function getData(req, res, webContents, store, client, index, dialog) {
  var pacreg = null;

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
            // if (
            //   filename.replaceAll('"', "").replace(".pdf", "").match(/^\d+$/)
            // ) {
            //   filename = filename.replaceAll('"', "").replace(".pdf", "");
            //   filename2 = filename;
            // } else {
            filename = filename.replaceAll('"', "");
            //   filename2 = filename;
            if (filename.includes("=?utf-8?B")) {
              filename = filename.slice(10, -2);
              filename = b64DecodeUnicode(filename);
              // filename2 = filename;
            }
            //   if (filename.split("-")[1] === undefined) {
            //     return res.sendStatus(404);
            //   } else {
            //     filename = filename.split("-")[0];
            //     if (!filename.match(/^\d+$/)) {
            //       return res.sendStatus(404);
            //     }
            //   }
            // }
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
              pacreg = await sql.pacreg(osm1, osm2);
              store.set("pacreg", pacreg.pacreg);
              store.set("convenio", pacreg.convenio);
            } else if (filename.match(/O\.S\. \d+\.\d+/)) {
              let osm1 = filename
                .match(/O\.S\. \d+\.\d+/)[0]
                .split("O.S. ")[1]
                .split(".")[0];
              let osm2 = filename
                .match(/O\.S\. \d+\.\d+/)[0]
                .split("O.S. ")[1]
                .split(".")[1];

              pacreg = await sql.pacreg(osm1, osm2);
              store.set("pacreg", pacreg.pacreg);
              store.set("convenio", pacreg.convenio);
            }
            webContents.on("did-finish-load", function formSender() {
              webContents.send("files", {
                files: store.get("files"),
                records: store.get("record"),
                pacreg: store.get("pacreg"),
              });
            });
          } else {
            webContents.on("did-finish-load", function formSender() {
              webContents.send("files", {
                files: store.get("files"),
                records: store.get("record"),
              });
            });
          }
        } catch (error) {
          console.log(error);
          dialog.showErrorBox(
            "Erro",
            "Erro na consulta da Ordem de Servico na Base de Dados"
          );
          index();
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

module.exports = {
  getData: getData,
};
