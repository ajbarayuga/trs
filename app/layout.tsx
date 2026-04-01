import type { Metadata } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const heading = Archivo({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["800", "900"],
});

export const metadata: Metadata = {
  title: "Quote Generator",
  description: "Professional Service Estimation",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${heading.variable}`}>
      <body className="font-sans antialiased selection:bg-primary/10 selection:text-primary">
        {children}
      </body>
    </html>
  );
}

