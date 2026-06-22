import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const breweries = await prisma.brewery.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(breweries);
}
