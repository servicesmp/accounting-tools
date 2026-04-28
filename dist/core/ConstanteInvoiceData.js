"use strict";
// /src/core
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_POLICIES = void 0;
exports.PROFILE_POLICIES = {
    MINIMUM: {
        mandatoryFields: [
            "header.invoiceNumber",
            "header.invoiceDate",
            "seller",
            "buyer"
        ],
        forbiddenFields: [
            "deliveryParty",
            "payeeParty"
        ]
    },
    BASIC: {
        mandatoryFields: [
            "header.invoiceNumber",
            "header.invoiceDate",
            "seller",
            "buyer",
            "lines"
        ],
        forbiddenFields: [
            "deliveryParty",
            "docAllowanceCharges",
            "additionalDocs"
        ]
    },
    BASICWL: {
        mandatoryFields: [
            "header.invoiceNumber",
            "header.invoiceDate",
            "seller",
            "buyer",
            "lines",
            "payment"
        ],
        forbiddenFields: [
            "buyer.contact",
            "deliveryParty"
        ]
    },
    EN16931: {
        mandatoryFields: [
            "header.invoiceNumber",
            "header.invoiceDate",
            "seller",
            "buyer",
            "lines",
            "payment"
        ],
        forbiddenFields: []
    },
    EXTENDED: {
        mandatoryFields: [
            "header.invoiceNumber",
            "header.invoiceDate",
            "seller",
            "buyer",
        ],
        forbiddenFields: []
    }
};
