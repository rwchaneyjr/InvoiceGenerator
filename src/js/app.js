(function () {
  'use strict';

  const calc = window.InvoiceCalculations;
  const validate = window.InvoiceValidation;
  const documentBuilder = window.InvoiceDocument;

  const state = {
    currentId: null,
    dirty: false,
    items: [],
    nextInvoiceNumber: 1001
  };

  const els = {
    businessName: document.getElementById('business-name'),
    businessAddress: document.getElementById('business-address'),
    businessEmail: document.getElementById('business-email'),
    businessPhone: document.getElementById('business-phone'),
    customerName: document.getElementById('customer-name'),
    customerCompany: document.getElementById('customer-company'),
    customerStreet: document.getElementById('customer-street'),
    customerCity: document.getElementById('customer-city'),
    customerState: document.getElementById('customer-state'),
    customerZip: document.getElementById('customer-zip'),
    customerEmail: document.getElementById('customer-email'),
    customerPhone: document.getElementById('customer-phone'),
    invoiceNumber: document.getElementById('invoice-number'),
    invoiceDate: document.getElementById('invoice-date'),
    dueDate: document.getElementById('due-date'),
    paymentTerms: document.getElementById('payment-terms'),
    invoiceStatus: document.getElementById('invoice-status'),
    invoiceNotes: document.getElementById('invoice-notes'),
    taxPercent: document.getElementById('tax-percent'),
    discount: document.getElementById('discount'),
    itemsBody: document.getElementById('items-body'),
    subtotalDisplay: document.getElementById('subtotal-display'),
    taxDisplay: document.getElementById('tax-display'),
    discountDisplay: document.getElementById('discount-display'),
    totalDisplay: document.getElementById('total-display'),
    toast: document.getElementById('toast'),
    errorBanner: document.getElementById('error-banner'),
    previewModal: document.getElementById('preview-modal'),
    previewFrame: document.getElementById('preview-frame'),
    historyModal: document.getElementById('history-modal'),
    historyBody: document.getElementById('history-body')
  };

  function todayISO() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  function addDaysISO(isoDate, days) {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function createEmptyItem() {
    return {
      id: createId(),
      description: '',
      quantity: 1,
      unitPrice: 0
    };
  }

  function showToast(message, isError) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    els.toast.classList.toggle('error', Boolean(isError));
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      els.toast.hidden = true;
    }, 3200);
  }

  function showErrors(errors) {
    if (!errors || errors.length === 0) {
      els.errorBanner.hidden = true;
      els.errorBanner.innerHTML = '';
      return;
    }
    els.errorBanner.hidden = false;
    els.errorBanner.innerHTML = `<strong>Please fix the following:</strong><ul>${
      errors.map((e) => `<li>${documentBuilder.escapeHtml(e)}</li>`).join('')
    }</ul>`;
    els.errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function markDirty() {
    state.dirty = true;
  }

  function collectBusiness() {
    return {
      businessName: els.businessName.value.trim(),
      address: els.businessAddress.value.trim(),
      email: els.businessEmail.value.trim(),
      phone: els.businessPhone.value.trim()
    };
  }

  function collectCustomer() {
    return {
      name: els.customerName.value.trim(),
      company: els.customerCompany.value.trim(),
      street: els.customerStreet.value.trim(),
      city: els.customerCity.value.trim(),
      state: els.customerState.value.trim(),
      zip: els.customerZip.value.trim(),
      email: els.customerEmail.value.trim(),
      phone: els.customerPhone.value.trim()
    };
  }

  function collectItems() {
    return state.items.map((item) => ({
      id: item.id,
      description: String(item.description || '').trim(),
      quantity: calc.toNumber(item.quantity),
      unitPrice: calc.toNumber(item.unitPrice),
      lineTotal: calc.lineTotal(item.quantity, item.unitPrice)
    }));
  }

  function getCurrentTotals() {
    return calc.calculateTotals(
      state.items,
      els.taxPercent.value,
      els.discount.value
    );
  }

  function collectInvoice() {
    const items = collectItems();
    const totals = getCurrentTotals();
    return {
      id: state.currentId || createId(),
      invoiceNumber: els.invoiceNumber.value.trim(),
      invoiceDate: els.invoiceDate.value,
      dueDate: els.dueDate.value,
      paymentTerms: els.paymentTerms.value.trim(),
      notes: els.invoiceNotes.value.trim(),
      status: els.invoiceStatus.value,
      taxPercent: calc.toNumber(els.taxPercent.value),
      discount: calc.toNumber(els.discount.value),
      business: collectBusiness(),
      customer: collectCustomer(),
      items,
      totals,
      updatedAt: new Date().toISOString()
    };
  }

  function updateTotalsDisplay() {
    const totals = getCurrentTotals();
    els.subtotalDisplay.textContent = calc.formatCurrency(totals.subtotal);
    els.taxDisplay.textContent = calc.formatCurrency(totals.taxAmount);
    els.discountDisplay.textContent = calc.formatCurrency(totals.discount);
    els.totalDisplay.textContent = calc.formatCurrency(totals.total);
  }

  function renderItems() {
    els.itemsBody.innerHTML = '';

    if (state.items.length === 0) {
      state.items.push(createEmptyItem());
    }

    state.items.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;

      const line = calc.lineTotal(item.quantity, item.unitPrice);

      tr.innerHTML = `
        <td>
          <input type="text" data-field="description" value="${documentBuilder.escapeHtml(item.description)}" placeholder="Item or service description" />
        </td>
        <td>
          <input type="number" data-field="quantity" min="0" step="0.01" value="${documentBuilder.escapeHtml(item.quantity)}" />
        </td>
        <td>
          <input type="number" data-field="unitPrice" min="0" step="0.01" value="${documentBuilder.escapeHtml(item.unitPrice)}" />
        </td>
        <td><div class="line-total">${calc.formatCurrency(line)}</div></td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn btn-small" data-action="duplicate">Duplicate</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete">Delete</button>
          </div>
        </td>
      `;

      tr.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', () => {
          const field = input.dataset.field;
          item[field] = input.value;
          const lineEl = tr.querySelector('.line-total');
          lineEl.textContent = calc.formatCurrency(calc.lineTotal(item.quantity, item.unitPrice));
          updateTotalsDisplay();
          markDirty();
        });
      });

      tr.querySelector('[data-action="delete"]').addEventListener('click', () => {
        if (state.items.length === 1) {
          state.items[0] = createEmptyItem();
        } else {
          state.items.splice(index, 1);
        }
        renderItems();
        updateTotalsDisplay();
        markDirty();
      });

      tr.querySelector('[data-action="duplicate"]').addEventListener('click', () => {
        state.items.splice(index + 1, 0, {
          id: createId(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
        renderItems();
        updateTotalsDisplay();
        markDirty();
      });

      els.itemsBody.appendChild(tr);
    });

    updateTotalsDisplay();
  }

  function setBusiness(business) {
    els.businessName.value = business.businessName || '';
    els.businessAddress.value = business.address || '';
    els.businessEmail.value = business.email || '';
    els.businessPhone.value = business.phone || '';
  }

  function fillInvoice(invoice) {
    state.currentId = invoice.id;
    setBusiness(invoice.business || {});
    els.customerName.value = invoice.customer?.name || '';
    els.customerCompany.value = invoice.customer?.company || '';
    els.customerStreet.value = invoice.customer?.street || '';
    els.customerCity.value = invoice.customer?.city || '';
    els.customerState.value = invoice.customer?.state || '';
    els.customerZip.value = invoice.customer?.zip || '';
    els.customerEmail.value = invoice.customer?.email || '';
    els.customerPhone.value = invoice.customer?.phone || '';
    els.invoiceNumber.value = invoice.invoiceNumber || '';
    els.invoiceDate.value = invoice.invoiceDate || todayISO();
    els.dueDate.value = invoice.dueDate || addDaysISO(todayISO(), 30);
    els.paymentTerms.value = invoice.paymentTerms || '';
    els.invoiceStatus.value = invoice.status || 'Draft';
    els.invoiceNotes.value = invoice.notes || '';
    els.taxPercent.value = invoice.taxPercent ?? 0;
    els.discount.value = invoice.discount ?? 0;
    state.items = (invoice.items || []).map((item) => ({
      id: item.id || createId(),
      description: item.description || '',
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0
    }));
    if (state.items.length === 0) {
      state.items = [createEmptyItem()];
    }
    renderItems();
    showErrors([]);
    state.dirty = false;
  }

  async function startNewInvoice(keepBusiness, options = {}) {
    const silent = Boolean(options.silent);
    if (state.dirty && !silent) {
      const proceed = window.confirm('You have unsaved changes. Start a new invoice anyway?');
      if (!proceed) {
        return;
      }
    }

    const business = keepBusiness ? collectBusiness() : await window.invoiceAPI.getBusiness();
    const settings = await window.invoiceAPI.getSettings();
    state.nextInvoiceNumber = calc.nextInvoiceNumber(settings.nextInvoiceNumber || 1001);
    const invoiceDate = todayISO();

    fillInvoice({
      id: createId(),
      invoiceNumber: calc.formatInvoiceNumber(state.nextInvoiceNumber),
      invoiceDate,
      dueDate: addDaysISO(invoiceDate, 30),
      paymentTerms: 'Net 30',
      notes: '',
      status: 'Draft',
      taxPercent: 0,
      discount: 0,
      business,
      customer: {},
      items: [createEmptyItem()]
    });

    state.dirty = false;
    if (!silent) {
      showToast('New invoice ready');
    }
  }

  async function saveBusinessInfo() {
    const business = collectBusiness();
    if (!business.businessName) {
      showErrors(['Business name is required before saving business information.']);
      return;
    }
    if (!validate.isValidEmail(business.email)) {
      showErrors(['Business email is not valid.']);
      return;
    }
    await window.invoiceAPI.saveBusiness(business);
    showErrors([]);
    showToast('Business information saved');
  }

  async function saveInvoice() {
    const invoice = collectInvoice();
    if (!invoice.createdAt) {
      const existing = state.currentId ? await window.invoiceAPI.getInvoice(state.currentId) : null;
      invoice.createdAt = existing?.createdAt || new Date().toISOString();
    }

    const result = validate.validateInvoice(invoice);
    if (!result.valid) {
      showErrors(result.errors);
      showToast('Cannot save until required fields are fixed', true);
      return null;
    }

    state.currentId = invoice.id;
    await window.invoiceAPI.saveInvoice(invoice);
    await window.invoiceAPI.saveBusiness(invoice.business);

    const numeric = parseInt(String(invoice.invoiceNumber).replace(/\D/g, ''), 10);
    if (Number.isFinite(numeric) && numeric >= state.nextInvoiceNumber) {
      state.nextInvoiceNumber = numeric + 1;
      await window.invoiceAPI.saveSettings({ nextInvoiceNumber: state.nextInvoiceNumber });
    }

    state.dirty = false;
    showErrors([]);
    showToast(`Invoice ${invoice.invoiceNumber} saved`);
    return invoice;
  }

  function openModal(modal) {
    modal.hidden = false;
  }

  function closeModal(modal) {
    modal.hidden = true;
  }

  function previewInvoice() {
    const invoice = collectInvoice();
    const result = validate.validateInvoice(invoice);
    if (!result.valid) {
      showErrors(result.errors);
      showToast('Fix errors before previewing', true);
      return;
    }
    showErrors([]);
    const html = documentBuilder.buildInvoiceHtml(invoice);
    els.previewFrame.srcdoc = html;
    openModal(els.previewModal);
  }

  async function savePdf() {
    const invoice = collectInvoice();
    const result = validate.validateInvoice(invoice);
    if (!result.valid) {
      showErrors(result.errors);
      showToast('Fix errors before exporting PDF', true);
      return;
    }

    const defaultName = `Invoice-${invoice.invoiceNumber}.pdf`;
    const choice = await window.invoiceAPI.choosePdfPath(defaultName);
    if (choice.canceled) {
      return;
    }

    const html = documentBuilder.buildInvoiceHtml(invoice);
    try {
      const saved = await window.invoiceAPI.savePdf({ html, filePath: choice.filePath });
      showErrors([]);
      showToast(`PDF saved: ${saved.filePath}`);
    } catch (error) {
      console.error(error);
      showToast('Failed to save PDF', true);
    }
  }

  async function printInvoice() {
    const invoice = collectInvoice();
    const result = validate.validateInvoice(invoice);
    if (!result.valid) {
      showErrors(result.errors);
      showToast('Fix errors before printing', true);
      return;
    }

    const html = documentBuilder.buildInvoiceHtml(invoice);
    try {
      await window.invoiceAPI.printInvoice(html);
      showErrors([]);
      showToast('Print dialog opened');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Print failed', true);
    }
  }

  async function openHistory() {
    const invoices = await window.invoiceAPI.listInvoices();
    if (!invoices.length) {
      els.historyBody.innerHTML = '<tr><td colspan="6" class="empty">No saved invoices yet.</td></tr>';
    } else {
      els.historyBody.innerHTML = invoices.map((inv) => {
        const customer = inv.companyName
          ? `${documentBuilder.escapeHtml(inv.customerName)} (${documentBuilder.escapeHtml(inv.companyName)})`
          : documentBuilder.escapeHtml(inv.customerName || '—');
        return `
          <tr>
            <td>${documentBuilder.escapeHtml(inv.invoiceNumber)}</td>
            <td>${customer}</td>
            <td>${documentBuilder.escapeHtml(documentBuilder.formatDate(inv.invoiceDate))}</td>
            <td>${calc.formatCurrency(inv.total)}</td>
            <td><span class="status-pill ${documentBuilder.escapeHtml(inv.status)}">${documentBuilder.escapeHtml(inv.status)}</span></td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-small btn-primary" data-open="${documentBuilder.escapeHtml(inv.id)}">Open</button>
                <button type="button" class="btn btn-small btn-danger" data-delete="${documentBuilder.escapeHtml(inv.id)}">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    openModal(els.historyModal);
  }

  async function openInvoiceById(id) {
    const invoice = await window.invoiceAPI.getInvoice(id);
    if (!invoice) {
      showToast('Invoice not found', true);
      return;
    }
    fillInvoice(invoice);
    closeModal(els.historyModal);
    showToast(`Opened invoice ${invoice.invoiceNumber}`);
  }

  function bindFormDirtiness() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        markDirty();
        if (input === els.taxPercent || input === els.discount) {
          updateTotalsDisplay();
        }
      });
      input.addEventListener('change', () => {
        markDirty();
        if (input === els.taxPercent || input === els.discount) {
          updateTotalsDisplay();
        }
      });
    });
  }

  function bindToolbar() {
    document.getElementById('btn-new').addEventListener('click', () => startNewInvoice(true));
    document.getElementById('btn-save').addEventListener('click', () => saveInvoice());
    document.getElementById('btn-preview').addEventListener('click', previewInvoice);
    document.getElementById('btn-pdf').addEventListener('click', savePdf);
    document.getElementById('btn-print').addEventListener('click', printInvoice);
    document.getElementById('btn-history').addEventListener('click', openHistory);
    document.getElementById('btn-save-business').addEventListener('click', saveBusinessInfo);
    document.getElementById('btn-add-item').addEventListener('click', () => {
      state.items.push(createEmptyItem());
      renderItems();
      markDirty();
    });

    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', (event) => {
        const modal = event.currentTarget.closest('.modal');
        if (modal) {
          closeModal(modal);
        }
      });
    });

    els.historyBody.addEventListener('click', async (event) => {
      const openBtn = event.target.closest('[data-open]');
      const deleteBtn = event.target.closest('[data-delete]');
      if (openBtn) {
        if (state.dirty) {
          const proceed = window.confirm('You have unsaved changes. Open this invoice anyway?');
          if (!proceed) {
            return;
          }
        }
        await openInvoiceById(openBtn.getAttribute('data-open'));
      }
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-delete');
        const confirmed = window.confirm('Delete this invoice permanently?');
        if (!confirmed) {
          return;
        }
        await window.invoiceAPI.deleteInvoice(id);
        if (state.currentId === id) {
          state.dirty = false;
          await startNewInvoice(true);
        }
        await openHistory();
        showToast('Invoice deleted');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal(els.previewModal);
        closeModal(els.historyModal);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveInvoice();
      }
    });
  }

  async function init() {
    if (!window.invoiceAPI) {
      document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif">This application must be run with Electron. Use <code>npm start</code>.</p>';
      return;
    }

    bindToolbar();
    bindFormDirtiness();
    await startNewInvoice(false, { silent: true });
    state.dirty = false;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
