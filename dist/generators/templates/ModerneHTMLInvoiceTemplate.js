"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModernHTMLInvoiceTemplate = void 0;
/**
 * ModernHTMLInvoiceTemplate renders the invoice as an HTML string.
 * The design now uses a purple-orange color scheme with smooth gradients and soft shadows.
 */
class ModernHTMLInvoiceTemplate {
    constructor(baseOptions = {}) {
        this.baseOptions = baseOptions;
    }
    async render(pdfDoc, invoice, userOptions) {
        const options = { ...this.baseOptions, ...userOptions };
        // Define our color palette.
        const headerBgColor = "#5e35b1"; // deep purple
        const accentColor = "#ff9800"; // warm orange
        const backgroundColor = "#f3e5f5"; // very light purple
        // Build the table columns header.
        const columns = options.columns || [];
        const columnsHtml = columns.map(col => `
      <th style="
          padding: 12px 8px; 
          border: 1px solid #ddd; 
          background-color: ${headerBgColor}; 
          color: #fff;
          text-align: ${col.align || 'left'};
        ">
        ${col.header}
      </th>`).join('');
        // Build table rows with alternate shading.
        const rowsHtml = invoice.lines.map((line, index) => {
            const rowBgColor = index % 2 === 0 ? "#ffffff" : "#fff3e0"; // white and very light orange
            const rowCells = columns.map(col => `
        <td style="
            padding: 10px; 
            border: 1px solid #ddd; 
            text-align: ${col.align || 'left'};
          ">
          ${line[col.id] ?? ''}
        </td>`).join('');
            return `<tr style="background-color: ${rowBgColor};">${rowCells}</tr>`;
        }).join('');
        // Build the complete HTML.
        const html = `
<!DOCTYPE html>
<html lang="${invoice.data.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.number}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: ${backgroundColor};
      margin: 0;
      padding: 0;
      color: #333;
    }
    header {
      background: linear-gradient(90deg, ${headerBgColor}, ${accentColor});
      color: #fff;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      padding: 20px;
      gap: 4%;
    }
    .invoice-info .block {
      width: 48%;
      background-color: #fff;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .invoice-details, .totals, .notes {
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    tr:nth-child(even) {
      background-color: #fff3e0;
    }
    .totals {
      text-align: right;
      font-size: 1.1em;
      font-weight: bold;
    }
    .notes {
      font-size: 0.9em;
      background-color: #fff;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <header>
    <h1>${options.headerTitle || 'Invoice'}</h1>
  </header>
  <section class="invoice-info">
    <div class="block">
      <h2>Seller</h2>
      <p>${invoice.seller.name}<br>${invoice.seller.address}</p>
    </div>
    <div class="block">
      <h2>Buyer</h2>
      <p>${invoice.buyer.name}<br>${invoice.buyer.address}</p>
    </div>
  </section>
  <section class="invoice-details">
    <p><strong>Invoice #:</strong> ${invoice.number}</p>
    <p><strong>Date:</strong> ${invoice.issueDate.toLocaleDateString()}</p>
  </section>
  <section class="invoice-items">
    <table>
      <thead>
        <tr>
          ${columnsHtml}
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </section>
  <section class="totals">
    <p>Subtotal: ${invoice.getNetTotal().toFixed(2)}</p>
    <p>VAT: ${invoice.getVatTotal().toFixed(2)}</p>
    <p>Grand Total: ${invoice.getTotalWithVat().toFixed(2)}</p>
  </section>
  ${invoice.notes ? `
  <section class="notes">
    <h2>Notes</h2>
    <p>${invoice.notes}</p>
  </section>` : ''}
</body>
</html>
    `;
        const page = pdfDoc.addPage();
        return page.drawText(html, {
            x: 50,
            y: 50,
            size: 12
        });
    }
}
exports.ModernHTMLInvoiceTemplate = ModernHTMLInvoiceTemplate;
