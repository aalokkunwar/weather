import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Real Weather - Current Weather & Forecasts",
    template: "%s | Real Weather",
  },
  description:
    "Get real-time weather forecasts, current conditions, and detailed weather information for any location worldwide with Real Weather.",
  keywords: [
    "real weather",
    "weather",
    "weather forecast",
    "real-time weather",
    "weather app",
    "weather conditions",
    "temperature",
    "humidity",
    "wind speed",
    "weather radar",
    "weather predictions",
    "climate",
    "meteorology",
    "weather updates",
    "local weather",
    "weather information",
  ],
  authors: [{ name: "Aalok Kunwar" }],
  creator: "Aalok Kunwar",
  publisher: "Real Weather by Aalok",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://weather.aalokkunwar.com.np/"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://weather.aalokkunwar.com.np/",
    title: "Real Weather - Get Accurate Weather Forecasts",
    description:
      "Get real-time weather forecasts, current conditions, and detailed weather information for any location worldwide with Real Weather.",
    siteName: "Real Weather",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Real Weather App - Get Accurate Weather Forecasts",
        type: "image/png",
      },
      {
        url: "/logoA.png",
        width: 400,
        height: 400,
        alt: "Real Weather Logo",
        type: "image/png",
      },
      {
        url: "/apple-icon.png",
        width: 180,
        height: 180,
        alt: "Real Weather Apple Icon",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Weather - Get Accurate Weather Forecasts",
    description:
      "Get real-time weather forecasts, current conditions, and detailed weather information for any location worldwide with Real Weather.",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        alt: "Real Weather App - Get Accurate Weather Forecasts",
      },
      {
        url: "/logoA.png",
        alt: "Real Weather Logo",
      },
    ],
    creator: "@aalokkunwar",
    site: "@aalokkunwar",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "WuNOwl186LmaeeEWncHz5vzaGFeT0y7Oz-m99XklRFc",
    other: {
      me: ["mailto:contact@aalokkunwar.com.np"],
    },
  },
  category: "weather",
  classification: "weather application",
  other: {
    "application-name": "Real Weather",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Real Weather",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#000000",
    "msapplication-tap-highlight": "no",
    "theme-color": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Real Weather" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Favicon and app icons */}
        <link rel="icon" href="/logoA.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/web-app-manifest-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/web-app-manifest-512x512.png"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Structured data for weather app */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Real Weather",
              alternateName: "RealWeather",
              description:
                "Get real-time weather forecasts, current conditions, and detailed weather information for any location worldwide.",
              url: "https://weather.aalokkunwar.com.np/",
              applicationCategory: "WeatherApplication",
              operatingSystem: "Web",
              image: [
                "https://weather.aalokkunwar.com.np/web-app-manifest-512x512.png",
                "https://weather.aalokkunwar.com.np/logoA.png",
                "https://weather.aalokkunwar.com.np/apple-icon.png",
              ],
              screenshot:
                "https://weather.aalokkunwar.com.np/web-app-manifest-512x512.png",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Real Weather Team",
                logo: "https://weather.aalokkunwar.com.np/logoA.png",
                url: "https://weather.aalokkunwar.com.np/",
              },
              publisher: {
                "@type": "Organization",
                name: "Real Weather",
                logo: {
                  "@type": "ImageObject",
                  url: "https://weather.aalokkunwar.com.np/logoA.png",
                },
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
