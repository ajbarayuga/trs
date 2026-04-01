import Link from "next/link";
import { CtaButton } from "@/components/ui/cta-button";
import { SiteFooter } from "@/components/ui/site-footer";

export const metadata = {
  title: "The Recording Service — Production Quote Generator",
  description:
    "Get an instant production estimate for live streaming, video production, audio, and event AV. Built by The Recording Service LLC.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* ── Video Background Layer ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="/bg-video.webm" type="video/webm" />
        </video>
        {/* Dark Overlay for contrast */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-end px-8 py-4 border-b border-white/10">
        <a
          href="https://www.therecordingservice.com/"
          className="text-xs font-bold text-white/80 hover:text-blue-700 transition-colors"
        >
          Go back to therecordingservice website.
        </a>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Headline — Font color set to white for dark background */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white uppercase mb-6 mt-6 max-w-3xl leading-tight">
          Production quotes,
          <br />
          <span className="text-white">built in minutes.</span>
        </h1>

        {/* Sub — Matches white/muted tone */}
        <p className="text-white/70 text-xl max-w-md leading-relaxed mb-14">
          Live streaming, video, audio, lighting, and event AV — configured and
          priced instantly.
        </p>

        {/* CTA fork — quote generator vs. contact sales */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <CtaButton href="/quote">
            Create a Quote Now <span>→</span>
          </CtaButton>
          <Link
            href="/contact-sales"
            className="w-full inline-flex items-center justify-center gap-3 px-12 h-8 text-sm font-bold transition-all active:scale-95 text-white hover:text-blue-700"
          >
            Not sure what I need — talk to someone
          </Link>
        </div>
      </section>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </main>
  );
}
