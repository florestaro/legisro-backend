// Ponte segura entre a tela (app/) e o processo principal.
const { contextBridge, ipcRenderer } = require('electron');

const chamar = (canal, ...args) => ipcRenderer.invoke(canal, ...args);

contextBridge.exposeInMainWorld('api', {
  chamar,
  aoReceberTrechoIA: (funcao) => ipcRenderer.on('ia:trecho', (_evento, id, trecho) => funcao(id, trecho)),
});
