const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getInvoicesDir() {
  const dir = path.join(getDataDir(), 'invoices');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: 'Simple Invoice Generator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('storage:get-business', () => {
  return readJson(path.join(getDataDir(), 'business.json'), {
    businessName: '',
    address: '',
    email: '',
    phone: ''
  });
});

ipcMain.handle('storage:save-business', (_event, business) => {
  writeJson(path.join(getDataDir(), 'business.json'), business);
  return { ok: true };
});

ipcMain.handle('storage:get-settings', () => {
  return readJson(path.join(getDataDir(), 'settings.json'), {
    nextInvoiceNumber: 1001
  });
});

ipcMain.handle('storage:save-settings', (_event, settings) => {
  writeJson(path.join(getDataDir(), 'settings.json'), settings);
  return { ok: true };
});

ipcMain.handle('storage:list-invoices', () => {
  const dir = getInvoicesDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const invoices = files.map((file) => {
    const data = readJson(path.join(dir, file), null);
    if (!data) {
      return null;
    }
    return {
      id: data.id,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customer?.name || '',
      companyName: data.customer?.company || '',
      invoiceDate: data.invoiceDate,
      total: data.totals?.total ?? 0,
      status: data.status || 'Draft',
      updatedAt: data.updatedAt || data.createdAt || null
    };
  }).filter(Boolean);

  invoices.sort((a, b) => {
    const aDate = a.updatedAt || a.invoiceDate || '';
    const bDate = b.updatedAt || b.invoiceDate || '';
    return bDate.localeCompare(aDate);
  });

  return invoices;
});

ipcMain.handle('storage:get-invoice', (_event, id) => {
  const filePath = path.join(getInvoicesDir(), `${id}.json`);
  return readJson(filePath, null);
});

ipcMain.handle('storage:save-invoice', (_event, invoice) => {
  if (!invoice || !invoice.id) {
    throw new Error('Invoice id is required');
  }
  const filePath = path.join(getInvoicesDir(), `${invoice.id}.json`);
  writeJson(filePath, invoice);
  return { ok: true, id: invoice.id };
});

ipcMain.handle('storage:delete-invoice', (_event, id) => {
  const filePath = path.join(getInvoicesDir(), `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return { ok: true };
});

ipcMain.handle('dialog:save-pdf', async (_event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Invoice as PDF',
    defaultPath: defaultName || 'invoice.pdf',
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  return { canceled: false, filePath: result.filePath };
});

function writeTempHtml(html) {
  const tempPath = path.join(app.getPath('temp'), `invoice-preview-${Date.now()}.html`);
  fs.writeFileSync(tempPath, html, 'utf8');
  return tempPath;
}

function cleanupTemp(tempPath) {
  try {
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  } catch (error) {
    console.warn('Failed to clean temp invoice file:', error.message);
  }
}

ipcMain.handle('pdf:save', async (_event, { html, filePath }) => {
  const pdfWindow = new BrowserWindow({
    width: 850,
    height: 1100,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const tempPath = writeTempHtml(html);

  try {
    await pdfWindow.loadFile(tempPath);
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'Letter',
      marginsType: 1
    });
    fs.writeFileSync(filePath, pdfData);
    return { ok: true, filePath };
  } finally {
    pdfWindow.destroy();
    cleanupTemp(tempPath);
  }
});

ipcMain.handle('print:invoice', async (_event, html) => {
  const printWindow = new BrowserWindow({
    width: 850,
    height: 1100,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const tempPath = writeTempHtml(html);

  try {
    await printWindow.loadFile(tempPath);
    await new Promise((resolve, reject) => {
      printWindow.webContents.print({ printBackground: true }, (success, failureReason) => {
        if (!success) {
          reject(new Error(failureReason || 'Print failed'));
        } else {
          resolve();
        }
      });
    });
    return { ok: true };
  } finally {
    setTimeout(() => {
      if (!printWindow.isDestroyed()) {
        printWindow.destroy();
      }
      cleanupTemp(tempPath);
    }, 1000);
  }
});

ipcMain.handle('shell:show-item', (_event, filePath) => {
  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle('app:get-data-path', () => getDataDir());
