const tableBody = document.querySelector("#tableBody");
const confirmButton = document.querySelector("#confirmButton");
const cancelButton = document.querySelector("#cancel");
const pacReg = document.querySelector("#pacReg");
const registry = document.querySelector("#registry");
const addFormButton = document.getElementById("addFormButton");
const ref = document.getElementById("ref");

var files;
var types = [];
var typesForms = [];
var forms = [];

function filterByCustomForm(arr) {
  return arr.filter((obj) => obj.custom_form === 1);
}

function updateFormsArray(forms) {
  localStorage.setItem("forms", JSON.stringify(forms));
}

function clearFormsArray() {
  localStorage.removeItem("forms");
}

ipcRenderer.on("files", (info) => {
  files = info.files;
  types = info.records;
  typesForms = filterByCustomForm(info.records);

  if (info.client === "Tasy") {
    registry.innerHTML = "Número do Atendimento";
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
      if (info.records[i].custom_form == 0) {
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

  const formsLocal = JSON.parse(localStorage.getItem("forms")) || [];
  forms = formsLocal;
  const table = document.querySelector("#table2");

  formsLocal.forEach((form) => {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td style="width: 85%; text-align: right">${form.name}</td>
        <td style="width: 15%">
          <button class="button" id="deleteButton_${form.id}">
            <img
              src="../assets/images/trash.svg"
              alt="trash can"
              width="20px"
              height="20px"
            />
          </button>
        </td>
      `;
    table.insertBefore(newRow, ref);

    const deleteButton = document.getElementById(`deleteButton_${form.id}`);
    deleteButton.addEventListener("click", function () {
      forms = forms.filter((f) => f.id !== form.id);
      updateFormsArray(forms);
      newRow.remove();
    });
  });

  if (info.pacreg) {
    pacReg.value = info.pacreg;
    pacReg.disabled = true;
  }
});

addFormButton.addEventListener("click", function () {
  const popup = document.createElement("div");
  popup.classList.add("modal");
  popup.style.display = "flex";
  popup.style.justifyContent = "center";
  popup.style.alignItems = "center";
  popup.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-card" style="border-radius: 20px;">
      <header class="modal-card-head">
        <button class="delete" aria-label="close"></button>
      </header>
      <section class="modal-card-body">
        <div class="buttons" style="display: flex; flex-direction: column;">
          ${typesForms
            .map((type) => {
              return `<button class="button" id="closeButton_${type.id}">${type.name}</button><br />`;
            })
            .join("")}
        </div>
      </section>
    </div>
  `;

  const closeButton = popup.querySelector(".delete");
  closeButton.addEventListener("click", function () {
    popup.remove();
  });

  document.body.appendChild(popup);
  popup
    .querySelector(".modal-background")
    .addEventListener("click", function () {
      popup.remove();
    });

  typesForms.forEach((type) => {
    const closeTypeButton = document.getElementById(`closeButton_${type.id}`);
    if (type.disabled === true) {
      closeTypeButton.disabled = true;
    }
    closeTypeButton.addEventListener("click", function () {
      forms.push(type);
      updateFormsArray(forms);
      const table = document.querySelector("#table2");
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td style="width: 85%; text-align: right">${type.name}</td>
        <td style="width: 15%">
          <button class="button" id="deleteButton_${type.id}">
            <img
              src="../assets/images/trash.svg"
              alt="trash can"
              width="20px"
              height="20px"
            />
          </button>
        </td>
      `;
      table.insertBefore(newRow, ref);

      const deleteButton = document.getElementById(`deleteButton_${type.id}`);
      deleteButton.addEventListener("click", function () {
        forms = forms.filter((form) => form.id !== type.id);
        updateFormsArray(forms);
        newRow.remove();
        type.disabled = false;
      });

      popup.remove();
      type.disabled = true;
    });
  });
});

confirmButton.addEventListener("click", () => {
  let retrievedArray = JSON.parse(localStorage.getItem("forms"));

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
      clearFormsArray();
      form.files = filesFinal;
      form.pacReg = pacReg.value;
      if (retrievedArray) {
        retrievedArray.length === 0
          ? (form.forms = false)
          : (form.forms = retrievedArray);
      }

      ipcRenderer.send("dbConnect", form);
    }
  }
});

cancelButton.addEventListener("click", () => {
  alert("Impressao cancelada");
  clearFormsArray();
  formRender = null;
  ipcRenderer.send("index");
});
