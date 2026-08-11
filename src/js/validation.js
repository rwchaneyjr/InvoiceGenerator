(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InvoiceValidation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  function isValidEmail(email) {
    if (isBlank(email)) {
      return true;
    }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  function validateInvoice(invoice) {
    const errors = [];

    if (!invoice.business || isBlank(invoice.business.businessName)) {
      errors.push('Business name is required.');
    }

    if (!invoice.customer || isBlank(invoice.customer.name)) {
      errors.push('Customer name is required.');
    }

    if (invoice.customer && !isValidEmail(invoice.customer.email)) {
      errors.push('Customer email is not valid.');
    }

    if (invoice.business && !isValidEmail(invoice.business.email)) {
      errors.push('Business email is not valid.');
    }

    if (isBlank(invoice.invoiceNumber)) {
      errors.push('Invoice number is required.');
    }

    if (isBlank(invoice.invoiceDate)) {
      errors.push('Invoice date is required.');
    }

    if (isBlank(invoice.dueDate)) {
      errors.push('Due date is required.');
    }

    if (invoice.invoiceDate && invoice.dueDate) {
      const inv = new Date(invoice.invoiceDate);
      const due = new Date(invoice.dueDate);
      if (!Number.isNaN(inv.getTime()) && !Number.isNaN(due.getTime()) && due < inv) {
        errors.push('Due date cannot be earlier than the invoice date.');
      }
    }

    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const usableItems = items.filter((item) => !isBlank(item.description) || Number(item.quantity) || Number(item.unitPrice));

    if (usableItems.length === 0) {
      errors.push('Add at least one invoice item.');
    }

    usableItems.forEach((item, index) => {
      const row = index + 1;
      if (isBlank(item.description)) {
        errors.push(`Item ${row}: description is required.`);
      }
      if (!(Number(item.quantity) > 0)) {
        errors.push(`Item ${row}: quantity must be greater than 0.`);
      }
      if (!(Number(item.unitPrice) >= 0) || item.unitPrice === '' || item.unitPrice === null) {
        errors.push(`Item ${row}: price must be 0 or greater.`);
      }
    });

    const taxPercent = Number(invoice.taxPercent);
    if (Number.isNaN(taxPercent) || taxPercent < 0) {
      errors.push('Tax percentage must be 0 or greater.');
    }

    const discount = Number(invoice.discount);
    if (Number.isNaN(discount) || discount < 0) {
      errors.push('Discount must be 0 or greater.');
    }

    const allowedStatuses = ['Draft', 'Sent', 'Paid', 'Overdue'];
    if (!allowedStatuses.includes(invoice.status)) {
      errors.push('Select a valid invoice status.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  return {
    isBlank,
    isValidEmail,
    validateInvoice
  };
});
