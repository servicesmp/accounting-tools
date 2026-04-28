"use strict";
// src/core/HeaderTradeAgreement.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeParty = exports.TradeContact = exports.PostalAddress = void 0;
/** Adresse postale de base */
class PostalAddress {
    constructor(line1, city, postalCode, countryCode = "FR", line2) {
        this.line1 = line1;
        this.city = city;
        this.postalCode = postalCode;
        this.countryCode = countryCode;
        this.line2 = line2;
    }
}
exports.PostalAddress = PostalAddress;
class TradeContact {
    constructor(contactName, contactEmail, contactPhoneNumber, divisionName) {
        this.contactName = contactName;
        this.contactEmail = contactEmail;
        this.contactPhoneNumber = contactPhoneNumber;
        this.divisionName = divisionName;
    }
    /** getFullContactInfo */
    getFullContactInfo() {
        return `${this.contactName || ''} ${this.divisionName ? '(' + this.divisionName + ')' : ''}, ${this.contactPhoneNumber || ''}, ${this.contactEmail || ''}`.trim();
    }
    /** Returns a boolean indicating if the contact has a valid email address */
    hasValidEmailForm() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.contactEmail ? emailPattern.test(this.contactEmail) : false;
    }
    /** Returns a boolean indicating if the contact has a valid phone number */
    hasValidPhoneNumberForm() {
        const phonePattern = /^[0-9+\-\s()]*$/;
        return this.contactPhoneNumber ? phonePattern.test(this.contactPhoneNumber) : false;
    }
}
exports.TradeContact = TradeContact;
/** Partie (vendeur, acheteur) : nom + adresse, vatNumber éventuel */
class TradeParty {
    constructor(name, postalAddress, vatNumber, registrationNumber, // Nom légal (SIRET, etc.)
    electronicAddress, // Email, site web, etc.
    phone, // Téléphone
    contacts = []) {
        this.name = name;
        this.postalAddress = postalAddress;
        this.vatNumber = vatNumber;
        this.registrationNumber = registrationNumber;
        this.electronicAddress = electronicAddress;
        this.phone = phone;
        this.contacts = contacts;
    }
    /** Add a new contact */
    addContact(contact) {
        this.contacts.push(contact);
    }
}
exports.TradeParty = TradeParty;
