import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import { formatNaira, formatDate } from "./utils";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, borderBottomWidth: 2, borderBottomColor: "#1e3a5f", paddingBottom: 15 },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1e3a5f" },
  companyTag: { fontSize: 9, color: "#64748b", marginTop: 2 },
  invoiceTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#1e3a5f", textAlign: "right" },
  invoiceNo: { fontSize: 10, color: "#64748b", textAlign: "right" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  twoCol: { flexDirection: "row", gap: 20, marginBottom: 20 },
  col: { flex: 1 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e3a5f", padding: "6 8", marginBottom: 2 },
  tableHeaderText: { color: "white", fontFamily: "Helvetica-Bold", fontSize: 9 },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tableAlt: { backgroundColor: "#f8fafc" },
  total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalBox: { width: 220, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#1e3a5f", padding: "6 8", marginTop: 4 },
  grandTotalText: { color: "white", fontFamily: "Helvetica-Bold", fontSize: 11 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10, textAlign: "center", color: "#94a3b8", fontSize: 8 },
  badge: { backgroundColor: "#dcfce7", color: "#166534", padding: "2 6", borderRadius: 4, fontSize: 8, fontFamily: "Helvetica-Bold" },
  badgePending: { backgroundColor: "#fef9c3", color: "#854d0e" },
});

interface InvoiceData {
  orderNo: string;
  createdAt: string | Date;
  customer: { name: string; phone: string; email?: string | null };
  deliveryAddress: string;
  items: Array<{ product: { name: string; size: string; brewery: { name: string } }; quantity: number; unitPrice: number; subtotal: number }>;
  totalAmount: number;
  depositAmount: number;
  payment?: { method: string; status: string; reference: string; verifiedAt?: string | Date | null } | null;
}

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const isPaid = data.payment?.status === "SUCCESS";
  const methodLabels: Record<string, string> = {
    PAYSTACK_CARD: "Debit/Credit Card (Paystack)",
    PAYSTACK_TRANSFER: "Bank Transfer (Paystack)",
    BANK_TRANSFER: "Direct Bank Transfer",
  };

  return React.createElement(Document, { title: `Invoice ${data.orderNo}` },
    React.createElement(Page, { size: "A4", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, null,
          React.createElement(Text, { style: styles.companyName }, "AIM-HYE INTEGRATED CONCEPTS"),
          React.createElement(Text, { style: styles.companyTag }, "Licensed Beverage Distributor · Nigeria"),
          React.createElement(Text, { style: { ...styles.companyTag, marginTop: 4 } }, "Champion · International · Nigerian · Guinness Breweries"),
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: styles.invoiceTitle }, "INVOICE"),
          React.createElement(Text, { style: styles.invoiceNo }, `#${data.orderNo}`),
          React.createElement(Text, { style: { ...styles.invoiceNo, marginTop: 4 } }, `Date: ${formatDate(data.createdAt)}`),
          isPaid
            ? React.createElement(Text, { style: { ...styles.badge, marginTop: 4 } }, "✓ PAID")
            : React.createElement(Text, { style: { ...styles.badge, ...styles.badgePending, marginTop: 4 } }, "PENDING"),
        ),
      ),

      // Bill to & Deliver to
      React.createElement(View, { style: styles.twoCol },
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.sectionTitle }, "Bill To"),
          React.createElement(Text, { style: { fontFamily: "Helvetica-Bold", marginBottom: 2 } }, data.customer.name),
          React.createElement(Text, { style: { color: "#64748b" } }, data.customer.phone),
          data.customer.email ? React.createElement(Text, { style: { color: "#64748b" } }, data.customer.email) : null,
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.sectionTitle }, "Deliver To"),
          React.createElement(Text, { style: { color: "#475569" } }, data.deliveryAddress),
        ),
      ),

      // Items table
      React.createElement(View, { style: styles.section },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 3 } }, "Product"),
          React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 1, textAlign: "center" } }, "Qty (Crates)"),
          React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 1, textAlign: "right" } }, "Unit Price"),
          React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 1, textAlign: "right" } }, "Amount"),
        ),
        ...data.items.map((item, i) =>
          React.createElement(View, { key: i, style: i % 2 === 1 ? { ...styles.tableRow, ...styles.tableAlt } : styles.tableRow },
            React.createElement(View, { style: { flex: 3 } },
              React.createElement(Text, null, `${item.product.name} (${item.product.size})`),
              React.createElement(Text, { style: { color: "#94a3b8", fontSize: 8 } }, item.product.brewery.name),
            ),
            React.createElement(Text, { style: { flex: 1, textAlign: "center" } }, String(item.quantity)),
            React.createElement(Text, { style: { flex: 1, textAlign: "right" } }, formatNaira(item.unitPrice)),
            React.createElement(Text, { style: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" } }, formatNaira(item.subtotal)),
          )
        ),
      ),

      // Totals
      React.createElement(View, { style: styles.total },
        React.createElement(View, { style: styles.totalBox },
          React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: { color: "#64748b" } }, "Subtotal"),
            React.createElement(Text, null, formatNaira(data.totalAmount)),
          ),
          React.createElement(View, { style: styles.totalRow },
            React.createElement(Text, { style: { color: "#64748b" } }, "Bottle Deposit (Refundable)"),
            React.createElement(Text, null, formatNaira(data.depositAmount)),
          ),
          React.createElement(View, { style: styles.grandTotal },
            React.createElement(Text, { style: styles.grandTotalText }, "TOTAL PAYABLE"),
            React.createElement(Text, { style: styles.grandTotalText }, formatNaira(data.totalAmount + data.depositAmount)),
          ),
        ),
      ),

      // Payment info
      data.payment ? React.createElement(View, { style: { marginTop: 20, backgroundColor: "#f8fafc", padding: 12, borderRadius: 4 } },
        React.createElement(Text, { style: styles.sectionTitle }, "Payment Information"),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: { color: "#64748b" } }, "Method"),
          React.createElement(Text, null, methodLabels[data.payment.method] || data.payment.method),
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: { color: "#64748b" } }, "Reference"),
          React.createElement(Text, null, data.payment.reference),
        ),
        data.payment.verifiedAt ? React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: { color: "#64748b" } }, "Payment Date"),
          React.createElement(Text, null, formatDate(data.payment.verifiedAt as string)),
        ) : null,
      ) : null,

      // Bank details for unpaid
      !isPaid ? React.createElement(View, { style: { marginTop: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 12, borderRadius: 4 } },
        React.createElement(Text, { style: { ...styles.sectionTitle, marginBottom: 8 } }, "Bank Transfer Details"),
        React.createElement(Text, null, "Bank: First Bank of Nigeria"),
        React.createElement(Text, null, "Account Name: Aim-Hye Integrated Concepts Limited"),
        React.createElement(Text, null, "Account Number: 3012345678"),
        React.createElement(Text, { style: { marginTop: 4, color: "#64748b" } }, `Narration: ${data.orderNo}`),
      ) : null,

      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, "Aim-Hye Integrated Concepts Limited · Thank you for your business!"),
        React.createElement(Text, { style: { marginTop: 2 } }, "Bottle deposits are refundable when empty bottles are returned in good condition."),
      ),
    )
  );
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const element = React.createElement(InvoiceDocument, { data });
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
