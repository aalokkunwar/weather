import WeatherApp from "@/components/weather-app";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RealTime Weather - Current Weather & Forecasts",
  description:
    "Get instant access to current weather conditions, hourly forecasts, and 7-day weather predictions for any location. Real-time weather data with temperature, humidity, wind speed, and more.",
  keywords: [
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
    title: "RealTime Weather - Current Weather & Forecasts",
    description:
      "Get instant access to current weather conditions, hourly forecasts, and 7-day weather predictions for any location.",
    type: "website",
    url: "https://weather.aalokkunwar.com.np/",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "RealTime Weather Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RealTime Weather - Current Weather & Forecasts",
    description:
      "Get instant access to current weather conditions, hourly forecasts, and 7-day weather predictions for any location.",
    images: ["/web-app-manifest-512x512.png"],
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
            name: "RealTime Weather",
            description:
              "Real-time weather forecasting service providing current conditions, hourly and daily forecasts for locations worldwide.",
            url: "https://weather.aalokkunwar.com.np/",
            applicationCategory: "WeatherApplication",
            operatingSystem: "Web",
            serviceType: "Weather Forecasting",
            areaServed: "Worldwide",
            provider: {
              "@type": "Organization",
              name: "Weather App by Aalok",
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
