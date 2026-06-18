import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalOrders,
    pendingOrders,
    todayOrders,
    totalCustomers,
    activeTrucks,
    lowStockProducts,
    recentOrders,
    todayAllocations,
    todayEmpties,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      include: { items: true },
    }),
    prisma.customer.count(),
    prisma.truck.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, stockCrates: { lte: prisma.product.fields.minStockCrates } },
      include: { brewery: true },
      take: 10,
    }).catch(() => prisma.product.findMany({ where: { isActive: true, stockCrates: { lte: 5 } }, include: { brewery: true }, take: 10 })),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: true, items: { include: { product: true } } },
    }),
    prisma.truckAllocation.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: { truck: true, product: true },
    }),
    prisma.emptyReturn.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: { product: true },
    }),
  ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
  const todayAllocValue = todayAllocations.reduce((s, a) => s + a.totalValue, 0);
  const todayEmptiesValue = todayEmpties.reduce((s, e) => s + e.depositValue, 0);

  return NextResponse.json({
    totalOrders,
    pendingOrders,
    todayRevenue,
    totalCustomers,
    activeTrucks,
    todayAllocValue,
    todayEmptiesValue,
    lowStockProducts,
    recentOrders,
  });
}
