import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "E.T.P.S Belle Odeur — Maison de parfumerie",
    template: "%s — E.T.P.S Belle Odeur",
  },
  description:
    "E.T.P.S Belle Odeur, maison spécialisée dans la vente de parfums. Découvrez notre sélection de parfums pour homme et femme, et commandez en ligne ou au 01 66 49 12 98.",
  keywords: [
    "parfum",
    "parfumerie",
    "parfums homme",
    "parfums femme",
    "E.T.P.S Belle Odeur",
    "achat parfum",
  ],
  openGraph: {
    title: "E.T.P.S Belle Odeur — Maison de parfumerie",
    description:
      "Sélection de parfums pour homme et femme. Commandez en ligne ou au 01 66 49 12 98.",
    type: "website",
    locale: "fr_FR",
    siteName: "E.T.P.S Belle Odeur",
    images: [{ url: "/images/hero.jpg", width: 864, height: 1152, alt: "Flacon de parfum E.T.P.S Belle Odeur" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "E.T.P.S Belle Odeur — Maison de parfumerie",
    description:
      "Sélection de parfums pour homme et femme. Commandez en ligne ou au 01 66 49 12 98.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${jost.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
