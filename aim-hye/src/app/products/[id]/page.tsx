import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductPageClient from "./ProductPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aimhye.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { brewery: true } });
  if (!product) return { title: "Product Not Found" };

  const title = `${product.name} (${product.size}) — ${product.brewery.name}`;
  const description = `Order ${product.name} ${product.size} by the ${product.packaging === "glass" ? "bottle" : "unit"} or crate from Aim-Hye — ${product.brewery.name} distributor in Akwa Ibom.`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: { title, description },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { brewery: true } });
  if (!product) notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name} (${product.size})`,
    brand: { "@type": "Brand", name: product.brewery.name },
    category: product.category,
    sku: product.sku,
    image: product.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${id}`,
      priceCurrency: "NGN",
      price: product.pricePerBottle,
      availability: product.stockCrates > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductPageClient params={params} />
    </>
  );
}
