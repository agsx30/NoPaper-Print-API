const tableBody = document.querySelector("#tableBody");
const confirmButton = document.querySelector("#confirmButton");
const cancelButton = document.querySelector("#cancel");
const pacReg = document.querySelector("#pacReg");
const registry = document.querySelector("#registry");

var files;

ipcRenderer.on("files", (info) => {
  files = info.files;
  if(info.client==='Tasy'){
registry.innerHTML = 'Número do Atendimento'
  }
  for (let i = 0; i < files.length; i++) {
    tableBody.insertAdjacentHTML(
      "beforeBegin",
      ` <tr ${files[i].deleted ? 'style="display:none"' : ""} id="tr${
        files[i].file.split(".pdf")[0]
      }">
      <th>${Number(info.files[i].file.split(".pdf")[0]) + 1}</th>
      <td style="overflow: hidden;text-overflow: ellipsis">${
        info.files[i].filename
      }</td>
      <td style="width:100%">
          <div style="width:100%" class="dropdown is-up dropdownActivation">
            <div style="width:100%" class="dropdown-trigger">
              <button
                class="button"
                aria-haspopup="true"
                aria-controls="dropdown-menu"
                style="width:100%"
              >
                <span style="overflow: hidden;text-overflow: ellipsis" class="docType${i}" >Escolha</span>
                </span>
              </button>
            </div>
            <div class="dropdown-menu" role="menu">
              <div class="dropdown-content dropdownContent">
              </div>
            </div>
          </div>
      </div></td>
      <td><button class="button bid${i}"><img src="../assets/images/trash.svg" alt="trash can" width="20px" height="20px"></button></td>
  </tr>`
    );
  }

  var dropdownContent = document.querySelectorAll(".dropdownContent");

  for (let f = 0; f < dropdownContent.length; f++) {
    for (var i = 0; i < info.records.length; i++) {
      dropdownContent[f].insertAdjacentHTML(
        "afterBegin",
        // `<a class="dropdown-item ${info.records[i].id}"> ${info.records[i].name} </a>`
        `<a class="dropdown-item id${info.records[i].id}${i}${f}" id="${info.records[i].id}"> ${info.records[i].name} </a>`
      );

      let dropdownUnit = document.querySelector(
        ".id" + info.records[i].id + i + f
      );
      let docType = document.querySelector(`.docType` + f);
      info.records.map((current) => {
        if (files[f].filename.startsWith(current.integration_starts_with)) {
          files[f].record = current.id;
          docType.innerText = current.name;
        }
      });
      dropdownUnit.addEventListener("click", () => {
        docType.innerText = dropdownUnit.innerText;
        files[f].record = dropdownUnit.id;
      });
    }

    var deleteButton = document.querySelector(".bid" + f);
    deleteButton.addEventListener("click", () => {
      ipcRenderer.send("fileDeleteButton");
      ipcRenderer.on("dialogResponse", (result) => {
        if (result) {
          files[f].deleted = true;
          files[f].record = true;
          ipcRenderer.send("filesDelete", files);
          document.getElementById(
            "tr" + files[f].file.split(".pdf")[0]
          ).style.display = "none";
          var index = true;
          files.map((cur) => {
            if (!cur.deleted) {
              index = false;
            }
          });
          if (index) {
            ipcRenderer.send("index");
          }
        }
      });
    });
  }

  const dropdownActivation = document.querySelectorAll(".dropdownActivation");
  for (let i = 0; i < dropdownActivation.length; i++) {
    dropdownActivation[i].addEventListener("click", () => {
      if (dropdownActivation[i].classList.contains("is-active")) {
        dropdownActivation[i].classList.remove("is-active");
      } else {
        dropdownActivation[i].classList.add("is-active");
      }
    });
  }

  if (info.pacreg) {
    pacReg.value = info.pacreg;
    pacReg.disabled = true;
  }
});

confirmButton.addEventListener("click", () => {
  var form = {};
  var filesFinal = [];
  var error = false;
  files.map((current, i) => {
    if (!current.record) {
      error = true;
    }
    if (!current.deleted) {
      filesFinal.push(current);
    }
  });

  if (error) {
    let msg = "Escolha um tipo de documento para cada documento.";
    ipcRenderer.send("dialogError", msg);
  } else {
    if (!pacReg.value) {
      let msg = "Preencha o registro do paciente.";
      ipcRenderer.send("dialogError", msg);
    } else {
      confirmButton.disabled = true;
      form.files = filesFinal;
      form.pacReg = pacReg.value;
      ipcRenderer.send("dbConnect", form);
    }
  }
});

cancelButton.addEventListener("click", () => {
  alert("Impressao cancelada");
  formRender = null;
  ipcRenderer.send("index");
});
