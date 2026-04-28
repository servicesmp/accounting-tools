"use strict";
// src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceData = exports.InputSanitizer = exports.InvoiceTemplateSimple = exports.BaseInvoiceTemplate = exports.FacturxProfile = exports.OrderTemplateSimple = exports.BaseOrderTemplate = exports.OrderStatus = exports.OrderPriority = exports.OrderTypeCode = exports.supportsFeature = exports.getOrderxProfileConfig = exports.OrderxProfiles = void 0;
const Invoice_1 = require("./models/Invoice");
var OrderxProfiles_1 = require("./core/OrderxProfiles");
Object.defineProperty(exports, "OrderxProfiles", { enumerable: true, get: function () { return OrderxProfiles_1.OrderxProfiles; } });
Object.defineProperty(exports, "getOrderxProfileConfig", { enumerable: true, get: function () { return OrderxProfiles_1.getOrderxProfileConfig; } });
Object.defineProperty(exports, "supportsFeature", { enumerable: true, get: function () { return OrderxProfiles_1.supportsFeature; } });
Object.defineProperty(exports, "OrderTypeCode", { enumerable: true, get: function () { return OrderxProfiles_1.OrderTypeCode; } });
Object.defineProperty(exports, "OrderPriority", { enumerable: true, get: function () { return OrderxProfiles_1.OrderPriority; } });
Object.defineProperty(exports, "OrderStatus", { enumerable: true, get: function () { return OrderxProfiles_1.OrderStatus; } });
var BaseOrderTemplate_1 = require("./templates/BaseOrderTemplate");
Object.defineProperty(exports, "BaseOrderTemplate", { enumerable: true, get: function () { return BaseOrderTemplate_1.BaseOrderTemplate; } });
var OrderTemplateSimple_1 = require("./templates/OrderTemplateSimple");
Object.defineProperty(exports, "OrderTemplateSimple", { enumerable: true, get: function () { return OrderTemplateSimple_1.OrderTemplateSimple; } });
var EnumInvoiceType_1 = require("./core/EnumInvoiceType");
Object.defineProperty(exports, "FacturxProfile", { enumerable: true, get: function () { return EnumInvoiceType_1.FacturxProfile; } });
var BaseInvoiceTemplate_1 = require("./templates/BaseInvoiceTemplate");
Object.defineProperty(exports, "BaseInvoiceTemplate", { enumerable: true, get: function () { return BaseInvoiceTemplate_1.BaseInvoiceTemplate; } });
var InvoiceTemplateSimple_1 = require("./templates/InvoiceTemplateSimple");
Object.defineProperty(exports, "InvoiceTemplateSimple", { enumerable: true, get: function () { return InvoiceTemplateSimple_1.InvoiceTemplateSimple; } });
// export { FacturxEngine } from './FacturxEngine';
// ***** Utilities *****
var InputSanitizer_1 = require("./utils/InputSanitizer");
Object.defineProperty(exports, "InputSanitizer", { enumerable: true, get: function () { return InputSanitizer_1.InputSanitizer; } });
// // ==================================================
// // File: services/accounting/src/index.ts
// // (Entry point that re-exports public APIs.)
// // ==================================================
// export * from "./models/Invoice";
// export * from "./signature/Signer";   
// export * from "./generators/templates/RendererOption";
// export * from "./generators/InvoicePDF";
// export * from "./compliance/ubl/UblBuilder"; 
// // export * from "./signature/Verifier";
// import fs from 'fs';
// import {
//   Invoice, 
//   ComplianceType, 
//   RendererOption,
//   PDFOption,  InvoicePDF
// } from './index';
const pdf_lib_1 = require("pdf-lib");
const Invoice_2 = require("./models/Invoice");
const ModerneHTMLInvoiceTemplate_1 = require("./generators/templates/ModerneHTMLInvoiceTemplate");
// 2) Build the invoice
exports.invoiceData = {
    id: 'INV-2025-0001',
    profile: Invoice_2.FacturxProfile.EXTENDED,
    number: 'INV-7ITEMS-003',
    issueDate: new Date('2025-05-10'),
    seller: {
        name: 'Design Agency S.A.',
        street: '123 Creative St',
        postalCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
        address: 'Creative Park\nDistrict 7, FR',
        vatId: 'FR0987654321'
    },
    buyer: {
        name: 'Fancy Buyer SAS',
        street: '123 Rue de la Mode',
        postalCode: '75000',
        city: 'Paris',
        countryCode: 'FR',
        address: '456 Luxury Ln\nFashion District, FR 75000',
        vatId: 'FR3333333333'
    },
    lines: [
        {
            description: 'Logo Design', quantity: 1, unitPrice: 400, taxRate: 20,
            taxCategoryCode: "",
            lineTotalWithoutTax: 0,
            id: "",
            unitCode: ""
        },
        {
            description: 'Brand Guidelines', quantity: 1, unitPrice: 600, taxRate: 20,
            taxCategoryCode: "",
            lineTotalWithoutTax: 0,
            id: "",
            unitCode: ""
        },
        {
            description: 'Mockup Revisions', quantity: 2, unitPrice: 100, taxRate: 20,
            taxCategoryCode: "",
            lineTotalWithoutTax: 0,
            id: "",
            unitCode: ""
        },
        {
            description: 'Social Media Package', quantity: 1, unitPrice: 250, taxRate: 20,
            taxCategoryCode: "",
            lineTotalWithoutTax: 0,
            id: "",
            unitCode: ""
        },
        {
            description: 'Custom Icons', quantity: 10, unitPrice: 10, taxRate: 20,
            taxCategoryCode: "",
            lineTotalWithoutTax: 0,
            id: "",
            unitCode: ""
        },
        {
            description: 'Design Consulting', quantity: 3, unitPrice: 80, taxRate: 20,
            taxCategoryCode: "",
            lineTotalWithoutTax: 0,
            id: "",
            unitCode: ""
        },
        {
            description: 'Hosting Transfer', quantity: 1, unitPrice: 50, taxRate: 10,
            taxCategoryCode: "",
            lineTotalWithoutTax: 0,
            id: "",
            unitCode: ""
        }
    ],
    notes: 'Payment due in 14 days. Buyer covers transaction fees.',
    paymentTerms: '14 days',
    currency: "EUR", // e.g., "EUR"
    totalWithoutTax: 1890,
    totalTaxAmount: 306,
    totalWithTax: 2196
};
const invoice = {
    profile: Invoice_2.FacturxProfile.BASIC_WL,
    id: "INV-2025-0001",
    issueDate: new Date("2025-02-15"),
    currency: "EUR",
    seller: {
        name: "ACME Corp",
        street: "1 Rue des Fleurs",
        postalCode: "75001",
        city: "Paris",
        countryCode: "FR",
        vatId: "FR12345678901" // FR VAT ID example
        ,
        address: ""
    },
    buyer: {
        name: "Client SA",
        street: "10 Downing St",
        postalCode: "SW1A 2AA",
        city: "London",
        countryCode: "GB",
        vatId: "GB987654321",
        address: ""
    },
    lines: [
        {
            description: "Consulting services", quantity: 1, unitCode: "DAY", unitPrice: 800,
            taxRate: 20, taxCategoryCode: "S", lineTotalWithoutTax: 800,
            id: ""
        },
        {
            description: "Software license", quantity: 2, unitCode: "EA", unitPrice: 500,
            taxRate: 20, taxCategoryCode: "S", lineTotalWithoutTax: 1000,
            id: ""
        }
    ],
    // Totals
    totalWithoutTax: 1800,
    totalTaxAmount: 360,
    totalWithTax: 2160,
    taxBreakdowns: [
        { taxCategoryCode: "S", taxRate: 20, taxableAmount: 1800, taxAmount: 360 }
    ],
    language: "en",
    number: "",
};
const inv = new Invoice_1.Invoice(exports.invoiceData, { defaultVatPercent: 20 });
// 3) Provide columns for the table
const columns = [
    { id: 'description', header: 'Item', width: 140, align: 'left' },
    { id: 'quantity', header: 'Qty', width: 40, align: 'right' },
    { id: 'unitPrice', header: 'Price', width: 60, align: 'right' },
    // Possibly discountRate or rebate columns
    { id: 'discountRate', header: 'Disc(%)', width: 60, align: 'right' },
    { id: 'rebate', header: 'Rebate', width: 60, align: 'right' },
];
// 4) Template config
const template = new ModerneHTMLInvoiceTemplate_1.ModernHTMLInvoiceTemplate({
    columns,
    headerTitle: 'INVOICE 25',
    brandColor: (0, pdf_lib_1.rgb)(0.2, 0.4, 0.8), // corrected the syntax for rgb
    backgroundColor: (0, pdf_lib_1.rgb)(0.97, 0.97, 1), // fixed missing variable and corrected syntax
    showSubtotal: true,
    showVat: true,
    showGrandTotal: true,
    // Adding total amount display
    showTotalAmount: true,
});
// 4) If you want to override something at runtime
const dynamicOverride = {
    // brandColor: rgb(0, 0.5, 0.8),
    margin: 50
};
// 5) Render the invoice
(async () => {
    const compliance = Invoice_1.ComplianceType.FR_FACTUR_X;
    // inv.render(...) => returns an InvoicePDF object
    const compliantInvoice = await inv.pdf(compliance, template, dynamicOverride);
    // 6) Sign the PDF
    // const privateKey = fs.readFileSync('./keys/privateKey.pem', 'utf-8');
    // For signing, we might do:
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDneOPLW0cTz5tPWFlPQNlNpiWzb4NygJ3GSc78lGfJyzuPM0eXbxBIg/PDYqzhsq+UQSI3rlZL5Ffs2G/6Lm41Y9pczSBuBAwct0C4xnlJQI+lFh/PDaecyc9Qz2ZbqzYC38S2gKNOK0wahpHnC8SDPW2NIjNPRc4w1+l1yLzgRrGuM6nHXqTIcMLN4J8SfwOmOmD1miyeNRTGh+ZtF1jHE7V+WsK2BCB5HR/8GcLGohrRh7fYVdQiO0TzUttgy2wGbn0mfyzu0Wk2tj5GA5bWPS4AYrW/sIQayyCRQjthvsYJkA/OS2SS5ND9sizsV3KUrV0o3nzv6i8yoC94WZmVAgMBAAECggEAEx1kklKDWBt40+CT33uXdlYWHu9Ch54faVSHB0yqFXv2+yhc7SB608IxyxzG8gxze2a1kKuQ7Mt6h1CITryu1THdwnQeDXfAGE75xUh+k5IFSri8/7g88zGnMSEvbrqAx1P7Rqbw1W+15SrfuZi7LatQ9KqyWgWFtXrfCJ7/GfYUT/gCllrkLSydQuM7jQhFmBx/UbAzI26Qchwz3OqPwirplqd0m3ketVeynzYWpAbAqzWUS28PJlsQv2Dp9qiFVZeQAhqu+SwBre62Os8iXBphrTJRuYaFOP7eWDjk0vVO2ohhKzyp5oShU7i101On+BEEgrtOsheoFOzaVVNwgQKBgQD+SuN2IpiBTmU13hvsrKvVl7PQhUmRCU/0cphsYmgVbr5dSQS/su5gbmTrla/L7b2Y2yxHRkpJEzQR4P4y1o2KPwUksWUwYFNHzjPJ2zVIGg5/IyOhQn0eeYqKc+2N87ktbmAbOPiO1o4Bd8RSNFSwU10ABlWD3yzIpBUbf4xevQKBgQDpBsZWKDRT6UNAhQfwopHHTExQkmUxQ3RdCDibepTuWwuQhMEjm1EPA8tRBbHGsCWQD2ppJLZ3UGPD4+VXAtbz19SNKv5PoFOc3r8u588CVKZeR/XoOLIJggdJhyJ8z10dP9Xn7KbKO46ieYi+Ve4rFxLX8YnZ+AgJD1m6wFVfuQKBgBJGg45r8hXo8nEqo0shJcBWBMBJs/3Oc4aX7chsUhqoONovcz3ruCIKDQq5WUcIsQWZStdcf948mRNn3hz9OnLjEJWQgjs10QZqFWK+dFfYN45/kgH261MTXReSOVJoX7iaJCIQuBxb4xzL5LobtLJva1GjIuY1Vdydnj65rfbpAoGAHfpII6dSbAUTKMa0acmQNXJkUu0yZW8HFjzLg3z2kd9WkoXxjtIZUHQtgMPZxfS9MFY7W0Fk096cpwO3akUsP/xhFLQWOUon14N0VuVtZSBcsr5RLUm15bE7nMLstd+7W9rtesOgBV46ED7QT6QgWpzCSNOC526YIgo+gd7iXMkCgYEA2gw3AevCsNJMyXnY5LgwY8l6pQSy7ZvaPH8iHxHvscgbaL23QJz+G6Modj5EMGfmwNcFa9BaciSm2Zyi48Pgmn39yBHNNezDrBZHRzYbMIdkNT/YfeiXqGISEyCF62XnPUhoT/Ot2qonBwsXpfQj3z+fW8lOg0ONxcHG0oQPkjY=
-----END RSA PRIVATE KEY-----`;
    const signature = compliantInvoice.sign(privateKey);
    // 7) Verify signature
    // const publicKey = fs.readFileSync('./keys/publicKey.pub', 'utf-8');
    const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA53jjy1tHE8+bT1hZT0DZTaYls2+DcoCdxknO/JRnycs7jzNHl28QSIPzw2Ks4bKvlEEiN65WS+RX7Nhv+i5uNWPaXM0gbgQMHLdAuMZ5SUCPpRYfzw2nnMnPUM9mW6s2At/EtoCjTitMGoaR5wvEgz1tjSIzT0XOMNfpdci84EaxrjOpx16kyHDCzeCfEn8Dpjpg9ZosnjUUxofmbRdYxxO1flrCtgQgeR0f/BnCxqIa0Ye32FXUIjtE81LbYMtsBm59Jn8s7tFpNrY+RgOW1j0uAGK1v7CEGssgkUI7Yb7GCZAPzktkkuTQ/bIs7FdylK1dKN587+ovMqAveFmZlQIDAQAB
-----END PUBLIC KEY-----`;
    // 7) Verify signature
    const isValid = compliantInvoice.verify(signature, publicKey);
    console.log('Signature valid?', isValid);
    // 8) Save with PDF metadata
    const pdfOptions = {
        title: 'Invoice #12345',
        author: 'Awesome Seller Corp.',
        subject: 'B2B Invoice Document',
        keywords: ['invoice', 'factur-x', 'b2b'],
        creator: 'SMP Accounting',
        producer: '@services/accounting',
        summary: 'This invoice covers services provided during the consultation phase.',
        provider: 'SMP Accounting Services'
    };
    await compliantInvoice.save(`F-${inv.formatDateForFacturx()}.pdf`, pdfOptions);
    // 9) If you need the embedded XML for FR_FACTUR_X
    let embeddedData = inv.extractEmbedded(compliance);
    console.log('Embedded Data (XML):', embeddedData.toString());
    embeddedData = await compliantInvoice.extractEmbeddedXml();
    if (embeddedData) {
        console.log('Embedded Data (XML):', embeddedData.toString());
    }
    // console.log('Embedded Data (XML):', embeddedData.buffer.toString());
    // } catch (error) {
    //   console.error('Error extracting embedded XML:', error);
    // }
    // console.log('Compliant Invoice Details:', compliantInvoice);
})();
