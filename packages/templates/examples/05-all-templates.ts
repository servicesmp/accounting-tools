/**
 * Example 5: Generate invoice with all templates
 *
 * This example demonstrates how to generate the same invoice
 * using all available templates for comparison.
 */

import fs from 'fs';
import {
  FacturXInvoice,
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
  PostalAddressImpl as PostalAddress,
  TradePartyImpl as TradeParty,
  DocumentHeaderImpl as DocumentHeader,
  PaymentDetailsImpl as PaymentDetails,
  InvoiceLineImpl as InvoiceLine,
  AllowanceChargeImpl as AllowanceCharge,
} from '@facturx/core';
import {
  generatePDF,
  TemplateType,
  generateModernPDF,
  generateFancyPDF,
  generateBrandPDF,
  generateCorporatePDF,
  generateMinimalPDF,
} from '../src';

async function createSampleInvoice(): Promise<FacturXInvoice> {
  // Seller — PostalAddressImpl(city, postalCode, countryCode, street?)
  const sellerAddress = new PostalAddress(
    'Paris',
    '75001',
    'FR',
    '123 Business Street'
  );
  // TradePartyImpl(name, address, tradingName?, vatId?)
  const seller = new TradeParty('Your Company Name', sellerAddress, undefined, 'FR12345678901');

  // Buyer
  const buyerAddress = new PostalAddress(
    'Lyon',
    '69001',
    'FR',
    '456 Client Avenue'
  );
  const buyer = new TradeParty('Client Company Ltd', buyerAddress, undefined, 'FR98765432100');

  // Header — DocumentHeaderImpl(id, invoiceNumber, name, invoiceDate, typeCode, dueDate?)
  const header = new DocumentHeader(
    'DEMO-2025-001',
    'DEMO-2025-001',
    'Demo Invoice - All Templates',
    new Date(2025, 0, 15),
    DocTypeCode.INVOICE,
    new Date(2025, 1, 15)
  );

  // Payment — PaymentDetailsImpl(meansCode, iban?, bic?, reference?, dueDate?, termsDescription?)
  const payment = new PaymentDetails(
    PaymentMeansCode.SEPA_CREDIT_TRANSFER,
    'FR7630004000031234567890143',
    'BNPAFRPPXXX',
    'DEMO-2025-001',
    new Date(2025, 1, 15),
    'Payment due within 30 days'
  );

  // Invoice
  const invoice = new FacturXInvoice(
    FacturxProfile.EN16931,
    header,
    seller,
    buyer,
    payment
  );

  // Add lines — InvoiceLine(id, description, quantity, unitPrice, vatRate)
  invoice.addLine(
    new InvoiceLine('1', 'Web Development - Full stack application', 80, 95.00, 0.20)
  );
  invoice.addLine(
    new InvoiceLine('2', 'UI/UX Design - Complete redesign', 40, 85.00, 0.20)
  );
  invoice.addLine(
    new InvoiceLine('3', 'SEO Optimization - 6 month campaign', 1, 1200.00, 0.20)
  );
  invoice.addLine(
    new InvoiceLine('4', 'Content Writing - 20 blog articles', 20, 45.00, 0.20)
  );
  invoice.addLine(
    new InvoiceLine('5', 'Social Media Management - Monthly', 3, 250.00, 0.20)
  );
  invoice.addLine(
    new InvoiceLine('6', 'Email Marketing Campaign Setup', 1, 600.00, 0.20)
  );
  invoice.addLine(
    new InvoiceLine('7', 'Analytics Dashboard Implementation', 1, 800.00, 0.20)
  );
  invoice.addLine(
    new InvoiceLine('8', 'Mobile App Development - iOS', 120, 110.00, 0.20)
  );

  // Discount
  invoice.addDocAllowanceCharge(
    new AllowanceCharge(false, 500.00, 'Volume discount', 'VOLUME', 0.20)
  );

  // Service charge
  invoice.addDocAllowanceCharge(
    new AllowanceCharge(true, 150.00, 'Rush delivery fee', 'RUSH', 0.20)
  );

  return invoice;
}

async function main() {
  console.log('Generating invoices with all templates...\n');

  const invoice = await createSampleInvoice();

  const commonOptions = {
    language: 'fr' as const,
    showTaxBreakdown: true,
    showPaymentTerms: true,
  };

  // Create output directory
  fs.mkdirSync('examples/output', { recursive: true });

  // Template 1: Modern
  console.log('1. Generating Modern template...');
  const modern = await generateModernPDF(invoice, commonOptions);
  fs.writeFileSync('examples/output/05-demo-modern.pdf', modern.pdf);
  console.log(`   ✓ Modern: ${modern.pageCount} pages, ${(modern.fileSize / 1024).toFixed(2)} KB\n`);

  // Template 2: Fancy
  console.log('2. Generating Fancy template...');
  const fancy = await generateFancyPDF(invoice, {
    ...commonOptions,
    customFooter: 'Fancy Design - Pink & Blue',
  });
  fs.writeFileSync('examples/output/05-demo-fancy.pdf', fancy.pdf);
  console.log(`   ✓ Fancy: ${fancy.pageCount} pages, ${(fancy.fileSize / 1024).toFixed(2)} KB\n`);

  // Template 3: Brand
  console.log('3. Generating Brand template...');
  const brand = await generateBrandPDF(invoice, {
    ...commonOptions,
    customFooter: 'Professional Brand - Navy & Orange',
  });
  fs.writeFileSync('examples/output/05-demo-brand.pdf', brand.pdf);
  console.log(`   ✓ Brand: ${brand.pageCount} pages, ${(brand.fileSize / 1024).toFixed(2)} KB\n`);

  // Template 4: Corporate
  console.log('4. Generating Corporate template...');
  const corporate = await generateCorporatePDF(invoice, {
    ...commonOptions,
    customFooter: 'Corporate Excellence',
  });
  fs.writeFileSync('examples/output/05-demo-corporate.pdf', corporate.pdf);
  console.log(`   ✓ Corporate: ${corporate.pageCount} pages, ${(corporate.fileSize / 1024).toFixed(2)} KB\n`);

  // Template 5: Minimal
  console.log('5. Generating Minimal template...');
  const minimal = await generateMinimalPDF(invoice, {
    ...commonOptions,
    customFooter: 'Less is More',
  });
  fs.writeFileSync('examples/output/05-demo-minimal.pdf', minimal.pdf);
  console.log(`   ✓ Minimal: ${minimal.pageCount} pages, ${(minimal.fileSize / 1024).toFixed(2)} KB\n`);

  // Also demonstrate using the generic generatePDF function
  console.log('6. Using generic generatePDF function...');
  const generic = await generatePDF(invoice, TemplateType.FANCY, commonOptions);
  fs.writeFileSync('examples/output/05-demo-generic.pdf', generic.pdf);
  console.log(`   ✓ Generic (Fancy): ${generic.pageCount} pages, ${(generic.fileSize / 1024).toFixed(2)} KB\n`);

  console.log('✓ All templates generated successfully!');
  console.log('  Output directory: examples/output/');
  console.log('\nAvailable PDFs:');
  console.log('  - 05-demo-modern.pdf');
  console.log('  - 05-demo-fancy.pdf');
  console.log('  - 05-demo-brand.pdf');
  console.log('  - 05-demo-corporate.pdf');
  console.log('  - 05-demo-minimal.pdf');
  console.log('  - 05-demo-generic.pdf');
}

main().catch(console.error);
