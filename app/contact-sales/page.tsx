"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/ui/site-footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LeadCaptureSchema, LeadCaptureData } from "@/schema/quote";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function ContactSalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadCaptureData>({
    resolver: zodResolver(LeadCaptureSchema),
    defaultValues: { website_url: "" },
  });

  const privacyAccepted = watch("privacyPolicy");

  async function onSubmit(data: LeadCaptureData) {
    setServerError(null);
    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border/50">
        <Link
          href="/"
          className="text-xs font-black uppercase tracking-[0.25em] text-foreground hover:text-primary transition-colors"
        >
          The Recording Service
        </Link>
        <a
          href="mailto:contact@therecordingservice.com"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          contact@therecordingservice.com
        </a>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {submitted ? (
          <div className="max-w-md w-full text-center space-y-6 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-muted/30">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                Message Sent
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight uppercase">
              We'll be in touch.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A producer will reach out shortly. Check your inbox for a
              confirmation.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <div className="max-w-lg w-full space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                ← Back
              </Link>
              <h1 className="text-4xl font-bold tracking-tight uppercase leading-tight">
                Talk to a producer.
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Not sure what you need? Tell us about your event and we'll help
                you figure it out.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Honeypot — hidden from real users */}
              <input
                type="text"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                style={{ display: "none" }}
                {...register("website_url")}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    className="bg-background"
                    placeholder="Jane"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    className="bg-background"
                    placeholder="Smith"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="bg-background"
                  placeholder="jane@company.com"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest">
                  Subject
                </Label>
                <Input
                  id="subject"
                  {...register("subject")}
                  className="bg-background"
                  placeholder="Annual conference — not sure what AV I need"
                />
                {errors.subject && (
                  <p className="text-xs text-destructive">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest">
                  Tell us about your event
                </Label>
                <textarea
                  id="message"
                  {...register("message")}
                  rows={5}
                  placeholder="Dates, venue, attendance, what you're trying to accomplish..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
                {errors.message && (
                  <p className="text-xs text-destructive">{errors.message.message}</p>
                )}
              </div>

              {/* Privacy policy */}
              <div className="flex items-start gap-3 p-4 border rounded-xl bg-muted/20">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted ?? false}
                  onCheckedChange={(c) => setValue("privacyPolicy", (c === true) as any)}
                />
                <Label htmlFor="privacy" className="text-xs leading-relaxed text-muted-foreground cursor-pointer">
                  I agree to the{" "}
                  <Link href="/privacy" className="underline hover:text-primary">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="underline hover:text-primary">
                    Terms of Use
                  </Link>
                  .
                </Label>
              </div>
              {errors.privacyPolicy && (
                <p className="text-xs text-destructive -mt-4">{errors.privacyPolicy.message}</p>
              )}

              {serverError && (
                <p className="text-xs text-destructive p-3 border border-destructive/30 rounded-xl bg-destructive/5">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 font-bold text-sm rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                {isSubmitting ? "Sending..." : "Send Message →"}
              </button>
            </form>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
