import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => {
        const s = String(cell ?? "").replace(/"/g, '""');
        return /[,"\n]/.test(s) ? `"${s}"` : s;
      }).join(",")
    )
    .join("\r\n");
}

function formatPeachtreeDate(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "invoices";
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(Date.now() - 30 * 86400000);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  to.setHours(23, 59, 59);

  let csv = "";
  let filename = "";

  if (type === "invoices") {
    // Peachtree Sales Journal import format
    const orders = await prisma.customerOrder.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      include: {
        customer: true,
        items: { include: { product: true } },
        payment: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const rows: string[][] = [
      // Peachtree Enterprise 2002 Sales Invoice import header
      ["Customer ID", "Invoice Number", "Date", "Ship Date", "Terms", "Ship Via",
        "Item ID", "Description", "Quantity", "Unit Price", "Amount",
        "Sales Tax", "Discount", "Payment Status", "Payment Method", "Payment Reference"],
    ];

    for (const order of orders) {
      const customerId = `CUST-${order.customer.phone.replace(/\D/g, "")}`;
      const isPaid = order.payment?.status === "SUCCESS";

      for (const item of order.items) {
        rows.push([
          customerId,
          order.orderNo,
          formatPeachtreeDate(order.createdAt),
          formatPeachtreeDate(order.createdAt),
          "Net 30",
          "Own Truck",
          item.product.sku || item.productId.slice(0, 10),
          `${item.product.name} - ${item.product.size}`,
          String(item.quantity),
          String(item.unitPrice),
          String(item.subtotal),
          "0",
          "0",
          isPaid ? "Paid" : "Unpaid",
          order.payment?.method?.replace(/_/g, " ") || "",
          order.payment?.reference || "",
        ]);
      }
    }

    csv = toCSV(rows);
    filename = `Peachtree-Invoices-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.csv`;
  }

  else if (type === "customers") {
    // Peachtree Customer import format
    const customers = await prisma.customerAccount.findMany({
      orderBy: { name: "asc" },
    });

    const rows: string[][] = [
      ["Customer ID", "Name", "Contact", "Phone", "E-mail", "Address Line 1", "City", "State", "Customer Type"],
    ];

    for (const c of customers) {
      rows.push([
        `CUST-${c.phone.replace(/\D/g, "")}`,
        c.name,
        c.name,
        c.phone,
        c.email || "",
        "", // address
        "",
        "Nigeria",
        "Retail",
      ]);
    }

    csv = toCSV(rows);
    filename = `Peachtree-Customers-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  else if (type === "inventory") {
    // Peachtree Inventory import format
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { brewery: true },
      orderBy: { brewery: { name: "asc" } },
    });

    const rows: string[][] = [
      ["Item ID", "Description", "Item Class", "Unit/Measure", "Qty on Hand",
        "Cost", "Sales Price", "Item Type", "GL Sales Account", "GL Inventory Account"],
    ];

    for (const p of products) {
      rows.push([
        p.sku,
        `${p.brewery.shortName} ${p.name} ${p.size}`,
        p.category.toUpperCase(),
        "Crate",
        String(p.stockCrates),
        String(p.pricePerCrate * 0.85), // estimated cost (85% of price)
        String(p.pricePerCrate),
        "Stock",
        "4000", // Sales Revenue GL
        "1300", // Inventory GL
      ]);
    }

    csv = toCSV(rows);
    filename = `Peachtree-Inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  else if (type === "stock_movement") {
    // Stock movement / adjustments for Peachtree Inventory Adjustment import
    const logs = await prisma.stockLog.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { product: { include: { brewery: true } } },
      orderBy: { createdAt: "asc" },
    });

    const rows: string[][] = [
      ["Date", "Item ID", "Description", "Reason", "Quantity Change", "Previous Qty", "New Qty", "Reference"],
    ];

    for (const log of logs) {
      rows.push([
        formatPeachtreeDate(log.createdAt),
        log.product.sku,
        `${log.product.name} (${log.product.size})`,
        log.reason.replace(/_/g, " "),
        String(log.change),
        String(log.prevQty),
        String(log.newQty),
        log.reference || "",
      ]);
    }

    csv = toCSV(rows);
    filename = `Peachtree-StockMovements-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.csv`;
  }

  else if (type === "empties") {
    const empties = await prisma.emptyReturn.findMany({
      where: { date: { gte: from, lte: to } },
      include: { truck: true, product: { include: { brewery: true } } },
      orderBy: { date: "asc" },
    });

    const rows: string[][] = [
      ["Date", "Truck", "Item ID", "Product", "Brewery", "Crates Returned", "Loose Bottles", "Total Bottles", "Deposit Value (NGN)"],
    ];

    for (const e of empties) {
      rows.push([
        formatPeachtreeDate(e.date),
        e.truck.plateNumber,
        e.product.sku,
        `${e.product.name} (${e.product.size})`,
        e.product.brewery.name,
        String(e.cratesReturned),
        String(e.looseBottles),
        String(e.totalBottles),
        String(e.depositValue),
      ]);
    }

    csv = toCSV(rows);
    filename = `Peachtree-Empties-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
