import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/app/Providers";

const nunito = Nunito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mathquest-kids.vercel.app'),
  title: {
    default: "MathQuest — Math Adventure for Kids 8-16",
    template: "%s · MathQuest",
  },
  description: "A fun, safe math practice app for kids aged 8 to 16. 150 levels, smart flashcards, character marketplace, and more. No ads, no chat, no personal data.",
  keywords: ["math", "kids", "education", "flashcards", "game", "MathQuest", "addition", "subtraction", "multiplication", "division", "arabic", "math game"],
  authors: [{ name: "MathQuest" }],
  creator: "MathQuest",
  publisher: "MathQuest",
  applicationName: "MathQuest",
  category: "education",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    languages: { en: "/", ar: "/?lang=ar" },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MathQuest",
  },
  openGraph: {
    title: "MathQuest — The Math Adventure Kids Love",
    description: "150 levels, smart flashcards, 22+ characters. The math app kids ages 8–16 actually ask to play. No ads, no chat, no personal data.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_AR"],
    siteName: "MathQuest",
    url: "/",
    images: [
      {
        url: "/guide/06-gameplay.png",
        width: 1200,
        height: 630,
        alt: "MathQuest gameplay screenshot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MathQuest — Math Adventure for Kids 8-16",
    description: "150 levels, smart flashcards, 22+ characters. The math app kids actually love.",
    images: ["/guide/06-gameplay.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((reg) => {
                    // Check for updates every 60 seconds
                    setInterval(() => reg.update(), 60000);
                    // When a new service worker takes over, reload the page
                    let refreshing = false;
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                      if (!refreshing) {
                        refreshing = true;
                        window.location.reload();
                      }
                    });
                  }).catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${nunito.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
