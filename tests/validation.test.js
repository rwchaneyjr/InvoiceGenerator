const assert = require('assert');
const validate = require('../src/js/validation.js');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const validInvoice = {
  business: {
    businessName: 'Acme Studio',
    email: 'hello@acme.test'
  },
  customer: {
    name: 'Jane Client',
    email: 'jane@client.test'
  },
  invoiceNumber: '1001',
  invoiceDate: '2026-08-01',
  dueDate: '2026-08-31',
  taxPercent: 8.25,
  discount: 0,
  status: 'Draft',
  items: [
    { description: 'Design work', quantity: 2, unitPrice: 100 }
  ]
};

test('valid invoice passes', () => {
  const result = validate.validateInvoice(validInvoice);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('missing customer and items fail', () => {
  const result = validate.validateInvoice({
    ...validInvoice,
    customer: { name: '' },
    items: []
  });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Customer name/.test(e)));
  assert.ok(result.errors.some((e) => /at least one invoice item/.test(e)));
});

test('due date before invoice date fails', () => {
  const result = validate.validateInvoice({
    ...validInvoice,
    invoiceDate: '2026-08-10',
    dueDate: '2026-08-01'
  });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Due date cannot be earlier/.test(e)));
});

test('invalid email fails', () => {
  const result = validate.validateInvoice({
    ...validInvoice,
    customer: { name: 'Jane', email: 'not-an-email' }
  });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Customer email/.test(e)));
});

console.log('All validation tests passed.');
