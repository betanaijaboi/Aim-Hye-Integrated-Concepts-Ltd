import type { LegalDoc } from "@/lib/legal";

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-[#1e3a5f]">{doc.heading}</h1>
      <p className="mt-2 mb-8 text-xs uppercase tracking-wide text-slate-500">
        Last updated: {doc.lastUpdated}
      </p>
      {doc.intro?.map((p, i) => (
        <p key={i} className="mb-6 text-sm leading-relaxed text-slate-600">
          {p}
        </p>
      ))}
      <div className="space-y-6">
        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-[#1e3a5f]">{section.title}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
