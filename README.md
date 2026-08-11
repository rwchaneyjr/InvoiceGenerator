# Simple Invoice Generator

An offline Windows desktop app for freelancers and small businesses to create, save, preview, print, and export invoices as PDF.

No internet connection or user account is required. All customer and invoice data stays on the local computer.

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

## Requirements

- Node.js 18+ (20 or 22 recommended)
- npm 9+
- Windows 10/11 for running the packaged app (development can be done on Windows, macOS, or Linux)

## Quick start (development)

```bash
npm install
npm start
```

## Tests

```bash
npm test
```

These tests cover money calculations and invoice validation rules.

## Build a Windows distributable

From a Windows machine (recommended):

```bash
npm install
npm run dist:win
```

Output files are written to the `dist/` folder:

- **NSIS installer** — `Simple Invoice Generator-1.0.0-x64.exe`
- **Portable app** — `Simple Invoice Generator-1.0.0-portable.exe`

You can also build only unpacked files for inspection:

```bash
npm run pack
```

### Build notes

- `electron-builder` is already configured in `package.json`.
- Optional custom icons can be placed in `build/` as `icon.ico` (Windows).
- If you build Windows packages from Linux/macOS, follow the [electron-builder Windows docs](https://www.electron.build/configuration/win) for Wine/Mono requirements.

## How data is stored

All data is stored under the Electron user data folder:

- Windows: `%APPDATA%\simple-invoice-generator\data\`
- `business.json` — saved business profile
- `settings.json` — next invoice number
- `invoices\*.json` — one file per saved invoice

Nothing is uploaded to a remote server.

## Using the app

1. Enter and save your **Business Information** once.
2. Fill in the customer and invoice details.
3. Add line items (description, quantity, price). Totals update automatically.
4. Choose a status (Draft / Sent / Paid / Overdue).
5. Click **Save Invoice**.
6. Use **Preview**, **Save PDF**, or **Print** as needed.
7. Open **Invoice History** to reopen past invoices.

### Toolbar actions

| Button | Action |
| --- | --- |
| New Invoice | Starts a fresh invoice and assigns the next invoice number |
| Save Invoice | Validates and saves the invoice locally |
| Preview | Shows a printable invoice layout |
| Save PDF | Asks where to save a PDF, then exports it |
| Print | Opens the system print dialog |
| Invoice History | Lists saved invoices for reopen/delete |

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
