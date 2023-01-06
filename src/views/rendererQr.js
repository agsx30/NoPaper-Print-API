const cancelButton = document.querySelector("#cancelQRCode");
const img = document.querySelector("#img");
const img2 = document.querySelector("#img2");

cancelButton.addEventListener("click", () => {
  formRender = null;
  ipcRenderer.send("index");
});

ipcRenderer.on("loadQRCode", (data) => {
  setTimeout(() => {
    img.remove()
    img2.insertAdjacentHTML("beforeBegin", data);
  }, 400);
});

