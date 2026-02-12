import WeatherApp from "@/components/weather-app";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real Weather - Current Weather & Forecasts",
  description:
    "Get current weather, hourly forecasts, and 5-day predictions for any location with Real Weather.",
  keywords: [
    "real weather",
    "weather",
    "current weather",
    "weather today",
    "hourly forecast",
    "7 day forecast",
    "weather conditions",
    "temperature now",
    "live weather",
    "weather dashboard",
    "local weather forecast",
    "weather widget",
  ],
  openGraph: {
    title: "Real Weather - Current Weather & Forecasts",
    description:
      "Get instant access to current weather conditions, hourly forecasts, and 7-day weather predictions for any location with Real Weather.",
    type: "website",
    url: "https://weather.aalokkunwar.com.np/",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Real Weather Dashboard",
        type: "image/png",
      },
      {
        url: "/logoA.png",
        width: 400,
        height: 400,
        alt: "Real Weather Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Weather - Current Weather & Forecasts",
    description:
      "Get instant access to current weather conditions, hourly forecasts, and 7-day weather predictions for any location with Real Weather.",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        alt: "Real Weather Dashboard",
      },
      {
        url: "/logoA.png",
        alt: "Real Weather Logo",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      {/* Structured Data for Weather Service */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["WebApplication", "Service"],
            name: "Real Weather",
            description:
              "Real-time weather forecasting service providing current conditions, hourly and daily forecasts for locations worldwide.",
            url: "https://weather.aalokkunwar.com.np/",
            applicationCategory: "WeatherApplication",
            operatingSystem: "Web",
            serviceType: "Weather Forecasting",
            areaServed: "Worldwide",
            provider: {
              "@type": "Organization",
              name: "Real Weather by Aalok",
              url: "https://weather.aalokkunwar.com.np/",
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Weather Services",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Current Weather",
                    description: "Real-time current weather conditions",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Weather Forecast",
                    description: "Hourly and daily weather forecasts",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Weather Alerts",
                    description: "Severe weather alerts and warnings",
                  },
                },
              ],
            },
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://weather.aalokkunwar.com.np/?location={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <main className="min-h-screen">
        <WeatherApp />
      </main>
    </>
  );
}
