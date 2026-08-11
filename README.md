# Simple Invoice Generator

An offline Windows desktop app for freelancers and small businesses to create, save, preview, print, and export invoices as PDF.

No internet connection or user account is required. All customer and invoice data stays on the local computer.

## Make the Windows EXE (on your PC)

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Download or clone this repository.
3. Open a terminal in the project folder and run:

```bash
npm install
npm run dist:win
```

4. Open the `dist` folder. Your EXEs will be there:
   - `Simple Invoice Generator-1.0.0-x64.exe` — installer
   - `Simple Invoice Generator-1.0.0-portable.exe` — portable (no install)

Portable only:

```bash
npm run dist:win:portable
```

## Run in development

```bash
npm install
npm start
```

## Features

- Customer and business information forms
- Persistent business profile (saved locally)
- Auto-generated invoice numbers
- Editable line items with live line totals
- Live subtotal, tax, discount, and final total
- Invoice status: Draft, Sent, Paid, Overdue
- Preview, Print, and Save as PDF
- Local invoice history with reopen/delete
- Fully offline Electron desktop app

## Tests

```bash
npm test
```

## How data is stored

All data is stored under the Electron user data folder:

- Windows: `%APPDATA%\simple-invoice-generator\data\`
- `business.json` — saved business profile
- `settings.json` — next invoice number
- `invoices\*.json` — one file per saved invoice

Nothing is uploaded to a remote server.

## Project structure

```
electron/          Main process, preload bridge, local file storage, PDF/print
src/
  index.html       Application UI
  css/styles.css   Desktop UI styles
  js/
    app.js         UI wiring and workflow
    calculations.js  Totals and currency helpers
    validation.js    Required-field and data checks
    invoice-document.js  Printable/PDF HTML layout
tests/             Automated calculation and validation tests
```

## Keyboard shortcuts

- `Ctrl+S` — Save invoice
- `Esc` — Close preview/history dialogs

## License

MIT
