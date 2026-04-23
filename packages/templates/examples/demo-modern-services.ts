import fs from 'fs';
import {
  FacturXInvoice,
  FacturxProfile,
  DocTypeCode,
  PaymentMeansCode,
  PostalAddressImpl,
  TradePartyImpl,
  DocumentHeaderImpl,
  PaymentDetailsImpl,
  InvoiceLineImpl as InvoiceLine,
} from '@facturx/core';
import { generateModernPDF } from '../src';

async function main() {
  const sellerAddress = new PostalAddressImpl('Clichy', '92110', 'FR', '67 Boulevard du Général Leclerc');
  const seller = new TradePartyImpl('Services SAS', sellerAddress, undefined, 'FR12487773327', undefined, '487773327', '0002', 'contact@services.ceo');

  const buyerAddress = new PostalAddressImpl('Villeurbanne', '69100', 'FR', '83 Rue Henri Legay');
  const buyer = new TradePartyImpl('Leonce Yopa', buyerAddress);

  const header = new DocumentHeaderImpl(
    'FR32N8LO9AEUI', 'FR32N8LO9AEUI', 'Facture',
    new Date(2024, 3, 15),
    DocTypeCode.INVOICE,
    new Date(2024, 4, 15),
  );

  const payment = new PaymentDetailsImpl(
    PaymentMeansCode.BANK_CARD, undefined, undefined,
    'FR32N8LO9AEUI',
    new Date(2024, 4, 15),
    'Paiement immédiat',
  );

  const invoice = new FacturXInvoice(FacturxProfile.EN16931, header, seller, buyer, payment);

  // 10 lignes pour tester la pagination
  invoice.addLine(new InvoiceLine('1', 'Apple 2023 MacBook Air Ordinateur Portable avec M3, CPU 8 coeurs, GPU 10 coeurs : ecran Liquid Retina XDR 15 Pouces, 8 Go de memoire unifiee, 258gb de Stockage SSD', 1, 1332.50, 0.20));
  invoice.addLine(new InvoiceLine('2', 'Coque de protection MacBook Air 15 pouces - Transparente rigide', 2, 24.99, 0.20));
  invoice.addLine(new InvoiceLine('3', 'Adaptateur USB-C vers HDMI 4K - Cable tresse 2m', 1, 18.50, 0.20));
  invoice.addLine(new InvoiceLine('4', 'Souris sans fil Logitech MX Master 3S - Graphite, Bluetooth, USB-C rechargeable', 1, 89.99, 0.20));
  invoice.addLine(new InvoiceLine('5', 'Clavier mecanique compact Keychron K3 - Layout AZERTY, switches Brown, retroeclairage RGB, compatible Mac', 1, 119.00, 0.20));
  invoice.addLine(new InvoiceLine('6', 'Hub USB-C 7-en-1 Anker PowerExpand+ avec HDMI 4K, lecteur SD/microSD, 2x USB-A 3.0, USB-C data, USB-C Power Delivery 100W', 1, 45.99, 0.20));
  invoice.addLine(new InvoiceLine('7', 'Support pour ordinateur portable en aluminium - Reglable en hauteur, pliable, compatible 10-17 pouces', 1, 34.99, 0.20));
  invoice.addLine(new InvoiceLine('8', 'Ecran externe Dell UltraSharp U2723QE 27 pouces 4K USB-C avec KVM integre, 100% sRGB, DisplayPort, HDMI, RJ45', 1, 529.00, 0.20));
  invoice.addLine(new InvoiceLine('9', 'Cable USB-C vers USB-C 100W - Charge rapide, transfert de donnees 10Gbps, longueur 2m, nylon tresse', 3, 12.99, 0.20));
  invoice.addLine(new InvoiceLine('10', 'Livraison express France metropolitaine', 1, 0.00, 0.00, 'Z'));

  // Logo Services
  const logoBuffer = fs.readFileSync('/Users/leonce/Desktop/Services/servicesV2/smp/apps/front/web/smp-webapp/public/images/ROUGENOIR.png');

  const result = await generateModernPDF(invoice, {
    language: 'fr',
    showTaxBreakdown: true,
    showPaymentTerms: true,
    logoLayout: 'left',
    logoData: logoBuffer,
    sellerSiret: '48777332700015',
  });

  fs.mkdirSync('examples/output', { recursive: true });
  fs.writeFileSync('examples/output/modern-services.pdf', result.pdf);
  console.log(`✓ PDF: ${result.pageCount} page(s), ${(result.fileSize / 1024).toFixed(2)} KB`);
}

main().catch(console.error);
