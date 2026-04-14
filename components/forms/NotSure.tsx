"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { LeadCaptureSchema, type LeadCaptureData } from "@/schema/quote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NotSure() {
  const [status, setStatus] = useState<
    "IDLE" | "SENDING" | "SUCCESS" | "ERROR"
  >("IDLE");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LeadCaptureData>({
    resolver: zodResolver(LeadCaptureSchema),
  });

  const onSubmit = async (data: LeadCaptureData) => {
    setStatus("SENDING");
    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("SUCCESS");
      } else {
        setStatus("ERROR");
      }
    } catch (error) {
      setStatus("ERROR");
    }
  };

  if (status === "SUCCESS") {
    return (
      <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <CheckCircle2 className="w-16 h-16 text-primary" />
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Email is sent!
          </h3>
          <p className="text-muted-foreground max-w-75">
            It is being reviewed by our sales and we'll get in touch soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {status === "ERROR" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Email sending failed. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Honeypot Trap */}
      <input
        {...register("website_url" as any)}
        type="text"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input {...register("firstName")} id="firstName" placeholder="Juan" />
          {errors.firstName && (
            <p className="text-xs text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            {...register("lastName")}
            id="lastName"
            placeholder="Dela Cruz"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          {...register("email")}
          id="email"
          type="email"
          placeholder="juan@example.com"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          {...register("subject")}
          id="subject"
          placeholder="Inquiry about..."
        />
        {errors.subject && (
          <p className="text-xs text-destructive">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          {...register("message")}
          id="message"
          rows={5}
          className="resize-none"
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="privacyPolicy"
            onCheckedChange={(checked) =>
              setValue("privacyPolicy", checked as any, {
                shouldValidate: true,
              })
            }
          />
          <Label
            htmlFor="privacyPolicy"
            className="text-xs text-muted-foreground"
          >
            I opt-in to the Data Privacy and Terms of Service.
          </Label>
        </div>
        {errors.privacyPolicy && (
          <p className="text-xs text-destructive">
            {errors.privacyPolicy.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12"
        disabled={status === "SENDING"}
      >
        {status === "SENDING" ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
