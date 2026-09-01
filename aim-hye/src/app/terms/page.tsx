import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { TERMS_DOC } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern ordering beverages from Aim-Hye Integrated Concepts Ltd.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalDocument doc={TERMS_DOC} />;
}
