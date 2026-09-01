import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aimhye.com";
const SITE_TITLE = "Aim-Hye Integrated Concepts | Drinks Distribution";
const SITE_DESCRIPTION = "Nigeria's trusted beverage distributor — Champion, International, Nigerian, Guinness Breweries";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Aim-Hye Integrated Concepts",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

const BRANCHES_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Aim-Hye Integrated Concepts Ltd — Ikot Ekpene Branch",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    address: { "@type": "PostalAddress", addressLocality: "Ikot Ekpene", addressRegion: "Akwa Ibom", addressCountry: "NG" },
    priceRange: "$$",
  },
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Aim-Hye Integrated Concepts Ltd — Itam Branch",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    address: { "@type": "PostalAddress", addressLocality: "Itam, Uyo", addressRegion: "Akwa Ibom", addressCountry: "NG" },
    priceRange: "$$",
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${bebasNeue.variable}`}>
      <body className="min-h-full antialiased">
        {BRANCHES_JSON_LD.map((branch) => (
          <script
            key={branch.name}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(branch) }}
          />
        ))}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
