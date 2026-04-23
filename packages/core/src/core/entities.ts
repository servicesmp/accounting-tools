/**
 * @module entities
 * @description Core domain entities with optimized implementations
 * Immutable by default with efficient builder patterns
 */

import {
  PostalAddress,
  TradeParty,
  PaymentDetails,
  DocumentHeader,
  AllowanceCharge as IAllowanceCharge,
  InvoiceLine as IInvoiceLine,
  NoteWithCode,
  DocTypeCode,
  PaymentMeansCode,
} from '../types';

// ============================================================================
// POSTAL ADDRESS - Immutable
// ============================================================================

export class PostalAddressImpl implements PostalAddress {
  constructor(
    public readonly city: string,
    public readonly postalCode: string,
    public readonly countryCode: string,
    public readonly street?: string,
    public readonly additionalStreet?: string,
    public readonly additionalStreet2?: string,
    public readonly subdivision?: string
  ) {
    // Validation in constructor for fail-fast
    if (!city || !postalCode || !countryCode) {
      throw new Error('City, postal code, and country code are required');
    }
    Object.freeze(this);
  }

  /** Create builder for fluent API */
  static builder(): PostalAddressBuilder {
    return new PostalAddressBuilder();
  }
}

class PostalAddressBuilder {
  private _city?: string;
  private _postalCode?: string;
  private _countryCode?: string;
  private _street?: string;
  private _additionalStreet?: string;
  private _additionalStreet2?: string;
  private _subdivision?: string;

  city(value: string): this {
    this._city = value;
    return this;
  }
  postalCode(value: string): this {
    this._postalCode = value;
    return this;
  }
  countryCode(value: string): this {
    this._countryCode = value;
    return this;
  }
  street(value: string): this {
    this._street = value;
    return this;
  }
  additionalStreet(value: string): this {
    this._additionalStreet = value;
    return this;
  }
  additionalStreet2(value: string): this {
    this._additionalStreet2 = value;
    return this;
  }
  subdivision(value: string): this {
    this._subdivision = value;
    return this;
  }

  build(): PostalAddressImpl {
    if (!this._city || !this._postalCode || !this._countryCode) {
      throw new Error('City, postal code, and country code are required');
    }
    return new PostalAddressImpl(
      this._city,
      this._postalCode,
      this._countryCode,
      this._street,
      this._additionalStreet,
      this._additionalStreet2,
      this._subdivision
    );
  }
}

// ============================================================================
// TRADE PARTY - Immutable
// ============================================================================

export class TradePartyImpl implements TradeParty {
  constructor(
    public readonly name: string,
    public readonly address: PostalAddress,
    public readonly tradingName?: string,
    public readonly vatId?: string,
    public readonly taxId?: string,
    public readonly legalId?: string,
    public readonly legalIdScheme?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly globalId?: string,
    public readonly electronicAddress?: string,
    public readonly electronicAddressScheme?: string
  ) {
    if (!name || !address) {
      throw new Error('Name and address are required');
    }
    Object.freeze(this);
  }

  static builder(): TradePartyBuilder {
    return new TradePartyBuilder();
  }
}

class TradePartyBuilder {
  private _name?: string;
  private _address?: PostalAddress;
  private _tradingName?: string;
  private _vatId?: string;
  private _taxId?: string;
  private _legalId?: string;
  private _legalIdScheme?: string;
  private _email?: string;
  private _phone?: string;
  private _globalId?: string;
  private _electronicAddress?: string;
  private _electronicAddressScheme?: string;

  name(value: string): this {
    this._name = value;
    return this;
  }
  address(value: PostalAddress): this {
    this._address = value;
    return this;
  }
  tradingName(value: string): this {
    this._tradingName = value;
    return this;
  }
  vatId(value: string): this {
    this._vatId = value;
    return this;
  }
  taxId(value: string): this {
    this._taxId = value;
    return this;
  }
  legalId(value: string): this {
    this._legalId = value;
    return this;
  }
  legalIdScheme(value: string): this {
    this._legalIdScheme = value;
    return this;
  }
  email(value: string): this {
    this._email = value;
    return this;
  }
  phone(value: string): this {
    this._phone = value;
    return this;
  }
  globalId(value: string): this {
    this._globalId = value;
    return this;
  }
  electronicAddress(value: string): this {
    this._electronicAddress = value;
    return this;
  }
  electronicAddressScheme(value: string): this {
    this._electronicAddressScheme = value;
    return this;
  }

  build(): TradePartyImpl {
    if (!this._name || !this._address) {
      throw new Error('Name and address are required');
    }
    return new TradePartyImpl(
      this._name,
      this._address,
      this._tradingName,
      this._vatId,
      this._taxId,
      this._legalId,
      this._legalIdScheme,
      this._email,
      this._phone,
      this._globalId,
      this._electronicAddress,
      this._electronicAddressScheme
    );
  }
}

// ============================================================================
// PAYMENT DETAILS - Immutable
// ============================================================================

export class PaymentDetailsImpl implements PaymentDetails {
  constructor(
    public readonly meansCode: PaymentMeansCode,
    public readonly iban?: string,
    public readonly bic?: string,
    public readonly reference?: string,
    public readonly dueDate?: Date,
    public readonly termsDescription?: string
  ) {
    Object.freeze(this);
  }

  static builder(): PaymentDetailsBuilder {
    return new PaymentDetailsBuilder();
  }
}

class PaymentDetailsBuilder {
  private _meansCode?: PaymentMeansCode;
  private _iban?: string;
  private _bic?: string;
  private _reference?: string;
  private _dueDate?: Date;
  private _termsDescription?: string;

  meansCode(value: PaymentMeansCode): this {
    this._meansCode = value;
    return this;
  }
  iban(value: string): this {
    this._iban = value;
    return this;
  }
  bic(value: string): this {
    this._bic = value;
    return this;
  }
  reference(value: string): this {
    this._reference = value;
    return this;
  }
  dueDate(value: Date): this {
    this._dueDate = value;
    return this;
  }
  termsDescription(value: string): this {
    this._termsDescription = value;
    return this;
  }

  build(): PaymentDetailsImpl {
    if (!this._meansCode) {
      throw new Error('Payment means code is required');
    }
    return new PaymentDetailsImpl(
      this._meansCode,
      this._iban,
      this._bic,
      this._reference,
      this._dueDate,
      this._termsDescription
    );
  }
}

// ============================================================================
// DOCUMENT HEADER - Immutable
// ============================================================================

export class DocumentHeaderImpl implements DocumentHeader {
  constructor(
    public readonly id: string,
    public readonly invoiceNumber: string,
    public readonly name: string,
    public readonly invoiceDate: Date,
    public readonly typeCode: DocTypeCode,
    public readonly dueDate?: Date,
    public readonly billingPeriodStart?: Date,
    public readonly billingPeriodEnd?: Date,
    public readonly purchaseOrderReference?: string,
    public readonly salesOrderReference?: string,
    public readonly contractReference?: string,
    public readonly notes?: (string | NoteWithCode)[]
  ) {
    if (!id || !invoiceNumber || !invoiceDate) {
      throw new Error('ID, invoice number, and date are required');
    }
    if (notes) {
      Object.freeze(notes);
    }
    Object.freeze(this);
  }

  static builder(): DocumentHeaderBuilder {
    return new DocumentHeaderBuilder();
  }
}

class DocumentHeaderBuilder {
  private _id?: string;
  private _invoiceNumber?: string;
  private _name: string = 'INVOICE';
  private _invoiceDate?: Date;
  private _typeCode: DocTypeCode = DocTypeCode.INVOICE;
  private _dueDate?: Date;
  private _billingPeriodStart?: Date;
  private _billingPeriodEnd?: Date;
  private _purchaseOrderReference?: string;
  private _salesOrderReference?: string;
  private _contractReference?: string;
  private _notes?: (string | NoteWithCode)[];

  id(value: string): this {
    this._id = value;
    return this;
  }
  invoiceNumber(value: string): this {
    this._invoiceNumber = value;
    return this;
  }
  name(value: string): this {
    this._name = value;
    return this;
  }
  invoiceDate(value: Date): this {
    this._invoiceDate = value;
    return this;
  }
  typeCode(value: DocTypeCode): this {
    this._typeCode = value;
    return this;
  }
  dueDate(value: Date): this {
    this._dueDate = value;
    return this;
  }
  billingPeriod(start: Date, end: Date): this {
    this._billingPeriodStart = start;
    this._billingPeriodEnd = end;
    return this;
  }
  purchaseOrderReference(value: string): this {
    this._purchaseOrderReference = value;
    return this;
  }
  salesOrderReference(value: string): this {
    this._salesOrderReference = value;
    return this;
  }
  contractReference(value: string): this {
    this._contractReference = value;
    return this;
  }
  addNote(note: string): this {
    if (!this._notes) {
      this._notes = [];
    }
    this._notes.push(note);
    return this;
  }
  addNoteWithCode(content: string, subjectCode: string): this {
    if (!this._notes) {
      this._notes = [];
    }
    this._notes.push({ content, subjectCode });
    return this;
  }

  build(): DocumentHeaderImpl {
    if (!this._id || !this._invoiceNumber || !this._invoiceDate) {
      throw new Error('ID, invoice number, and date are required');
    }
    return new DocumentHeaderImpl(
      this._id,
      this._invoiceNumber,
      this._name,
      this._invoiceDate,
      this._typeCode,
      this._dueDate,
      this._billingPeriodStart,
      this._billingPeriodEnd,
      this._purchaseOrderReference,
      this._salesOrderReference,
      this._contractReference,
      this._notes ? [...this._notes] : undefined
    );
  }
}

// ============================================================================
// ALLOWANCE/CHARGE - Immutable
// ============================================================================

export class AllowanceCharge implements IAllowanceCharge {
  constructor(
    public readonly chargeIndicator: boolean,
    public readonly actualAmount: number,
    public readonly reason?: string,
    public readonly reasonCode?: string,
    public readonly taxRate?: number,
    public readonly taxCategoryCode?: string,
    public readonly baseAmount?: number,
    public readonly percentage?: number
  ) {
    if (actualAmount < 0) {
      throw new Error('Amount must be non-negative');
    }
    Object.freeze(this);
  }

  /** Create allowance (discount) */
  static allowance(amount: number, reason?: string, reasonCode?: string): AllowanceCharge {
    return new AllowanceCharge(false, amount, reason, reasonCode);
  }

  /** Create charge */
  static charge(amount: number, reason?: string, reasonCode?: string): AllowanceCharge {
    return new AllowanceCharge(true, amount, reason, reasonCode);
  }
}

// ============================================================================
// INVOICE LINE - Mutable for performance (quantity/price can change)
// ============================================================================

export class InvoiceLine implements IInvoiceLine {
  // Optimized: Use arrays instead of readonly for internal mutations
  public readonly allowances: AllowanceCharge[] = [];
  public readonly charges: AllowanceCharge[] = [];

  constructor(
    public readonly id: string,
    public readonly description: string,
    public quantity: number,
    public unitPrice: number,
    public readonly vatRate: number,
    public readonly taxCategoryCode: string = 'S',
    public readonly unitCode: string = 'C62',
    public readonly billingPeriodStart?: Date,
    public readonly billingPeriodEnd?: Date,
    public readonly deliveredQuantity?: number,
    public readonly productId?: string,
    public readonly ean?: string,
    /** BT-120: Tax exemption reason text (required for non-S categories) */
    public readonly taxExemptionReason?: string,
    /** BT-121: Tax exemption reason code */
    public readonly taxExemptionReasonCode?: string,
  ) {
    if (!id || !description) {
      throw new Error('ID and description are required');
    }
    if (quantity < 0 || unitPrice < 0) {
      throw new Error('Quantity and price must be non-negative');
    }
  }

  /** Get line total (optimized: inline calculation) */
  get lineTotal(): number {
    return this.quantity * this.unitPrice;
  }

  /** Add allowance - Optimized: direct push */
  addAllowance(amount: number, reason?: string): void {
    this.allowances.push(AllowanceCharge.allowance(amount, reason));
  }

  /** Add charge - Optimized: direct push */
  addCharge(amount: number, reason?: string): void {
    this.charges.push(AllowanceCharge.charge(amount, reason));
  }

  /** Add allowance or charge - Optimized: ternary */
  addAllowanceCharge(amount: number, isCharge: boolean, reason?: string): void {
    isCharge ? this.addCharge(amount, reason) : this.addAllowance(amount, reason);
  }

  /** Get all allowances and charges - Optimized: spread is faster than concat for small arrays */
  getAllAllowancesCharges(): AllowanceCharge[] {
    return [...this.allowances, ...this.charges];
  }

  /** Clear all - Optimized: length = 0 is faster than creating new array */
  clearAllowancesCharges(): void {
    this.allowances.length = 0;
    this.charges.length = 0;
  }

  static builder(): InvoiceLineBuilder {
    return new InvoiceLineBuilder();
  }
}

class InvoiceLineBuilder {
  private _id?: string;
  private _description?: string;
  private _quantity: number = 1;
  private _unitPrice: number = 0;
  private _vatRate: number = 0.20;
  private _taxCategoryCode: string = 'S';
  private _unitCode: string = 'C62';
  private _billingPeriodStart?: Date;
  private _billingPeriodEnd?: Date;
  private _deliveredQuantity?: number;
  private _productId?: string;
  private _ean?: string;

  id(value: string): this {
    this._id = value;
    return this;
  }
  description(value: string): this {
    this._description = value;
    return this;
  }
  quantity(value: number): this {
    this._quantity = value;
    return this;
  }
  unitPrice(value: number): this {
    this._unitPrice = value;
    return this;
  }
  vatRate(value: number): this {
    this._vatRate = value;
    return this;
  }
  taxCategoryCode(value: string): this {
    this._taxCategoryCode = value;
    return this;
  }
  unitCode(value: string): this {
    this._unitCode = value;
    return this;
  }
  billingPeriod(start: Date, end: Date): this {
    this._billingPeriodStart = start;
    this._billingPeriodEnd = end;
    return this;
  }
  deliveredQuantity(value: number): this {
    this._deliveredQuantity = value;
    return this;
  }
  productId(value: string): this {
    this._productId = value;
    return this;
  }
  ean(value: string): this {
    this._ean = value;
    return this;
  }

  build(): InvoiceLine {
    if (!this._id || !this._description) {
      throw new Error('ID and description are required');
    }
    return new InvoiceLine(
      this._id,
      this._description,
      this._quantity,
      this._unitPrice,
      this._vatRate,
      this._taxCategoryCode,
      this._unitCode,
      this._billingPeriodStart,
      this._billingPeriodEnd,
      this._deliveredQuantity,
      this._productId,
      this._ean
    );
  }
}
