(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InvoiceCalculations = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function toNumber(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function roundMoney(value) {
    return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
  }

  function lineTotal(quantity, unitPrice) {
    return roundMoney(toNumber(quantity) * toNumber(unitPrice));
  }

  function calculateTotals(items, taxPercent, discount) {
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = roundMoney(
      safeItems.reduce((sum, item) => {
        const qty = toNumber(item.quantity);
        const price = toNumber(item.unitPrice);
        return sum + qty * price;
      }, 0)
    );

    const taxRate = Math.max(0, toNumber(taxPercent));
    const discountAmount = Math.max(0, roundMoney(discount));
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = roundMoney(taxable * (taxRate / 100));
    const total = roundMoney(taxable + taxAmount);

    return {
      subtotal,
      taxPercent: taxRate,
      taxAmount,
      discount: discountAmount,
      total
    };
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(roundMoney(value));
  }

  function formatInvoiceNumber(num) {
    const n = Math.max(1, Math.floor(toNumber(num)) || 1);
    return String(n).padStart(4, '0');
  }

  function nextInvoiceNumber(current) {
    const n = Math.max(1, Math.floor(toNumber(current)) || 1001);
    return n;
  }

  return {
    toNumber,
    roundMoney,
    lineTotal,
    calculateTotals,
    formatCurrency,
    formatInvoiceNumber,
    nextInvoiceNumber
  };
});
