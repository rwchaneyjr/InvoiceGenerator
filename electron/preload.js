const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('invoiceAPI', {
  getBusiness: () => ipcRenderer.invoke('storage:get-business'),
  saveBusiness: (business) => ipcRenderer.invoke('storage:save-business', business),
  getSettings: () => ipcRenderer.invoke('storage:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('storage:save-settings', settings),
  listInvoices: () => ipcRenderer.invoke('storage:list-invoices'),
  getInvoice: (id) => ipcRenderer.invoke('storage:get-invoice', id),
  saveInvoice: (invoice) => ipcRenderer.invoke('storage:save-invoice', invoice),
  deleteInvoice: (id) => ipcRenderer.invoke('storage:delete-invoice', id),
  choosePdfPath: (defaultName) => ipcRenderer.invoke('dialog:save-pdf', defaultName),
  savePdf: (payload) => ipcRenderer.invoke('pdf:save', payload),
  printInvoice: (html) => ipcRenderer.invoke('print:invoice', html),
  showItemInFolder: (filePath) => ipcRenderer.invoke('shell:show-item', filePath),
  getDataPath: () => ipcRenderer.invoke('app:get-data-path')
});
