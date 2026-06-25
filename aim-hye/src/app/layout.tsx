import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "Aim-Hye Integrated Concepts | Drinks Distribution",
  description: "Nigeria's trusted beverage distributor — Champion, International, Nigerian, Guinness Breweries",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${bebasNeue.variable}`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
