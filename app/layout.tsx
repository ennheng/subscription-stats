import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { dictionaryFor } from "../lib/i18n";
import { I18nProvider } from "./I18nProvider";
import { getLocale } from "./locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = dictionaryFor(locale);
  const description =
    locale === "zh-CN"
      ? "私密追踪订阅、续费日期与年度开销，也可不登录在本机使用。"
      : "Privately track subscriptions, renewal dates and annual spending — with an optional local guest mode.";
  return {
    title: t.brandNameFull,
    description,
    applicationName: t.brandNameFull,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
      apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      title: t.brandName,
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      title: t.brandNameFull,
      description,
      siteName: t.brandNameFull,
      locale: locale === "zh-CN" ? "zh_CN" : "en_US",
      images: [
        {
          url: "/og-subscription-stats.png",
          width: 1672,
          height: 941,
          alt: "订阅统计 · Subscription Stats — Track subscriptions clearly.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.brandNameFull,
      description,
      images: ["/og-subscription-stats.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#f5f2ed" />
        <meta name="color-scheme" content="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
