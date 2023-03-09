const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

contextBridge.exposeInMainWorld("path", {
  text: (str) => path.join(__dirname, str),
});

contextBridge.exposeInMainWorld("Buffer", {
  from: (string) => Buffer.from(string),
});
