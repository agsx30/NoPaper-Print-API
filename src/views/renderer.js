const cancelButton = document.querySelector("#cancel");
const confirmButton = document.querySelector("#confirm");
const emailCheckbox = document.querySelector("#emailBox");
const email = document.querySelector("#email");
const cpf = document.querySelector("#cpf");
const dob = document.querySelector("#dob");
const clientName = document.querySelector("#nomeCliente");
const tablet = document.querySelector("#tablet");
const QRCodeBox = document.querySelector("#QRcodeBox");
const docType = document.querySelector("#docType");
var formRender = {};
var QRcode = false;

cancelButton.addEventListener("click", () => {
  alert("Impressao cancelada");
  formRender = null;
  ipcRenderer.send("index");
});

confirmButton.addEventListener("click", () => {
  formRender.channel_name = tablet.value;

  const conf = confirm("Confirma os dados do paciente?");
  if (conf) {
    ipcRenderer.send("confirm", formRender);
    formRender = null;
  }
});

emailCheckbox.addEventListener("click", () => {
  if (emailCheckbox.checked) {
    formRender.send_mail = "true";
    tablet.disabled = true;
  } else {
    formRender.send_mail = "false";
    tablet.disabled = false;
  }
  if (QRCodeBox.checked) {
    formRender.qrcode = true;
    tablet.disabled = false;
  } else {
    formRender.qrcode = false;
  }
});

QRCodeBox.addEventListener("click", () => {
  if (QRCodeBox.checked) {
    formRender.qrcode = true;
  } else {
    formRender.qrcode = false;
  }
  if (emailCheckbox.checked) {
    formRender.send_mail = "true";
    tablet.disabled = true;
  } else {
    formRender.send_mail = "false";
    tablet.disabled = false;
  }
});

ipcRenderer.on("form", (form) => {
  email.disabled = false;
  emailCheckbox.disabled = false;
  formRender = form;
  formRender.send_mail = "false";
  formRender.qrcode = false;
  if (!form.parms.email) {
    email.disabled = true;
    emailCheckbox.disabled = true;
  }
  cpf.innerText = form.parms.cpf;
  dob.innerText = form.parms.data_nascimento
    .toLocaleString("pt-BR", { timeZone: "GMT" })
    .split(" ")[0];
  email.innerText = form.parms.email;
  clientName.innerText = form.parms.nome;
  tablet.value = form.channel_name;
});
