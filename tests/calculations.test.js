const assert = require('assert');
const calc = require('../src/js/calculations.js');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('lineTotal multiplies quantity and price', () => {
  assert.strictEqual(calc.lineTotal(3, 12.5), 37.5);
});

test('calculateTotals includes tax and discount', () => {
  const totals = calc.calculateTotals(
    [
      { quantity: 2, unitPrice: 50 },
      { quantity: 1, unitPrice: 20 }
    ],
    10,
    20
  );
  assert.strictEqual(totals.subtotal, 120);
  assert.strictEqual(totals.discount, 20);
  assert.strictEqual(totals.taxAmount, 10);
  assert.strictEqual(totals.total, 110);
});

test('negative-looking inputs are sanitized to zero where needed', () => {
  const totals = calc.calculateTotals([], -5, -10);
  assert.strictEqual(totals.taxPercent, 0);
  assert.strictEqual(totals.discount, 0);
  assert.strictEqual(totals.total, 0);
});

test('formatInvoiceNumber pads values', () => {
  assert.strictEqual(calc.formatInvoiceNumber(7), '0007');
  assert.strictEqual(calc.formatInvoiceNumber(1001), '1001');
});

test('currency formatting works', () => {
  assert.strictEqual(calc.formatCurrency(12.5), '$12.50');
});

console.log('All calculation tests passed.');
