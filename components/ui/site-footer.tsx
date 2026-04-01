import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t mt-16 border-border/50 py-8">
      <div className="container max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <span className="font-bold uppercase">
          © {new Date().getFullYear()} The Recording Service.
        </span>
        <div className="flex items-center gap-6 font-bold uppercase tracking-widest">
          <Link
            href="/privacy"
            className="hover:text-blue-900 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="opacity-30">·</span>
          <Link href="/terms" className="hover:text-blue-900 transition-colors">
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  );
}

