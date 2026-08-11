const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-storage-'));
const invoicesDir = path.join(root, 'invoices');
fs.mkdirSync(invoicesDir, { recursive: true });

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('business profile persists locally', () => {
  const businessPath = path.join(root, 'business.json');
  const business = {
    businessName: 'Northwind Freelance',
    address: '100 Market Street',
    email: 'hello@northwind.test',
    phone: '555-0100'
  };
  writeJson(businessPath, business);
  assert.deepStrictEqual(readJson(businessPath, null), business);
});

test('invoice files can be listed and reopened', () => {
  const invoice = {
    id: 'abc-123',
    invoiceNumber: '1001',
    invoiceDate: '2026-08-11',
    status: 'Sent',
    customer: { name: 'Alex Client', company: 'Client Co' },
    totals: { total: 250.5 },
    updatedAt: '2026-08-11T12:00:00.000Z'
  };
  writeJson(path.join(invoicesDir, `${invoice.id}.json`), invoice);
  const files = fs.readdirSync(invoicesDir).filter((f) => f.endsWith('.json'));
  assert.strictEqual(files.length, 1);
  const loaded = readJson(path.join(invoicesDir, files[0]), null);
  assert.strictEqual(loaded.invoiceNumber, '1001');
  assert.strictEqual(loaded.status, 'Sent');
  assert.strictEqual(loaded.totals.total, 250.5);
});

test('settings keep next invoice number', () => {
  const settingsPath = path.join(root, 'settings.json');
  writeJson(settingsPath, { nextInvoiceNumber: 1002 });
  assert.strictEqual(readJson(settingsPath, {}).nextInvoiceNumber, 1002);
});

fs.rmSync(root, { recursive: true, force: true });
console.log('All storage tests passed.');
