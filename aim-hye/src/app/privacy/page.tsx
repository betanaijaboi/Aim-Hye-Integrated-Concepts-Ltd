import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { PRIVACY_DOC } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Aim-Hye collects, why, who it's shared with, and your data rights under Nigeria's Data Protection Act.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalDocument doc={PRIVACY_DOC} />;
}
