(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./calculations.js'));
  } else {
    root.InvoiceDocument = factory(root.InvoiceCalculations);
  }
})(typeof self !== 'undefined' ? self : this, function (calc) {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }
    const date = new Date(value + (String(value).includes('T') ? '' : 'T00:00:00'));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function buildItemRows(items) {
    const rows = (items || []).filter((item) => {
      return String(item.description || '').trim() || Number(item.quantity) || Number(item.unitPrice);
    });

    if (rows.length === 0) {
      return '<tr><td colspan="4" class="empty">No items</td></tr>';
    }

    return rows.map((item) => {
      const total = calc.lineTotal(item.quantity, item.unitPrice);
      return `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="num">${escapeHtml(item.quantity)}</td>
          <td class="num">${calc.formatCurrency(item.unitPrice)}</td>
          <td class="num">${calc.formatCurrency(total)}</td>
        </tr>
      `;
    }).join('');
  }

  function buildInvoiceHtml(invoice) {
    const business = invoice.business || {};
    const customer = invoice.customer || {};
    const totals = invoice.totals || calc.calculateTotals(invoice.items, invoice.taxPercent, invoice.discount);
    const notes = String(invoice.notes || '').trim();

    const customerBlock = [
      customer.name,
      customer.company,
      customer.street,
      [customer.city, customer.state, customer.zip].filter(Boolean).join(', ').replace(/, (,|$)/g, ','),
      customer.email,
      customer.phone
    ].filter((line) => String(line || '').trim()).map((line) => escapeHtml(line)).join('<br>');

    const businessBlock = [
      business.businessName,
      business.address,
      business.email,
      business.phone
    ].filter((line) => String(line || '').trim()).map((line) => escapeHtml(line)).join('<br>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    @page { margin: 0.6in; size: letter; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: #1f2933;
      background: #fff;
      font-size: 13px;
      line-height: 1.45;
    }
    .sheet { max-width: 800px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 3px solid #0f4c5c;
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .brand h1 {
      margin: 0 0 8px;
      font-size: 28px;
      color: #0f4c5c;
      letter-spacing: 0.02em;
    }
    .brand .meta { color: #52606d; }
    .invoice-meta { text-align: right; min-width: 220px; }
    .invoice-meta .label {
      display: inline-block;
      min-width: 90px;
      color: #52606d;
      text-align: left;
    }
    .invoice-meta .title {
      font-size: 22px;
      font-weight: 700;
      color: #0f4c5c;
      margin-bottom: 10px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 28px;
    }
    .party { flex: 1; }
    .party h2 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f4c5c;
    }
    .party .box {
      background: #f5f7fa;
      border: 1px solid #d9e2ec;
      padding: 12px 14px;
      min-height: 96px;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table.items th {
      background: #0f4c5c;
      color: #fff;
      text-align: left;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 600;
    }
    table.items th.num,
    table.items td.num { text-align: right; }
    table.items td {
      padding: 10px 12px;
      border-bottom: 1px solid #e4e7eb;
      vertical-align: top;
    }
    table.items tr:nth-child(even) td { background: #f8fafc; }
    table.items .empty { text-align: center; color: #829ab1; }
    .bottom {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
    }
    .notes {
      flex: 1;
      max-width: 55%;
    }
    .notes h3 {
      margin: 0 0 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0f4c5c;
    }
    .notes p {
      margin: 0;
      white-space: pre-wrap;
      color: #3e4c59;
    }
    .totals {
      width: 280px;
      border: 1px solid #d9e2ec;
      background: #f5f7fa;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      border-bottom: 1px solid #e4e7eb;
    }
    .totals .row:last-child { border-bottom: none; }
    .totals .grand {
      background: #0f4c5c;
      color: #fff;
      font-weight: 700;
      font-size: 15px;
    }
    .status {
      margin-top: 28px;
      color: #52606d;
      font-size: 12px;
    }
    .terms { margin-top: 8px; color: #52606d; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <h1>${escapeHtml(business.businessName || 'Your Business')}</h1>
        <div class="meta">${businessBlock}</div>
      </div>
      <div class="invoice-meta">
        <div class="title">INVOICE</div>
        <div><span class="label">Number</span> ${escapeHtml(invoice.invoiceNumber)}</div>
        <div><span class="label">Date</span> ${escapeHtml(formatDate(invoice.invoiceDate))}</div>
        <div><span class="label">Due</span> ${escapeHtml(formatDate(invoice.dueDate))}</div>
        <div><span class="label">Status</span> ${escapeHtml(invoice.status || 'Draft')}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h2>Bill To</h2>
        <div class="box">${customerBlock || '—'}</div>
      </div>
      <div class="party">
        <h2>Payment Terms</h2>
        <div class="box">${escapeHtml(invoice.paymentTerms || '—')}</div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${buildItemRows(invoice.items)}
      </tbody>
    </table>

    <div class="bottom">
      <div class="notes">
        ${notes ? `<h3>Notes</h3><p>${escapeHtml(notes)}</p>` : ''}
        ${invoice.paymentTerms ? `<div class="terms"><strong>Terms:</strong> ${escapeHtml(invoice.paymentTerms)}</div>` : ''}
      </div>
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${calc.formatCurrency(totals.subtotal)}</span></div>
        <div class="row"><span>Discount</span><span>-${calc.formatCurrency(totals.discount)}</span></div>
        <div class="row"><span>Tax (${escapeHtml(totals.taxPercent)}%)</span><span>${calc.formatCurrency(totals.taxAmount)}</span></div>
        <div class="row grand"><span>Amount Due</span><span>${calc.formatCurrency(totals.total)}</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  return {
    escapeHtml,
    formatDate,
    buildInvoiceHtml
  };
});
