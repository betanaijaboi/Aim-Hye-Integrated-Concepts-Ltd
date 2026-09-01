export interface LegalSection {
  title: string;
  body: string[];
}

export interface LegalDoc {
  heading: string;
  lastUpdated: string;
  intro?: string[];
  sections: LegalSection[];
}

export const TERMS_DOC: LegalDoc = {
  heading: "Terms of Service",
  lastUpdated: "September 1, 2026",
  intro: [
    "These Terms govern use of the Aim-Hye Integrated Concepts Ltd beverage distribution platform (\"the Platform\"), operated by Aim-Hye Integrated Concepts Ltd, a company registered in Nigeria, with branches in Ikot Ekpene and Itam (Uyo), Akwa Ibom State.",
  ],
  sections: [
    {
      title: "1. The service",
      body: [
        "The Platform lets customers place beverage distribution orders — for delivery or pickup from either branch — and generates invoices/documentation for those orders. The Platform is provided \"AS IS\" and \"AS AVAILABLE,\" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.",
      ],
    },
    {
      title: "2. Orders",
      body: [
        "Placing an order is an offer to purchase at the price and quantity shown at checkout. Aim-Hye Integrated Concepts Ltd may accept, reject, or adjust an order (e.g. for stock availability) before confirmation. A confirmed order is binding on both parties.",
      ],
    },
    {
      title: "3. Pricing and payment",
      body: [
        "Prices are shown in Nigerian Naira (₦) and may change without notice for future orders (not for already-confirmed ones). Orders can be paid by card via Paystack or by bank transfer. Payment terms for wholesale/distributor accounts may be agreed separately.",
      ],
    },
    {
      title: "4. Crate deposits (\"empties\")",
      body: [
        "Crates purchased carry a refundable deposit, shown separately from the product price at checkout. The deposit is refunded when the empty crate and bottles are returned in good condition to the branch you ordered from. Damaged, missing, or non-Aim-Hye crates/bottles are not eligible for a deposit refund.",
      ],
    },
    {
      title: "5. Delivery",
      body: [
        "Delivery timelines shown at order time are estimates, not guarantees. Aim-Hye Integrated Concepts Ltd is not liable for delays caused by circumstances outside its reasonable control (e.g. logistics disruption, force majeure).",
      ],
    },
    {
      title: "6. Returns and refunds",
      body: [
        "Consistent with Nigeria's Federal Competition and Consumer Protection Act (FCCPA), customers may request a return or refund for goods that are defective, damaged in transit, or materially different from what was ordered, within 7 days of delivery. Contact us to initiate a return — see Section 10.",
      ],
    },
    {
      title: "7. Accounts and authentication",
      body: [
        "Customer accounts are verified by phone number and secured with a PIN. Accounts may also use passkey/biometric authentication (WebAuthn) in addition to standard login. You're responsible for keeping your PIN and login method secure and for all activity under your account.",
      ],
    },
    {
      title: "8. Limitation of liability",
      body: [
        "To the maximum extent permitted by law, Aim-Hye Integrated Concepts Ltd's liability is capped at the value of the specific order giving rise to a claim. We are not liable for indirect or consequential damages.",
      ],
    },
    {
      title: "9. Governing law",
      body: ["These Terms are governed by the laws of the Federal Republic of Nigeria."],
    },
    {
      title: "10. Contact",
      body: ["Budoessien2331@outlook.com"],
    },
  ],
};

export const PRIVACY_DOC: LegalDoc = {
  heading: "Privacy Policy",
  lastUpdated: "September 1, 2026",
  sections: [
    {
      title: "What we collect",
      body: [
        "Account info: name, email, phone, delivery address(es).",
        "Authentication data: a PIN (hashed) for account access, and/or a password (bcrypt-hashed) or passkey/biometric credential (WebAuthn) — biometric data itself never leaves your device; we only store the cryptographic public key WebAuthn generates.",
        "Order data: items ordered, quantities, pricing, crate deposits (\"empties\"), delivery address, order history.",
        "Payment info: handled directly by Paystack for card payments, or your bank for transfers — we do not store your card number or bank login details.",
        "Invoicing data: used to generate order invoices/documentation.",
      ],
    },
    {
      title: "Why we collect it",
      body: ["To create your account, process and deliver orders, track crate deposits, generate invoices, and communicate order status via email."],
    },
    {
      title: "Who we share it with",
      body: [
        "Paystack — our payment processor for card payments. See Paystack's own privacy policy at paystack.com/privacy.",
        "Delivery/logistics partners — your delivery address and order details, to fulfil the order.",
        "Database provider (Turso/libSQL) and email provider (via nodemailer) — infrastructure needed to run the service.",
        "We do not sell your personal data.",
      ],
    },
    {
      title: "Your rights (Nigeria Data Protection Act 2023)",
      body: [
        "You can request access to, correction of, or deletion of your data at any time. Order and invoice records may be retained for the period required under Nigerian tax/accounting recordkeeping rules even after a deletion request.",
      ],
    },
    {
      title: "Security",
      body: [
        "PINs and passwords are hashed, never stored in plain text. Passkey/biometric login uses WebAuthn, which never transmits your actual biometric data — only a device-generated cryptographic signature. Card payments are handled by PCI-compliant Paystack infrastructure, not stored on our servers.",
      ],
    },
    {
      title: "Contact",
      body: ["Budoessien2331@outlook.com"],
    },
  ],
};
