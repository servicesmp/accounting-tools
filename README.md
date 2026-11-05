# accounting-tools

Monorepo de bibliotheques TypeScript pour la facturation electronique **Factur-X** (ZUGFeRD 2.3), conforme au standard **EN 16931:2017**.

## Structure du projet

```
accounting-tools/
├── packages/
│   ├── core/              # @facturx/core      - Moteur XML Factur-X
│   ├── templates/         # @facturx/templates  - Templates PDF professionnels
│   └── cli/               # @facturx/cli        - CLI de generation
├── examples/              # Scripts d'integration et generation
├── scripts/               # Scripts de validation externe
├── reference/             # Schemas XSD, Schematron et documentation officielle Factur-X 1.07.2
├── docs/plans/            # Plans d'implementation
└── legacy/                # Code prototype (ancien src/)
```

## Les bibliotheques

### `@facturx/core` (`packages/core`)

Bibliotheque coeur pour la generation de factures electroniques Factur-X.

**Fonctionnalites :**
- Generation XML conforme Factur-X 1.07.2
- Tous les profils supportes : MINIMUM, BASIC WL, BASIC, EN16931, EXTENDED
- Validation XSD, regles metier EN16931, regles Schematron BR-FR
- Validation des code lists (ISO 4217, ISO 3166, UNTDID...)
- Calculateur de taxes automatique
- Internationalisation (fr, en, de)
- Sanitisation des entrees / echappement XML

**Installation :**

```bash
cd packages/core
npm install
npm run build
```

**Usage rapide :**

```typescript
import {
  FacturXInvoice,
  FacturxProfile,
  PostalAddressImpl,
  TradePartyImpl,
  PaymentDetailsImpl,
  DocumentHeaderImpl,
  InvoiceLineImpl,
  DocTypeCode,
  PaymentMeansCode,
  CurrencyCode,
} from '@facturx/core';

// 1. Creer le vendeur
const seller = TradePartyImpl.builder()
  .name('Mon Entreprise SARL')
  .address(
    PostalAddressImpl.builder()
      .street('10 Rue du Commerce')
      .city('Paris')
      .postalCode('75001')
      .countryCode('FR')
      .build()
  )
  .vatId('FR12345678901')
  .build();

// 2. Creer l'acheteur
const buyer = TradePartyImpl.builder()
  .name('Client Corp')
  .address(
    PostalAddressImpl.builder()
      .street('25 Avenue Client')
      .city('Lyon')
      .postalCode('69001')
      .countryCode('FR')
      .build()
  )
  .vatId('FR98765432100')
  .build();

// 3. En-tete du document
const header = DocumentHeaderImpl.builder()
  .invoiceNumber('FA-2025-001')
  .typeCode(DocTypeCode.COMMERCIAL_INVOICE)
  .issueDate(new Date())
  .currencyCode(CurrencyCode.EUR)
  .build();

// 4. Paiement
const payment = PaymentDetailsImpl.builder()
  .meansCode(PaymentMeansCode.SEPA_CREDIT_TRANSFER)
  .iban('FR7630004000031234567890143')
  .bic('BNPAFRPPXXX')
  .dueDate(new Date(Date.now() + 30 * 86400000))
  .build();

// 5. Creer la facture
const invoice = new FacturXInvoice(
  FacturxProfile.EN16931,
  header,
  seller,
  buyer,
  payment
);

// 6. Ajouter des lignes
invoice.addLine(InvoiceLineImpl.create({
  lineId: '1',
  description: 'Prestation de conseil',
  quantity: 10,
  unitPrice: 150.00,
  vatRate: 20.0,
  unitCode: 'HUR',
}));

// 7. Generer le XML
const xml = invoice.toXml();
```

**Tests :**

```bash
npm test                  # tous les tests
npm run test:coverage     # avec couverture
```

Voir `packages/core/examples/` pour 8 exemples complets couvrant factures simples, multi-lignes, avec remises, multi-devises, devis et avoirs.

---

### `@facturx/templates` (`packages/templates`)

Bibliotheque de templates PDF professionnels pour les factures Factur-X, avec conformite PDF/A-3.

**5 templates disponibles :**
| Template | Description |
|----------|-------------|
| `MODERN` | Design propre, palette bleue (defaut) |
| `FANCY` | Design colore avec degrade rose/bleu |
| `BRAND` | Template corporate navy/orange |
| `CORPORATE` | Design elegant gris/bleu/or |
| `MINIMAL` | Design minimaliste monochrome |

**Installation :**

```bash
cd packages/templates
npm install
npm run build
```

> **Note :** `@facturx/templates` depend de `@facturx/core`. Construire core en premier.

**Usage rapide :**

```typescript
import { generatePDF, TemplateType } from '@facturx/templates';
import { FacturXInvoice, FacturxProfile } from '@facturx/core';

// ... creer la facture (voir @facturx/core ci-dessus)

// Generer le PDF avec un template
const result = await generatePDF(invoice, TemplateType.MODERN, {
  language: 'fr',
  showQRCode: true,
});

// result.pdfBytes contient le PDF/A-3
fs.writeFileSync('facture.pdf', result.pdfBytes);
```

**Fonctions de convenance :**

```typescript
import {
  generateModernPDF,
  generateFancyPDF,
  generateBrandPDF,
  generateCorporatePDF,
  generateMinimalPDF,
} from '@facturx/templates';

const result = await generateFancyPDF(invoice, { language: 'fr' });
```

**Validation PDF/A-3 :**

```typescript
import { validateQuick, validateAfterGeneration } from '@facturx/templates';

// Validation rapide avant generation
const preCheck = validateQuick(invoice);

// Validation complete apres generation
const postCheck = await validateAfterGeneration(pdfBytes, xmlString);
```

Voir `packages/templates/examples/` pour des exemples de chaque template.

**Rapports par blocs (`accounting-tools/document` + `generateReportPdf`) :**

Rapport de tâche, compte rendu de réunion, rapport d'activité d'une équipe… tout document de
restitution d'une organisation, rendu avec le MÊME réglage de présentation que ses factures
(couleurs, logo selon le plan, mention « Document émis avec Services ») : à l'écran avec
`renderReportHtml` (fragment HTML autonome, navigateur-compatible) et en PDF paginé avec
`generateReportPdf` (Node). La librairie ne calcule rien : l'appelant fournit des blocs typés déjà
calculés (`paragraph`, `callout`, `list`, `rows`, `stats`, `bars`, `distribution`, `people`,
`actions`, `agenda`, `columns`), bornés et nettoyés par `buildReportView`.

```typescript
import { buildReportView, renderReportHtml, type ReportDocumentData } from 'accounting-tools/document';
import { generateReportPdf } from 'accounting-tools';

const data: ReportDocumentData = {
  kind: 'meeting_minutes', typeLabel: 'Rapport Services · Compte rendu',
  title: 'Point client', subtitle: 'Vendredi 16 octobre 2026', issuer: { name: 'Atelier Roux' },
  meta: [{ label: 'Lieu', value: 'Visio' }],
  blocks: [
    { type: 'paragraph', title: 'Synthèse', badge: "Fils d'Iro", text: '…' },
    { type: 'callout', title: 'Décisions', style: 'dark', items: [{ text: 'Restitution le 28/10' }] },
    { type: 'actions', title: 'Actions à réaliser', items: [{ title: 'Envoyer la liste', owner: 'Camille Roux', due: '21/10', status: 'À créer', statusTone: 'info' }] },
  ],
  footer: { sources: 'Généré par le fils d’Iro à partir de : notes de la réunion.' },
  status: 'draft', // filigrane BROUILLON si le réglage l'active
};
const html = renderReportHtml(buildReportView(data, { settings }), { logoUrl });
const { pdf, pageCount } = await generateReportPdf({ data, settings, entitlements, logo });
```

Pagination du PDF : chaque ligne, action ou élément d'agenda est insécable ; un encart passe entier
à la page suivante s'il y tient, sinon il est découpé ; un bloc à deux colonnes trop haut est empilé.
Titres en Chillax (embarquée entière), corps en Liberation Sans.

---

### `@facturx/cli` (`packages/cli`)

CLI pour generer des factures depuis la ligne de commande.

```bash
cd packages/cli
npm install
npm run build
node dist/index.js
```

---

## Scripts de validation

Le dossier `scripts/` contient des scripts pour valider les factures avec des outils externes :

```bash
# Installer les outils de validation (veraPDF, Mustang)
./scripts/setup-validation-tools.sh

# Valider un PDF Factur-X
./scripts/validate-facturx.sh output/facture.pdf

# Validation externe complete
./scripts/validate-external.sh output/facture.pdf
```

## Build complet

```bash
# 1. Installer les dependances
cd packages/core && npm install && cd ../..
cd packages/templates && npm install && cd ../..
cd packages/cli && npm install && cd ../..

# 2. Build dans l'ordre
cd packages/core && npm run build && cd ../..
cd packages/templates && npm run build && cd ../..
cd packages/cli && npm run build && cd ../..

# 3. Lancer les tests
cd packages/core && npm test && cd ../..
cd packages/templates && npm test && cd ../..
```

## Standards supportes

- **Factur-X 1.07.2** / ZUGFeRD 2.3.2
- **EN 16931:2017** (norme europeenne de facturation electronique)
- **CII D16B** (Cross-Industry Invoice)
- **PDF/A-3** (archivage long terme avec piece jointe XML)
- Regles Schematron **BR-FR** (regles francaises)

## Profils Factur-X

| Profil | Complexite | Usage |
|--------|-----------|-------|
| MINIMUM | Tres simple | Archivage minimal |
| BASIC WL | Simple | Factures sans lignes detaillees |
| BASIC | Standard | Factures courantes |
| EN16931 | Complet | Conformite europeenne (recommande) |
| EXTENDED | Maximum | Factures complexes B2B |

## Licence

MIT - SMP Solutions
