import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-[#f59e0b] mb-2">404</p>
      <h1 className="text-3xl font-semibold text-[#1e3a5f]">Page not found</h1>
      <p className="mt-4 max-w-sm text-sm text-slate-500">
        This page doesn&apos;t exist — the product or order you&apos;re looking for may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: "#1e3a5f" }}
      >
        Back to store
      </Link>
    </div>
  );
}
